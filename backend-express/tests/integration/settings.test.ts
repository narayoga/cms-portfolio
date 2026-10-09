import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer } from './helpers';

describe('Admin › settings and service page', function () {
  let editorToken = '';

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  it('saved settings are returned by the admin API', async function () {
    const saveResponse = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', bearer(editorToken))
      .send({ site_name: 'Test Site', contact_phone: 12345, show_banner: true });
    expect(saveResponse.status).toBe(200);

    const response = await request(app).get('/api/admin/settings').set('Authorization', bearer(editorToken));

    expect(response.status).toBe(200);
    expect(response.body.data.site_name).toBe('Test Site');
    // Numbers and true/false are saved as text
    expect(response.body.data.contact_phone).toBe('12345');
    expect(response.body.data.show_banner).toBe('1');
  });

  it('the public settings API only shows the public keys', async function () {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', bearer(editorToken))
      .send({ site_name: 'Public Name', internal_note: 'secret note' });

    const response = await request(app).get('/api/public/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.site_name).toBe('Public Name');
    expect(response.body.data.internal_note).toBeUndefined();
  });

  it('a setting sent as null is saved as an empty value, not the text "null"', async function () {
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', bearer(editorToken))
      .send({ ga_id: null });

    const response = await request(app).get('/api/admin/settings').set('Authorization', bearer(editorToken));

    expect(response.body.data.ga_id).toBe(null);
  });

  it('the service page keeps the fields that are not sent', async function () {
    await request(app)
      .put('/api/admin/service')
      .set('Authorization', bearer(editorToken))
      .send({ content_html: '<p>Full text</p>', hero_image: '/uploads/site/services/a.jpg' });

    // Only change the image: the text must stay
    await request(app)
      .put('/api/admin/service')
      .set('Authorization', bearer(editorToken))
      .send({ hero_image: '/uploads/site/services/b.jpg' });

    const afterImageChange = await request(app).get('/api/public/service');
    expect(afterImageChange.body.data).toEqual({
      content_html: '<p>Full text</p>',
      hero_image: '/uploads/site/services/b.jpg',
    });

    // The image can still be removed by sending null
    await request(app)
      .put('/api/admin/service')
      .set('Authorization', bearer(editorToken))
      .send({ hero_image: null });

    const afterRemove = await request(app).get('/api/public/service');
    expect(afterRemove.body.data.hero_image).toBe(null);
    expect(afterRemove.body.data.content_html).toBe('<p>Full text</p>');
  });

  it('the service page can be saved and is shown on the website', async function () {
    const saveResponse = await request(app)
      .put('/api/admin/service')
      .set('Authorization', bearer(editorToken))
      .send({ content_html: '<p>Our services</p>', hero_image: '/uploads/site/services/hero.jpg' });
    expect(saveResponse.status).toBe(200);

    const response = await request(app).get('/api/public/service');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      content_html: '<p>Our services</p>',
      hero_image: '/uploads/site/services/hero.jpg',
    });
  });
});
