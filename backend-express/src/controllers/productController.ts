import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import type { SqlValue } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  getQueryText,
  hasField,
  hasValue,
  valueOrFallback,
  toInteger,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField, makeSlug, makeUniqueSlug } from '../lib/validator';
import type { ProductRow } from '../types/database';

/**
 * GET /api/admin/products?subcategory_id=5
 */
export async function listProducts(request: Request, response: Response) {
  let subcategoryId = 0;
  const subcategoryIdText = getQueryText(request, 'subcategory_id');
  if (subcategoryIdText !== null) {
    subcategoryId = toInteger(subcategoryIdText);
  }

  let whereClause = '';
  const params: SqlValue[] = [];
  if (subcategoryId !== 0) {
    whereClause = 'WHERE p.subcategory_id = ?';
    params.push(subcategoryId);
  }

  const products = await queryAll(
    `SELECT p.*, s.name AS subcategory_name, c.name AS category_name
     FROM products p
     JOIN subcategories s ON s.id = p.subcategory_id
     JOIN categories c ON c.id = s.category_id
     ${whereClause}
     ORDER BY c.sort_order, s.sort_order, p.sort_order, p.id`,
    params
  );

  sendOk(response, products);
}

/**
 * GET /api/admin/products/:id
 * One product with its gallery images.
 */
export async function getProduct(request: Request, response: Response) {
  const productId = toInteger(request.params.id);

  const product: Record<string, any> | null = await queryOne<ProductRow>('SELECT * FROM products WHERE id = ?', [productId]);
  if (product === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  product.images = await queryAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [productId]);

  sendOk(response, product);
}

/**
 * POST /api/admin/products
 * Body: { name, subcategory_id, slug?, short_desc?, content_html?, cover_image?,
 *         sort_order?, is_active?, images?: string[] }
 */
export async function createProduct(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name', 'subcategory_id']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const subcategoryId = toInteger(body.subcategory_id);

  const slugSource = valueOrFallback(body, 'slug', body.name);
  const slug = await makeUniqueSlug('products', makeSlug(slugSource), {
    scopeColumn: 'subcategory_id',
    scopeValue: subcategoryId,
  });

  const newProductId = await insert(
    'INSERT INTO products (subcategory_id, name, slug, short_desc, content_html, cover_image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      subcategoryId,
      body.name,
      slug,
      valueOrFallback(body, 'short_desc', null),
      valueOrFallback(body, 'content_html', null),
      valueOrFallback(body, 'cover_image', null),
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  await saveGalleryImages(newProductId, valueOrFallback(body, 'images', []));

  sendOk(response, { id: newProductId, slug: slug });
}

/**
 * PUT /api/admin/products/:id
 * When "images" is sent, the whole gallery is replaced.
 */
export async function updateProduct(request: Request, response: Response) {
  const productId = toInteger(request.params.id);
  const body = getBody(request);

  const existingProduct = await queryOne<ProductRow>('SELECT * FROM products WHERE id = ?', [productId]);
  if (existingProduct === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let subcategoryId = toInteger(existingProduct.subcategory_id);
  if (hasValue(body, 'subcategory_id')) {
    subcategoryId = toInteger(body.subcategory_id);
  }

  let slug = existingProduct.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('products', makeSlug(body.slug), {
      excludeId: productId,
      scopeColumn: 'subcategory_id',
      scopeValue: subcategoryId,
    });
  }

  await execute(
    'UPDATE products SET subcategory_id = ?, name = ?, slug = ?, short_desc = ?, content_html = ?, cover_image = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      subcategoryId,
      valueOrFallback(body, 'name', existingProduct.name),
      slug,
      valueOrFallback(body, 'short_desc', existingProduct.short_desc),
      valueOrFallback(body, 'content_html', existingProduct.content_html),
      valueOrFallback(body, 'cover_image', existingProduct.cover_image),
      toInteger(valueOrFallback(body, 'sort_order', existingProduct.sort_order)),
      activeFlagForUpdate(body, existingProduct.is_active),
      productId,
    ]
  );

  if (hasField(body, 'images')) {
    await execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
    await saveGalleryImages(productId, body.images);
  }

  sendOk(response, { id: productId });
}

/**
 * DELETE /api/admin/products/:id
 */
export async function deleteProduct(request: Request, response: Response) {
  const productId = toInteger(request.params.id);

  await execute('DELETE FROM products WHERE id = ?', [productId]);

  sendOk(response);
}

/**
 * Save a list of gallery image paths for a product.
 */
async function saveGalleryImages(productId: number, images: any): Promise<void> {
  if (Array.isArray(images) === false) {
    return;
  }

  let sortOrder = 0;
  for (const imagePath of images) {
    if (typeof imagePath !== 'string' || imagePath === '') {
      continue;
    }

    await insert(
      'INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)',
      [productId, imagePath, sortOrder]
    );
    sortOrder = sortOrder + 1;
  }
}
