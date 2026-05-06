<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class ServiceController
{
    public function show(): void
    {
        Auth::require();
        $row = Db::one('SELECT * FROM services_page WHERE id = 1');
        Response::ok($row ?: ['id' => 1, 'content_html' => '', 'hero_image' => null]);
    }

    public function update(): void
    {
        Auth::require();
        $b = Validator::body();
        $existing = Db::one('SELECT id FROM services_page WHERE id = 1');
        if ($existing) {
            Db::exec('UPDATE services_page SET content_html = ?, hero_image = ? WHERE id = 1', [
                $b['content_html'] ?? '',
                $b['hero_image'] ?? null,
            ]);
        } else {
            Db::insert('INSERT INTO services_page (id, content_html, hero_image) VALUES (1, ?, ?)', [
                $b['content_html'] ?? '',
                $b['hero_image'] ?? null,
            ]);
        }
        Response::ok();
    }
}
