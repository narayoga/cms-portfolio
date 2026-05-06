<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class SubcategoryController
{
    public function index(): void
    {
        Auth::require();
        $catId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : null;
        if ($catId) {
            $rows = Db::all(
                'SELECT s.*, c.name AS category_name FROM subcategories s JOIN categories c ON c.id = s.category_id WHERE s.category_id = ? ORDER BY s.sort_order ASC, s.id ASC',
                [$catId]
            );
        } else {
            $rows = Db::all(
                'SELECT s.*, c.name AS category_name FROM subcategories s JOIN categories c ON c.id = s.category_id ORDER BY c.sort_order ASC, s.sort_order ASC'
            );
        }
        Response::ok($rows);
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['name', 'category_id']);
        $slug = Validator::uniqueSlug(
            'subcategories',
            Validator::slug($b['slug'] ?? $b['name']),
            null,
            'category_id',
            (int) $b['category_id']
        );
        $id = Db::insert(
            'INSERT INTO subcategories (category_id, name, slug, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                (int) $b['category_id'],
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
        $row = Db::one('SELECT * FROM subcategories WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        $catId = isset($b['category_id']) ? (int) $b['category_id'] : (int) $row['category_id'];
        $slug = isset($b['slug'])
            ? Validator::uniqueSlug('subcategories', Validator::slug($b['slug']), $id, 'category_id', $catId)
            : $row['slug'];

        Db::exec(
            'UPDATE subcategories SET category_id = ?, name = ?, slug = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $catId,
                $b['name'] ?? $row['name'],
                $slug,
                $b['description'] ?? $row['description'],
                $b['image_path'] ?? $row['image_path'],
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
        Db::exec('DELETE FROM subcategories WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
