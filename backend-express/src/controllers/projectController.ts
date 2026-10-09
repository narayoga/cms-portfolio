import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import {
  getBody,
  hasValue,
  valueOrFallback,
  valueOrExisting,
  toInteger,
  todayAsText,
  activeFlagForInsert,
  activeFlagForUpdate,
} from '../lib/values';
import { findMissingField, makeSlug, makeUniqueSlug } from '../lib/validator';
import type { ProjectRow } from '../types/database';

/**
 * GET /api/admin/projects
 */
export async function listProjects(request: Request, response: Response) {
  const projects = await queryAll('SELECT * FROM projects ORDER BY published_at DESC, id DESC');
  sendOk(response, projects);
}

/**
 * POST /api/admin/projects
 */
export async function createProject(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['title']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const slugSource = valueOrFallback(body, 'slug', body.title);
  const slug = await makeUniqueSlug('projects', makeSlug(slugSource));

  const newProjectId = await insert(
    'INSERT INTO projects (title, category, location, products, owner, architect, contractor, slug, cover_image, content_html, published_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      body.title,
      valueOrFallback(body, 'category', null),
      valueOrFallback(body, 'location', null),
      valueOrFallback(body, 'products', null),
      valueOrFallback(body, 'owner', null),
      valueOrFallback(body, 'architect', null),
      valueOrFallback(body, 'contractor', null),
      slug,
      valueOrFallback(body, 'cover_image', null),
      valueOrFallback(body, 'content_html', null),
      valueOrFallback(body, 'published_at', todayAsText()),
      activeFlagForInsert(body),
    ]
  );

  sendOk(response, { id: newProjectId, slug: slug });
}

/**
 * PUT /api/admin/projects/:id
 * The detail fields (category, location, products, owner, architect, contractor)
 * can be cleared by sending null.
 */
export async function updateProject(request: Request, response: Response) {
  const projectId = toInteger(request.params.id);
  const body = getBody(request);

  const existingProject = await queryOne<ProjectRow>('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (existingProject === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  let slug = existingProject.slug;
  if (hasValue(body, 'slug')) {
    slug = await makeUniqueSlug('projects', makeSlug(body.slug), { excludeId: projectId });
  }

  await execute(
    'UPDATE projects SET title = ?, category = ?, location = ?, products = ?, owner = ?, architect = ?, contractor = ?, slug = ?, cover_image = ?, content_html = ?, published_at = ?, is_active = ? WHERE id = ?',
    [
      valueOrFallback(body, 'title', existingProject.title),
      valueOrExisting(body, 'category', existingProject.category),
      valueOrExisting(body, 'location', existingProject.location),
      valueOrExisting(body, 'products', existingProject.products),
      valueOrExisting(body, 'owner', existingProject.owner),
      valueOrExisting(body, 'architect', existingProject.architect),
      valueOrExisting(body, 'contractor', existingProject.contractor),
      slug,
      valueOrFallback(body, 'cover_image', existingProject.cover_image),
      valueOrFallback(body, 'content_html', existingProject.content_html),
      valueOrFallback(body, 'published_at', existingProject.published_at),
      activeFlagForUpdate(body, existingProject.is_active),
      projectId,
    ]
  );

  sendOk(response, { id: projectId });
}

/**
 * DELETE /api/admin/projects/:id
 */
export async function deleteProject(request: Request, response: Response) {
  const projectId = toInteger(request.params.id);

  const deletedRowCount = await execute('DELETE FROM projects WHERE id = ?', [projectId]);
  if (deletedRowCount === 0) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response);
}
