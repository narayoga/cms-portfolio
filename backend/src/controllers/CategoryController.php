<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class CategoryController
{
    public function index(): void
    {
        Auth::require();
        $rows = Db::all('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
        Response::ok($rows);
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['name']);
        $slug = Validator::slug($b['slug'] ?? $b['name']);
        $slug = Validator::uniqueSlug('categories', $slug);
        $id = Db::insert(
            'INSERT INTO categories (name, slug, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $b['name'],
                $slug,
                $b['description'] ?? null,
                $b['image_path'] ?? null,
                (int) ($b['sort_order'] ?? 0),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : 1,
            ]
        );
        Response::ok(['id' => $id, 'slug' => $slug]);
    }

    public function update(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $b = Validator::body();
        $existing = Db::one('SELECT * FROM categories WHERE id = ?', [$id]);
        if (!$existing) Response::error('Not found', 404);

        $slug = isset($b['slug']) ? Validator::uniqueSlug('categories', Validator::slug($b['slug']), $id) : $existing['slug'];

        Db::exec(
            'UPDATE categories SET name = ?, slug = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $b['name'] ?? $existing['name'],
                $slug,
                $b['description'] ?? $existing['description'],
                $b['image_path'] ?? $existing['image_path'],
                (int) ($b['sort_order'] ?? $existing['sort_order']),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : (int) $existing['is_active'],
                $id,
            ]
        );
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM categories WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
