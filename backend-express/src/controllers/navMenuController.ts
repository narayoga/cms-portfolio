import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  getQueryText,
  valueOrFallback,
  toInteger,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField } from '../lib/validator';
import type { NavMenuRow } from '../types/database';

const ALLOWED_LOCATIONS = ['header', 'footer_explore', 'footer_resources'];

/**
 * GET /api/admin/nav-menus?location=header
 * Without location, every menu link is returned.
 */
export async function listNavMenus(request: Request, response: Response) {
  const location = getQueryText(request, 'location');

  let menuLinks;
  if (location !== null && location !== '' && location !== '0') {
    menuLinks = await queryAll(
      'SELECT * FROM nav_menus WHERE location = ? ORDER BY sort_order ASC, id ASC',
      [location]
    );
  } else {
    menuLinks = await queryAll('SELECT * FROM nav_menus ORDER BY location ASC, sort_order ASC');
  }

  sendOk(response, menuLinks);
}

/**
 * POST /api/admin/nav-menus
 * Body: { location, label, url, sort_order?, is_active? }
 */
export async function createNavMenu(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['location', 'label', 'url']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  if (ALLOWED_LOCATIONS.includes(body.location) === false) {
    sendError(response, 'Invalid location', 422);
    return;
  }

  const newMenuLinkId = await insert(
    'INSERT INTO nav_menus (location, label, url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
    [
      body.location,
      body.label,
      body.url,
      toInteger(valueOrFallback(body, 'sort_order', 0)),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newMenuLinkId });
}

/**
 * PUT /api/admin/nav-menus/:id
 */
export async function updateNavMenu(request: Request, response: Response) {
  const menuLinkId = toInteger(request.params.id);
  const body = getBody(request);

  const existingMenuLink = await queryOne<NavMenuRow>('SELECT * FROM nav_menus WHERE id = ?', [menuLinkId]);
  if (existingMenuLink === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  await execute(
    'UPDATE nav_menus SET location = ?, label = ?, url = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'location', existingMenuLink.location),
      valueOrFallback(body, 'label', existingMenuLink.label),
      valueOrFallback(body, 'url', existingMenuLink.url),
      toInteger(valueOrFallback(body, 'sort_order', existingMenuLink.sort_order)),
      activeFlagForUpdate(body, existingMenuLink.is_active),
      menuLinkId,
    ]
  );

  sendOk(response, { id: menuLinkId });
}

/**
 * DELETE /api/admin/nav-menus/:id
 */
export async function deleteNavMenu(request: Request, response: Response) {
  const menuLinkId = toInteger(request.params.id);

  await execute('DELETE FROM nav_menus WHERE id = ?', [menuLinkId]);

  sendOk(response);
}
