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
import { findMissingField, makeSlug, makeUniqueSlug } from '../lib/validator';
import type { CategoryRow } from '../types/database';

/**
 * GET /api/admin/categories
 */
export async function listCategories(request: Request, response: Response) {
  const categories = await queryAll('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
  sendOk(response, categories);
}

/**
 * POST /api/admin/categories
 * Body: { name, slug?, description?, image_path?, sort_order?, is_active? }
 */
export async function createCategory(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  // Use the given slug, or make one from the name
  const slugSource = valueOrFallback(body, 'slug', body.name);
  const slug = await makeUniqueSlug('categories', makeSlug(slugSource));

  const newCategoryId = await insert(
    'INSERT INTO categories (name, slug, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [
      body.name,
      slug,
      valueOrFallback(body, 'description', null),
      valueOrFallback(body, 'image_path', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newCategoryId, slug: slug });
}

/**
 * PUT /api/admin/categories/:id
 * Fields that are not sent keep their current value.
 */
export async function updateCategory(request: Request, response: Response) {
  const categoryId = toInteger(request.params.id);
  const body = getBody(request);

  const existingCategory = await queryOne<CategoryRow>('SELECT * FROM categories WHERE id = ?', [categoryId]);
  if (existingCategory === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let slug = existingCategory.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('categories', makeSlug(body.slug), { excludeId: categoryId });
  }

  await execute(
    'UPDATE categories SET name = ?, slug = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'name', existingCategory.name),
      slug,
      valueOrFallback(body, 'description', existingCategory.description),
      valueOrFallback(body, 'image_path', existingCategory.image_path),
      toInteger(valueOrFallback(body, 'sort_order', existingCategory.sort_order)),
      activeFlagForUpdate(body, existingCategory.is_active),
      categoryId,
    ]
  );

  sendOk(response, { id: categoryId });
}

/**
 * DELETE /api/admin/categories/:id
 */
export async function deleteCategory(request: Request, response: Response) {
  const categoryId = toInteger(request.params.id);

  await execute('DELETE FROM categories WHERE id = ?', [categoryId]);

  sendOk(response);
}
