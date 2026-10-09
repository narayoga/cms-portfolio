import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { UPLOADS_DIR } from '../../src/config/env';
import { TEST_USERS } from '../setup/test-users';

// Never send real emails from the tests
vi.mock('../../src/lib/mailer', function () {
  return { sendEmail: vi.fn().mockResolvedValue(true) };
});

afterEach(function () {
  vi.unstubAllEnvs();
});

describe('Security headers (Helmet)', function () {
  it('every API response has the security headers', async function () {
    const response = await request(app).get('/api/health');

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['strict-transport-security']).toContain('max-age=');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  describe('uploaded images', function () {
    const testFolder = path.join(UPLOADS_DIR, 'misc');
    const testFile = path.join(testFolder, 'security-test-image.txt');

    afterAll(function () {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });

    it('can be shown by the website on another domain (Cross-Origin-Resource-Policy)', async function () {
      fs.mkdirSync(testFolder, { recursive: true });
      fs.writeFileSync(testFile, 'pretend this is an image');

      const response = await request(app)
        .get('/uploads/misc/security-test-image.txt')
        .set('Origin', 'https://example.com');

      expect(response.status).toBe(200);
      // "same-origin" (Helmet's default) would block images on the frontend domain
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
  });
});

describe('Rate limit: POST /api/auth/login', function () {
  const wrongLogin = { email: TEST_USERS.admin.email, password: 'wrong-password' };
  const correctLogin = { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password };

  it('successful logins are not counted', async function () {
    vi.stubEnv('LOGIN_RATE_LIMIT', '3');

    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await request(app).post('/api/auth/login').send(correctLogin);
      expect(response.status).toBe(200);
    }
  });

  it('blocks the next attempt after too many failed logins (429)', async function () {
    vi.stubEnv('LOGIN_RATE_LIMIT', '3');

    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await request(app).post('/api/auth/login').send(wrongLogin);
      expect(response.status).toBe(401);
    }

    const blockedResponse = await request(app).post('/api/auth/login').send(wrongLogin);
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({ ok: false, error: 'Too many login attempts, please try again later' });

    // Once blocked, even the right password has to wait (otherwise guessing could go on)
    const correctButBlocked = await request(app).post('/api/auth/login').send(correctLogin);
    expect(correctButBlocked.status).toBe(429);
  });

  it('tells the client how long to wait', async function () {
    vi.stubEnv('LOGIN_RATE_LIMIT', '3');

    const response = await request(app).post('/api/auth/login').send(wrongLogin);

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
  });
});

describe('Rate limit: POST /api/public/contact', function () {
  const message = { name: 'Budi', email: 'budi@example.com', subject: 'Hello', message: 'Hi there' };

  it('blocks the next message after too many messages (429)', async function () {
    vi.stubEnv('CONTACT_RATE_LIMIT', '2');

    for (let attempt = 1; attempt <= 2; attempt++) {
      const response = await request(app).post('/api/public/contact').send(message);
      expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).post('/api/public/contact').send(message);
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({ ok: false, error: 'Too many messages, please try again later' });
  });

  it('other routes are not affected by the contact limit', async function () {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
