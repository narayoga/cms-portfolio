<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class BannerController
{
    public function index(): void
    {
        Auth::require();
        Response::ok(Db::all('SELECT * FROM homepage_banners ORDER BY sort_order ASC, id ASC'));
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['image_path']);
        $id = Db::insert(
            'INSERT INTO homepage_banners (image_path, title, subtitle, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $b['image_path'],
                $b['title'] ?? null,
                $b['subtitle'] ?? null,
                $b['link'] ?? null,
                (int) ($b['sort_order'] ?? 0),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : 1,
            ]
        );
        Response::ok(['id' => $id]);
    }

    public function update(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $b = Validator::body();
        $row = Db::one('SELECT * FROM homepage_banners WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        Db::exec(
            'UPDATE homepage_banners SET image_path = ?, title = ?, subtitle = ?, link = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $b['image_path'] ?? $row['image_path'],
                $b['title'] ?? $row['title'],
                $b['subtitle'] ?? $row['subtitle'],
                $b['link'] ?? $row['link'],
                (int) ($b['sort_order'] ?? $row['sort_order']),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : (int) $row['is_active'],
                $id,
            ]
        );
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM homepage_banners WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
