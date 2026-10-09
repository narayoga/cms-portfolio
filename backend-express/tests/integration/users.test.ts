import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { TEST_USERS } from '../setup/test-users';
import { loginAs, bearer, uniqueSuffix } from './helpers';

describe('Admin › users (admin only)', function () {
  let adminToken = '';
  let editorToken = '';

  beforeAll(async function () {
    adminToken = await loginAs('admin');
    editorToken = await loginAs('editor');
  });

  it('answers 401 without a token', async function () {
    const response = await request(app).get('/api/admin/users');
    expect(response.status).toBe(401);
  });

  it('answers 403 for an editor', async function () {
    const response = await request(app).get('/api/admin/users').set('Authorization', bearer(editorToken));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ ok: false, error: 'Forbidden' });
  });

  it('lists users without password hashes', async function () {
    const response = await request(app).get('/api/admin/users').set('Authorization', bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    for (const user of response.body.data) {
      expect(user.password_hash).toBeUndefined();
    }
  });

  it('creates, updates and deletes a user; the new user can log in', async function () {
    const email = 'new-' + uniqueSuffix() + '@test.local';

    // Create
    const createResponse = await request(app)
      .post('/api/admin/users')
      .set('Authorization', bearer(adminToken))
      .send({ name: 'New Editor', email: email, password: 'First-Password-1', role: 'editor' });

    expect(createResponse.status).toBe(200);
    const newUserId = createResponse.body.data.id;
    expect(newUserId).toEqual(expect.any(Number));

    // Update the password
    const updateResponse = await request(app)
      .put('/api/admin/users/' + newUserId)
      .set('Authorization', bearer(adminToken))
      .send({ password: 'Second-Password-2' });
    expect(updateResponse.status).toBe(200);

    // The new password works, the old one does not
    const oldLogin = await request(app).post('/api/auth/login').send({ email: email, password: 'First-Password-1' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/api/auth/login').send({ email: email, password: 'Second-Password-2' });
    expect(newLogin.status).toBe(200);

    // Delete
    const deleteResponse = await request(app)
      .delete('/api/admin/users/' + newUserId)
      .set('Authorization', bearer(adminToken));
    expect(deleteResponse.status).toBe(200);

    const loginAfterDelete = await request(app).post('/api/auth/login').send({ email: email, password: 'Second-Password-2' });
    expect(loginAfterDelete.status).toBe(401);
  });

  it('answers 409 for an email that already exists', async function () {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', bearer(adminToken))
      .send({ name: 'Copy', email: TEST_USERS.editor.email, password: 'x', role: 'editor' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Email already exists');
  });

  it('answers 422 for an unknown role', async function () {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', bearer(adminToken))
      .send({ name: 'Boss', email: 'boss-' + uniqueSuffix() + '@test.local', password: 'x', role: 'superadmin' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid role');
  });

  it('answers 422 when an update has nothing to change', async function () {
    const response = await request(app)
      .put('/api/admin/users/1')
      .set('Authorization', bearer(adminToken))
      .send({});

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Nothing to update');
  });

  it('answers 422 for an invalid email address', async function () {
    const response = await request(app)
      .post('/api/admin/users')
      .set('Authorization', bearer(adminToken))
      .send({ name: 'No Email', email: 'not-an-email', password: 'x', role: 'editor' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid email');
  });

  describe('PUT /api/admin/users/:id', function () {
    let userId = 0;
    let userEmail = '';

    beforeAll(async function () {
      userEmail = 'update-me-' + uniqueSuffix() + '@test.local';
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Authorization', bearer(adminToken))
        .send({ name: 'Update Me', email: userEmail, password: 'Password-1', role: 'editor' });
      userId = createResponse.body.data.id;
    });

    it('answers 404 for a user that does not exist', async function () {
      const response = await request(app)
        .put('/api/admin/users/99999999')
        .set('Authorization', bearer(adminToken))
        .send({ name: 'Ghost' });

      expect(response.status).toBe(404);
    });

    it('answers 422 for an unknown role', async function () {
      const response = await request(app)
        .put('/api/admin/users/' + userId)
        .set('Authorization', bearer(adminToken))
        .send({ role: 'superadmin' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Invalid role');
    });

    it('answers 422 for an invalid email address', async function () {
      const response = await request(app)
        .put('/api/admin/users/' + userId)
        .set('Authorization', bearer(adminToken))
        .send({ email: 'broken@' });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('Invalid email');
    });

    it('answers 409 when the email belongs to another user', async function () {
      const response = await request(app)
        .put('/api/admin/users/' + userId)
        .set('Authorization', bearer(adminToken))
        .send({ email: TEST_USERS.editor.email });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already exists');
    });

    it('accepts the user\'s own email (the admin form always sends it)', async function () {
      const response = await request(app)
        .put('/api/admin/users/' + userId)
        .set('Authorization', bearer(adminToken))
        .send({ name: 'Updated Name', email: userEmail, role: 'admin' });

      expect(response.status).toBe(200);

      const listResponse = await request(app).get('/api/admin/users').set('Authorization', bearer(adminToken));
      const updatedUser = listResponse.body.data.find(function (user: any) {
        return user.id === userId;
      });
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.role).toBe('admin');
    });
  });

  it('answers 404 when deleting a user that does not exist', async function () {
    const response = await request(app)
      .delete('/api/admin/users/99999999')
      .set('Authorization', bearer(adminToken));

    expect(response.status).toBe(404);
  });

  it('an admin cannot delete their own account', async function () {
    const meResponse = await request(app).get('/api/auth/me').set('Authorization', bearer(adminToken));
    const myId = meResponse.body.data.id;

    const response = await request(app)
      .delete('/api/admin/users/' + myId)
      .set('Authorization', bearer(adminToken));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot delete yourself');
  });
});
