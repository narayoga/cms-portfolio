import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  getQueryText,
  hasValue,
  valueOrFallback,
  toInteger,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField, makeSlug, makeUniqueSlug, rowExists } from '../lib/validator';
import type { SubcategoryRow } from '../types/database';

/**
 * GET /api/admin/subcategories?category_id=3
 * Without category_id, every subcategory is returned.
 */
export async function listSubcategories(request: Request, response: Response) {
  let categoryId = 0;
  const categoryIdText = getQueryText(request, 'category_id');
  if (categoryIdText !== null) {
    categoryId = toInteger(categoryIdText);
  }

  let subcategories;
  if (categoryId !== 0) {
    subcategories = await queryAll(
      'SELECT s.*, c.name AS category_name FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE s.category_id = ? ORDER BY s.sort_order ASC, s.id ASC',
      [categoryId]
    );
  } else {
    subcategories = await queryAll(
      'SELECT s.*, c.name AS category_name FROM subcategories s JOIN categories c ON c.id = s.category_id ORDER BY c.sort_order ASC, s.sort_order ASC'
    );
  }

  sendOk(response, subcategories);
}

/**
 * POST /api/admin/subcategories
 * Body: { name, category_id, subtitle?, slug?, description?, image_path?, sort_order?, is_active? }
 */
export async function createSubcategory(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name', 'category_id']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const categoryId = toInteger(body.category_id);

  const categoryExists = await rowExists('categories', categoryId);
  if (categoryExists === false) {
    sendError(response, 'Category not found', 422);
    return;
  }

  // The slug only has to be unique inside the same category
  const slugSource = valueOrFallback(body, 'slug', body.name);
  const slug = await makeUniqueSlug('subcategories', makeSlug(slugSource), {
    scopeColumn: 'category_id',
    scopeValue: categoryId,
  });

  const newSubcategoryId = await insert(
    'INSERT INTO subcategories (category_id, name, subtitle, slug, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      categoryId,
      body.name,
      valueOrFallback(body, 'subtitle', null),
      slug,
      valueOrFallback(body, 'description', null),
      valueOrFallback(body, 'image_path', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newSubcategoryId, slug: slug });
}

/**
 * PUT /api/admin/subcategories/:id
 */
export async function updateSubcategory(request: Request, response: Response) {
  const subcategoryId = toInteger(request.params.id);
  const body = getBody(request);

  const existingSubcategory = await queryOne<SubcategoryRow>('SELECT * FROM subcategories WHERE id = ?', [subcategoryId]);
  if (existingSubcategory === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let categoryId = toInteger(existingSubcategory.category_id);
  if (hasValue(body, 'category_id')) {
    categoryId = toInteger(body.category_id);

    const categoryExists = await rowExists('categories', categoryId);
    if (categoryExists === false) {
      sendError(response, 'Category not found', 422);
      return;
    }
  }

  let slug = existingSubcategory.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('subcategories', makeSlug(body.slug), {
      excludeId: subcategoryId,
      scopeColumn: 'category_id',
      scopeValue: categoryId,
    });
  }

  await execute(
    'UPDATE subcategories SET category_id = ?, name = ?, subtitle = ?, slug = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      categoryId,
      valueOrFallback(body, 'name', existingSubcategory.name),
      valueOrFallback(body, 'subtitle', existingSubcategory.subtitle),
      slug,
      valueOrFallback(body, 'description', existingSubcategory.description),
      valueOrFallback(body, 'image_path', existingSubcategory.image_path),
      toInteger(valueOrFallback(body, 'sort_order', existingSubcategory.sort_order)),
      activeFlagForUpdate(body, existingSubcategory.is_active),
      subcategoryId,
    ]
  );

  sendOk(response, { id: subcategoryId });
}

/**
 * DELETE /api/admin/subcategories/:id
 */
export async function deleteSubcategory(request: Request, response: Response) {
  const subcategoryId = toInteger(request.params.id);

  const deletedRowCount = await execute('DELETE FROM subcategories WHERE id = ?', [subcategoryId]);
  if (deletedRowCount === 0) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response);
}
