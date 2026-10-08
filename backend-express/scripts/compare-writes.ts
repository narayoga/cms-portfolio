/**
 * Parity test for create / update / delete endpoints.
 *
 * The same scenario (create, update, validation errors) is run against the PHP
 * backend and then against the Express backend. After each run, the responses
 * and the database rows that were written are saved, then deleted again.
 * Finally both results are compared.
 *
 * Usage (both servers must be running):
 *   npm run compare-writes
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, insert, execute, closeDatabase } from '../src/lib/db';

const PHP_URL = process.env.PHP_URL || 'http://localhost:8000';
const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:8001';
const TEST_EMAIL = 'compare-writes@migration.test';

// Columns that are always different between two runs, so they are not compared
const IGNORED_COLUMNS = ['id', 'created_at', 'updated_at'];
// Columns that point to another row; only "is it filled in or not" is compared
const REFERENCE_COLUMNS = ['category_id', 'subcategory_id', 'parent_id', 'sub_subcategory_id', 'product_id'];

type CreatedRow = { table: string; id: number };

/**
 * Return a copy of a response where ids and timestamps are replaced by
 * placeholders, because they are always different between two runs.
 */
function hideChangingValues(value: any): any {
  if (Array.isArray(value)) {
    return value.map(hideChangingValues);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const copy: Record<string, any> = {};
  for (const key of Object.keys(value)) {
    const isIdColumn = key === 'id' || REFERENCE_COLUMNS.includes(key);
    const isTimeColumn = key === 'created_at' || key === 'updated_at';

    if (isIdColumn && value[key] !== null) {
      copy[key] = 'ID';
    } else if (isTimeColumn) {
      copy[key] = 'TIME';
    } else {
      copy[key] = hideChangingValues(value[key]);
    }
  }
  return copy;
}

class ScenarioRunner {
  baseUrl: string;
  token: string;
  steps: Record<string, any> = {};
  createdRows: CreatedRow[] = [];

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Call the API and remember the (normalized) response under a step name.
   */
  async call(stepName: string, method: string, path: string, body: any = undefined): Promise<any> {
    const options: RequestInit = {
      method: method,
      headers: {
        Authorization: 'Bearer ' + this.token,
        'Content-Type': 'application/json',
      },
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const httpResponse = await fetch(this.baseUrl + path, options);
    const text = await httpResponse.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch (error) {
      result = { notJson: text.substring(0, 200) };
    }

    this.steps[stepName] = { status: httpResponse.status, body: hideChangingValues(result) };

    return result;
  }

  remember(table: string, id: number) {
    this.createdRows.push({ table: table, id: id });
  }
}

/**
 * The scenario: the same list of API calls for both backends.
 */
async function runScenario(runner: ScenarioRunner) {
  // --- Categories ---
  const category = await runner.call('category create', 'POST', '/api/admin/categories', {
    name: 'Zz Test Category',
    description: 'desc',
    image_path: '/uploads/x.jpg',
    sort_order: '7',
    is_active: false,
  });
  const categoryId = category.data.id;
  runner.remember('categories', categoryId);
  await runner.call('category update', 'PUT', '/api/admin/categories/' + categoryId, {
    name: 'Zz Test Category 2',
    slug: 'Zz Test Slug!!',
    is_active: '1',
    description: null,
  });
  await runner.call('category missing name', 'POST', '/api/admin/categories', { description: 'x' });
  await runner.call('category not found', 'PUT', '/api/admin/categories/99999999', { name: 'x' });

  // --- Subcategories ---
  const subcategory = await runner.call('subcategory create', 'POST', '/api/admin/subcategories', {
    name: 'Zz Sub',
    category_id: String(categoryId),
  });
  const subcategoryId = subcategory.data.id;
  runner.remember('subcategories', subcategoryId);
  await runner.call('subcategory update', 'PUT', '/api/admin/subcategories/' + subcategoryId, {
    sort_order: 3,
    image_path: '/a.png',
  });

  // --- Catalog items (sub-subcategories) ---
  const group = await runner.call('item group create', 'POST', '/api/admin/subsubcategories', {
    name: 'Zz Group',
    subcategory_id: subcategoryId,
    type: 'group',
  });
  runner.remember('sub_subcategories', group.data.id);
  const leaf = await runner.call('item leaf create', 'POST', '/api/admin/subsubcategories', {
    name: 'Zz Leaf',
    subcategory_id: subcategoryId,
    parent_id: group.data.id,
    type: 'weird',
    brand_logo: '/logo.png',
    advantages: ['a', ' ', 'b '],
    features: [
      { title: 'F1', images: ['/1.jpg', ' ', '/2.jpg'] },
      { title: '' },
      { title: 'F2', image_path: '/3.jpg', description: 'dd' },
      'not an object',
    ],
  });
  runner.remember('sub_subcategories', leaf.data.id);
  await runner.call('item leaf show', 'GET', '/api/admin/subsubcategories/' + leaf.data.id);
  await runner.call('item leaf update', 'PUT', '/api/admin/subsubcategories/' + leaf.data.id, {
    parent_id: null,
    advantages: ['c'],
    type: 'group',
  });
  await runner.call('item leaf show after update', 'GET', '/api/admin/subsubcategories/' + leaf.data.id);

  // --- Products ---
  const product = await runner.call('product create', 'POST', '/api/admin/products', {
    name: 'Zz Product',
    subcategory_id: subcategoryId,
    images: ['/p1.jpg', '', 5, '/p2.jpg'],
  });
  runner.remember('products', product.data.id);
  await runner.call('product update', 'PUT', '/api/admin/products/' + product.data.id, {
    images: ['/p3.jpg'],
    is_active: 0,
  });
  await runner.call('product show', 'GET', '/api/admin/products/' + product.data.id);

  // --- Projects ---
  const project = await runner.call('project create', 'POST', '/api/admin/projects', {
    title: 'Zz Project',
    owner: 'Owner',
    published_at: '2026-01-02',
  });
  runner.remember('projects', project.data.id);
  await runner.call('project update', 'PUT', '/api/admin/projects/' + project.data.id, {
    owner: null,
    title: null,
    category: 'Hotel',
  });

  // --- Publications ---
  const publication = await runner.call('publication create', 'POST', '/api/admin/publications', {
    title: 'Zz Publication',
    published_at: '2026-02-03',
  });
  runner.remember('publications', publication.data.id);
  await runner.call('publication update', 'PUT', '/api/admin/publications/' + publication.data.id, {
    is_active: '0',
  });

  // --- Downloads ---
  const download = await runner.call('download create', 'POST', '/api/admin/downloads', {
    title: 'Zz Download',
    section: 'manuals',
  });
  runner.remember('downloads', download.data.id);
  const download2 = await runner.call('download create bad section', 'POST', '/api/admin/downloads', {
    title: 'Zz Download 2',
    section: 'bad',
  });
  runner.remember('downloads', download2.data.id);
  await runner.call('download update', 'PUT', '/api/admin/downloads/' + download.data.id, { section: 'bad' });

  // --- Banners ---
  const banner = await runner.call('banner create', 'POST', '/api/admin/banners', {
    image_path: '/b.jpg',
    title: 'Zz Banner',
  });
  runner.remember('homepage_banners', banner.data.id);
  await runner.call('banner update', 'PUT', '/api/admin/banners/' + banner.data.id, { link: '/x' });
  await runner.call('banner missing image', 'POST', '/api/admin/banners', { title: 'x' });

  // --- Nav menus ---
  const navMenu = await runner.call('nav create', 'POST', '/api/admin/nav-menus', {
    location: 'footer_explore',
    label: 'Zz Nav',
    url: '/zz',
  });
  runner.remember('nav_menus', navMenu.data.id);
  await runner.call('nav update', 'PUT', '/api/admin/nav-menus/' + navMenu.data.id, { sort_order: '9' });
  await runner.call('nav bad location', 'POST', '/api/admin/nav-menus', { location: 'x', label: 'a', url: '/a' });

  // --- Settings ---
  await runner.call('settings update', 'PUT', '/api/admin/settings', {
    zz_test_text: 'hello',
    zz_test_number: 12,
    zz_test_true: true,
    zz_test_false: false,
    zz_test_list: [1, 2],
    zz_test_null: null,
  });

  // --- Service page (the original content is put back afterwards) ---
  const originalService = await runner.call('service show', 'GET', '/api/admin/service');
  await runner.call('service update', 'PUT', '/api/admin/service', { content_html: '<p>Zz</p>' });
  await runner.call('service show after update', 'GET', '/api/admin/service');
  await runner.call('service restore', 'PUT', '/api/admin/service', {
    content_html: originalService.data.content_html,
    hero_image: originalService.data.hero_image,
  });

  // --- Users ---
  await runner.call('user missing role', 'POST', '/api/admin/users', { name: 'a', email: 'b@c.d', password: 'x' });
  await runner.call('user bad role', 'POST', '/api/admin/users', { name: 'a', email: 'b@c.d', password: 'x', role: 'boss' });
  await runner.call('user duplicate email', 'POST', '/api/admin/users', {
    name: 'a',
    email: TEST_EMAIL,
    password: 'x',
    role: 'editor',
  });
  await runner.call('user nothing to update', 'PUT', '/api/admin/users/99999999', {});

  // --- Contact form (only the checks that happen before an email is sent) ---
  await runner.call('contact missing field', 'POST', '/api/public/contact', { name: 'a' });
  await runner.call('contact bad email', 'POST', '/api/public/contact', {
    name: 'a',
    email: 'not-an-email',
    subject: 's',
    message: 'm',
  });
  await runner.call('contact honeypot', 'POST', '/api/public/contact', {
    name: 'a',
    email: 'a@b.cd',
    subject: 's',
    message: 'm',
    website: 'spam',
  });
}

/**
 * Read every row the scenario wrote, without the columns that always differ.
 */
async function readWrittenRows(createdRows: CreatedRow[]) {
  const snapshot: Record<string, any> = {};

  for (const createdRow of createdRows) {
    const row = await queryOne('SELECT * FROM `' + createdRow.table + '` WHERE id = ?', [createdRow.id]);
    snapshot[createdRow.table + ' #' + createdRows.indexOf(createdRow)] = cleanRow(row);
  }

  const leafAndGroupIds = createdRows
    .filter(function (createdRow) {
      return createdRow.table === 'sub_subcategories';
    })
    .map(function (createdRow) {
      return createdRow.id;
    });
  const advantages = await queryAll(
    'SELECT * FROM sub_subcategory_advantages WHERE sub_subcategory_id IN (?) ORDER BY sort_order, id',
    [leafAndGroupIds]
  );
  const features = await queryAll(
    'SELECT * FROM sub_subcategory_features WHERE sub_subcategory_id IN (?) ORDER BY sort_order, id',
    [leafAndGroupIds]
  );
  snapshot['advantages'] = advantages.map(cleanRow);
  snapshot['features'] = features.map(cleanRow);

  const productIds = createdRows
    .filter(function (createdRow) {
      return createdRow.table === 'products';
    })
    .map(function (createdRow) {
      return createdRow.id;
    });
  const productImages = await queryAll('SELECT * FROM product_images WHERE product_id IN (?) ORDER BY sort_order, id', [
    productIds,
  ]);
  snapshot['product_images'] = productImages.map(cleanRow);

  snapshot['settings'] = await queryAll("SELECT `key`, `value` FROM site_settings WHERE `key` LIKE 'zz\\_test\\_%' ORDER BY `key`");

  return snapshot;
}

function cleanRow(row: any) {
  if (row === null) {
    return null;
  }

  const cleanedRow: Record<string, any> = {};
  for (const column of Object.keys(row)) {
    if (IGNORED_COLUMNS.includes(column)) {
      continue;
    }
    if (REFERENCE_COLUMNS.includes(column)) {
      if (row[column] === null) {
        cleanedRow[column] = null;
      } else {
        cleanedRow[column] = 'REF';
      }
      continue;
    }
    cleanedRow[column] = row[column];
  }
  return cleanedRow;
}

/**
 * Delete everything the scenario created (children first).
 */
async function deleteWrittenRows(createdRows: CreatedRow[]) {
  const deleteOrder = [
    'nav_menus',
    'homepage_banners',
    'downloads',
    'publications',
    'projects',
    'products',
    'sub_subcategories',
    'subcategories',
    'categories',
  ];

  for (const table of deleteOrder) {
    for (const createdRow of createdRows) {
      if (createdRow.table !== table) {
        continue;
      }
      if (table === 'products') {
        await execute('DELETE FROM product_images WHERE product_id = ?', [createdRow.id]);
      }
      if (table === 'sub_subcategories') {
        await execute('DELETE FROM sub_subcategory_advantages WHERE sub_subcategory_id = ?', [createdRow.id]);
        await execute('DELETE FROM sub_subcategory_features WHERE sub_subcategory_id = ?', [createdRow.id]);
      }
      await execute('DELETE FROM `' + table + '` WHERE id = ?', [createdRow.id]);
    }
  }

  await execute("DELETE FROM site_settings WHERE `key` LIKE 'zz\\_test\\_%'");
}

async function loginAs(baseUrl: string, password: string): Promise<string> {
  const httpResponse = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: password }),
  });
  const result = await httpResponse.json();
  return result.data.token;
}

async function runAgainst(baseUrl: string, password: string) {
  const token = await loginAs(baseUrl, password);
  const runner = new ScenarioRunner(baseUrl, token);

  try {
    await runScenario(runner);
    const rows = await readWrittenRows(runner.createdRows);
    return { responses: runner.steps, rows: rows };
  } finally {
    await deleteWrittenRows(runner.createdRows);
  }
}

function compareSection(sectionName: string, phpSection: Record<string, any>, expressSection: Record<string, any>) {
  let differenceCount = 0;
  const allKeys = new Set(Object.keys(phpSection).concat(Object.keys(expressSection)));

  for (const key of allKeys) {
    const phpText = JSON.stringify(phpSection[key]);
    const expressText = JSON.stringify(expressSection[key]);

    if (phpText === expressText) {
      console.log('  ✓ ' + key);
    } else {
      differenceCount = differenceCount + 1;
      console.log('  ✗ ' + key);
      console.log('      PHP:     ' + phpText);
      console.log('      Express: ' + expressText);
    }
  }

  console.log(sectionName + ': ' + differenceCount + ' difference(s)\n');
  return differenceCount;
}

async function main() {
  const password = crypto.randomBytes(12).toString('hex');
  await execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL]);
  await insert('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    '__compare_writes__',
    TEST_EMAIL,
    await bcrypt.hash(password, 10),
    'admin',
  ]);

  try {
    const phpResult = await runAgainst(PHP_URL, password);
    const expressResult = await runAgainst(EXPRESS_URL, password);

    console.log('Responses:');
    const responseDifferences = compareSection('Responses', phpResult.responses, expressResult.responses);
    console.log('Database rows:');
    const rowDifferences = compareSection('Database rows', phpResult.rows, expressResult.rows);

    if (responseDifferences + rowDifferences > 0) {
      process.exitCode = 1;
    }
  } finally {
    await execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL]);
    await closeDatabase();
  }
}

main();
