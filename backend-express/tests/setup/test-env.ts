import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Settings for the integration tests.
 *
 * The database credentials come from the file ../.env.test (repository root),
 * NOT from ../.env, so the tests can never touch the live database.
 */

// The repository root (two folders above backend-express/tests/setup)
const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

export const TEST_ENV_FILE = path.join(REPOSITORY_ROOT, '.env.test');

/**
 * Read ../.env.test and add the fixed test values (JWT secret, fake SMTP).
 * Returns an empty object when the file does not exist yet.
 */
export function loadTestEnv(): Record<string, string> {
  let fileValues: Record<string, string> = {};

  if (fs.existsSync(TEST_ENV_FILE)) {
    const fileContent = fs.readFileSync(TEST_ENV_FILE, 'utf8');
    fileValues = dotenv.parse(fileContent);
  }

  return {
    ...fileValues,
    APP_ENV: 'test',
    // A fixed secret, so tokens in the tests do not depend on the real .env
    JWT_SECRET: 'test-jwt-secret',
    JWT_TTL: '3600',
    // The mailer is mocked in the tests, but just in case: never reach a real SMTP server
    SMTP_HOST: 'smtp.invalid',
    SMTP_USER: '',
    SMTP_PASS: '',
    CONTACT_RECIPIENT: 'admin@test.local',
  };
}

/**
 * Stop right away when the database is not a test database.
 * Every integration test run deletes ALL tables, so this check protects the live data.
 */
export function assertIsTestDatabase(databaseName: string | undefined): void {
  if (databaseName === undefined || databaseName === '') {
    throw new Error(
      'No test database configured. Create ' + TEST_ENV_FILE + ' with DB_HOST, DB_NAME, DB_USER and DB_PASS.'
    );
  }

  if (databaseName.endsWith('_test') === false) {
    throw new Error(
      'Refusing to run integration tests on database "' + databaseName + '". ' +
        'The test database name must end with "_test", because the tests delete every table.'
    );
  }
}
