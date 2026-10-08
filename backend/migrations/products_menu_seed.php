<?php
declare(strict_types=1);

/**
 * Products mega-menu seed — categories (level-1) + subcategories (level-2).
 * Safe to run multiple times (idempotent).
 *   - Looks up categories by NAME (stable), then corrects slug + name.
 *   - UPSERTs subcategories by (category_id, slug).
 *
 * Run AFTER migrate.php (creates categories/subcategories tables).
 *
 * Usage: php migrations/products_menu_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../../.env');

use App\Db;

echo "Seeding Products mega-menu (categories + subcategories)...\n\n";

function slugify(string $s): string
{
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

// Correct slug => [display name, [subcategories in order...]]
$tree = [
    'door-hardware' => [
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
            'Hinges',
            'Knobsets and Leversets',
            'Shower Glass Door Hardware',
            'Sliding and Folding Door Hardware',
        ],
    ],
    'entrance-systems' => [
        'name' => 'Entrance Systems',
        'subs' => [
            'Automatic Swing Door Operators',
            'Automatic Sliding Door Operators',
        ],
    ],
    'electronic-access' => [
        'name' => 'Electronic Access',
        'subs' => [
            'Wall Reader',
            'Electronic Locks',
        ],
    ],
    'smart-home' => [
        'name' => 'Smart Home',
        'subs' => [
            'Smart Devices',
            'Smart Locks',
        ],
    ],
];

foreach ($tree as $catSlug => $data) {
    // Look up by name (stable across slug changes); fall back to any prior slug
    $cat = Db::one('SELECT id, slug FROM categories WHERE name = ?', [$data['name']]);
    if (!$cat) {
        echo "  ⚠ Category '{$data['name']}' not found — skipped (run content_seed.php first)\n";
        continue;
    }

    // Always ensure name AND slug are correct
    if ($cat['slug'] !== $catSlug) {
        Db::exec('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [$data['name'], $catSlug, $cat['id']]);
        echo "  ↻ Fixed category slug '{$cat['slug']}' → '{$catSlug}'\n";
    } else {
        Db::exec('UPDATE categories SET name = ? WHERE id = ?', [$data['name'], $cat['id']]);
    }

    echo "  • {$data['name']} (/{$catSlug})\n";

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
