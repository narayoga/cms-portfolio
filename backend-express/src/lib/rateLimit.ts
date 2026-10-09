import { rateLimit } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { getEnvNumber } from '../config/env';
import { sendError } from './response';

/**
 * Limits for routes that attackers or spam bots like to call many times.
 * Visitors are counted per IP address. The limits can be changed in ../.env.
 *
 * Behind a reverse proxy (nginx, a hosting panel, Cloudflare) set TRUST_PROXY=1,
 * otherwise every visitor looks like the same IP (the proxy) and they block each other.
 */

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Login: at most LOGIN_RATE_LIMIT failed attempts per 15 minutes (default 10).
 * Successful logins are not counted, so a real admin is never locked out by their own logins.
 * Protects against guessing passwords (brute force).
 */
export const loginRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: function () {
    return getEnvNumber('LOGIN_RATE_LIMIT', 10);
  },
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: function sendTooManyLoginAttempts(request: Request, response: Response) {
    sendError(response, 'Too many login attempts, please try again later', 429);
  },
});

/**
 * Contact form: at most CONTACT_RATE_LIMIT messages per hour (default 5).
 * Protects the inbox against spam and the email account against sending limits.
 */
export const contactRateLimit = rateLimit({
  windowMs: ONE_HOUR,
  limit: function () {
    return getEnvNumber('CONTACT_RATE_LIMIT', 5);
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: function sendTooManyMessages(request: Request, response: Response) {
    sendError(response, 'Too many messages, please try again later', 429);
  },
});
