<?php
declare(strict_types=1);

/**
 * Convenience runner — executes all migrations and seeds in order.
 * Usage: php migrations/run_all.php
 */

$steps = [
    'migrate.php'      => 'SQL migrations (tables)',
    'seed.php'         => 'Admin user seed',
    'content_seed.php' => 'Homepage banners, categories, nav menus',
    'homepage_seed.php'=> 'Extended homepage (story, partners, settings)',
];

foreach ($steps as $file => $desc) {
    echo "\n▶ Running $file ($desc)...\n";
    $output = [];
    $code = 0;
    exec("php " . __DIR__ . DIRECTORY_SEPARATOR . $file . " 2>&1", $output, $code);
    foreach ($output as $line) echo "  $line\n";
    if ($code !== 0) {
        echo "  ✗ ERROR (exit code $code) — stopping.\n";
        exit(1);
    }
}

echo "\n\n✅ All done! Backend is ready.\n";
