import type { Request, Response } from 'express';
import { queryAll, execute } from '../lib/db';
import { sendOk } from '../lib/response';
import { getBody } from '../lib/values';
import type { SettingRow } from '../types/database';

/**
 * Site settings are stored as key/value rows in the site_settings table.
 */

/**
 * Convert a setting value to the text that is saved in the database.
 * Text, numbers and true/false are saved as text; lists and objects as JSON.
 * null is saved as an empty value (NULL), not as the text "null".
 */
function settingValueToText(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    if (value === true) {
      return '1';
    }
    return '';
  }

  // arrays and objects
  return JSON.stringify(value);
}

/**
 * GET /api/admin/settings
 * Returns every setting as one object: { site_name: "...", contact_email: "..." }
 */
export async function getSettings(request: Request, response: Response) {
  const rows = await queryAll<SettingRow>('SELECT `key`, `value` FROM site_settings');

  const settings: Record<string, string | null> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  sendOk(response, settings);
}

/**
 * PUT /api/admin/settings
 * Body: { some_key: "new value", other_key: "..." }
 * Every key in the body is created or updated.
 */
export async function updateSettings(request: Request, response: Response) {
  const body = getBody(request);

  const keys = Object.keys(body);
  for (const key of keys) {
    const valueText = settingValueToText(body[key]);

    await execute(
      'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      [key, valueText]
    );
  }

  sendOk(response);
}
