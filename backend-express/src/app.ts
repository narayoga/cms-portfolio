import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { Request, Response, NextFunction } from 'express';
import { getEnv, getEnvNumber, UPLOADS_DIR } from './config/env';
import { sendError } from './lib/response';
import { loadApiDocs } from './lib/apiDocs';
import { router } from './routes';

export const app = express();

// CORS: allow the frontend to call this API
app.use(
  cors({
    origin: getEnv('FRONTEND_ORIGIN', '*'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Behind a reverse proxy (nginx, hosting panel, Cloudflare), read the visitor's real IP
// from the X-Forwarded-For header. TRUST_PROXY = how many proxies are in front (usually 1).
// Needed for the rate limits: without it every visitor looks like the proxy's IP.
const trustedProxyCount = getEnvNumber('TRUST_PROXY', 0);
if (trustedProxyCount > 0) {
  app.set('trust proxy', trustedProxyCount);
}

// Security headers (Helmet): Content-Security-Policy, Strict-Transport-Security,
// X-Content-Type-Options, X-Frame-Options and more
app.use(
  helmet({
    // The website runs on another domain than this API (example.com vs api.example.com)
    // and must be allowed to show images from /uploads
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Same value as before (Helmet's default would be "no-referrer")
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Read JSON bodies and normal form bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files, for example /uploads/projects/park-hyatt.jpg
app.use('/uploads', express.static(UPLOADS_DIR, { index: false, dotfiles: 'ignore' }));

// API documentation: Swagger UI at /api/docs, the raw spec at /api/docs/openapi.json
// Set API_DOCS=off in .env to hide it.
if (getEnv('API_DOCS', 'on') !== 'off') {
  const apiDocs = loadApiDocs();

  app.get('/api/docs/openapi.json', function sendApiDocs(request: Request, response: Response) {
    response.json(apiDocs);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiDocs, { customSiteTitle: 'Portfolio CMS API' }));
}

// All API routes
app.use(router);

// Nothing matched: 404 in the same JSON format as the PHP backend
app.use(function handleNotFound(request: Request, response: Response) {
  sendError(response, 'Not found', 404);
});

// Any error thrown inside a route ends up here
app.use(function handleError(error: any, request: Request, response: Response, next: NextFunction) {
  // The request body was not valid JSON
  if (error.type === 'entity.parse.failed') {
    sendError(response, 'Invalid JSON body', 400);
    return;
  }

  // The request body was too big
  if (error.type === 'entity.too.large') {
    sendError(response, 'Request body too large', 413);
    return;
  }

  // The database could not be reached
  const connectionErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'];
  if (connectionErrorCodes.includes(error.code)) {
    console.error('Database connection failed:', error.message);
    sendError(response, 'Database connection failed', 500);
    return;
  }

  console.error(error);
  sendError(response, 'Server error', 500);
});
