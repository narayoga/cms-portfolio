<?php
declare(strict_types=1);

/**
 * Image seed — assigns uploaded images to the correct DB records.
 * Safe to run multiple times (all statements are UPDATE / UPSERT).
 *
 * Usage: php migrations/image_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../../.env');

use App\Db;

echo "Assigning images to database records...\n\n";

// ─────────────────────────────────────────────
// 1. CATEGORY CARD IMAGES (Section 2)
// ─────────────────────────────────────────────
$catImages = [
    'door-locks'          => ['image' => '/uploads/1_Door-hardware.jpeg',   'name' => 'Door Hardware'],
    'access-control'      => ['image' => '/uploads/2_Automatic-Doors.jpeg', 'name' => 'Automatic Doors'],
    'digital-locks'       => ['image' => '/uploads/3_Electronic-Access.jpeg','name' => 'Electronic Access'],
    'smart-home-security' => ['image' => '/uploads/4_Smart-Home.jpeg',      'name' => 'Smart Home'],
];

foreach ($catImages as $slug => $data) {
    $rows = Db::exec(
        'UPDATE categories SET image_path = ?, name = ? WHERE slug = ?',
        [$data['image'], $data['name'], $slug]
    );
    echo "  ✓ Category [$slug] → {$data['image']}\n";
}
echo "✓ Category images done\n\n";

// ─────────────────────────────────────────────
// 2. SERVICES SECTION IMAGE (Section 3)
// ─────────────────────────────────────────────
Db::exec(
    "INSERT INTO site_settings (`key`, `value`) VALUES ('homepage_services_image', ?)
     ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    ['/uploads/5_Banner-scaled.jpg']
);
echo "✓ Services image → /uploads/5_Banner-scaled.jpg\n\n";

// ─────────────────────────────────────────────
// 3. PROJECT MARQUEE IMAGES (Section 4, images 6–14)
// ─────────────────────────────────────────────
// Ordered by published_at DESC — same order as seeded in homepage_seed.php
$projectImages = [
    'istana-negara-ikn'      => '/uploads/6_Istana-Negara-IKN-scaled.jpeg',
    'jakarta-premium-outlet' => '/uploads/7_Jakarta-Premium-Outlets.jpg',
    'central-park-mall'      => '/uploads/8_Central-Park.jpeg',
    'trinity-tower'          => '/uploads/9_Trinity-Tower.webp',
    'botanica-apartment'     => '/uploads/10_Botanica-Apartment.jpg',
    'the-elements'           => '/uploads/11_The-Elements.webp',
    'kota-kasablanka'        => '/uploads/12_Kota-Kasablanka-scaled.jpg',
    'park-hyatt-jakarta'     => '/uploads/13_park-hyatt-scaled.jpg',
    'hotel-tentrem-jakarta'  => '/uploads/14_Hotel-Tentrem-Jakarta.webp',
];

foreach ($projectImages as $slug => $path) {
    Db::exec('UPDATE projects SET cover_image = ? WHERE slug = ?', [$path, $slug]);
    echo "  ✓ Project [$slug] → $path\n";
}
echo "✓ Project images done\n\n";

// ─────────────────────────────────────────────
// 4. COMPANY LOGO (Section 5)
// ─────────────────────────────────────────────
Db::exec(
    "INSERT INTO site_settings (`key`, `value`) VALUES ('homepage_about_logo', ?)
     ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    ['/uploads/15_SAG-warna-ri4cltobofltnbnvjndxax4uuic9o83fh7mq7ac1wy.png']
);
echo "✓ Company logo → /uploads/15_SAG-warna-...png\n\n";

// ─────────────────────────────────────────────
// 5. STORY MILESTONE IMAGES (Section 6, images 16–23)
// ─────────────────────────────────────────────
// Ordered by sort_order (0–7) = years 1991, 1998, 2005, 2008, 2012, 2017, 2022, 2024
$storyImages = [
    0 => '/uploads/16_WILKA-ri4clsqf4315nmn41xrvmwr5pm9bskz6f2h6sv1bls.jpg',
    1 => '/uploads/17_Wisma-BNI-46-ri4clsqf4315nmn41xrvmwr5pm9bskz6f2h6sv1bls.jpg',
    2 => '/uploads/18_Tesa-Electronic-Locksets-ri4clquqqeyl0epucwymhx88iuild6rpqt67ub43y8.jpg',
    3 => '/uploads/19_Automatic-Sliding-Door-ri4clto9ax2fz8lqwg6i7eimb04p0a2wr74oa4zxfk.jpg',
    4 => '/uploads/20_Mulia-Resort-ri4clum3hr3qaukdqyl4rwa2we027z6n3bs5reyj9c.webp',
    5 => '/uploads/21_Milre-ri4clum3hr3qaukdqyl4rwa2we027z6n3bs5reyj9c.webp',
    6 => '/uploads/22_Neutra-DC-ri4clquqqeyl0epucwymhx88iuild6rpqt67ub43y8.jpg',
    7 => '/uploads/23_IKN-ri4clrskx8zvc0oh7fd92ezp48dykvvg2xtpbl2ps0.jpg',
];

foreach ($storyImages as $sortOrder => $path) {
    Db::exec(
        'UPDATE story_milestones SET image_url = ? WHERE sort_order = ?',
        [$path, $sortOrder]
    );
    echo "  ✓ Story [sort_order=$sortOrder] → $path\n";
}
echo "✓ Story images done\n\n";

// ─────────────────────────────────────────────
// 6. PARTNER BRAND LOGOS (Section 7)
// ─────────────────────────────────────────────
$brandLogos = [
    'WILKA'           => '/uploads/brand_wilka-logo.png',
    'dormakaba'       => '/uploads/brand-dormakaba.png',
    'Tesa Assa Abloy' => '/uploads/brand_tessaassaabloy.png',
    'Salto Systems'   => '/uploads/brand-salto-blk-logo.png',
    'CALFIS'          => '/uploads/brand-CALFIS.png',
    'MANTION'         => '/uploads/brand-MANTION.png',
];

foreach ($brandLogos as $name => $path) {
    Db::exec('UPDATE partner_brands SET logo_path = ? WHERE name = ?', [$path, $name]);
    echo "  ✓ Brand [$name] → $path\n";
}
echo "✓ Partner brand logos done\n\n";

echo "✅ All images assigned!\n";
