import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { queryAll, queryOne, insert, execute } from '../lib/db';
import type { SqlValue } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import { getCurrentUser } from '../lib/auth';
import { getBody, hasValue, isEmptyValue, toInteger } from '../lib/values';
import { findMissingField } from '../lib/validator';

const ALLOWED_ROLES = ['admin', 'editor'];

/**
 * GET /api/admin/users   (admin only)
 */
export async function listUsers(request: Request, response: Response) {
  const users = await queryAll('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
  sendOk(response, users);
}

/**
 * POST /api/admin/users   (admin only)
 * Body: { name, email, password, role }
 */
export async function createUser(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name', 'email', 'password', 'role']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  if (ALLOWED_ROLES.includes(body.role) === false) {
    sendError(response, 'Invalid role', 422);
    return;
  }

  const userWithSameEmail = await queryOne('SELECT id FROM users WHERE email = ?', [body.email]);
  if (userWithSameEmail !== null) {
    sendError(response, 'Email already exists', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(String(body.password), 10);

  const newUserId = await insert(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [body.name, body.email, passwordHash, body.role]
  );

  sendOk(response, { id: newUserId });
}

/**
 * PUT /api/admin/users/:id   (admin only)
 * Only the fields that are sent are updated.
 */
export async function updateUser(request: Request, response: Response) {
  const userId = toInteger(request.params.id);
  const body = getBody(request);

  // Build the "SET name = ?, email = ?" part step by step
  const setParts: string[] = [];
  const values: SqlValue[] = [];

  const simpleFields = ['name', 'email', 'role'];
  for (const fieldName of simpleFields) {
    if (hasValue(body, fieldName)) {
      setParts.push(fieldName + ' = ?');
      values.push(body[fieldName]);
    }
  }

  if (isEmptyValue(body.password) === false) {
    const passwordHash = await bcrypt.hash(String(body.password), 10);
    setParts.push('password_hash = ?');
    values.push(passwordHash);
  }

  if (setParts.length === 0) {
    sendError(response, 'Nothing to update', 422);
    return;
  }

  values.push(userId);
  await execute('UPDATE users SET ' + setParts.join(', ') + ' WHERE id = ?', values);

  sendOk(response, { id: userId });
}

/**
 * DELETE /api/admin/users/:id   (admin only)
 * An admin cannot delete their own account.
 */
export async function deleteUser(request: Request, response: Response) {
  const userId = toInteger(request.params.id);
  const currentUser = getCurrentUser(response);

  if (toInteger(currentUser.sub) === userId) {
    sendError(response, 'Cannot delete yourself', 400);
    return;
  }

  await execute('DELETE FROM users WHERE id = ?', [userId]);

  sendOk(response, { id: userId });
}
