import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

describe('Admin › publications + public publications API', function () {
  let editorToken = '';

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  it('answers 422 when the title is missing', async function () {
    const response = await request(app)
      .post('/api/admin/publications')
      .set('Authorization', bearer(editorToken))
      .send({ content_html: '<p>No title</p>' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: title');
  });

  it('full flow: create → visible on website → update → hide → delete', async function () {
    const title = 'New Showroom Opening ' + uniqueSuffix();

    // 1. Create
    const created = await createAs(editorToken, '/api/admin/publications', {
      title: title,
      content_html: '<p>We opened a showroom.</p>',
      published_at: '2026-05-01',
    });
    expect(created.slug).toMatch(/^new-showroom-opening-/);

    // 2. The website can show it
    const detail = await request(app).get('/api/public/publications/' + created.slug);
    expect(detail.status).toBe(200);
    expect(detail.body.data.title).toBe(title);
    expect(detail.body.data.content_html).toBe('<p>We opened a showroom.</p>');

    // 3. Update: fields that are not sent stay the same
    await request(app)
      .put('/api/admin/publications/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ title: title + ' (updated)' });

    const afterUpdate = await request(app).get('/api/public/publications/' + created.slug);
    expect(afterUpdate.body.data.title).toBe(title + ' (updated)');
    expect(afterUpdate.body.data.content_html).toBe('<p>We opened a showroom.</p>');
    expect(afterUpdate.body.data.published_at).toBe('2026-05-01');

    // 4. Hide it
    await request(app)
      .put('/api/admin/publications/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ is_active: 0 });

    const hidden = await request(app).get('/api/public/publications/' + created.slug);
    expect(hidden.status).toBe(404);

    // 5. Delete
    const deleteResponse = await request(app)
      .delete('/api/admin/publications/' + created.id)
      .set('Authorization', bearer(editorToken));
    expect(deleteResponse.status).toBe(200);
  });

  it('gives a second publication with the same title a "-2" slug', async function () {
    const title = 'Same Publication ' + uniqueSuffix();

    const first = await createAs(editorToken, '/api/admin/publications', { title: title });
    const second = await createAs(editorToken, '/api/admin/publications', { title: title });

    expect(second.slug).toBe(first.slug + '-2');
  });

  it('answers 404 when updating a publication that does not exist', async function () {
    const response = await request(app)
      .put('/api/admin/publications/99999999')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'Ghost' });

    expect(response.status).toBe(404);
  });

  describe('public list', function () {
    it('is paginated and shows the newest first', async function () {
      const suffix = uniqueSuffix();
      await createAs(editorToken, '/api/admin/publications', { title: 'Older ' + suffix, published_at: '2000-01-01' });
      await createAs(editorToken, '/api/admin/publications', { title: 'Newest ' + suffix, published_at: '2099-12-31' });

      const response = await request(app).get('/api/public/publications?page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.items[0].title).toBe('Newest ' + suffix);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
    });

    it('limits "limit" to 50 and "page" to at least 1', async function () {
      const response = await request(app).get('/api/public/publications?page=0&limit=500');

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(50);
    });

    it('does not include hidden publications', async function () {
      const title = 'Hidden Publication ' + uniqueSuffix();
      await createAs(editorToken, '/api/admin/publications', { title: title, is_active: 0 });

      const response = await request(app).get('/api/public/publications?limit=50');
      const titles = response.body.data.items.map((item: any) => item.title);

      expect(titles).not.toContain(title);
    });
  });
});
