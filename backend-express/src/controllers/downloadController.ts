import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  hasValue,
  valueOrFallback,
  toInteger,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField } from '../lib/validator';
import type { DownloadRow } from '../types/database';

const ALLOWED_SECTIONS = ['catalogues', 'manuals'];

/**
 * GET /api/admin/downloads
 */
export async function listDownloads(request: Request, response: Response) {
  const downloads = await queryAll('SELECT * FROM downloads ORDER BY sort_order ASC, id DESC');
  sendOk(response, downloads);
}

/**
 * POST /api/admin/downloads
 */
export async function createDownload(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['title']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  // A new download goes to "catalogues" unless another section is chosen
  const section = valueOrFallback(body, 'section', 'catalogues');
  if (ALLOWED_SECTIONS.includes(section) === false) {
    sendError(response, 'Invalid section', 422);
    return;
  }

  const newDownloadId = await insert(
    'INSERT INTO downloads (title, section, description, image_path, file_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      body.title,
      section,
      valueOrFallback(body, 'description', null),
      valueOrFallback(body, 'image_path', null),
      valueOrFallback(body, 'file_path', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newDownloadId });
}

/**
 * PUT /api/admin/downloads/:id
 */
export async function updateDownload(request: Request, response: Response) {
  const downloadId = toInteger(request.params.id);
  const body = getBody(request);

  const existingDownload = await queryOne<DownloadRow>('SELECT * FROM downloads WHERE id = ?', [downloadId]);
  if (existingDownload === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  if (hasValue(body, 'section') && ALLOWED_SECTIONS.includes(body.section) === false) {
    sendError(response, 'Invalid section', 422);
    return;
  }

  await execute(
    'UPDATE downloads SET title = ?, section = ?, description = ?, image_path = ?, file_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'title', existingDownload.title),
      valueOrFallback(body, 'section', existingDownload.section),
      valueOrFallback(body, 'description', existingDownload.description),
      valueOrFallback(body, 'image_path', existingDownload.image_path),
      valueOrFallback(body, 'file_path', existingDownload.file_path),
      toInteger(valueOrFallback(body, 'sort_order', existingDownload.sort_order)),
      activeFlagForUpdate(body, existingDownload.is_active),
      downloadId,
    ]
  );

  sendOk(response, { id: downloadId });
}

/**
 * DELETE /api/admin/downloads/:id
 */
export async function deleteDownload(request: Request, response: Response) {
  const downloadId = toInteger(request.params.id);

  const deletedRowCount = await execute('DELETE FROM downloads WHERE id = ?', [downloadId]);
  if (deletedRowCount === 0) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response);
}
