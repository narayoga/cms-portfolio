import { queryOne } from './db';
import type { SqlValue } from './db';
import type { RequestBody } from './values';

/**
 * Find the first required field that is missing or empty.
 * Returns the field name, or null when every field is filled in.
 *
 * Usage:
 *   const missingField = findMissingField(body, ['title']);
 *   if (missingField !== null) {
 *     sendError(response, 'Missing field: ' + missingField, 422);
 *     return;
 *   }
 */
export function findMissingField(body: RequestBody, requiredFields: string[]): string | null {
  for (const fieldName of requiredFields) {
    const value = body[fieldName];

    if (value === undefined || value === null || value === '') {
      return fieldName;
    }
  }

  return null;
}

/**
 * Turn any text into a URL-friendly slug.
 *   "Park Hyatt Jakarta!" -> "park-hyatt-jakarta"
 */
export function makeSlug(text: any): string {
  let slug = String(text).trim().toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  slug = slug.replace(/^-+/, '');
  slug = slug.replace(/-+$/, '');

  return slug;
}

/**
 * Options for makeUniqueSlug()
 */
type UniqueSlugOptions = {
  // Ignore this row id (used when updating an existing row)
  excludeId?: number | null;
  // Only check slugs inside the same parent, for example category_id = 3
  scopeColumn?: string | null;
  scopeValue?: SqlValue;
};

/**
 * Make sure a slug is not used yet in a table.
 * If "door-closers" already exists, it tries "door-closers-2", "door-closers-3", ...
 */
export async function makeUniqueSlug(
  tableName: string,
  baseSlug: string,
  options: UniqueSlugOptions = {}
): Promise<string> {
  let startSlug = baseSlug;
  if (startSlug === '') {
    startSlug = 'item';
  }

  let candidateSlug = startSlug;
  let counter = 1;

  while (true) {
    let sql = 'SELECT id FROM `' + tableName + '` WHERE slug = ?';
    const params: SqlValue[] = [candidateSlug];

    if (options.excludeId !== undefined && options.excludeId !== null) {
      sql = sql + ' AND id <> ?';
      params.push(options.excludeId);
    }

    if (options.scopeColumn !== undefined && options.scopeColumn !== null) {
      sql = sql + ' AND `' + options.scopeColumn + '` = ?';
      if (options.scopeValue === undefined) {
        params.push(null);
      } else {
        params.push(options.scopeValue);
      }
    }

    const existingRow = await queryOne(sql, params);
    if (existingRow === null) {
      return candidateSlug;
    }

    counter = counter + 1;
    candidateSlug = startSlug + '-' + counter;
  }
}

/**
 * True when a row with this id exists in the table.
 * Used to check parent ids (for example category_id) before saving,
 * so the admin gets a clear 422 message instead of a database error.
 */
export async function rowExists(tableName: string, id: number): Promise<boolean> {
  const row = await queryOne('SELECT id FROM `' + tableName + '` WHERE id = ?', [id]);

  if (row === null) {
    return false;
  }

  return true;
}

/**
 * Check that an email address looks valid.
 */
export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}
