<?php
declare(strict_types=1);

/**
 * Content seed — populates homepage with initial data.
 * Run AFTER migrate.php and seed.php (which creates the admin user).
 *
 * Usage:
 *   php migrations/content_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');

use App\Db;

echo "Seeding initial content...\n\n";

// ─────────────────────────────────────────────
// 1. SITE SETTINGS
// ─────────────────────────────────────────────
$settings = [
    'site_name'        => '82Cart Security Solutions',
    'contact_email'    => 'info@82cart.com',
    'contact_phone'    => '+62 21 1234 5678',
    'contact_address'  => 'Jl. Sudirman No. 123, Jakarta Selatan 12190, Indonesia',
    'ga_id'            => '',
    'social_facebook'  => '',
    'social_instagram' => '',
    'social_linkedin'  => '',
];

foreach ($settings as $k => $v) {
    Db::exec(
        'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [$k, $v]
    );
}
echo "✓ Site settings seeded\n";

// ─────────────────────────────────────────────
// 2. HOMEPAGE BANNERS
// ─────────────────────────────────────────────
// Delete existing banners first (clean slate)
Db::exec('DELETE FROM homepage_banners');

$banners = [
    [
        'image_path' => '/uploads/banners/wilka-banner.jpg',
        'title'      => 'Premium Door Lock Solutions',
        'subtitle'   => 'WILKA — engineered for security and reliability',
        'link'       => '/products',
        'sort_order' => 0,
        'is_active'  => 1,
    ],
    [
        'image_path' => '/uploads/banners/dormakaba-banner.jpg',
        'title'      => 'Advanced Access Control',
        'subtitle'   => 'dormakaba — redefining how the world manages access',
        'link'       => '/products',
        'sort_order' => 1,
        'is_active'  => 1,
    ],
    [
        'image_path' => '/uploads/banners/salto-banner.jpg',
        'title'      => 'Smart Locking Systems',
        'subtitle'   => 'Salto Systems — wireless access control technology',
        'link'       => '/products',
        'sort_order' => 2,
        'is_active'  => 1,
    ],
];

foreach ($banners as $b) {
    Db::insert(
        'INSERT INTO homepage_banners (image_path, title, subtitle, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [$b['image_path'], $b['title'], $b['subtitle'], $b['link'], $b['sort_order'], $b['is_active']]
    );
}
echo "✓ Homepage banners seeded (" . count($banners) . " items)\n";

// ─────────────────────────────────────────────
// 3. CATEGORIES
// ─────────────────────────────────────────────
Db::exec('DELETE FROM categories');

$categories = [
    [
        'name'        => 'Door Locks',
        'slug'        => 'door-locks',
        'description' => 'High-security mechanical and electronic door locks for residential and commercial use.',
        'image_path'  => null,
        'sort_order'  => 0,
    ],
    [
        'name'        => 'Access Control',
        'slug'        => 'access-control',
        'description' => 'Complete access control systems — card readers, biometrics, and cloud-managed solutions.',
        'image_path'  => null,
        'sort_order'  => 1,
    ],
    [
        'name'        => 'Digital Locks',
        'slug'        => 'digital-locks',
        'description' => 'Keypad, fingerprint, and RFID digital locks for modern security needs.',
        'image_path'  => null,
        'sort_order'  => 2,
    ],
    [
        'name'        => 'Master Key Systems',
        'slug'        => 'master-key-systems',
        'description' => 'Hierarchical keying solutions for large facilities and property management.',
        'image_path'  => null,
        'sort_order'  => 3,
    ],
    [
        'name'        => 'Padlocks',
        'slug'        => 'padlocks',
        'description' => 'Heavy-duty padlocks for outdoor, industrial, and high-security applications.',
        'image_path'  => null,
        'sort_order'  => 4,
    ],
    [
        'name'        => 'Smart Home Security',
        'slug'        => 'smart-home-security',
        'description' => 'IoT-connected locks and security devices for smart home integration.',
        'image_path'  => null,
        'sort_order'  => 5,
    ],
];

$categoryIds = [];
foreach ($categories as $c) {
    $id = Db::insert(
        'INSERT INTO categories (name, slug, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [$c['name'], $c['slug'], $c['description'], $c['image_path'], $c['sort_order']]
    );
    $categoryIds[$c['slug']] = $id;
}
echo "✓ Categories seeded (" . count($categories) . " items)\n";

// ─────────────────────────────────────────────
// 4. SERVICE PAGE
// ─────────────────────────────────────────────
$serviceHtml = <<<HTML
<h2>What We Do</h2>
<p>We are a leading distributor and integrator of premium security solutions in Indonesia.
Our team of certified specialists delivers end-to-end services — from product consultation
and system design to installation, commissioning, and after-sales support.</p>

<h3>Product Supply & Distribution</h3>
<p>We carry an extensive range of products from world-class brands including WILKA, dormakaba,
and Salto Systems, covering mechanical locks, digital locks, access control panels, and smart
home security devices.</p>

<h3>System Design & Consultation</h3>
<p>Our engineers work closely with architects, contractors, and facility managers to design
access control and locking systems tailored to your specific building requirements, budget,
and security objectives.</p>

<h3>Installation & Commissioning</h3>
<p>Our certified installation team ensures every product is fitted and configured correctly,
minimising disruption to your operations and ensuring full system functionality from day one.</p>

<h3>Maintenance & Support</h3>
<p>We provide ongoing maintenance contracts and rapid-response technical support to keep your
security infrastructure operating at peak performance year-round.</p>

<h3>Training</h3>
<p>We offer product training and system administration workshops for your in-house facilities
and security teams.</p>
HTML;

Db::exec(
    'INSERT INTO services_page (id, content_html, hero_image) VALUES (1, ?, NULL) ON DUPLICATE KEY UPDATE content_html = VALUES(content_html)',
    [$serviceHtml]
);
echo "✓ Service page seeded\n";

// ─────────────────────────────────────────────
// 5. NAV MENUS
// ─────────────────────────────────────────────
Db::exec('DELETE FROM nav_menus');

$navItems = [
    // Header navigation
    ['header', 'Home',            '/',                0],
    ['header', 'Products',        '/products',        1],
    ['header', 'Services',        '/services',        2],
    ['header', 'Projects',        '/projects',        3],
    ['header', 'Publications',    '/publications',    4],
    ['header', 'Download Center', '/download-center', 5],
    ['header', 'Contact',         '/contact',         6],

    // Footer — Explore column
    ['footer_explore', 'Products',     '/products',     0],
    ['footer_explore', 'Services',     '/services',     1],
    ['footer_explore', 'Projects',     '/projects',     2],
    ['footer_explore', 'Publications', '/publications', 3],

    // Footer — Resources column
    ['footer_resources', 'Download Center', '/download-center', 0],
    ['footer_resources', 'Contact',         '/contact',         1],
];

foreach ($navItems as [$location, $label, $url, $sort]) {
    Db::insert(
        'INSERT INTO nav_menus (location, label, url, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
        [$location, $label, $url, $sort]
    );
}
echo "✓ Nav menus seeded (" . count($navItems) . " items)\n";

echo "\n✅ Content seed complete!\n";
echo "   → Run the backend and open the homepage to see banners.\n";
echo "   → Categories are ready — add sub-categories and products via admin.\n";
