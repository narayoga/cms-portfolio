import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  hasValue,
  valueOrFallback,
  toInteger,
  todayAsText,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField, makeSlug, makeUniqueSlug } from '../lib/validator';
import type { PublicationRow } from '../types/database';

/**
 * GET /api/admin/publications
 */
export async function listPublications(request: Request, response: Response) {
  const publications = await queryAll('SELECT * FROM publications ORDER BY published_at DESC, id DESC');
  sendOk(response, publications);
}

/**
 * POST /api/admin/publications
 */
export async function createPublication(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['title']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const slugSource = valueOrFallback(body, 'slug', body.title);
  const slug = await makeUniqueSlug('publications', makeSlug(slugSource));

  const newPublicationId = await insert(
    'INSERT INTO publications (title, slug, cover_image, content_html, published_at, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [
      body.title,
      slug,
      valueOrFallback(body, 'cover_image', null),
      valueOrFallback(body, 'content_html', null),
      valueOrFallback(body, 'published_at', todayAsText()),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newPublicationId, slug: slug });
}

/**
 * PUT /api/admin/publications/:id
 */
export async function updatePublication(request: Request, response: Response) {
  const publicationId = toInteger(request.params.id);
  const body = getBody(request);

  const existingPublication = await queryOne<PublicationRow>('SELECT * FROM publications WHERE id = ?', [publicationId]);
  if (existingPublication === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let slug = existingPublication.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('publications', makeSlug(body.slug), { excludeId: publicationId });
  }

  await execute(
    'UPDATE publications SET title = ?, slug = ?, cover_image = ?, content_html = ?, published_at = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'title', existingPublication.title),
      slug,
      valueOrFallback(body, 'cover_image', existingPublication.cover_image),
      valueOrFallback(body, 'content_html', existingPublication.content_html),
      valueOrFallback(body, 'published_at', existingPublication.published_at),
      activeFlagForUpdate(body, existingPublication.is_active),
      publicationId,
    ]
  );

  sendOk(response, { id: publicationId });
}

/**
 * DELETE /api/admin/publications/:id
 */
export async function deletePublication(request: Request, response: Response) {
  const publicationId = toInteger(request.params.id);

  await execute('DELETE FROM publications WHERE id = ?', [publicationId]);

  sendOk(response);
}
