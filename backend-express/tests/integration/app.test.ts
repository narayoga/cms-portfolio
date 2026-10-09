import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('General app behaviour', function () {
  it('GET /api/health answers ok', async function () {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, data: { status: 'ok' } });
  });

  it('an unknown route answers 404 in the JSON format', async function () {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ ok: false, error: 'Not found' });
  });

  it('broken JSON answers 400', async function () {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ ok: false, error: 'Invalid JSON body' });
  });

  it('sends the security headers and hides the framework name', async function () {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
