import path from 'node:path';
import fs from 'node:fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getEnv, UPLOADS_DIR } from '../config/env';

/**
 * Where uploaded files are stored.
 *
 * Production (all R2_* variables filled in):
 *   files go to the Cloudflare R2 bucket with the key "uploads/<folder>/<file>",
 *   so the public URL is <media domain>/uploads/<folder>/<file>,
 *   exactly the path that is saved in the database.
 *
 * Local development and tests (R2_* variables empty):
 *   files are written to backend-express/public/uploads, like before.
 */

const CONTENT_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    txt: 'text/plain; charset=utf-8',
};

// Browsers and the Cloudflare CDN may keep a file for 30 days.
// This is safe because every upload gets a new random file name.
const CACHE_CONTROL = 'public, max-age=2592000';

type R2Settings = {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
};

/**
 * Read the R2 settings. Returns null when one of them is missing,
 * which means: store files on the local disk.
 */
function readR2Settings(): R2Settings | null {
    const settings = {
        accountId: getEnv('R2_ACCOUNT_ID', ''),
        accessKeyId: getEnv('R2_ACCESS_KEY_ID', ''),
        secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY', ''),
        bucket: getEnv('R2_BUCKET', ''),
    };

    if (settings.accountId === '' || settings.accessKeyId === '' || settings.secretAccessKey === '' || settings.bucket === '') {
        return null;
    }

    return settings;
}

// Created on first use and then reused for every upload
let r2Client: S3Client | null = null;

function getR2Client(settings: R2Settings): S3Client {
    if (r2Client === null) {
        r2Client = new S3Client({
            region: 'auto',
            endpoint: 'https://' + settings.accountId + '.r2.cloudflarestorage.com',
            credentials: {
                accessKeyId: settings.accessKeyId,
                secretAccessKey: settings.secretAccessKey,
            },
            // Only add checksums when the request really needs one (keeps R2 compatible)
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
        });
    }

    return r2Client;
}

/**
 * Store a file.
 *   relativePath: path inside /uploads, for example "projects/park-hyatt-k3f9a2.jpg"
 *   extension:    file extension without the dot, used for the Content-Type
 */
export async function storeFile(relativePath: string, content: Buffer, extension: string): Promise<void> {
    const settings = readR2Settings();

    if (settings === null) {
        const targetPath = path.join(UPLOADS_DIR, relativePath);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, content);
        return;
    }

    await getR2Client(settings).send(
        new PutObjectCommand({
            Bucket: settings.bucket,
            Key: 'uploads/' + relativePath,
            Body: content,
            ContentType: CONTENT_TYPES[extension] ?? 'application/octet-stream',
            CacheControl: CACHE_CONTROL,
        })
    );
}