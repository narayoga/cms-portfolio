import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  valueOrFallback,
  toInteger,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField } from '../lib/validator';
import type { BannerRow } from '../types/database';

/**
 * Homepage hero banners.
 */

/**
 * GET /api/admin/banners
 */
export async function listBanners(request: Request, response: Response) {
  const banners = await queryAll('SELECT * FROM homepage_banners ORDER BY sort_order ASC, id ASC');
  sendOk(response, banners);
}

/**
 * POST /api/admin/banners
 */
export async function createBanner(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['image_path']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const newBannerId = await insert(
    'INSERT INTO homepage_banners (image_path, title, subtitle, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [
      body.image_path,
      valueOrFallback(body, 'title', null),
      valueOrFallback(body, 'subtitle', null),
      valueOrFallback(body, 'link', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newBannerId });
}

/**
 * PUT /api/admin/banners/:id
 */
export async function updateBanner(request: Request, response: Response) {
  const bannerId = toInteger(request.params.id);
  const body = getBody(request);

  const existingBanner = await queryOne<BannerRow>('SELECT * FROM homepage_banners WHERE id = ?', [bannerId]);
  if (existingBanner === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  await execute(
    'UPDATE homepage_banners SET image_path = ?, title = ?, subtitle = ?, link = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'image_path', existingBanner.image_path),
      valueOrFallback(body, 'title', existingBanner.title),
      valueOrFallback(body, 'subtitle', existingBanner.subtitle),
      valueOrFallback(body, 'link', existingBanner.link),
      toInteger(valueOrFallback(body, 'sort_order', existingBanner.sort_order)),
      activeFlagForUpdate(body, existingBanner.is_active),
      bannerId,
    ]
  );

  sendOk(response, { id: bannerId });
}

/**
 * DELETE /api/admin/banners/:id
 */
export async function deleteBanner(request: Request, response: Response) {
  const bannerId = toInteger(request.params.id);

  const deletedRowCount = await execute('DELETE FROM homepage_banners WHERE id = ?', [bannerId]);
  if (deletedRowCount === 0) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response);
}
