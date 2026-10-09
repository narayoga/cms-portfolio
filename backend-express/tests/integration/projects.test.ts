import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, uniqueSuffix } from './helpers';

describe('Admin › projects + public projects API', function () {
  let editorToken = '';

  beforeAll(async function () {
    // Editors may manage content, so the editor token is enough here
    editorToken = await loginAs('editor');
  });

  it('answers 401 without a token', async function () {
    const response = await request(app).post('/api/admin/projects').send({ title: 'No token' });
    expect(response.status).toBe(401);
  });

  it('answers 422 when the title is missing', async function () {
    const response = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', bearer(editorToken))
      .send({ location: 'Jakarta' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: title');
  });

  it('full flow: create → visible on website → update → hide → delete', async function () {
    const title = 'Park Hyatt Jakarta ' + uniqueSuffix();

    // 1. Create
    const createResponse = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', bearer(editorToken))
      .send({ title: title, location: 'Jakarta', owner: 'PT Example' });

    expect(createResponse.status).toBe(200);
    const projectId = createResponse.body.data.id;
    const slug = createResponse.body.data.slug;
    expect(slug).toMatch(/^park-hyatt-jakarta-/);

    // 2. The website can show it
    const publicDetail = await request(app).get('/api/public/projects/' + slug);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.data.title).toBe(title);
    expect(publicDetail.body.data.location).toBe('Jakarta');

    const publicList = await request(app).get('/api/public/projects');
    expect(publicList.status).toBe(200);
    const listedSlugs = publicList.body.data.items.map(function (item: any) {
      return item.slug;
    });
    expect(listedSlugs).toContain(slug);

    // 3. Update: clear the location by sending null, other fields stay the same
    const updateResponse = await request(app)
      .put('/api/admin/projects/' + projectId)
      .set('Authorization', bearer(editorToken))
      .send({ location: null });
    expect(updateResponse.status).toBe(200);

    const afterUpdate = await request(app).get('/api/public/projects/' + slug);
    expect(afterUpdate.body.data.location).toBe(null);
    expect(afterUpdate.body.data.owner).toBe('PT Example');

    // 4. Hide it: the website no longer finds it
    await request(app)
      .put('/api/admin/projects/' + projectId)
      .set('Authorization', bearer(editorToken))
      .send({ is_active: 0 });

    const hiddenDetail = await request(app).get('/api/public/projects/' + slug);
    expect(hiddenDetail.status).toBe(404);

    // 5. Delete
    const deleteResponse = await request(app)
      .delete('/api/admin/projects/' + projectId)
      .set('Authorization', bearer(editorToken));
    expect(deleteResponse.status).toBe(200);

    const adminList = await request(app).get('/api/admin/projects').set('Authorization', bearer(editorToken));
    const remainingIds = adminList.body.data.map(function (project: any) {
      return project.id;
    });
    expect(remainingIds).not.toContain(projectId);
  });

  it('gives a second project with the same title a "-2" slug', async function () {
    const title = 'Same Title ' + uniqueSuffix();

    const firstResponse = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', bearer(editorToken))
      .send({ title: title });
    const secondResponse = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', bearer(editorToken))
      .send({ title: title });

    const firstSlug = firstResponse.body.data.slug;
    expect(secondResponse.body.data.slug).toBe(firstSlug + '-2');
  });

  it('answers 404 when updating a project that does not exist', async function () {
    const response = await request(app)
      .put('/api/admin/projects/99999999')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'Ghost' });

    expect(response.status).toBe(404);
  });

  it('the public list is paginated', async function () {
    const response = await request(app).get('/api/public/projects?page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.data.items.length).toBeLessThanOrEqual(1);
    expect(response.body.data.total).toEqual(expect.any(Number));
  });
});
