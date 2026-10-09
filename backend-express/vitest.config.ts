import { defineConfig } from 'vitest/config';
import { loadTestEnv } from './tests/setup/test-env.ts';

/**
 * Two groups of tests:
 *
 *   unit         tests/unit         no database, fast            npm run test:unit
 *   integration  tests/integration  real HTTP + test database    npm run test:integration
 *
 * The integration tests use the database from ../.env.test (never the live one).
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          // These values are placed in process.env BEFORE the app is loaded,
          // so they win over the values in ../.env
          env: loadTestEnv(),
          globalSetup: ['tests/setup/global-setup.ts'],
          setupFiles: ['tests/setup/integration-setup.ts'],
          // All files share one database, so run them one after another
          fileParallelism: false,
          // The test database is on a remote server, so give it some time
          testTimeout: 30000,
          hookTimeout: 120000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/types/**'],
      reporter: ['text', 'html'],
    },
  },
});
