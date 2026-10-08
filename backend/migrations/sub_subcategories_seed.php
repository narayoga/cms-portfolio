<?php
declare(strict_types=1);

/**
 * Sub-subcategories seed — level 3 in catalog taxonomy.
 * Category > Subcategory > Sub-subcategory > Product
 *
 * Safe to run multiple times (idempotent: UPSERT on subcategory_id + slug).
 * Run AFTER migrate.php and products_menu_seed.php.
 *
 * Usage: php migrations/sub_subcategories_seed.php
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../../.env');

use App\Db;

echo "Seeding sub-subcategories...\n\n";

// subcategory name => [sub-subcategory names in order]
$data = [
    'Mechanical Locksets' => [
        'Wilka Lockset',
        'Tessa Assa Abloy Lockset',
        'Calfis Lock Set',
    ],
    'Electric Locks' => [
        'Dormakaba SVP 2000',
        'Dormakaba SVP 6000',
        'Dormakaba SVZ 6000',
    ],
    'Pull Handles And Other Fittings' => [
        'Pull Handles',
    ],
    'Door Closers' => [
        'Dormakaba Door Closer',
        'Tessa Assa Abloy Door Closer',
        'Calfis Door Closer',
    ],
    'Floor Hinges' => [
        'Dormakaba Floor Hinge',
        'Tessa Assa Abloy Floor Hinge',
        'Calvis Floor Hinge',
    ],
    'Automatic Sliding Door Operators' => [
        'ES250 Pro Easy',
        'Dormakaba ES400 Pro',
    ],
    'Automatic Swing Door Operators' => [
        'Dormakaba ED 100',
        'Dormakaba ED 250',
    ],
];

function slugify(string $s): string
{
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

foreach ($data as $subName => $items) {
    $sub = Db::one('SELECT id FROM subcategories WHERE name = ?', [$subName]);
    if (!$sub) {
        echo "  ⚠ Subcategory '$subName' not found — skipped\n";
        continue;
    }

    echo "  • $subName\n";
    foreach ($items as $i => $itemName) {
        $slug = slugify($itemName);
        $existing = Db::one(
            'SELECT id FROM sub_subcategories WHERE subcategory_id = ? AND slug = ?',
            [$sub['id'], $slug]
        );
        if ($existing) {
            Db::exec(
                'UPDATE sub_subcategories SET name = ?, sort_order = ?, is_active = 1 WHERE id = ?',
                [$itemName, $i, $existing['id']]
            );
        } else {
            Db::insert(
                'INSERT INTO sub_subcategories (subcategory_id, name, slug, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
                [$sub['id'], $itemName, $slug, $i]
            );
        }
        echo "      - $itemName\n";
    }
}

echo "\n✅ Sub-subcategories seeded.\n";
