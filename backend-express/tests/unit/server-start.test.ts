import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

const SERVER_FILE = path.resolve(import.meta.dirname, '..', '..', 'src', 'server.ts');

/**
 * Start src/server.ts in a separate process with the given JWT_SECRET
 * and return what happened. The server must stop by itself.
 */
function startServerWithSecret(jwtSecret: string) {
  return spawnSync(process.execPath, ['--import', 'tsx', SERVER_FILE], {
    // An already set (even empty) variable is not replaced by the value in ../.env
    env: { ...process.env, JWT_SECRET: jwtSecret, PORT: '0' },
    encoding: 'utf8',
    // Safety net: kill the server if it started anyway
    timeout: 20000,
  });
}

describe('starting the server', function () {
  it('refuses to start without JWT_SECRET', function () {
    const result = startServerWithSecret('');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Cannot start the server: JWT_SECRET is not set in .env');
  });

  it('refuses to start with the public "dev-secret"', function () {
    const result = startServerWithSecret('dev-secret');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('public in the repository');
  });
}, 60000);
