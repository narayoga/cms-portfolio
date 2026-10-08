import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { queryOne } from '../lib/db';
import { sendOk, sendError } from '../lib/response';
import { createToken, getCurrentUser } from '../lib/auth';
import { getBody } from '../lib/values';
import { findMissingField } from '../lib/validator';
import type { UserRow } from '../types/database';

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['email', 'password']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  const user = await queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [body.email]);
  if (user === null) {
    sendError(response, 'Invalid credentials', 401);
    return;
  }

  const passwordIsCorrect = await bcrypt.compare(String(body.password), user.password_hash);
  if (passwordIsCorrect === false) {
    sendError(response, 'Invalid credentials', 401);
    return;
  }

  const token = createToken(user);

  sendOk(response, {
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

/**
 * GET /api/auth/me   (requires login)
 * Returns the user stored inside the token.
 */
export async function me(request: Request, response: Response) {
  const user = getCurrentUser(response);

  sendOk(response, {
    id: user.sub,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
