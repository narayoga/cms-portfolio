import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { TEST_USERS } from '../setup/test-users';
import { loginAs, bearer } from './helpers';

describe('POST /api/auth/login', function () {
  it('returns a token and the user (without the password hash)', async function () {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USERS.admin.email, password: TEST_USERS.admin.password });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.user).toEqual({
      id: expect.any(Number),
      name: TEST_USERS.admin.name,
      email: TEST_USERS.admin.email,
      role: 'admin',
    });
    expect(response.body.data.user.password_hash).toBeUndefined();
  });

  it('answers 401 for a wrong password', async function () {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USERS.admin.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ ok: false, error: 'Invalid credentials' });
  });

  it('answers 401 for an unknown email (same message, so emails cannot be guessed)', async function () {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'whatever' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ ok: false, error: 'Invalid credentials' });
  });

  it('answers 422 when a field is missing', async function () {
    const response = await request(app).post('/api/auth/login').send({ email: TEST_USERS.admin.email });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ ok: false, error: 'Missing field: password' });
  });
});

describe('GET /api/auth/me', function () {
  it('returns the logged in user', async function () {
    const token = await loginAs('editor');

    const response = await request(app).get('/api/auth/me').set('Authorization', bearer(token));

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(TEST_USERS.editor.email);
    expect(response.body.data.role).toBe('editor');
  });

  it('answers 401 without a token', async function () {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('answers 401 with an invalid token', async function () {
    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });
});
