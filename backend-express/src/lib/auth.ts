import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getEnv, getEnvNumber } from '../config/env';
import { sendError } from './response';

// The data stored inside a login token
export type TokenUser = {
  sub: number; // user id
  role: string;
  name: string;
  email: string;
  iat: number; // issued at (unix seconds)
  exp: number; // expires at (unix seconds)
};

// The user columns needed to create a token
type UserForToken = {
  id: number;
  role: string;
  name: string;
  email: string;
};

// A shorter secret can be guessed by trying many values
const MINIMUM_SECRET_LENGTH = 32;

// Secrets that are written in this public repository (old defaults and examples).
// Anyone can read them, so anyone could create a valid admin token with them.
const PUBLIC_SECRETS = ['dev-secret', 'change-me', 'secret'];

/**
 * Check a JWT secret. Returns what is wrong with it, or null when it is safe.
 */
export function findJwtSecretProblem(secret: string): string | null {
  if (secret === '') {
    return 'JWT_SECRET is not set in .env';
  }

  if (PUBLIC_SECRETS.includes(secret)) {
    return 'JWT_SECRET uses a value that is public in the repository ("' + secret + '")';
  }

  if (secret.length < MINIMUM_SECRET_LENGTH) {
    return (
      'JWT_SECRET is too short (' + secret.length + ' characters, at least ' + MINIMUM_SECRET_LENGTH + ' are needed)'
    );
  }

  return null;
}

/**
 * The secret used to sign and check login tokens.
 * There is NO default value: without a safe secret, no token can be created or accepted.
 */
function getJwtSecret(): string {
  const secret = getEnv('JWT_SECRET', '');

  const problem = findJwtSecretProblem(secret);
  if (problem !== null) {
    throw new Error(problem);
  }

  return secret;
}

/**
 * Called when the server starts: stop right away when the secret is missing or unsafe.
 * (Generate a good secret with:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
 */
export function assertJwtSecretIsSafe(): void {
  getJwtSecret();
}

/**
 * Create a login token for a user.
 * Uses the same secret, algorithm (HS256) and fields as the PHP backend,
 * so tokens created by either backend work in both.
 */
export function createToken(user: UserForToken): string {
  const lifetimeInSeconds = getEnvNumber('JWT_TTL', 86400);
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const payload = {
    iat: nowInSeconds,
    exp: nowInSeconds + lifetimeInSeconds,
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256' });
}

/**
 * Read a token and return its data.
 * Returns null when the token is invalid or expired.
 */
export function readToken(token: string): TokenUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (typeof decoded === 'string') {
      return null;
    }

    return decoded as unknown as TokenUser;
  } catch (error) {
    return null;
  }
}

/**
 * Get the token from the "Authorization: Bearer <token>" header.
 */
function getBearerToken(request: Request): string | null {
  const header = request.headers.authorization;

  if (header === undefined) {
    return null;
  }

  if (header.toLowerCase().startsWith('bearer ') === false) {
    return null;
  }

  return header.substring(7);
}

/**
 * Get the logged in user for this request, or null when not logged in.
 */
export function getLoggedInUser(request: Request): TokenUser | null {
  const token = getBearerToken(request);

  if (token === null || token === '') {
    return null;
  }

  return readToken(token);
}

/**
 * Middleware: only continue when the request has a valid token.
 * The user is saved in response.locals.user for the controller.
 */
export function requireLogin(request: Request, response: Response, next: NextFunction): void {
  const user = getLoggedInUser(request);

  if (user === null) {
    sendError(response, 'Unauthorized', 401);
    return;
  }

  response.locals.user = user;
  next();
}

/**
 * Middleware: only continue when the logged in user is an admin.
 */
export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  const user = getLoggedInUser(request);

  if (user === null) {
    sendError(response, 'Unauthorized', 401);
    return;
  }

  if (user.role !== 'admin') {
    sendError(response, 'Forbidden', 403);
    return;
  }

  response.locals.user = user;
  next();
}

/**
 * Read the user that requireLogin / requireAdmin saved earlier.
 */
export function getCurrentUser(response: Response): TokenUser {
  return response.locals.user as TokenUser;
}
