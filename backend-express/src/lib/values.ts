import type { Request } from 'express';

/**
 * Small helpers for reading values from a request body.
 *
 * The PHP backend relied on a few PHP-specific rules (isset, ??, (int), (bool)).
 * These helpers copy those rules exactly, so the Express API behaves the same.
 */

// The request body as a simple key -> value object
export type RequestBody = Record<string, any>;

/**
 * Get the request body as an object.
 * If the body is missing, or is not an object (for example a JSON array),
 * an empty object is returned.
 */
export function getBody(request: Request): RequestBody {
  const body = request.body;

  if (body === undefined || body === null) {
    return {};
  }

  if (typeof body !== 'object') {
    return {};
  }

  if (Array.isArray(body)) {
    return {};
  }

  return body;
}

/**
 * True when the field exists AND is not null.
 * (Same as PHP: isset($body['field']))
 */
export function hasValue(body: RequestBody, fieldName: string): boolean {
  const value = body[fieldName];

  if (value === undefined || value === null) {
    return false;
  }

  return true;
}

/**
 * True when the field exists, even if its value is null.
 * (Same as PHP: array_key_exists('field', $body))
 */
export function hasField(body: RequestBody, fieldName: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, fieldName);
}

/**
 * Return the field value, or the fallback when the field is missing or null.
 * (Same as PHP: $body['field'] ?? $fallback)
 */
export function valueOrFallback(body: RequestBody, fieldName: string, fallback: any): any {
  if (hasValue(body, fieldName)) {
    return body[fieldName];
  }

  return fallback;
}

/**
 * Return the field value when the field is present (even when it is null),
 * otherwise return the existing value.
 * Used for fields that the admin is allowed to clear by sending null.
 */
export function valueOrExisting(body: RequestBody, fieldName: string, existingValue: any): any {
  if (hasField(body, fieldName)) {
    return body[fieldName];
  }

  return existingValue;
}

/**
 * True when a value counts as "empty".
 * (Same as PHP: empty($value))
 */
export function isEmptyValue(value: any): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (value === false || value === 0 || value === '' || value === '0') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  return false;
}

/**
 * Convert any value to a whole number.
 * (Same as PHP: (int) $value)
 *   "12"    -> 12
 *   "12abc" -> 12
 *   "abc"   -> 0
 *   true    -> 1
 *   null    -> 0
 */
export function toInteger(value: any): number {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return Math.trunc(value);
    }
    return 0;
  }

  if (typeof value === 'boolean') {
    if (value === true) {
      return 1;
    }
    return 0;
  }

  if (typeof value === 'string') {
    const parsedNumber = parseInt(value.trim(), 10);
    if (Number.isNaN(parsedNumber)) {
      return 0;
    }
    return parsedNumber;
  }

  return 0;
}

/**
 * Convert any value to 1 or 0 (used for is_active columns).
 * (Same as PHP: (int) (bool) $value)
 */
export function toFlag(value: any): number {
  if (isEmptyValue(value)) {
    return 0;
  }

  return 1;
}

/**
 * The is_active value for an INSERT: use the body value when given, otherwise 1.
 */
export function activeFlagForInsert(body: RequestBody): number {
  if (hasValue(body, 'is_active')) {
    return toFlag(body.is_active);
  }

  return 1;
}

/**
 * The is_active value for an UPDATE: use the body value when given,
 * otherwise keep the existing value.
 */
export function activeFlagForUpdate(body: RequestBody, existingValue: any): number {
  if (hasValue(body, 'is_active')) {
    return toFlag(body.is_active);
  }

  return toInteger(existingValue);
}

/**
 * Read a query string value (for example ?page=2) as text.
 * Returns null when the value is missing.
 */
export function getQueryText(request: Request, name: string): string | null {
  const value = request.query[name];

  if (typeof value === 'string') {
    return value;
  }

  return null;
}

/**
 * Today's date as "YYYY-MM-DD" (in the server's local time zone).
 */
export function todayAsText(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
}

/**
 * Split a newline-separated list of image paths into an array.
 * Empty lines are removed.
 */
export function splitImageList(text: string | null): string[] {
  const images: string[] = [];

  if (text === null || text === undefined) {
    return images;
  }

  const lines = String(text).split('\n');
  for (const line of lines) {
    const cleanLine = line.trim();
    // PHP's array_filter() also dropped the string "0", so we do the same
    if (cleanLine !== '' && cleanLine !== '0') {
      images.push(cleanLine);
    }
  }

  return images;
}
