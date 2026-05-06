<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class DownloadController
{
    public function index(): void
    {
        Auth::require();
        Response::ok(Db::all('SELECT * FROM downloads ORDER BY sort_order ASC, id DESC'));
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['title']);
        $id = Db::insert(
            'INSERT INTO downloads (title, description, image_path, file_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $b['title'],
                $b['description'] ?? null,
                $b['image_path'] ?? null,
                $b['file_path'] ?? null,
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
        $row = Db::one('SELECT * FROM downloads WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        Db::exec(
            'UPDATE downloads SET title = ?, description = ?, image_path = ?, file_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $b['title'] ?? $row['title'],
                $b['description'] ?? $row['description'],
                $b['image_path'] ?? $row['image_path'],
                $b['file_path'] ?? $row['file_path'],
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
        Db::exec('DELETE FROM downloads WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
