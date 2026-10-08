import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireLogin, requireAdmin } from './lib/auth';
import { sendOk } from './lib/response';

import * as authController from './controllers/authController';
import * as userController from './controllers/userController';

/**
 * Every API route in one place (same list as backend/public/index.php).
 *
 * requireLogin = any logged in user (admin or editor)
 * requireAdmin = only admins
 */
export const router = Router();

// Auth
router.post('/api/auth/login', authController.login);
router.get('/api/auth/me', requireLogin, authController.me);

// Admin: users (admin only)
router.get('/api/admin/users', requireAdmin, userController.listUsers);
router.post('/api/admin/users', requireAdmin, userController.createUser);
router.put('/api/admin/users/:id', requireAdmin, userController.updateUser);
router.delete('/api/admin/users/:id', requireAdmin, userController.deleteUser);

// Health check
router.get('/api/health', function healthCheck(request: Request, response: Response) {
  sendOk(response, { status: 'ok' });
});
