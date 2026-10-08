import type { Request, Response } from 'express';
import { queryOne, insert, execute } from '../lib/db';
import { sendOk } from '../lib/response';
import { getBody, valueOrFallback } from '../lib/values';

/**
 * The Services page is a single row (id = 1) in the services_page table.
 */

/**
 * GET /api/admin/service
 */
export async function getServicePage(request: Request, response: Response) {
  const servicePage = await queryOne('SELECT * FROM services_page WHERE id = 1');

  if (servicePage === null) {
    sendOk(response, { id: 1, content_html: '', hero_image: null });
    return;
  }

  sendOk(response, servicePage);
}

/**
 * PUT /api/admin/service
 * Body: { content_html, hero_image }
 */
export async function updateServicePage(request: Request, response: Response) {
  const body = getBody(request);

  const contentHtml = valueOrFallback(body, 'content_html', '');
  const heroImage = valueOrFallback(body, 'hero_image', null);

  const existingRow = await queryOne('SELECT id FROM services_page WHERE id = 1');

  if (existingRow !== null) {
    await execute('UPDATE services_page SET content_html = ?, hero_image = ? WHERE id = 1', [contentHtml, heroImage]);
  } else {
    await insert('INSERT INTO services_page (id, content_html, hero_image) VALUES (1, ?, ?)', [contentHtml, heroImage]);
  }

  sendOk(response);
}
