import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

describe('Nav menus', function () {
  let editorToken = '';
  const suffix = uniqueSuffix();

  beforeAll(async function () {
    editorToken = await loginAs('editor');

    // Created out of order on purpose: the website must sort by sort_order
    await createAs(editorToken, '/api/admin/nav-menus', { location: 'footer_explore', label: 'Projects ' + suffix, url: '/projects', sort_order: 2 });
    await createAs(editorToken, '/api/admin/nav-menus', { location: 'footer_explore', label: 'Products ' + suffix, url: '/products', sort_order: 1 });
    await createAs(editorToken, '/api/admin/nav-menus', { location: 'footer_explore', label: 'Hidden ' + suffix, url: '/hidden', is_active: 0 });
  });

  describe('GET /api/public/nav-menus', function () {
    it('always returns the three menu locations', async function () {
      const response = await request(app).get('/api/public/nav-menus');

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.data).sort()).toEqual(['footer_explore', 'footer_resources', 'header']);
    });

    it('shows active links only, sorted by sort_order', async function () {
      const response = await request(app).get('/api/public/nav-menus');

      const ourLabels = response.body.data.footer_explore
        .map(function (link: any) {
          return link.label;
        })
        .filter(function (label: string) {
          return label.endsWith(suffix);
        });

      expect(ourLabels).toEqual(['Products ' + suffix, 'Projects ' + suffix]);
    });

    it('each link only has id, label and url', async function () {
      const response = await request(app).get('/api/public/nav-menus');

      for (const link of response.body.data.footer_explore) {
        expect(Object.keys(link).sort()).toEqual(['id', 'label', 'url']);
      }
    });
  });

  describe('admin', function () {
    it('the admin list can be filtered by location (hidden links included)', async function () {
      const response = await request(app)
        .get('/api/admin/nav-menus?location=footer_explore')
        .set('Authorization', bearer(editorToken));

      expect(response.status).toBe(200);
      const labels: string[] = [];
      for (const link of response.body.data) {
        expect(link.location).toBe('footer_explore');
        labels.push(link.label);
      }
      expect(labels).toContain('Hidden ' + suffix);
    });

    it('an update keeps the fields that are not sent', async function () {
      const link = await createAs(editorToken, '/api/admin/nav-menus', { location: 'header', label: 'Contact ' + suffix, url: '/contact' });

      await request(app)
        .put('/api/admin/nav-menus/' + link.id)
        .set('Authorization', bearer(editorToken))
        .send({ label: 'Contact us ' + suffix });

      const response = await request(app)
        .get('/api/admin/nav-menus?location=header')
        .set('Authorization', bearer(editorToken));
      const updatedLink = response.body.data.find((item: any) => item.id === link.id);

      expect(updatedLink.label).toBe('Contact us ' + suffix);
      expect(updatedLink.url).toBe('/contact');
    });

    it('answers 422 when a field is missing', async function () {
      const response = await request(app)
        .post('/api/admin/nav-menus')
        .set('Authorization', bearer(editorToken))
        .send({ location: 'header', label: 'No URL' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Missing field: url');
    });

    it('answers 422 for an unknown location', async function () {
      const response = await request(app)
        .post('/api/admin/nav-menus')
        .set('Authorization', bearer(editorToken))
        .send({ location: 'sidebar', label: 'X', url: '/x' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Invalid location');
    });
  });
});
