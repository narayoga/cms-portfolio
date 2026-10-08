import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import type { SqlValue } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  getQueryText,
  hasField,
  hasValue,
  isEmptyValue,
  valueOrFallback,
  splitImageList,
  toInteger,
  toCleanText,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import type { RequestBody } from '../lib/values';
import { findMissingField, makeSlug, makeUniqueSlug } from '../lib/validator';
import type { SubSubcategoryRow, SubSubcategoryFeatureRow } from '../types/database';

/**
 * Catalog items ("sub-subcategories").
 * An item is either a "group" (has child items) or a "product" (has advantages + features).
 */

const ALLOWED_TYPES = ['group', 'product'];

/**
 * Return the type when it is allowed, otherwise "product".
 */
function chooseItemType(requestedType: any): string {
  if (ALLOWED_TYPES.includes(requestedType)) {
    return requestedType;
  }

  return 'product';
}

/**
 * parent_id from the body: a number, or null when empty.
 */
function parentIdFromBody(body: RequestBody): number | null {
  if (isEmptyValue(body.parent_id)) {
    return null;
  }

  return toInteger(body.parent_id);
}

/**
 * GET /api/admin/subsubcategories?subcategory_id=5
 */
export async function listSubSubcategories(request: Request, response: Response) {
  let subcategoryId = 0;
  const subcategoryIdText = getQueryText(request, 'subcategory_id');
  if (subcategoryIdText !== null) {
    subcategoryId = toInteger(subcategoryIdText);
  }

  let sql = `SELECT ss.*, s.name AS subcategory_name, c.name AS category_name, p.name AS parent_name
             FROM sub_subcategories ss
             JOIN subcategories s ON s.id = ss.subcategory_id
             JOIN categories c ON c.id = s.category_id
             LEFT JOIN sub_subcategories p ON p.id = ss.parent_id`;
  const params: SqlValue[] = [];

  if (subcategoryId !== 0) {
    sql = sql + ' WHERE ss.subcategory_id = ?';
    params.push(subcategoryId);
  }

  // Sort so that every group is directly followed by its children
  sql = sql + ' ORDER BY c.sort_order, s.sort_order, COALESCE(ss.parent_id, ss.id), ss.parent_id IS NOT NULL, ss.sort_order, ss.id';

  const items = await queryAll(sql, params);
  sendOk(response, items);
}

/**
 * GET /api/admin/subsubcategories/:id
 * One item with its advantages and features.
 */
export async function getSubSubcategory(request: Request, response: Response) {
  const itemId = toInteger(request.params.id);

  const item: Record<string, any> | null = await queryOne<SubSubcategoryRow>(
    'SELECT * FROM sub_subcategories WHERE id = ?',
    [itemId]
  );
  if (item === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  item.advantages = await queryAll(
    'SELECT id, label FROM sub_subcategory_advantages WHERE sub_subcategory_id = ? ORDER BY sort_order, id',
    [itemId]
  );

  const features: Record<string, any>[] = await queryAll<SubSubcategoryFeatureRow>(
    'SELECT id, title, image_path, images, description FROM sub_subcategory_features WHERE sub_subcategory_id = ? ORDER BY sort_order, id',
    [itemId]
  );

  // Turn the newline-separated "images" text into an array
  for (const feature of features) {
    let images: string[] = [];

    if (isEmptyValue(feature.images) === false) {
      images = splitImageList(feature.images);
    } else if (isEmptyValue(feature.image_path) === false) {
      images = [feature.image_path];
    }

    feature.images = images;
  }

  item.features = features;

  sendOk(response, item);
}

/**
 * POST /api/admin/subsubcategories
 * Body: { name, subcategory_id, parent_id?, type?, slug?, description?, image_path?,
 *         brand_logo?, sort_order?, is_active?, advantages?: string[], features?: [] }
 */
export async function createSubSubcategory(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name', 'subcategory_id']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const subcategoryId = toInteger(body.subcategory_id);

  const slugSource = valueOrFallback(body, 'slug', body.name);
  const slug = await makeUniqueSlug('sub_subcategories', makeSlug(slugSource), {
    scopeColumn: 'subcategory_id',
    scopeValue: subcategoryId,
  });

  const newItemId = await insert(
    `INSERT INTO sub_subcategories (subcategory_id, parent_id, type, name, slug, description, image_path, brand_logo, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      subcategoryId,
      parentIdFromBody(body),
      chooseItemType(valueOrFallback(body, 'type', 'product')),
      body.name,
      slug,
      valueOrFallback(body, 'description', null),
      valueOrFallback(body, 'image_path', null),
      valueOrFallback(body, 'brand_logo', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  await saveAdvantagesAndFeatures(newItemId, body);

  sendOk(response, { id: newItemId, slug: slug });
}

/**
 * PUT /api/admin/subsubcategories/:id
 */
export async function updateSubSubcategory(request: Request, response: Response) {
  const itemId = toInteger(request.params.id);
  const body = getBody(request);

  const existingItem = await queryOne<SubSubcategoryRow>('SELECT * FROM sub_subcategories WHERE id = ?', [itemId]);
  if (existingItem === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let subcategoryId = toInteger(existingItem.subcategory_id);
  if (hasValue(body, 'subcategory_id')) {
    subcategoryId = toInteger(body.subcategory_id);
  }

  let slug = existingItem.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('sub_subcategories', makeSlug(body.slug), {
      excludeId: itemId,
      scopeColumn: 'subcategory_id',
      scopeValue: subcategoryId,
    });
  }

  // parent_id can be cleared by sending null, so check if the field was sent at all
  let parentId = existingItem.parent_id;
  if (hasField(body, 'parent_id')) {
    parentId = parentIdFromBody(body);
  }

  await execute(
    'UPDATE sub_subcategories SET subcategory_id = ?, parent_id = ?, type = ?, name = ?, slug = ?, description = ?, image_path = ?, brand_logo = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      subcategoryId,
      parentId,
      chooseItemType(valueOrFallback(body, 'type', existingItem.type)),
      valueOrFallback(body, 'name', existingItem.name),
      slug,
      valueOrFallback(body, 'description', existingItem.description),
      valueOrFallback(body, 'image_path', existingItem.image_path),
      valueOrFallback(body, 'brand_logo', existingItem.brand_logo),
      toInteger(valueOrFallback(body, 'sort_order', existingItem.sort_order)),
      activeFlagForUpdate(body, existingItem.is_active),
      itemId,
    ]
  );

  await saveAdvantagesAndFeatures(itemId, body);

  sendOk(response, { id: itemId });
}

/**
 * DELETE /api/admin/subsubcategories/:id
 */
export async function deleteSubSubcategory(request: Request, response: Response) {
  const itemId = toInteger(request.params.id);

  await execute('DELETE FROM sub_subcategories WHERE id = ?', [itemId]);

  sendOk(response);
}

/**
 * Replace the advantages and/or features of an item,
 * but only when the request contains those arrays.
 */
async function saveAdvantagesAndFeatures(itemId: number, body: RequestBody): Promise<void> {
  // --- Advantages: a list of text labels ---
  if (hasField(body, 'advantages') && Array.isArray(body.advantages)) {
    await execute('DELETE FROM sub_subcategory_advantages WHERE sub_subcategory_id = ?', [itemId]);

    let sortOrder = 1;
    for (const advantage of body.advantages) {
      const label = toCleanText(advantage);
      if (label === '') {
        continue;
      }

      await insert(
        'INSERT INTO sub_subcategory_advantages (sub_subcategory_id, label, sort_order) VALUES (?, ?, ?)',
        [itemId, label, sortOrder]
      );
      sortOrder = sortOrder + 1;
    }
  }

  // --- Features: a list of { title, images?: string[], image_path?, description? } ---
  if (hasField(body, 'features') && Array.isArray(body.features)) {
    await execute('DELETE FROM sub_subcategory_features WHERE sub_subcategory_id = ?', [itemId]);

    let sortOrder = 1;
    for (const feature of body.features) {
      if (feature === null || typeof feature !== 'object') {
        continue;
      }

      let title = '';
      if (hasValue(feature, 'title')) {
        title = toCleanText(feature.title);
      }
      if (title === '') {
        continue;
      }

      // Several images make a carousel; a single image_path is also accepted
      const images: string[] = [];
      if (hasValue(feature, 'images') && Array.isArray(feature.images)) {
        for (const image of feature.images) {
          const cleanImage = toCleanText(image);
          if (cleanImage !== '' && cleanImage !== '0') {
            images.push(cleanImage);
          }
        }
      } else if (isEmptyValue(feature.image_path) === false) {
        images.push(toCleanText(feature.image_path));
      }

      let firstImage: string | null = null;
      let imagesText: string | null = null;
      if (images.length > 0) {
        firstImage = images[0];
        imagesText = images.join('\n');
      }

      await insert(
        'INSERT INTO sub_subcategory_features (sub_subcategory_id, title, image_path, images, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, title, firstImage, imagesText, valueOrFallback(feature, 'description', null), sortOrder]
      );
      sortOrder = sortOrder + 1;
    }
  }
}
