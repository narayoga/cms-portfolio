import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

/**
 * Transactions: a product with its gallery, and a catalog item with its
 * advantages/features, are saved "all or nothing".
 *
 * To prove it, we make one INSERT fail on purpose in the middle of a save,
 * then check that the earlier changes of that save were rolled back.
 */

// Shared between the fake insert() below and the tests
const simulatedFailure = vi.hoisted(function () {
  return { failWhenSqlContains: null as string | null };
});

// The real database module, except that insert() can be told to fail
vi.mock('../../src/lib/db', async function (importOriginal) {
  const realDatabase = await importOriginal<typeof import('../../src/lib/db')>();

  return {
    ...realDatabase,
    insert: async function (sql: string, params?: any[], transaction?: any) {
      const failText = simulatedFailure.failWhenSqlContains;
      if (failText !== null && sql.includes(failText)) {
        throw new Error('Simulated database failure');
      }
      return realDatabase.insert(sql, params, transaction);
    },
  };
});

describe('Transactions (all or nothing)', function () {
  let editorToken = '';
  let subcategoryId = 0;

  beforeAll(async function () {
    editorToken = await loginAs('editor');

    const category = await createAs(editorToken, '/api/admin/categories', { name: 'Transactions ' + uniqueSuffix() });
    const subcategory = await createAs(editorToken, '/api/admin/subcategories', { name: 'Locks', category_id: category.id });
    subcategoryId = subcategory.id;
  });

  afterEach(function () {
    simulatedFailure.failWhenSqlContains = null;
    vi.restoreAllMocks();
  });

  /**
   * Make the next matching INSERT fail, and hide the expected error log.
   */
  function failNextInsertInto(tableName: string) {
    simulatedFailure.failWhenSqlContains = 'INSERT INTO ' + tableName + ' ';
    vi.spyOn(console, 'error').mockImplementation(function () {});
  }

  describe('product + gallery', function () {
    it('a failed gallery save keeps the old product and the old gallery', async function () {
      const product = await createAs(editorToken, '/api/admin/products', {
        name: 'Old name',
        subcategory_id: subcategoryId,
        images: ['/uploads/products/old-1.jpg', '/uploads/products/old-2.jpg'],
      });

      // The UPDATE and the DELETE of the old gallery run, then the first new image fails
      failNextInsertInto('product_images');
      const updateResponse = await request(app)
        .put('/api/admin/products/' + product.id)
        .set('Authorization', bearer(editorToken))
        .send({ name: 'New name', images: ['/uploads/products/new.jpg'] });
      expect(updateResponse.status).toBe(500);
      simulatedFailure.failWhenSqlContains = null;

      const response = await request(app)
        .get('/api/admin/products/' + product.id)
        .set('Authorization', bearer(editorToken));
      const imagePaths = response.body.data.images.map((image: any) => image.image_path);

      expect(response.body.data.name).toBe('Old name');
      expect(imagePaths).toEqual(['/uploads/products/old-1.jpg', '/uploads/products/old-2.jpg']);
    });

    it('a failed gallery save on create leaves no half-saved product', async function () {
      const name = 'Half product ' + uniqueSuffix();

      failNextInsertInto('product_images');
      const createResponse = await request(app)
        .post('/api/admin/products')
        .set('Authorization', bearer(editorToken))
        .send({ name: name, subcategory_id: subcategoryId, images: ['/uploads/products/a.jpg'] });
      expect(createResponse.status).toBe(500);
      simulatedFailure.failWhenSqlContains = null;

      const listResponse = await request(app)
        .get('/api/admin/products?subcategory_id=' + subcategoryId)
        .set('Authorization', bearer(editorToken));
      const names = listResponse.body.data.map((product: any) => product.name);

      expect(names).not.toContain(name);
    });
  });

  describe('catalog item + advantages/features', function () {
    it('a failed features save keeps the old name, advantages and features', async function () {
      const item = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Old item name',
        subcategory_id: subcategoryId,
        advantages: ['Old advantage 1', 'Old advantage 2'],
        features: [{ title: 'Old feature', images: ['/uploads/catalog/features/old.jpg'] }],
      });

      // Advantages are deleted and saved again, features are deleted, then the first feature fails
      failNextInsertInto('sub_subcategory_features');
      const updateResponse = await request(app)
        .put('/api/admin/subsubcategories/' + item.id)
        .set('Authorization', bearer(editorToken))
        .send({
          name: 'New item name',
          advantages: ['New advantage'],
          features: [{ title: 'New feature' }],
        });
      expect(updateResponse.status).toBe(500);
      simulatedFailure.failWhenSqlContains = null;

      const response = await request(app)
        .get('/api/admin/subsubcategories/' + item.id)
        .set('Authorization', bearer(editorToken));
      const data = response.body.data;

      expect(data.name).toBe('Old item name');
      expect(data.advantages.map((advantage: any) => advantage.label)).toEqual(['Old advantage 1', 'Old advantage 2']);
      expect(data.features.map((feature: any) => feature.title)).toEqual(['Old feature']);
    });

    it('a failed advantages save on create leaves no half-saved item', async function () {
      const name = 'Half item ' + uniqueSuffix();

      failNextInsertInto('sub_subcategory_advantages');
      const createResponse = await request(app)
        .post('/api/admin/subsubcategories')
        .set('Authorization', bearer(editorToken))
        .send({ name: name, subcategory_id: subcategoryId, advantages: ['Fails'] });
      expect(createResponse.status).toBe(500);
      simulatedFailure.failWhenSqlContains = null;

      const listResponse = await request(app)
        .get('/api/admin/subsubcategories?subcategory_id=' + subcategoryId)
        .set('Authorization', bearer(editorToken));
      const names = listResponse.body.data.map((listedItem: any) => listedItem.name);

      expect(names).not.toContain(name);
    });
  });
});
