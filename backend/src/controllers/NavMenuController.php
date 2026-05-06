<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class NavMenuController
{
    /** GET /api/admin/nav-menus?location=header */
    public function index(): void
    {
        Auth::require();
        $location = $_GET['location'] ?? null;
        if ($location) {
            $rows = Db::all(
                'SELECT * FROM nav_menus WHERE location = ? ORDER BY sort_order ASC, id ASC',
                [$location]
            );
        } else {
            $rows = Db::all('SELECT * FROM nav_menus ORDER BY location ASC, sort_order ASC');
        }
        Response::ok($rows);
    }

    /** POST /api/admin/nav-menus */
    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['location', 'label', 'url']);

        $allowed = ['header', 'footer_explore', 'footer_resources'];
        if (!in_array($b['location'], $allowed, true)) {
            Response::error('Invalid location', 422);
        }

        $id = Db::insert(
            'INSERT INTO nav_menus (location, label, url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
            [
                $b['location'],
                $b['label'],
                $b['url'],
                (int) ($b['sort_order'] ?? 0),
                isset($b['is_active']) ? (int)(bool)$b['is_active'] : 1,
            ]
        );
        Response::ok(['id' => $id]);
    }

    /** PUT /api/admin/nav-menus/:id */
    public function update(array $params): void
    {
        Auth::require();
        $id  = (int) $params['id'];
        $b   = Validator::body();
        $row = Db::one('SELECT * FROM nav_menus WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);

        Db::exec(
            'UPDATE nav_menus SET location = ?, label = ?, url = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $b['location']   ?? $row['location'],
                $b['label']      ?? $row['label'],
                $b['url']        ?? $row['url'],
                (int) ($b['sort_order'] ?? $row['sort_order']),
                isset($b['is_active']) ? (int)(bool)$b['is_active'] : (int)$row['is_active'],
                $id,
            ]
        );
        Response::ok(['id' => $id]);
    }

    /** DELETE /api/admin/nav-menus/:id */
    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM nav_menus WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
