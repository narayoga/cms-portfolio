<?php
declare(strict_types=1);

/**
 * Homepage extended seed — populates the new homepage sections.
 * Safe to run multiple times (uses UPSERT / INSERT IGNORE).
 *
 * Run AFTER:
 *   php migrations/migrate.php   (creates tables incl. story_milestones, partner_brands)
 *   php migrations/seed.php      (admin user)
 *   php migrations/content_seed.php  (banners, categories, nav menus)
 *
 * Usage:
 *   php migrations/homepage_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');

use App\Db;

echo "Seeding extended homepage content...\n\n";

// ─────────────────────────────────────────────
// 1. EXTRA SITE SETTINGS
// ─────────────────────────────────────────────
$extra = [
    // Section 3 — Professional Services
    'homepage_services_headline' => 'Our professional services are here to assist you',
    'homepage_services_subtext'  => 'Get to know more about how we can help you from planning to construction stage.',
    'homepage_services_image'    => '',   // upload via admin → /uploads/...

    // Section 4 — Project Marquee
    'homepage_marquee_headline'  => 'We have solutions for every project and application',

    // Section 5 — About / Copywriting
    'homepage_about_logo'           => '',  // upload company logo
    'homepage_about_text'           => 'With 30 years of experience, our company provides value in the Indonesian construction industry by offering a holistic and exceptional portfolio of door hardware, entrance systems, and electronic access produced by reputable manufacturers worldwide. We have a unique and curated network of brands such as WILKA, dormakaba, Tesa Assa Abloy, and Salto Systems that positions us to deliver the best-in-class solutions in every aspect of access in building projects. For each project entrusted to us, we take pride in it and aim to excel by also providing competent and in-depth technical support.',
    'homepage_about_headline_prefix' => 'We have the',
    'homepage_about_headline_words'  => 'Spirit of Excellence,Spirit of Integrity,Spirit of Innovation',

    // Section 7 — Partner brands
    'homepage_partners_title'    => 'Our partner brands',
];

foreach ($extra as $k => $v) {
    Db::exec(
        'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [$k, $v]
    );
}
echo "✓ Extra site settings seeded\n";

// ─────────────────────────────────────────────
// 2. UPDATE CATEGORIES (hover text & names)
// ─────────────────────────────────────────────
// Re-align the first 4 categories to match the reference design
$catUpdates = [
    ['slug' => 'door-locks',          'name' => 'Door Hardware',       'description' => 'Proven solutions for every kind of security needs'],
    ['slug' => 'access-control',      'name' => 'Entrance Systems',    'description' => 'Seamless automated access'],
    ['slug' => 'digital-locks',       'name' => 'Electronic Access',   'description' => 'Eliminate traditional keys with digital credentials'],
    ['slug' => 'smart-home-security', 'name' => 'Smart Home',          'description' => 'Elevate living experience with automation'],
];

foreach ($catUpdates as $u) {
    Db::exec(
        'UPDATE categories SET name = ?, description = ? WHERE slug = ?',
        [$u['name'], $u['description'], $u['slug']]
    );
}
echo "✓ Category names/descriptions updated\n";

// ─────────────────────────────────────────────
// 3. STORY MILESTONES
// ─────────────────────────────────────────────
// Only seed if table is empty
$existing = Db::one('SELECT COUNT(*) AS c FROM story_milestones');
if ((int)($existing['c'] ?? 0) === 0) {
    $milestones = [
        [
            'year' => '1991',
            'content_text' => 'Founded by two hardware specialists, the company first started its journey by partnering with its flagship brand, WILKA from Germany, and pioneered the six-pin cylinder trend in Indonesia in the effort to meet the increasing demand for higher security in building projects.',
            'image_url' => '',
            'sort_order' => 0,
        ],
        [
            'year' => '1998',
            'content_text' => 'During the economic downturn caused by Asian Financial Crises, the company faced unprecedented challenges and was compelled to display resilience, which ultimately led to sealing landmark projects such as Wisma Mulia and Wisma 46.',
            'image_url' => '',
            'sort_order' => 1,
        ],
        [
            'year' => '2005',
            'content_text' => 'The firm further strengthened its offerings by becoming the distributor of Tesa Assa Abloy from Spain for panic exit devices and hotel locks, and also the distributor of dormakaba from Germany for door controllers. Notable projects included Pacific Place, Senayan City, Conrad Bali, and Plaza Semanggi.',
            'image_url' => '',
            'sort_order' => 2,
        ],
        [
            'year' => '2008',
            'content_text' => 'The company achieved another milestone by being appointed to sell entrance systems from dormakaba. Shortly after, the team secured the automatic sliding door works in Kualanamu International Airport, and launched an economical door hardware brand to cater to the growing mid-market segment.',
            'image_url' => '',
            'sort_order' => 3,
        ],
        [
            'year' => '2012',
            'content_text' => 'A sustained and rapid period of growth followed as the company built a strong reputation for being a reliable door hardware provider by completing works in The Mulia Resorts and Villas BSD, Ngurah Rai International Airport, ICE BSD, Botanica Apartment, and Gandaria City Superblock.',
            'image_url' => '',
            'sort_order' => 4,
        ],
        [
            'year' => '2017',
            'content_text' => 'When digitalization became a defining breakthrough, the company pioneered the adoption of digital door locks in Indonesia by introducing electronic lock solutions from South Korea. The company received a recognition award from Allegion for its outstanding work of commercializing digital locks in Indonesia.',
            'image_url' => '',
            'sort_order' => 5,
        ],
        [
            'year' => '2022',
            'content_text' => 'As the world faced the challenge of a global pandemic, the company adapted by capturing the growing market of data center projects propelled by AI technologies. In 2022, the company became the first supplier to install fully contactless, automated, and electronically controlled doors in data centers in Indonesia.',
            'image_url' => '',
            'sort_order' => 6,
        ],
        [
            'year' => '2024',
            'content_text' => 'With the government\'s historic decision to move the capital to Nusantara, the company was highly involved in the development, working on projects including Rumah Susun ASN, Rumah Susun Paspampres, and notably the high-profile Istana Negara and Istana Garuda projects — demonstrating the ability to execute complex requirements with 30 years of expertise.',
            'image_url' => '',
            'sort_order' => 7,
        ],
    ];

    foreach ($milestones as $m) {
        Db::insert(
            'INSERT INTO story_milestones (year, content_text, image_url, sort_order) VALUES (?, ?, ?, ?)',
            [$m['year'], $m['content_text'], $m['image_url'], $m['sort_order']]
        );
    }
    echo "✓ Story milestones seeded (" . count($milestones) . " items)\n";
} else {
    echo "  (story_milestones already populated — skipped)\n";
}

// ─────────────────────────────────────────────
// 4. PARTNER BRANDS
// ─────────────────────────────────────────────
$existing = Db::one('SELECT COUNT(*) AS c FROM partner_brands');
if ((int)($existing['c'] ?? 0) === 0) {
    $brands = [
        ['name' => 'WILKA',             'logo_path' => '', 'sort_order' => 0],
        ['name' => 'dormakaba',         'logo_path' => '', 'sort_order' => 1],
        ['name' => 'Tesa Assa Abloy',   'logo_path' => '', 'sort_order' => 2],
        ['name' => 'Salto Systems',     'logo_path' => '', 'sort_order' => 3],
        ['name' => 'CALFIS',            'logo_path' => '', 'sort_order' => 4],
        ['name' => 'MANTION',           'logo_path' => '', 'sort_order' => 5],
    ];

    foreach ($brands as $b) {
        Db::insert(
            'INSERT INTO partner_brands (name, logo_path, sort_order, is_active) VALUES (?, ?, ?, 1)',
            [$b['name'], $b['logo_path'], $b['sort_order']]
        );
    }
    echo "✓ Partner brands seeded (" . count($brands) . " items)\n";
} else {
    echo "  (partner_brands already populated — skipped)\n";
}

// ─────────────────────────────────────────────
// 5. SAMPLE PROJECTS (for marquee)
// ─────────────────────────────────────────────
$existing = Db::one('SELECT COUNT(*) AS c FROM projects');
if ((int)($existing['c'] ?? 0) === 0) {
    $projects = [
        ['title' => 'Istana Negara IKN',       'slug' => 'istana-negara-ikn',       'published_at' => '2024-03-01'],
        ['title' => 'Jakarta Premium Outlet',  'slug' => 'jakarta-premium-outlet',  'published_at' => '2023-06-15'],
        ['title' => 'Central Park Mall',       'slug' => 'central-park-mall',       'published_at' => '2022-11-20'],
        ['title' => 'Trinity Tower',           'slug' => 'trinity-tower',           'published_at' => '2022-05-10'],
        ['title' => 'Botanica Apartment',      'slug' => 'botanica-apartment',      'published_at' => '2021-08-01'],
        ['title' => 'The Elements',            'slug' => 'the-elements',            'published_at' => '2021-03-15'],
        ['title' => 'Kota Kasablanka',         'slug' => 'kota-kasablanka',         'published_at' => '2020-12-01'],
        ['title' => 'Park Hyatt Jakarta',      'slug' => 'park-hyatt-jakarta',      'published_at' => '2020-07-20'],
        ['title' => 'Hotel Tentrem Jakarta',   'slug' => 'hotel-tentrem-jakarta',   'published_at' => '2019-11-05'],
    ];

    foreach ($projects as $pr) {
        Db::insert(
            'INSERT INTO projects (title, slug, cover_image, content_html, published_at, is_active) VALUES (?, ?, NULL, ?, ?, 1)',
            [$pr['title'], $pr['slug'], '<p>Project details coming soon.</p>', $pr['published_at']]
        );
    }
    echo "✓ Sample projects seeded (" . count($projects) . " items)\n";
} else {
    echo "  (projects already populated — skipped)\n";
}

echo "\n✅ Homepage seed complete!\n";
echo "   → Run the backend server and refresh the homepage.\n";
echo "   → Upload category images via admin to complete the category cards.\n";
echo "   → Upload partner brand logos via admin → partner brands.\n";
