import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { insert } from '../../src/lib/db';
import { loginAs, bearer, createAs, uniqueSuffix } from './helpers';

/**
 * GET /api/public/homepage — everything the homepage needs in one request.
 */
describe('GET /api/public/homepage', function () {
  let editorToken = '';
  const suffix = uniqueSuffix();

  beforeAll(async function () {
    editorToken = await loginAs('editor');

    // Banners: two visible (in a chosen order) and one hidden
    await createAs(editorToken, '/api/admin/banners', { image_path: '/uploads/banners/second.jpg', title: 'Second ' + suffix, sort_order: 2 });
    await createAs(editorToken, '/api/admin/banners', { image_path: '/uploads/banners/first.jpg', title: 'First ' + suffix, sort_order: 1 });
    await createAs(editorToken, '/api/admin/banners', { image_path: '/uploads/banners/hidden.jpg', title: 'Hidden ' + suffix, is_active: 0 });

    // A hidden category and a hidden project
    await createAs(editorToken, '/api/admin/categories', { name: 'Hidden Category ' + suffix, is_active: 0 });
    await createAs(editorToken, '/api/admin/projects', { title: 'Hidden Project ' + suffix, is_active: 0 });

    // Story milestones and partner brands have no admin pages yet,
    // so they are added straight into the test database
    await insert('INSERT INTO story_milestones (year, content_text, sort_order) VALUES (?, ?, ?)', ['1998', 'Founded ' + suffix, 1]);
    await insert('INSERT INTO partner_brands (name, logo_path, is_active) VALUES (?, ?, ?)', ['Visible Brand ' + suffix, '/uploads/brands/a.png', 1]);
    await insert('INSERT INTO partner_brands (name, logo_path, is_active) VALUES (?, ?, ?)', ['Hidden Brand ' + suffix, '/uploads/brands/b.png', 0]);

    // One homepage setting and one setting that does not belong on the homepage
    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', bearer(editorToken))
      .send({ homepage_about_text: 'About us ' + suffix, smtp_note: 'not for the homepage' });
  });

  it('always has the six homepage sections', async function () {
    const response = await request(app).get('/api/public/homepage');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.data).sort()).toEqual([
      'banners',
      'featuredCategories',
      'homepageSettings',
      'marqueeProjects',
      'partnerBrands',
      'storyMilestones',
    ]);
  });

  it('shows active banners in sort_order, and hides hidden banners', async function () {
    const response = await request(app).get('/api/public/homepage');

    const ourTitles = response.body.data.banners
      .map(function (banner: any) {
        return banner.title;
      })
      .filter(function (title: string) {
        return title !== null && title.endsWith(suffix);
      });

    expect(ourTitles).toEqual(['First ' + suffix, 'Second ' + suffix]);
  });

  it('does not show hidden categories, projects or brands', async function () {
    const response = await request(app).get('/api/public/homepage');
    const data = response.body.data;

    const allNames = [
      ...data.featuredCategories.map((category: any) => category.name),
      ...data.marqueeProjects.map((project: any) => project.title),
      ...data.partnerBrands.map((brand: any) => brand.name),
    ];

    expect(allNames).not.toContain('Hidden Category ' + suffix);
    expect(allNames).not.toContain('Hidden Project ' + suffix);
    expect(allNames).not.toContain('Hidden Brand ' + suffix);
    expect(allNames).toContain('Visible Brand ' + suffix);
  });

  it('shows at most 8 categories and 20 projects', async function () {
    const response = await request(app).get('/api/public/homepage');

    expect(response.body.data.featuredCategories.length).toBeLessThanOrEqual(8);
    expect(response.body.data.marqueeProjects.length).toBeLessThanOrEqual(20);
  });

  it('shows the newest projects first', async function () {
    await createAs(editorToken, '/api/admin/projects', { title: 'Old Project ' + suffix, published_at: '2001-01-01' });
    await createAs(editorToken, '/api/admin/projects', { title: 'New Project ' + suffix, published_at: '2099-01-01' });

    const response = await request(app).get('/api/public/homepage');
    const titles = response.body.data.marqueeProjects.map((project: any) => project.title);

    expect(titles[0]).toBe('New Project ' + suffix);
  });

  it('includes story milestones', async function () {
    const response = await request(app).get('/api/public/homepage');

    const texts = response.body.data.storyMilestones.map((milestone: any) => milestone.content_text);
    expect(texts).toContain('Founded ' + suffix);
  });

  it('only includes homepage_* settings', async function () {
    const response = await request(app).get('/api/public/homepage');
    const settings = response.body.data.homepageSettings;

    expect(settings.homepage_about_text).toBe('About us ' + suffix);
    for (const key of Object.keys(settings)) {
      expect(key.startsWith('homepage_')).toBe(true);
    }
  });
});
