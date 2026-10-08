import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireLogin, requireAdmin } from './lib/auth';
import { sendOk } from './lib/response';

import * as authController from './controllers/authController';
import * as publicController from './controllers/publicController';
import * as contactController from './controllers/contactController';
import * as userController from './controllers/userController';
import * as categoryController from './controllers/categoryController';
import * as subcategoryController from './controllers/subcategoryController';
import * as subSubcategoryController from './controllers/subSubcategoryController';
import * as productController from './controllers/productController';
import * as projectController from './controllers/projectController';
import * as publicationController from './controllers/publicationController';
import * as downloadController from './controllers/downloadController';
import * as serviceController from './controllers/serviceController';
import * as settingsController from './controllers/settingsController';
import * as bannerController from './controllers/bannerController';
import * as navMenuController from './controllers/navMenuController';
import * as uploadController from './controllers/uploadController';

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

// Public (website)
router.get('/api/public/homepage', publicController.getHomepage);
router.get('/api/public/categories', publicController.getCategories);
router.get('/api/public/categories/:slug', publicController.getCategoryDetail);
router.get('/api/public/subcategories/:catSlug/:subSlug', publicController.getSubcategoryDetail);
router.get('/api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug', publicController.getSubSubcategoryDetail);
router.get('/api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug/:leafSlug', publicController.getSubSubProductDetail);
router.get('/api/public/products/:catSlug/:subSlug/:prodSlug', publicController.getProductDetail);
router.get('/api/public/projects', publicController.getProjects);
router.get('/api/public/projects/:slug', publicController.getProjectDetail);
router.get('/api/public/publications', publicController.getPublications);
router.get('/api/public/publications/:slug', publicController.getPublicationDetail);
router.get('/api/public/downloads', publicController.getDownloads);
router.get('/api/public/service', publicController.getServicePage);
router.get('/api/public/settings', publicController.getPublicSettings);
router.get('/api/public/nav-menus', publicController.getNavMenus);
router.post('/api/public/contact', contactController.submitContactForm);

// Admin: users (admin only)
router.get('/api/admin/users', requireAdmin, userController.listUsers);
router.post('/api/admin/users', requireAdmin, userController.createUser);
router.put('/api/admin/users/:id', requireAdmin, userController.updateUser);
router.delete('/api/admin/users/:id', requireAdmin, userController.deleteUser);

// Admin: categories
router.get('/api/admin/categories', requireLogin, categoryController.listCategories);
router.post('/api/admin/categories', requireLogin, categoryController.createCategory);
router.put('/api/admin/categories/:id', requireLogin, categoryController.updateCategory);
router.delete('/api/admin/categories/:id', requireLogin, categoryController.deleteCategory);

// Admin: subcategories
router.get('/api/admin/subcategories', requireLogin, subcategoryController.listSubcategories);
router.post('/api/admin/subcategories', requireLogin, subcategoryController.createSubcategory);
router.put('/api/admin/subcategories/:id', requireLogin, subcategoryController.updateSubcategory);
router.delete('/api/admin/subcategories/:id', requireLogin, subcategoryController.deleteSubcategory);

// Admin: sub-subcategories (catalog items: groups + product pages)
router.get('/api/admin/subsubcategories', requireLogin, subSubcategoryController.listSubSubcategories);
router.get('/api/admin/subsubcategories/:id', requireLogin, subSubcategoryController.getSubSubcategory);
router.post('/api/admin/subsubcategories', requireLogin, subSubcategoryController.createSubSubcategory);
router.put('/api/admin/subsubcategories/:id', requireLogin, subSubcategoryController.updateSubSubcategory);
router.delete('/api/admin/subsubcategories/:id', requireLogin, subSubcategoryController.deleteSubSubcategory);

// Admin: products
router.get('/api/admin/products', requireLogin, productController.listProducts);
router.get('/api/admin/products/:id', requireLogin, productController.getProduct);
router.post('/api/admin/products', requireLogin, productController.createProduct);
router.put('/api/admin/products/:id', requireLogin, productController.updateProduct);
router.delete('/api/admin/products/:id', requireLogin, productController.deleteProduct);

// Admin: projects
router.get('/api/admin/projects', requireLogin, projectController.listProjects);
router.post('/api/admin/projects', requireLogin, projectController.createProject);
router.put('/api/admin/projects/:id', requireLogin, projectController.updateProject);
router.delete('/api/admin/projects/:id', requireLogin, projectController.deleteProject);

// Admin: publications
router.get('/api/admin/publications', requireLogin, publicationController.listPublications);
router.post('/api/admin/publications', requireLogin, publicationController.createPublication);
router.put('/api/admin/publications/:id', requireLogin, publicationController.updatePublication);
router.delete('/api/admin/publications/:id', requireLogin, publicationController.deletePublication);

// Admin: downloads
router.get('/api/admin/downloads', requireLogin, downloadController.listDownloads);
router.post('/api/admin/downloads', requireLogin, downloadController.createDownload);
router.put('/api/admin/downloads/:id', requireLogin, downloadController.updateDownload);
router.delete('/api/admin/downloads/:id', requireLogin, downloadController.deleteDownload);

// Admin: service page (one single page)
router.get('/api/admin/service', requireLogin, serviceController.getServicePage);
router.put('/api/admin/service', requireLogin, serviceController.updateServicePage);

// Admin: settings
router.get('/api/admin/settings', requireLogin, settingsController.getSettings);
router.put('/api/admin/settings', requireLogin, settingsController.updateSettings);

// Admin: banners
router.get('/api/admin/banners', requireLogin, bannerController.listBanners);
router.post('/api/admin/banners', requireLogin, bannerController.createBanner);
router.put('/api/admin/banners/:id', requireLogin, bannerController.updateBanner);
router.delete('/api/admin/banners/:id', requireLogin, bannerController.deleteBanner);

// Admin: nav menus
router.get('/api/admin/nav-menus', requireLogin, navMenuController.listNavMenus);
router.post('/api/admin/nav-menus', requireLogin, navMenuController.createNavMenu);
router.put('/api/admin/nav-menus/:id', requireLogin, navMenuController.updateNavMenu);
router.delete('/api/admin/nav-menus/:id', requireLogin, navMenuController.deleteNavMenu);

// Admin: file upload (multipart form, field "file")
router.post('/api/admin/upload', requireLogin, uploadController.uploadFile);

// Health check
router.get('/api/health', function healthCheck(request: Request, response: Response) {
  sendOk(response, { status: 'ok' });
});
