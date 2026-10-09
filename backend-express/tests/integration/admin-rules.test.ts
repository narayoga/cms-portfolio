import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer } from './helpers';

/**
 * Rules that every admin resource must follow.
 */
describe('Admin rules for every resource', function () {
  let adminToken = '';

  beforeAll(async function () {
    adminToken = await loginAs('admin');
  });

  // Every resource that has DELETE /api/admin/<name>/:id
  const resourcesWithDelete = [
    'users',
    'categories',
    'subcategories',
    'subsubcategories',
    'products',
    'projects',
    'publications',
    'downloads',
    'banners',
    'nav-menus',
  ];

  for (const resourceName of resourcesWithDelete) {
    it('DELETE /api/admin/' + resourceName + '/:id answers 404 when the row does not exist', async function () {
      const response = await request(app)
        .delete('/api/admin/' + resourceName + '/99999999')
        .set('Authorization', bearer(adminToken));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ ok: false, error: 'Not found' });
    });
  }

  it('a deleted row is really gone (second delete answers 404)', async function () {
    const createResponse = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', bearer(adminToken))
      .send({ image_path: '/uploads/banners/test.jpg', title: 'Delete me' });
    const bannerId = createResponse.body.data.id;

    const firstDelete = await request(app)
      .delete('/api/admin/banners/' + bannerId)
      .set('Authorization', bearer(adminToken));
    expect(firstDelete.status).toBe(200);

    const secondDelete = await request(app)
      .delete('/api/admin/banners/' + bannerId)
      .set('Authorization', bearer(adminToken));
    expect(secondDelete.status).toBe(404);
  });

  it('a nav menu link cannot be moved to an unknown location', async function () {
    const createResponse = await request(app)
      .post('/api/admin/nav-menus')
      .set('Authorization', bearer(adminToken))
      .send({ location: 'header', label: 'About', url: '/about' });
    const menuLinkId = createResponse.body.data.id;

    const response = await request(app)
      .put('/api/admin/nav-menus/' + menuLinkId)
      .set('Authorization', bearer(adminToken))
      .send({ location: 'sidebar' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid location');
  });
});
