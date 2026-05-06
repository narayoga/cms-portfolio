<?php
declare(strict_types=1);

// Runs all .sql files in this folder in alphabetical order.
// Usage: php migrations/migrate.php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../.env');

use App\Db;

$files = glob(__DIR__ . '/*.sql');
sort($files);

foreach ($files as $file) {
    echo "Running " . basename($file) . "...\n";
    $sql = file_get_contents($file);
    Db::conn()->exec($sql);
}
echo "Migrations done.\n";
