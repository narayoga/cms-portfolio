<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';

loadEnv(__DIR__ . '/../../.env');

// CORS
$origin = env('FRONTEND_ORIGIN', '*');
header('Access-Control-Allow-Origin: ' . $origin);
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

use App\Router;
use App\controllers\AuthController;
use App\controllers\UserController;
use App\controllers\CategoryController;
use App\controllers\SubcategoryController;
use App\controllers\SubSubcategoryController;
use App\controllers\ProductController;
use App\controllers\ProjectController;
use App\controllers\PublicationController;
use App\controllers\DownloadController;
use App\controllers\ServiceController;
use App\controllers\SettingsController;
use App\controllers\BannerController;
use App\controllers\UploadController;
use App\controllers\ContactController;
use App\controllers\NavMenuController;
use App\controllers\PublicController;

$r = new Router();

// Auth
$r->post('/api/auth/login',  [AuthController::class, 'login']);
$r->get ('/api/auth/me',     [AuthController::class, 'me']);

// Public
$r->get ('/api/public/homepage',                              [PublicController::class, 'homepage']);
$r->get ('/api/public/categories',                            [PublicController::class, 'categories']);
$r->get ('/api/public/categories/:slug',                      [PublicController::class, 'categoryDetail']);
$r->get ('/api/public/subcategories/:catSlug/:subSlug',       [PublicController::class, 'subcategoryDetail']);
$r->get ('/api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug', [PublicController::class, 'subSubcategoryDetail']);
$r->get ('/api/public/subsubcategories/:catSlug/:subSlug/:subSubSlug/:leafSlug', [PublicController::class, 'subSubProductDetail']);
$r->get ('/api/public/products/:catSlug/:subSlug/:prodSlug',  [PublicController::class, 'productDetail']);
$r->get ('/api/public/projects',                              [PublicController::class, 'projects']);
$r->get ('/api/public/projects/:slug',                        [PublicController::class, 'projectDetail']);
$r->get ('/api/public/publications',                          [PublicController::class, 'publications']);
$r->get ('/api/public/publications/:slug',                    [PublicController::class, 'publicationDetail']);
$r->get ('/api/public/downloads',                             [PublicController::class, 'downloads']);
$r->get ('/api/public/service',                               [PublicController::class, 'service']);
$r->get ('/api/public/settings',                              [PublicController::class, 'settings']);
$r->get ('/api/public/nav-menus',                             [PublicController::class, 'navMenus']);
$r->post('/api/public/contact',                               [ContactController::class, 'submit']);

// Admin: users (admin only)
$r->get   ('/api/admin/users',     [UserController::class, 'index']);
$r->post  ('/api/admin/users',     [UserController::class, 'store']);
$r->put   ('/api/admin/users/:id', [UserController::class, 'update']);
$r->delete('/api/admin/users/:id', [UserController::class, 'destroy']);

// Admin: categories
$r->get   ('/api/admin/categories',     [CategoryController::class, 'index']);
$r->post  ('/api/admin/categories',     [CategoryController::class, 'store']);
$r->put   ('/api/admin/categories/:id', [CategoryController::class, 'update']);
$r->delete('/api/admin/categories/:id', [CategoryController::class, 'destroy']);

// Admin: subcategories
$r->get   ('/api/admin/subcategories',     [SubcategoryController::class, 'index']);
$r->post  ('/api/admin/subcategories',     [SubcategoryController::class, 'store']);
$r->put   ('/api/admin/subcategories/:id', [SubcategoryController::class, 'update']);
$r->delete('/api/admin/subcategories/:id', [SubcategoryController::class, 'destroy']);

// Admin: sub-subcategories (catalog items: groups + product pages)
$r->get   ('/api/admin/subsubcategories',     [SubSubcategoryController::class, 'index']);
$r->get   ('/api/admin/subsubcategories/:id', [SubSubcategoryController::class, 'show']);
$r->post  ('/api/admin/subsubcategories',     [SubSubcategoryController::class, 'store']);
$r->put   ('/api/admin/subsubcategories/:id', [SubSubcategoryController::class, 'update']);
$r->delete('/api/admin/subsubcategories/:id', [SubSubcategoryController::class, 'destroy']);

// Admin: products
$r->get   ('/api/admin/products',     [ProductController::class, 'index']);
$r->get   ('/api/admin/products/:id', [ProductController::class, 'show']);
$r->post  ('/api/admin/products',     [ProductController::class, 'store']);
$r->put   ('/api/admin/products/:id', [ProductController::class, 'update']);
$r->delete('/api/admin/products/:id', [ProductController::class, 'destroy']);

// Admin: projects
$r->get   ('/api/admin/projects',     [ProjectController::class, 'index']);
$r->post  ('/api/admin/projects',     [ProjectController::class, 'store']);
$r->put   ('/api/admin/projects/:id', [ProjectController::class, 'update']);
$r->delete('/api/admin/projects/:id', [ProjectController::class, 'destroy']);

// Admin: publications
$r->get   ('/api/admin/publications',     [PublicationController::class, 'index']);
$r->post  ('/api/admin/publications',     [PublicationController::class, 'store']);
$r->put   ('/api/admin/publications/:id', [PublicationController::class, 'update']);
$r->delete('/api/admin/publications/:id', [PublicationController::class, 'destroy']);

// Admin: downloads
$r->get   ('/api/admin/downloads',     [DownloadController::class, 'index']);
$r->post  ('/api/admin/downloads',     [DownloadController::class, 'store']);
$r->put   ('/api/admin/downloads/:id', [DownloadController::class, 'update']);
$r->delete('/api/admin/downloads/:id', [DownloadController::class, 'destroy']);

// Admin: service page (singleton)
$r->get('/api/admin/service', [ServiceController::class, 'show']);
$r->put('/api/admin/service', [ServiceController::class, 'update']);

// Admin: settings
$r->get('/api/admin/settings', [SettingsController::class, 'index']);
$r->put('/api/admin/settings', [SettingsController::class, 'update']);

// Admin: banners
$r->get   ('/api/admin/banners',     [BannerController::class, 'index']);
$r->post  ('/api/admin/banners',     [BannerController::class, 'store']);
$r->put   ('/api/admin/banners/:id', [BannerController::class, 'update']);
$r->delete('/api/admin/banners/:id', [BannerController::class, 'destroy']);

// Admin: nav menus
$r->get   ('/api/admin/nav-menus',     [NavMenuController::class, 'index']);
$r->post  ('/api/admin/nav-menus',     [NavMenuController::class, 'store']);
$r->put   ('/api/admin/nav-menus/:id', [NavMenuController::class, 'update']);
$r->delete('/api/admin/nav-menus/:id', [NavMenuController::class, 'destroy']);

// Admin: upload (multipart)
$r->post('/api/admin/upload', [UploadController::class, 'upload']);

// Health
$r->get('/api/health', function () { App\Response::ok(['status' => 'ok']); });

$r->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
