import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

/**
 * Catalog items (sub-subcategories): the 3rd and 4th level of the catalog.
 *
 *   /categories/:cat/:sub/:item            level 3: a group or a product directly in a subcategory
 *   /categories/:cat/:sub/:group/:product  level 4: a product inside a group
 */
describe('Catalog items (sub-subcategories)', function () {
  let editorToken = '';
  let categorySlug = '';
  let subcategoryId = 0;
  let subcategorySlug = '';

  // Public URL of a level 3 item
  function level3Url(itemSlug: string): string {
    return '/api/public/subsubcategories/' + categorySlug + '/' + subcategorySlug + '/' + itemSlug;
  }

  // Public URL of a level 4 item (a product inside a group)
  function level4Url(groupSlug: string, itemSlug: string): string {
    return level3Url(groupSlug) + '/' + itemSlug;
  }

  async function updateItem(itemId: number, body: Record<string, unknown>) {
    return request(app)
      .put('/api/admin/subsubcategories/' + itemId)
      .set('Authorization', bearer(editorToken))
      .send(body);
  }

  beforeAll(async function () {
    editorToken = await loginAs('editor');

    const category = await createAs(editorToken, '/api/admin/categories', { name: 'Architectural ' + uniqueSuffix() });
    const subcategory = await createAs(editorToken, '/api/admin/subcategories', {
      name: 'Door Hardware',
      category_id: category.id,
    });

    categorySlug = category.slug;
    subcategoryId = subcategory.id;
    subcategorySlug = subcategory.slug;
  });

  describe('advantages and features of a product item', function () {
    let productId = 0;
    let productSlug = '';

    beforeAll(async function () {
      const product = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Floor Spring FS-100',
        type: 'product',
        subcategory_id: subcategoryId,
        advantages: ['Silent closing', '', '  Up to 120 kg  '],
        features: [
          { title: 'Carousel feature', images: ['/uploads/catalog/features/a.jpg', '/uploads/catalog/features/b.jpg'] },
          { title: 'Single image feature', image_path: '/uploads/catalog/features/c.jpg', description: 'One image' },
          { title: '', images: ['/uploads/catalog/features/skipped.jpg'] },
        ],
      });
      productId = product.id;
      productSlug = product.slug;
    });

    it('saves advantages in order, trimmed, without empty lines', async function () {
      const response = await request(app).get(level3Url(productSlug));

      expect(response.status).toBe(200);
      const labels = response.body.data.advantages.map(function (advantage: any) {
        return advantage.label;
      });
      expect(labels).toEqual(['Silent closing', 'Up to 120 kg']);
    });

    it('turns feature images into a list (carousel or single image), skipping features without a title', async function () {
      const response = await request(app).get(level3Url(productSlug));

      const features = response.body.data.features;
      expect(features.length).toBe(2);
      expect(features[0].title).toBe('Carousel feature');
      expect(features[0].images).toEqual(['/uploads/catalog/features/a.jpg', '/uploads/catalog/features/b.jpg']);
      expect(features[1].title).toBe('Single image feature');
      expect(features[1].images).toEqual(['/uploads/catalog/features/c.jpg']);
      expect(features[1].description).toBe('One image');
    });

    it('the admin detail returns the same advantages and features (for the edit form)', async function () {
      const response = await request(app)
        .get('/api/admin/subsubcategories/' + productId)
        .set('Authorization', bearer(editorToken));

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Floor Spring FS-100');
      expect(response.body.data.advantages.length).toBe(2);
      expect(response.body.data.features[0].images.length).toBe(2);
    });

    it('an update without advantages/features keeps them', async function () {
      const updateResponse = await updateItem(productId, { name: 'Floor Spring FS-100 Pro' });
      expect(updateResponse.status).toBe(200);

      const response = await request(app).get(level3Url(productSlug));
      expect(response.body.data.name).toBe('Floor Spring FS-100 Pro');
      expect(response.body.data.advantages.length).toBe(2);
      expect(response.body.data.features.length).toBe(2);
    });

    it('sending advantages replaces the whole list', async function () {
      await updateItem(productId, { advantages: ['Only this one'] });

      const response = await request(app).get(level3Url(productSlug));
      expect(response.body.data.advantages.map((advantage: any) => advantage.label)).toEqual(['Only this one']);
      // Features were not sent, so they stay
      expect(response.body.data.features.length).toBe(2);
    });

    it('sending an empty features list removes every feature', async function () {
      await updateItem(productId, { features: [] });

      const response = await request(app).get(level3Url(productSlug));
      expect(response.body.data.features).toEqual([]);
    });
  });

  describe('groups and nested products (level 3 and 4)', function () {
    let groupId = 0;
    let groupSlug = '';
    let childSlug = '';

    beforeAll(async function () {
      const group = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Door Closers Group',
        type: 'group',
        subcategory_id: subcategoryId,
      });
      groupId = group.id;
      groupSlug = group.slug;

      const child = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Closer TS 3000',
        subcategory_id: subcategoryId,
        parent_id: groupId,
        advantages: ['Adjustable speed'],
      });
      childSlug = child.slug;

      await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Hidden Closer',
        subcategory_id: subcategoryId,
        parent_id: groupId,
        is_active: 0,
      });
    });

    it('a group page lists its active children only', async function () {
      const response = await request(app).get(level3Url(groupSlug));

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('group');
      const childNames = response.body.data.children.map(function (child: any) {
        return child.name;
      });
      expect(childNames).toEqual(['Closer TS 3000']);
    });

    it('a nested product opens at level 4 with its group in the response', async function () {
      const response = await request(app).get(level4Url(groupSlug, childSlug));

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Closer TS 3000');
      expect(response.body.data.group_slug).toBe(groupSlug);
      expect(response.body.data.advantages[0].label).toBe('Adjustable speed');
    });

    it('a nested product does not open at level 3', async function () {
      const response = await request(app).get(level3Url(childSlug));
      expect(response.status).toBe(404);
    });

    it('a nested product does not open under the wrong group', async function () {
      const response = await request(app).get(level4Url('wrong-group', childSlug));
      expect(response.status).toBe(404);
    });

    it('hiding the group hides the products inside it', async function () {
      await updateItem(groupId, { is_active: 0 });

      const groupResponse = await request(app).get(level3Url(groupSlug));
      const childResponse = await request(app).get(level4Url(groupSlug, childSlug));

      expect(groupResponse.status).toBe(404);
      expect(childResponse.status).toBe(404);
    });
  });

  describe('admin list and validation', function () {
    it('the admin list can be filtered by subcategory', async function () {
      const response = await request(app)
        .get('/api/admin/subsubcategories?subcategory_id=' + subcategoryId)
        .set('Authorization', bearer(editorToken));

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      for (const item of response.body.data) {
        expect(item.subcategory_id).toBe(subcategoryId);
      }
    });

    it('answers 404 for an item that does not exist', async function () {
      const response = await request(app)
        .get('/api/admin/subsubcategories/99999999')
        .set('Authorization', bearer(editorToken));

      expect(response.status).toBe(404);
    });

    it('a type that is not "group" or "product" is rejected (create)', async function () {
      const response = await request(app)
        .post('/api/admin/subsubcategories')
        .set('Authorization', bearer(editorToken))
        .send({ name: 'Odd', type: 'folder', subcategory_id: subcategoryId });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Invalid type');
    });

    it('a type that is not "group" or "product" is rejected (update)', async function () {
      const item = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'Valid item',
        subcategory_id: subcategoryId,
      });

      const response = await updateItem(item.id, { type: 'folder' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Invalid type');
    });

    it('a new item without a type becomes a product', async function () {
      const item = await createAs(editorToken, '/api/admin/subsubcategories', {
        name: 'No type given',
        subcategory_id: subcategoryId,
      });

      const response = await request(app)
        .get('/api/admin/subsubcategories/' + item.id)
        .set('Authorization', bearer(editorToken));

      expect(response.body.data.type).toBe('product');
    });
  });
});
