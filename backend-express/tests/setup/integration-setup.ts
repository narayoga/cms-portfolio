import { afterAll } from 'vitest';
import { assertIsTestDatabase } from './test-env';
import { closeDatabase } from '../../src/lib/db';

/**
 * Runs before EVERY integration test file.
 * A second safety check: the app itself must be pointed at the "_test" database.
 */
assertIsTestDatabase(process.env.DB_NAME);

// Close the database connections when the test file is finished
afterAll(async function () {
  await closeDatabase();
});
