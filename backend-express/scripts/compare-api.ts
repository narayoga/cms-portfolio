/**
 * Parity test: call every GET endpoint on the PHP backend and on the Express
 * backend, and report any difference in the JSON responses.
 *
 * Usage (both servers must be running):
 *   npm run compare-api
 *
 * Optional environment variables:
 *   PHP_URL     (default http://localhost:8000)
 *   EXPRESS_URL (default http://localhost:8001)
 *
 * A temporary admin user is created for the admin endpoints and removed at the end.
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { queryAll, insert, execute, closeDatabase } from '../src/lib/db';

const PHP_URL = process.env.PHP_URL || 'http://localhost:8000';
const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:8001';

const TEST_EMAIL = 'compare-api@migration.test';

// Random password for the temporary admin (set by createTestAdmin)
let testPassword = '';

type ApiResult = {
  status: number;
  body: any;
};

async function callApi(baseUrl: string, path: string, token: string | null): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (token !== null) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const httpResponse = await fetch(baseUrl + path, { headers: headers });
  const text = await httpResponse.text();

  let body;
  try {
    body = JSON.parse(text);
  } catch (error) {
    body = { notJson: text.substring(0, 200) };
  }

  return { status: httpResponse.status, body: body };
}

/**
 * True when a value is an empty list or an empty object.
 * PHP sends an empty key/value object as [] while Express sends {}; both mean "nothing".
 */
function isEmptyContainer(value: any): boolean {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

/**
 * Compare two JSON values and collect every difference as text.
 */
function findDifferences(phpValue: any, expressValue: any, location: string, differences: string[]): void {
  if (differences.length > 20) {
    return;
  }

  if (isEmptyContainer(phpValue) && isEmptyContainer(expressValue)) {
    return;
  }

  if (Array.isArray(phpValue) && Array.isArray(expressValue)) {
    if (phpValue.length !== expressValue.length) {
      differences.push(location + ': list length ' + phpValue.length + ' vs ' + expressValue.length);
      return;
    }
    for (let index = 0; index < phpValue.length; index++) {
      findDifferences(phpValue[index], expressValue[index], location + '[' + index + ']', differences);
    }
    return;
  }

  const phpIsObject = phpValue !== null && typeof phpValue === 'object';
  const expressIsObject = expressValue !== null && typeof expressValue === 'object';

  if (phpIsObject && expressIsObject) {
    const allKeys = new Set(Object.keys(phpValue).concat(Object.keys(expressValue)));
    for (const key of allKeys) {
      findDifferences(phpValue[key], expressValue[key], location + '.' + key, differences);
    }
    return;
  }

  if (phpValue !== expressValue) {
    differences.push(location + ': PHP=' + JSON.stringify(phpValue) + ' Express=' + JSON.stringify(expressValue));
  }
}

/**
 * Build the list of URLs to test, using real slugs from the database.
 */
async function buildEndpointList(): Promise<string[]> {
  const endpoints = [
    '/api/health',
    '/api/does-not-exist',
    '/api/public/homepage',
    '/api/public/categories',
    '/api/public/categories/does-not-exist',
    '/api/public/projects',
    '/api/public/projects?page=2&limit=5',
    '/api/public/projects?page=0&limit=999',
    '/api/public/publications',
    '/api/public/downloads',
    '/api/public/service',
    '/api/public/settings',
    '/api/public/nav-menus',
    '/api/auth/me',
    '/api/admin/users',
    '/api/admin/categories',
    '/api/admin/subcategories',
    '/api/admin/subsubcategories',
    '/api/admin/products',
    '/api/admin/projects',
    '/api/admin/publications',
    '/api/admin/downloads',
    '/api/admin/service',
    '/api/admin/settings',
    '/api/admin/banners',
    '/api/admin/nav-menus',
    '/api/admin/nav-menus?location=header',
  ];

  const categories = await queryAll('SELECT id, slug FROM categories');
  for (const category of categories) {
    endpoints.push('/api/public/categories/' + category.slug);
    endpoints.push('/api/admin/subcategories?category_id=' + category.id);
  }

  const subcategories = await queryAll(
    'SELECT s.id, s.slug, c.slug AS category_slug FROM subcategories s JOIN categories c ON c.id = s.category_id'
  );
  for (const subcategory of subcategories) {
    endpoints.push('/api/public/subcategories/' + subcategory.category_slug + '/' + subcategory.slug);
    endpoints.push('/api/admin/subsubcategories?subcategory_id=' + subcategory.id);
  }

  const items = await queryAll(
    `SELECT ss.id, ss.slug, g.slug AS group_slug, s.slug AS subcategory_slug, c.slug AS category_slug
     FROM sub_subcategories ss
     LEFT JOIN sub_subcategories g ON g.id = ss.parent_id
     JOIN subcategories s ON s.id = ss.subcategory_id
     JOIN categories c ON c.id = s.category_id`
  );
  for (const item of items) {
    endpoints.push('/api/admin/subsubcategories/' + item.id);
    const basePath = '/api/public/subsubcategories/' + item.category_slug + '/' + item.subcategory_slug + '/';
    if (item.group_slug === null) {
      endpoints.push(basePath + item.slug);
    } else {
      endpoints.push(basePath + item.group_slug + '/' + item.slug);
    }
  }

  const products = await queryAll(
    `SELECT p.id, p.slug, s.slug AS subcategory_slug, c.slug AS category_slug
     FROM products p JOIN subcategories s ON s.id = p.subcategory_id JOIN categories c ON c.id = s.category_id`
  );
  for (const product of products) {
    endpoints.push('/api/admin/products/' + product.id);
    endpoints.push('/api/public/products/' + product.category_slug + '/' + product.subcategory_slug + '/' + product.slug);
  }

  const projects = await queryAll('SELECT slug FROM projects');
  for (const project of projects) {
    endpoints.push('/api/public/projects/' + project.slug);
  }

  const publications = await queryAll('SELECT slug FROM publications');
  for (const publication of publications) {
    endpoints.push('/api/public/publications/' + publication.slug);
  }

  return endpoints;
}

async function createTestAdmin(): Promise<void> {
  await execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL]);
  const password = crypto.randomBytes(12).toString('hex');
  const passwordHash = await bcrypt.hash(password, 10);
  await insert('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    '__compare_api__',
    TEST_EMAIL,
    passwordHash,
    'admin',
  ]);
  testPassword = password;
}


async function login(baseUrl: string): Promise<string> {
  const httpResponse = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: testPassword }),
  });
  const result = await httpResponse.json();

  if (result.ok !== true) {
    throw new Error('Login failed on ' + baseUrl + ': ' + JSON.stringify(result));
  }

  return result.data.token;
}

async function main() {
  await createTestAdmin();

  try {
    // The PHP token is used for both servers (tokens are compatible)
    const token = await login(PHP_URL);
    await login(EXPRESS_URL);

    // The users list contains the temporary user's created_at, which is fine:
    // it is the same row for both servers.
    const endpoints = await buildEndpointList();

    let passedCount = 0;
    let failedCount = 0;

    for (const endpoint of endpoints) {
      const phpResult = await callApi(PHP_URL, endpoint, token);
      const expressResult = await callApi(EXPRESS_URL, endpoint, token);

      const differences: string[] = [];
      if (phpResult.status !== expressResult.status) {
        differences.push('status: PHP=' + phpResult.status + ' Express=' + expressResult.status);
      }
      findDifferences(phpResult.body, expressResult.body, 'body', differences);

      if (differences.length === 0) {
        passedCount = passedCount + 1;
      } else {
        failedCount = failedCount + 1;
        console.log('✗ ' + endpoint);
        for (const difference of differences) {
          console.log('    ' + difference);
        }
      }
    }

    console.log('');
    console.log('Endpoints checked: ' + endpoints.length);
    console.log('Identical:         ' + passedCount);
    console.log('Different:         ' + failedCount);

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    await execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL]);
    await closeDatabase();
  }
}

main();
