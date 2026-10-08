import type { Request, Response } from 'express';
import { queryAll, queryOne } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import { getQueryText, splitImageList, toInteger } from '../lib/values';
import type { SettingRow } from '../types/database';

/**
 * Public (no login needed) endpoints used by the website.
 */

/**
 * Turn rows of { key, value } into one object: { key1: value1, key2: value2 }
 */
function settingRowsToObject(rows: SettingRow[]): Record<string, string | null> {
  const settings: Record<string, string | null> = {};

  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return settings;
}

/**
 * Read ?page= and ?limit= from the query string.
 * page is at least 1, limit is between 1 and 50 (default 12).
 */
function getPagination(request: Request) {
  let page = 1;
  const pageText = getQueryText(request, 'page');
  if (pageText !== null) {
    page = toInteger(pageText);
  }
  if (page < 1) {
    page = 1;
  }

  let limit = 12;
  const limitText = getQueryText(request, 'limit');
  if (limitText !== null) {
    limit = toInteger(limitText);
  }
  if (limit < 1) {
    limit = 1;
  }
  if (limit > 50) {
    limit = 50;
  }

  const offset = (page - 1) * limit;

  return { page: page, limit: limit, offset: offset };
}

/**
 * Features of a catalog item, with their images as an array.
 * The images come from the newline-separated "images" column,
 * or from the single "image_path" column when "images" is empty.
 */
async function getFeaturesForItem(subSubcategoryId: number) {
  const features = await queryAll(
    'SELECT id, title, image_path, images, description FROM sub_subcategory_features WHERE sub_subcategory_id = ? ORDER BY sort_order ASC, id ASC',
    [subSubcategoryId]
  );

  for (const feature of features) {
    let images = splitImageList(feature.images);

    if (images.length === 0 && feature.image_path) {
      images = [feature.image_path];
    }

    feature.images = images;
  }

  return features;
}

async function getAdvantagesForItem(subSubcategoryId: number) {
  return queryAll(
    'SELECT id, label FROM sub_subcategory_advantages WHERE sub_subcategory_id = ? ORDER BY sort_order ASC, id ASC',
    [subSubcategoryId]
  );
}

/**
 * GET /api/public/homepage
 */
export async function getHomepage(request: Request, response: Response) {
  const banners = await queryAll(
    'SELECT id, image_path, title, subtitle, link FROM homepage_banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  );
  const featuredCategories = await queryAll(
    'SELECT id, name, slug, image_path, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC LIMIT 8'
  );
  const marqueeProjects = await queryAll(
    'SELECT id, title, slug, cover_image FROM projects WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT 20'
  );
  const storyMilestones = await queryAll(
    'SELECT id, year, content_text, image_url FROM story_milestones ORDER BY sort_order ASC, year ASC'
  );
  const partnerBrands = await queryAll(
    'SELECT id, name, logo_path FROM partner_brands WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  );

  // Homepage-specific site settings
  const homepageSettingKeys = [
    'homepage_services_headline',
    'homepage_services_subtext',
    'homepage_services_image',
    'homepage_marquee_headline',
    'homepage_about_logo',
    'homepage_about_text',
    'homepage_about_headline_prefix',
    'homepage_about_headline_words',
    'homepage_partners_title',
  ];
  const settingRows = await queryAll<SettingRow>(
    'SELECT `key`, `value` FROM site_settings WHERE `key` IN (?)',
    [homepageSettingKeys]
  );
  const homepageSettings = settingRowsToObject(settingRows);

  sendOk(response, {
    banners: banners,
    featuredCategories: featuredCategories,
    marqueeProjects: marqueeProjects,
    storyMilestones: storyMilestones,
    partnerBrands: partnerBrands,
    homepageSettings: homepageSettings,
  });
}

/**
 * GET /api/public/categories
 * Every active category with its active subcategories.
 */
export async function getCategories(request: Request, response: Response) {
  const categories = await queryAll(
    'SELECT id, name, slug, image_path, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  );

  for (const category of categories) {
    category.subcategories = await queryAll(
      'SELECT id, name, slug, image_path FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
      [category.id]
    );
  }

  sendOk(response, categories);
}

/**
 * GET /api/public/categories/:slug
 */
export async function getCategoryDetail(request: Request, response: Response) {
  const category = await queryOne(
    'SELECT id, name, slug, image_path, description FROM categories WHERE slug = ? AND is_active = 1',
    [request.params.slug]
  );

  if (category === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  category.subcategories = await queryAll(
    'SELECT id, name, slug, image_path, description FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
    [category.id]
  );

  sendOk(response, category);
}

/**
 * GET /api/public/subcategories/:catSlug/:subSlug
 */
export async function getSubcategoryDetail(request: Request, response: Response) {
  const subcategory = await queryOne(
    `SELECT s.id, s.name, s.subtitle, s.slug, s.image_path, s.description, c.name AS category_name, c.slug AS category_slug
     FROM subcategories s JOIN categories c ON c.id = s.category_id
     WHERE s.slug = ? AND c.slug = ? AND s.is_active = 1 AND c.is_active = 1`,
    [request.params.subSlug, request.params.catSlug]
  );

  if (subcategory === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  subcategory.sub_subcategories = await queryAll(
    'SELECT id, name, slug, image_path FROM sub_subcategories WHERE subcategory_id = ? AND parent_id IS NULL AND is_active = 1 ORDER BY sort_order ASC, id ASC',
    [subcategory.id]
  );
  subcategory.products = await queryAll(
    'SELECT id, name, slug, short_desc, cover_image FROM products WHERE subcategory_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
    [subcategory.id]
  );

  sendOk(response, subcategory);
}

/**
 * GET /api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug
 * A top-level catalog item (parent_id IS NULL).
 * Group items list their children; product items have advantages + features.
 */
export async function getSubSubcategoryDetail(request: Request, response: Response) {
  const item = await queryOne(
    `SELECT ss.id, ss.name, ss.slug, ss.type, ss.description, ss.image_path, ss.brand_logo,
            s.name AS subcategory_name, s.slug AS subcategory_slug,
            c.name AS category_name, c.slug AS category_slug
     FROM sub_subcategories ss
     JOIN subcategories s ON s.id = ss.subcategory_id
     JOIN categories c ON c.id = s.category_id
     WHERE ss.slug = ? AND s.slug = ? AND c.slug = ?
       AND ss.parent_id IS NULL
       AND ss.is_active = 1 AND s.is_active = 1 AND c.is_active = 1`,
    [request.params.subSubSlug, request.params.subSlug, request.params.catSlug]
  );

  if (item === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  item.children = await queryAll(
    'SELECT id, name, slug, image_path FROM sub_subcategories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC',
    [item.id]
  );
  item.advantages = await getAdvantagesForItem(item.id);
  item.features = await getFeaturesForItem(item.id);

  sendOk(response, item);
}

/**
 * GET /api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug/:leafSlug
 * A product item nested under a group item (4th level).
 */
export async function getSubSubProductDetail(request: Request, response: Response) {
  const item = await queryOne(
    `SELECT ss.id, ss.name, ss.slug, ss.type, ss.description, ss.image_path, ss.brand_logo,
            g.name AS group_name, g.slug AS group_slug,
            s.name AS subcategory_name, s.slug AS subcategory_slug,
            c.name AS category_name, c.slug AS category_slug
     FROM sub_subcategories ss
     JOIN sub_subcategories g ON g.id = ss.parent_id
     JOIN subcategories s ON s.id = ss.subcategory_id
     JOIN categories c ON c.id = s.category_id
     WHERE ss.slug = ? AND g.slug = ? AND s.slug = ? AND c.slug = ?
       AND ss.is_active = 1 AND g.is_active = 1 AND s.is_active = 1 AND c.is_active = 1`,
    [request.params.leafSlug, request.params.subSubSlug, request.params.subSlug, request.params.catSlug]
  );

  if (item === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  item.advantages = await getAdvantagesForItem(item.id);
  item.features = await getFeaturesForItem(item.id);

  sendOk(response, item);
}

/**
 * GET /api/public/products/:catSlug/:subSlug/:prodSlug
 */
export async function getProductDetail(request: Request, response: Response) {
  const product = await queryOne(
    `SELECT pr.*, s.name AS subcategory_name, s.slug AS subcategory_slug, c.name AS category_name, c.slug AS category_slug
     FROM products pr
     JOIN subcategories s ON s.id = pr.subcategory_id
     JOIN categories c ON c.id = s.category_id
     WHERE pr.slug = ? AND s.slug = ? AND c.slug = ?
       AND pr.is_active = 1 AND s.is_active = 1 AND c.is_active = 1`,
    [request.params.prodSlug, request.params.subSlug, request.params.catSlug]
  );

  if (product === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  product.images = await queryAll(
    'SELECT image_path FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
    [product.id]
  );

  sendOk(response, product);
}

/**
 * GET /api/public/projects?page=1&limit=12
 */
export async function getProjects(request: Request, response: Response) {
  const pagination = getPagination(request);

  const items = await queryAll(
    'SELECT id, title, category, slug, cover_image, published_at FROM projects WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?',
    [pagination.limit, pagination.offset]
  );
  const countRow = await queryOne('SELECT COUNT(*) AS total FROM projects WHERE is_active = 1');

  let total = 0;
  if (countRow !== null) {
    total = toInteger(countRow.total);
  }

  sendOk(response, {
    items: items,
    total: total,
    page: pagination.page,
    limit: pagination.limit,
  });
}

/**
 * GET /api/public/projects/:slug
 */
export async function getProjectDetail(request: Request, response: Response) {
  const project = await queryOne('SELECT * FROM projects WHERE slug = ? AND is_active = 1', [request.params.slug]);

  if (project === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response, project);
}

/**
 * GET /api/public/publications?page=1&limit=12
 */
export async function getPublications(request: Request, response: Response) {
  const pagination = getPagination(request);

  const items = await queryAll(
    'SELECT id, title, slug, cover_image, published_at FROM publications WHERE is_active = 1 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?',
    [pagination.limit, pagination.offset]
  );
  const countRow = await queryOne('SELECT COUNT(*) AS total FROM publications WHERE is_active = 1');

  let total = 0;
  if (countRow !== null) {
    total = toInteger(countRow.total);
  }

  sendOk(response, {
    items: items,
    total: total,
    page: pagination.page,
    limit: pagination.limit,
  });
}

/**
 * GET /api/public/publications/:slug
 */
export async function getPublicationDetail(request: Request, response: Response) {
  const publication = await queryOne('SELECT * FROM publications WHERE slug = ? AND is_active = 1', [request.params.slug]);

  if (publication === null) {
    sendError(response, 'Not found', 404);
    return;
  }

  sendOk(response, publication);
}

/**
 * GET /api/public/downloads
 */
export async function getDownloads(request: Request, response: Response) {
  const downloads = await queryAll(
    'SELECT id, title, section, description, image_path, file_path FROM downloads WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  );

  sendOk(response, downloads);
}

/**
 * GET /api/public/service
 */
export async function getServicePage(request: Request, response: Response) {
  const servicePage = await queryOne('SELECT content_html, hero_image FROM services_page WHERE id = 1');

  if (servicePage === null) {
    sendOk(response, { content_html: '', hero_image: null });
    return;
  }

  sendOk(response, servicePage);
}

/**
 * GET /api/public/settings
 * Only the settings that are safe to show to visitors.
 */
export async function getPublicSettings(request: Request, response: Response) {
  const publicKeys = [
    'site_name',
    'contact_email',
    'contact_phone',
    'contact_address',
    'ga_id',
    'social_facebook',
    'social_instagram',
    'social_linkedin',
  ];

  const allRows = await queryAll<SettingRow>('SELECT `key`, `value` FROM site_settings');

  const publicRows: SettingRow[] = [];
  for (const row of allRows) {
    if (publicKeys.includes(row.key)) {
      publicRows.push(row);
    }
  }

  sendOk(response, settingRowsToObject(publicRows));
}

/**
 * GET /api/public/nav-menus
 * Active menu links grouped by location.
 */
export async function getNavMenus(request: Request, response: Response) {
  const rows = await queryAll(
    'SELECT id, location, label, url, sort_order FROM nav_menus WHERE is_active = 1 ORDER BY location ASC, sort_order ASC'
  );

  const menus: Record<string, { id: number; label: string; url: string }[]> = {
    header: [],
    footer_explore: [],
    footer_resources: [],
  };

  for (const row of rows) {
    const location = row.location;

    if (menus[location] !== undefined) {
      menus[location].push({
        id: toInteger(row.id),
        label: row.label,
        url: row.url,
      });
    }
  }

  sendOk(response, menus);
}
