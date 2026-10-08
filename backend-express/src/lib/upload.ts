import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import type { Request, Response } from 'express';
import { getEnvNumber, UPLOADS_DIR } from '../config/env';

/**
 * File uploads from the admin panel.
 *
 * Every admin form uploads into its own folder, for example:
 *   Projects  -> /uploads/projects/park-hyatt-k3f9a2.jpg
 *   Banners   -> /uploads/banners/wilka-banner-81c0de.jpg
 * Only the folders in ALLOWED_UPLOAD_FOLDERS can be used.
 */

export const ALLOWED_UPLOAD_FOLDERS = [
  'site/logo',
  'site/mega-menu',
  'site/home',
  'site/services',
  'site/download-center',
  'banners',
  'brands',
  'catalog/categories',
  'catalog/subcategories',
  'catalog/items',
  'catalog/features',
  'products',
  'projects',
  'publications',
  'downloads/thumbnails',
  'downloads/files',
  'story',
  'content',
  'misc',
];

// Used when the request does not say which folder to use
export const DEFAULT_UPLOAD_FOLDER = 'misc';

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const ALLOWED_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt'];

// Big photos are made smaller: the longest side becomes at most 1600px
const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 80;

/**
 * An error with an HTTP status code, so the controller knows what to answer.
 */
export class UploadError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Which file extensions are allowed for a "kind" of upload.
 *   image -> only images
 *   file  -> only documents
 *   any   -> both
 */
function getAllowedExtensions(kind: string): string[] {
  if (kind === 'image') {
    return ALLOWED_IMAGE_EXTENSIONS;
  }

  if (kind === 'file') {
    return ALLOWED_FILE_EXTENSIONS;
  }

  return ALLOWED_IMAGE_EXTENSIONS.concat(ALLOWED_FILE_EXTENSIONS);
}

/**
 * Read the uploaded file (form field "file") into memory.
 * Multer is started by hand here so its errors can be turned into nice messages.
 */
function readUploadedFile(request: Request, response: Response): Promise<Express.Multer.File | undefined> {
  const maxBytes = getEnvNumber('UPLOAD_MAX_BYTES', 10485760);

  const readSingleFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
  }).single('file');

  return new Promise(function (resolve, reject) {
    readSingleFile(request, response, function (error: any) {
      if (error === undefined || error === null) {
        resolve(request.file);
        return;
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        reject(new UploadError('File too large', 413));
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        reject(new UploadError('No file uploaded (file)', 422));
        return;
      }

      reject(new UploadError('Upload error: ' + error.message, 400));
    });
  });
}

/**
 * Make a readable, unique file name from the original name.
 *   "Park Hyatt.JPG" -> "park-hyatt-k3f9a2"
 */
function makeFileName(originalName: string): string {
  const nameWithoutExtension = path.parse(originalName).name;

  let readablePart = nameWithoutExtension.toLowerCase();
  readablePart = readablePart.replace(/[^a-z0-9]+/g, '-');
  readablePart = readablePart.replace(/^-+/, '');
  readablePart = readablePart.replace(/-+$/, '');
  readablePart = readablePart.substring(0, 60);

  if (readablePart === '') {
    readablePart = 'file';
  }

  const randomPart = crypto.randomBytes(3).toString('hex');

  return readablePart + '-' + randomPart;
}

/**
 * Save an uploaded file and return its public path, for example
 * "/uploads/projects/park-hyatt-k3f9a2.jpg".
 */
export async function saveUploadedFile(
  request: Request,
  response: Response,
  kind: string,
  folder: string
): Promise<string> {
  if (ALLOWED_UPLOAD_FOLDERS.includes(folder) === false) {
    throw new UploadError('Invalid upload folder: ' + folder, 422);
  }

  const uploadedFile = await readUploadedFile(request, response);
  if (uploadedFile === undefined) {
    throw new UploadError('No file uploaded (file)', 422);
  }

  let extension = path.extname(uploadedFile.originalname).toLowerCase();
  extension = extension.replace('.', '');

  const allowedExtensions = getAllowedExtensions(kind);
  if (allowedExtensions.includes(extension) === false) {
    throw new UploadError('File type .' + extension + ' not allowed', 415);
  }

  // Create the folder when it does not exist yet
  const targetFolder = path.join(UPLOADS_DIR, folder);
  await fs.mkdir(targetFolder, { recursive: true });

  const fileName = makeFileName(uploadedFile.originalname) + '.' + extension;
  const targetPath = path.join(targetFolder, fileName);

  const optimizedContent = await optimizeImage(uploadedFile.buffer, extension);
  await fs.writeFile(targetPath, optimizedContent);

  return '/uploads/' + folder + '/' + fileName;
}

/**
 * Make JPEG / PNG images smaller (resize + compress).
 * Other files are returned unchanged. If something goes wrong, or the result
 * is not smaller than the original, the original is kept.
 */
async function optimizeImage(originalContent: Buffer, extension: string): Promise<Buffer> {
  const isJpeg = extension === 'jpg' || extension === 'jpeg';
  const isPng = extension === 'png';

  if (isJpeg === false && isPng === false) {
    return originalContent;
  }

  try {
    let image = sharp(originalContent).rotate(); // rotate = respect the photo's orientation

    image = image.resize({
      width: MAX_IMAGE_SIDE,
      height: MAX_IMAGE_SIDE,
      fit: 'inside', // keep the aspect ratio
      withoutEnlargement: true, // never make small images bigger
    });

    let optimizedContent: Buffer;
    if (isPng) {
      optimizedContent = await image.png({ compressionLevel: 9 }).toBuffer();
    } else {
      optimizedContent = await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    }

    if (optimizedContent.length < originalContent.length) {
      return optimizedContent;
    }

    return originalContent;
  } catch (error) {
    console.error('Image optimization failed, keeping the original:', error);
    return originalContent;
  }
}
