<?php
declare(strict_types=1);
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');
use App\Db;

// Hapus dua kategori yang tidak dipakai
Db::exec('DELETE FROM categories WHERE slug IN (?,?)', ['master-key-systems','padlocks']);
echo "✓ Master Key Systems dan Padlocks dihapus\n";

// Verifikasi sisa kategori
$cats = Db::all('SELECT slug, name, image_path FROM categories WHERE is_active=1 ORDER BY sort_order');
echo "\nKategori tersisa:\n";
foreach ($cats as $c) {
    echo "  [{$c['slug']}] {$c['name']} → " . ($c['image_path'] ?: '(no image)') . "\n";
}

// Verifikasi story images
echo "\nStory milestones:\n";
$stories = Db::all('SELECT sort_order, year, image_url FROM story_milestones ORDER BY sort_order');
foreach ($stories as $s) {
    echo "  {$s['year']} (sort={$s['sort_order']}) → " . ($s['image_url'] ?: '(kosong)') . "\n";
}
