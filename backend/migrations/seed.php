<?php
declare(strict_types=1);

// Seeds initial admin user, default service page, default settings.
// Usage: php migrations/seed.php

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../config/env.php';
loadEnv(__DIR__ . '/../../.env');

use App\Db;

$email = $argv[1] ?? 'admin@example.com';
$pass  = $argv[2] ?? 'admin123';
$name  = $argv[3] ?? 'Administrator';

$existing = Db::one('SELECT id FROM users WHERE email = ?', [$email]);
if (!$existing) {
    Db::insert(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [$name, $email, password_hash($pass, PASSWORD_BCRYPT), 'admin']
    );
    echo "Created admin: $email / $pass\n";
} else {
    echo "Admin $email already exists\n";
}

// Service page singleton
Db::exec('INSERT IGNORE INTO services_page (id, content_html) VALUES (1, ?)', [
    '<h1>Our Services</h1><p>Edit this page from the CMS admin panel.</p>'
]);

// Default settings
$defaults = [
    'site_name'       => 'Portfolio Website',
    'contact_email'   => 'info@example.com',
    'contact_phone'   => '+62 000 000 000',
    'contact_address' => 'Jakarta, Indonesia',
    'ga_id'           => '',
    'social_facebook' => '',
    'social_instagram'=> '',
    'social_linkedin' => '',
];
foreach ($defaults as $k => $v) {
    Db::exec('INSERT IGNORE INTO site_settings (`key`, `value`) VALUES (?, ?)', [$k, $v]);
}

echo "Seed completed.\n";
