import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  createToken,
  readToken,
  requireLogin,
  requireAdmin,
  findJwtSecretProblem,
  assertJwtSecretIsSafe,
} from '../../src/lib/auth';

const ADMIN = { id: 1, role: 'admin', name: 'Admin', email: 'admin@example.com' };
const EDITOR = { id: 2, role: 'editor', name: 'Editor', email: 'editor@example.com' };

// Long enough to pass the JWT_SECRET safety check (at least 32 characters)
const UNIT_TEST_SECRET = 'unit-test-secret-that-is-long-enough-1234';

/**
 * A fake Express response that remembers the status code and JSON body.
 */
function makeFakeResponse() {
  const fakeResponse: any = {
    statusCode: 200,
    body: null,
    locals: {},
    status: function (code: number) {
      fakeResponse.statusCode = code;
      return fakeResponse;
    },
    json: function (data: unknown) {
      fakeResponse.body = data;
      return fakeResponse;
    },
  };
  return fakeResponse;
}

/**
 * A fake Express request with (optionally) an Authorization header.
 */
function makeFakeRequest(authorizationHeader?: string): any {
  const headers: Record<string, string> = {};
  if (authorizationHeader !== undefined) {
    headers.authorization = authorizationHeader;
  }
  return { headers: headers };
}

beforeEach(function () {
  vi.stubEnv('JWT_SECRET', UNIT_TEST_SECRET);
  vi.stubEnv('JWT_TTL', '3600');
});

afterEach(function () {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('createToken and readToken', function () {
  it('a created token can be read back', function () {
    const token = createToken(ADMIN);
    const tokenUser = readToken(token);

    expect(tokenUser).not.toBe(null);
    expect(tokenUser?.sub).toBe(1);
    expect(tokenUser?.role).toBe('admin');
    expect(tokenUser?.email).toBe('admin@example.com');
  });

  it('the token expires after JWT_TTL seconds', function () {
    const token = createToken(ADMIN);
    const tokenUser = readToken(token);

    expect(tokenUser?.exp! - tokenUser?.iat!).toBe(3600);
  });

  it('an expired token is rejected', function () {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const token = createToken(ADMIN);

    // Two hours later the 1-hour token is no longer valid
    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'));
    expect(readToken(token)).toBe(null);
  });

  it('a token signed with another secret is rejected', function () {
    const fakeToken = jwt.sign({ sub: 1, role: 'admin' }, 'some-other-secret');
    expect(readToken(fakeToken)).toBe(null);
  });

  it('garbage is rejected', function () {
    expect(readToken('not-a-token')).toBe(null);
  });
});

describe('requireLogin middleware', function () {
  it('answers 401 without a token', function () {
    const response = makeFakeResponse();
    const next = vi.fn();

    requireLogin(makeFakeRequest(), response, next);

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('answers 401 when the header is not "Bearer <token>"', function () {
    const response = makeFakeResponse();
    const next = vi.fn();

    requireLogin(makeFakeRequest('Basic abc123'), response, next);

    expect(response.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('continues with a valid token and saves the user', function () {
    const response = makeFakeResponse();
    const next = vi.fn();
    const token = createToken(EDITOR);

    requireLogin(makeFakeRequest('Bearer ' + token), response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.locals.user.email).toBe('editor@example.com');
  });
});

describe('requireAdmin middleware', function () {
  it('answers 403 for an editor', function () {
    const response = makeFakeResponse();
    const next = vi.fn();
    const token = createToken(EDITOR);

    requireAdmin(makeFakeRequest('Bearer ' + token), response, next);

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ ok: false, error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('continues for an admin', function () {
    const response = makeFakeResponse();
    const next = vi.fn();
    const token = createToken(ADMIN);

    requireAdmin(makeFakeRequest('Bearer ' + token), response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('JWT_SECRET safety check', function () {
  it('rejects a missing secret', function () {
    expect(findJwtSecretProblem('')).toBe('JWT_SECRET is not set in .env');
  });

  it('rejects the old public default "dev-secret"', function () {
    expect(findJwtSecretProblem('dev-secret')).toContain('public in the repository');
  });

  it('rejects a secret shorter than 32 characters', function () {
    expect(findJwtSecretProblem('short-secret')).toContain('too short (12 characters');
  });

  it('accepts a long random secret', function () {
    expect(findJwtSecretProblem(UNIT_TEST_SECRET)).toBe(null);
  });

  it('there is no fallback: without JWT_SECRET no token can be created', function () {
    vi.stubEnv('JWT_SECRET', '');

    expect(function () {
      createToken(ADMIN);
    }).toThrow('JWT_SECRET is not set in .env');
    expect(function () {
      assertJwtSecretIsSafe();
    }).toThrow();
  });

  it('a token signed with the old "dev-secret" is never accepted', function () {
    const forgedToken = jwt.sign({ sub: 1, role: 'admin', name: 'Hacker', email: 'x@x.x' }, 'dev-secret');

    expect(readToken(forgedToken)).toBe(null);

    // Even if the server is (wrongly) configured with "dev-secret"
    vi.stubEnv('JWT_SECRET', 'dev-secret');
    expect(readToken(forgedToken)).toBe(null);
  });
});
