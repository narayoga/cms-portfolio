<?php
declare(strict_types=1);

/**
 * Products mega-menu seed — categories (level-1) + subcategories (level-2).
 * Safe to run multiple times (idempotent: UPSERT on category name, INSERT IGNORE on subcategory slug).
 *
 * Run AFTER migrate.php (creates categories/subcategories tables).
 *
 * Usage: php migrations/products_menu_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');

use App\Db;

echo "Seeding Products mega-menu (categories + subcategories)...\n\n";

function slugify(string $s): string
{
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

// slug => [display name, [subcategories...]]
$tree = [
    'door-locks' => [
        'name' => 'Door Hardware',
        'subs' => [
            'Mechanical Locksets',
            'Electric Locks',
            'Pull Handles And Other Fittings',
            'Panic Exit Devices',
            'Door Closers',
            'Floor Hinges',
            'Decorative Locksets',
            'Door Seals',
            'Knobsets and Leversets',
            'Shower Glass Door Hardware',
            'Sliding and Folding Door Hardware',
        ],
    ],
    'access-control' => [
        'name' => 'Entrance Systems',
        'subs' => [
            'Automatic Swing Door Operators',
            'Automatic Sliding Door Operators',
        ],
    ],
    'digital-locks' => [
        'name' => 'Electronic Access',
        'subs' => [
            'Wall Reader',
            'Electronic Locks',
        ],
    ],
    'smart-home-security' => [
        'name' => 'Smart Home',
        'subs' => [
            'Smart Devices',
            'Smart Locks',
        ],
    ],
];

foreach ($tree as $catSlug => $data) {
    $cat = Db::one('SELECT id, name FROM categories WHERE slug = ?', [$catSlug]);
    if (!$cat) {
        echo "  ⚠ Category '$catSlug' not found — skipped (run content_seed.php first)\n";
        continue;
    }

    // Ensure display name is correct
    if ($cat['name'] !== $data['name']) {
        Db::exec('UPDATE categories SET name = ? WHERE id = ?', [$data['name'], $cat['id']]);
        echo "  ↻ Renamed category '{$cat['name']}' → '{$data['name']}'\n";
    }

    echo "  • {$data['name']}\n";
    foreach ($data['subs'] as $i => $subName) {
        $subSlug = slugify($subName);
        $existing = Db::one(
            'SELECT id FROM subcategories WHERE category_id = ? AND slug = ?',
            [$cat['id'], $subSlug]
        );
        if ($existing) {
            Db::exec(
                'UPDATE subcategories SET name = ?, sort_order = ?, is_active = 1 WHERE id = ?',
                [$subName, $i, $existing['id']]
            );
        } else {
            Db::insert(
                'INSERT INTO subcategories (category_id, name, slug, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
                [$cat['id'], $subName, $subSlug, $i]
            );
        }
        echo "      - {$subName}\n";
    }
}

echo "\n✅ Products mega-menu seeded.\n";
