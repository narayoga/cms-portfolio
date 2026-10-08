<?php
declare(strict_types=1);
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../../.env');
use App\Db;

$banners = [
    [
        'image_path' => '/uploads/banners/wilka-banner.jpg',
        'title'      => 'We simply make the world safe',
        'subtitle'   => 'Locking systems from WILKA offer a long-lasting and effective solution to secure access in residential and commercial buildings. With certified and customized locking systems including patented cylinders, you can control and manage doors, even those with a very high amount of traffic and stringent security requirements.',
        'link'       => '/products',
    ],
    [
        'image_path' => '/uploads/banners/dormakaba-banner.jpg',
        'title'      => 'Self-locking emergency escape locks',
        'subtitle'   => 'dormakaba emergency escape locks with automatic locking action provide intrusion protection, rapid emergency opening and controlled access. Mechanical, electric or motor-operated. Doors are securely locked without a key — automatically each time the door is closed. Safety in both directions: convenient and secure.',
        'link'       => '/products',
    ],
    [
        'image_path' => '/uploads/banners/salto-banner.jpg',
        'title'      => 'Smart access reimagined',
        'subtitle'   => 'Streamline security and your operations with industry-leading smart access solutions and elevate user experience by eliminating the reliance on traditional mechanical keys.',
        'link'       => '/products',
    ],
];

Db::exec('DELETE FROM homepage_banners');
foreach ($banners as $i => $b) {
    Db::insert(
        'INSERT INTO homepage_banners (image_path, title, subtitle, link, sort_order, is_active) VALUES (?,?,?,?,?,1)',
        [$b['image_path'], $b['title'], $b['subtitle'], $b['link'], $i]
    );
    echo "✓ Banner " . ($i + 1) . ": {$b['title']}\n";
}
echo "\n✅ Banners updated.\n";
