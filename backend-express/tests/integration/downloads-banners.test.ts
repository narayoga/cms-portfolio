import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

describe('Downloads', function () {
  let editorToken = '';

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  it('the website shows active downloads only, sorted by sort_order', async function () {
    const suffix = uniqueSuffix();
    await createAs(editorToken, '/api/admin/downloads', { title: 'Catalogue B ' + suffix, sort_order: 20 });
    await createAs(editorToken, '/api/admin/downloads', { title: 'Catalogue A ' + suffix, sort_order: 10 });
    await createAs(editorToken, '/api/admin/downloads', { title: 'Hidden ' + suffix, is_active: 0 });

    const response = await request(app).get('/api/public/downloads');

    expect(response.status).toBe(200);
    const ourTitles = response.body.data
      .map((download: any) => download.title)
      .filter((title: string) => title.endsWith(suffix));
    expect(ourTitles).toEqual(['Catalogue A ' + suffix, 'Catalogue B ' + suffix]);
  });

  it('a new download without a section goes to "catalogues"', async function () {
    const title = 'No section ' + uniqueSuffix();
    await createAs(editorToken, '/api/admin/downloads', { title: title });

    const response = await request(app).get('/api/public/downloads');
    const download = response.body.data.find((item: any) => item.title === title);

    expect(download.section).toBe('catalogues');
  });

  it('an update keeps the fields that are not sent', async function () {
    const title = 'Manual ' + uniqueSuffix();
    const created = await createAs(editorToken, '/api/admin/downloads', {
      title: title,
      section: 'manuals',
      file_path: '/uploads/downloads/files/manual.pdf',
    });

    await request(app)
      .put('/api/admin/downloads/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ description: 'Installation manual' });

    const response = await request(app).get('/api/admin/downloads').set('Authorization', bearer(editorToken));
    const download = response.body.data.find((item: any) => item.id === created.id);

    expect(download.description).toBe('Installation manual');
    expect(download.section).toBe('manuals');
    expect(download.file_path).toBe('/uploads/downloads/files/manual.pdf');
  });

  it('answers 422 when the title is missing', async function () {
    const response = await request(app)
      .post('/api/admin/downloads')
      .set('Authorization', bearer(editorToken))
      .send({ section: 'manuals' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: title');
  });

  it('answers 422 for an unknown section (create)', async function () {
    const response = await request(app)
      .post('/api/admin/downloads')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'Brochure', section: 'brochures' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid section');
  });

  it('answers 422 for an unknown section (update)', async function () {
    const created = await createAs(editorToken, '/api/admin/downloads', { title: 'Valid ' + uniqueSuffix() });

    const response = await request(app)
      .put('/api/admin/downloads/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ section: 'brochures' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid section');
  });

  it('answers 404 when updating a download that does not exist', async function () {
    const response = await request(app)
      .put('/api/admin/downloads/99999999')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'Ghost' });

    expect(response.status).toBe(404);
  });
});

describe('Banners', function () {
  let editorToken = '';

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  it('answers 422 without an image', async function () {
    const response = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'No image' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: image_path');
  });

  it('an update keeps the fields that are not sent', async function () {
    const created = await createAs(editorToken, '/api/admin/banners', {
      image_path: '/uploads/banners/hero.jpg',
      title: 'Hero',
      subtitle: 'Since 1998',
      link: '/about',
    });

    await request(app)
      .put('/api/admin/banners/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ title: 'New hero' });

    const response = await request(app).get('/api/admin/banners').set('Authorization', bearer(editorToken));
    const banner = response.body.data.find((item: any) => item.id === created.id);

    expect(banner.title).toBe('New hero');
    expect(banner.subtitle).toBe('Since 1998');
    expect(banner.link).toBe('/about');
    expect(banner.image_path).toBe('/uploads/banners/hero.jpg');
  });

  it('hiding a banner removes it from the homepage', async function () {
    const title = 'Temporary ' + uniqueSuffix();
    const created = await createAs(editorToken, '/api/admin/banners', { image_path: '/uploads/banners/t.jpg', title: title });

    await request(app)
      .put('/api/admin/banners/' + created.id)
      .set('Authorization', bearer(editorToken))
      .send({ is_active: 0 });

    const response = await request(app).get('/api/public/homepage');
    const titles = response.body.data.banners.map((banner: any) => banner.title);

    expect(titles).not.toContain(title);
  });

  it('answers 404 when updating a banner that does not exist', async function () {
    const response = await request(app)
      .put('/api/admin/banners/99999999')
      .set('Authorization', bearer(editorToken))
      .send({ title: 'Ghost' });

    expect(response.status).toBe(404);
  });
});
