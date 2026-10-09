import request from 'supertest';
import { app } from '../../src/app';
import { TEST_USERS } from '../setup/test-users';
import type { TestUserRole } from '../setup/test-users';

/**
 * Log in as one of the test users and return the token.
 */
export async function loginAs(role: TestUserRole): Promise<string> {
  const user = TEST_USERS[role];

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password });

  if (response.status !== 200) {
    throw new Error('Login as ' + role + ' failed: ' + JSON.stringify(response.body));
  }

  return response.body.data.token;
}

/**
 * The "Authorization" header value for a token.
 */
export function bearer(token: string): string {
  return 'Bearer ' + token;
}

/**
 * A short random text, so every test run creates unique names.
 */
export function uniqueSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}
