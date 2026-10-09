import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, uniqueSuffix } from './helpers';

describe('Catalog: category → subcategory → product', function () {
  let editorToken = '';

  beforeAll(async function () {
    editorToken = await loginAs('editor');
  });

  /**
   * Small helper: POST to an admin endpoint and return the response data.
   */
  async function createItem(url: string, body: Record<string, unknown>) {
    const response = await request(app).post(url).set('Authorization', bearer(editorToken)).send(body);

    expect(response.status).toBe(200);
    return response.body.data;
  }

  it('a product is reachable on the website through its category and subcategory', async function () {
    const suffix = uniqueSuffix();

    const category = await createItem('/api/admin/categories', { name: 'Door Hardware ' + suffix });
    const subcategory = await createItem('/api/admin/subcategories', {
      name: 'Door Closers',
      category_id: category.id,
    });
    const product = await createItem('/api/admin/products', {
      name: 'Closer TS 5000',
      subcategory_id: subcategory.id,
      short_desc: 'Heavy duty door closer',
      images: ['/uploads/products/a.jpg', '/uploads/products/b.jpg'],
    });

    // The public category list includes the new category with its subcategory
    const categoriesResponse = await request(app).get('/api/public/categories');
    const publicCategory = categoriesResponse.body.data.find(function (item: any) {
      return item.id === category.id;
    });
    expect(publicCategory).toBeDefined();
    expect(publicCategory.subcategories[0].slug).toBe('door-closers');

    // The product detail page works with the full slug path
    const productUrl = '/api/public/products/' + category.slug + '/' + subcategory.slug + '/' + product.slug;
    const productResponse = await request(app).get(productUrl);

    expect(productResponse.status).toBe(200);
    expect(productResponse.body.data.name).toBe('Closer TS 5000');
    expect(productResponse.body.data.category_slug).toBe(category.slug);
    expect(productResponse.body.data.images).toEqual([
      { image_path: '/uploads/products/a.jpg' },
      { image_path: '/uploads/products/b.jpg' },
    ]);

    // Hiding the category hides the product as well
    await request(app)
      .put('/api/admin/categories/' + category.id)
      .set('Authorization', bearer(editorToken))
      .send({ is_active: 0 });

    const hiddenResponse = await request(app).get(productUrl);
    expect(hiddenResponse.status).toBe(404);
  });

  it('category slugs are unique across the whole table', async function () {
    const name = 'Hinges ' + uniqueSuffix();

    const first = await createItem('/api/admin/categories', { name: name });
    const second = await createItem('/api/admin/categories', { name: name });

    expect(second.slug).toBe(first.slug + '-2');
  });

  it('subcategory slugs only have to be unique inside the same category', async function () {
    const suffix = uniqueSuffix();
    const firstCategory = await createItem('/api/admin/categories', { name: 'Locks ' + suffix });
    const secondCategory = await createItem('/api/admin/categories', { name: 'Handles ' + suffix });

    const inFirst = await createItem('/api/admin/subcategories', { name: 'Accessories', category_id: firstCategory.id });
    const inSecond = await createItem('/api/admin/subcategories', { name: 'Accessories', category_id: secondCategory.id });
    const againInFirst = await createItem('/api/admin/subcategories', { name: 'Accessories', category_id: firstCategory.id });

    expect(inFirst.slug).toBe('accessories');
    expect(inSecond.slug).toBe('accessories');
    expect(againInFirst.slug).toBe('accessories-2');
  });

  it('answers 422 when a subcategory has no category_id', async function () {
    const response = await request(app)
      .post('/api/admin/subcategories')
      .set('Authorization', bearer(editorToken))
      .send({ name: 'Orphan' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: category_id');
  });

  it('a subcategory subtitle can be saved and is shown on the website', async function () {
    const category = await createItem('/api/admin/categories', { name: 'Glass Fittings ' + uniqueSuffix() });
    const subcategory = await createItem('/api/admin/subcategories', {
      name: 'Patch Fittings',
      subtitle: 'For frameless glass doors',
      category_id: category.id,
    });

    const detailUrl = '/api/public/subcategories/' + category.slug + '/' + subcategory.slug;
    const createdResponse = await request(app).get(detailUrl);
    expect(createdResponse.body.data.subtitle).toBe('For frameless glass doors');

    // Update the subtitle
    await request(app)
      .put('/api/admin/subcategories/' + subcategory.id)
      .set('Authorization', bearer(editorToken))
      .send({ subtitle: 'New subtitle' });

    const updatedResponse = await request(app).get(detailUrl);
    expect(updatedResponse.body.data.subtitle).toBe('New subtitle');

    // An update without "subtitle" keeps it
    await request(app)
      .put('/api/admin/subcategories/' + subcategory.id)
      .set('Authorization', bearer(editorToken))
      .send({ name: 'Patch Fittings' });

    const keptResponse = await request(app).get(detailUrl);
    expect(keptResponse.body.data.subtitle).toBe('New subtitle');
  });

  describe('parent records must exist (422 instead of a database error)', function () {
    const MISSING_ID = 99999999;

    /**
     * Send a request and return the response.
     */
    async function send(method: 'post' | 'put', url: string, body: Record<string, unknown>) {
      return request(app)[method](url).set('Authorization', bearer(editorToken)).send(body);
    }

    it('a subcategory needs an existing category', async function () {
      const createResponse = await send('post', '/api/admin/subcategories', { name: 'X', category_id: MISSING_ID });
      expect(createResponse.status).toBe(422);
      expect(createResponse.body.error).toBe('Category not found');

      const category = await createItem('/api/admin/categories', { name: 'Parent ' + uniqueSuffix() });
      const subcategory = await createItem('/api/admin/subcategories', { name: 'Child', category_id: category.id });

      const updateResponse = await send('put', '/api/admin/subcategories/' + subcategory.id, { category_id: MISSING_ID });
      expect(updateResponse.status).toBe(422);
      expect(updateResponse.body.error).toBe('Category not found');
    });

    it('a product needs an existing subcategory', async function () {
      const createResponse = await send('post', '/api/admin/products', { name: 'X', subcategory_id: MISSING_ID });
      expect(createResponse.status).toBe(422);
      expect(createResponse.body.error).toBe('Subcategory not found');

      const category = await createItem('/api/admin/categories', { name: 'Parent ' + uniqueSuffix() });
      const subcategory = await createItem('/api/admin/subcategories', { name: 'Child', category_id: category.id });
      const product = await createItem('/api/admin/products', { name: 'Product', subcategory_id: subcategory.id });

      const updateResponse = await send('put', '/api/admin/products/' + product.id, { subcategory_id: MISSING_ID });
      expect(updateResponse.status).toBe(422);
      expect(updateResponse.body.error).toBe('Subcategory not found');
    });

    describe('catalog items (sub-subcategories)', function () {
      let subcategoryId = 0;
      let otherSubcategoryId = 0;
      let groupId = 0;

      beforeAll(async function () {
        const category = await createItem('/api/admin/categories', { name: 'Items ' + uniqueSuffix() });
        const subcategory = await createItem('/api/admin/subcategories', { name: 'Main', category_id: category.id });
        const otherSubcategory = await createItem('/api/admin/subcategories', { name: 'Other', category_id: category.id });
        subcategoryId = subcategory.id;
        otherSubcategoryId = otherSubcategory.id;

        const group = await createItem('/api/admin/subsubcategories', {
          name: 'Group',
          type: 'group',
          subcategory_id: subcategoryId,
        });
        groupId = group.id;
      });

      it('need an existing subcategory', async function () {
        const response = await send('post', '/api/admin/subsubcategories', { name: 'X', subcategory_id: MISSING_ID });

        expect(response.status).toBe(422);
        expect(response.body.error).toBe('Subcategory not found');
      });

      it('the parent must exist', async function () {
        const response = await send('post', '/api/admin/subsubcategories', {
          name: 'X',
          subcategory_id: subcategoryId,
          parent_id: MISSING_ID,
        });

        expect(response.status).toBe(422);
        expect(response.body.error).toBe('Parent not found');
      });

      it('the parent must be a group', async function () {
        const product = await createItem('/api/admin/subsubcategories', {
          name: 'A product',
          type: 'product',
          subcategory_id: subcategoryId,
        });

        const response = await send('post', '/api/admin/subsubcategories', {
          name: 'X',
          subcategory_id: subcategoryId,
          parent_id: product.id,
        });

        expect(response.status).toBe(422);
        expect(response.body.error).toBe('Parent must be a group');
      });

      it('the parent must be in the same subcategory', async function () {
        const response = await send('post', '/api/admin/subsubcategories', {
          name: 'X',
          subcategory_id: otherSubcategoryId,
          parent_id: groupId,
        });

        expect(response.status).toBe(422);
        expect(response.body.error).toBe('Parent must be in the same subcategory');
      });

      it('an item cannot be its own parent', async function () {
        const response = await send('put', '/api/admin/subsubcategories/' + groupId, { parent_id: groupId });

        expect(response.status).toBe(422);
        expect(response.body.error).toBe('An item cannot be its own parent');
      });

      it('a valid parent is accepted', async function () {
        const response = await send('post', '/api/admin/subsubcategories', {
          name: 'Child product',
          subcategory_id: subcategoryId,
          parent_id: groupId,
        });

        expect(response.status).toBe(200);
      });
    });
  });

  it('an unknown category answers 404 on the website', async function () {
    const response = await request(app).get('/api/public/categories/does-not-exist-' + uniqueSuffix());
    expect(response.status).toBe(404);
  });
});
