<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class ProductController
{
    public function index(): void
    {
        Auth::require();
        $subId = isset($_GET['subcategory_id']) ? (int) $_GET['subcategory_id'] : null;
        $where = $subId ? 'WHERE p.subcategory_id = ?' : '';
        $params = $subId ? [$subId] : [];
        $rows = Db::all(
            "SELECT p.*, s.name AS subcategory_name, c.name AS category_name
             FROM products p
             JOIN subcategories s ON s.id = p.subcategory_id
             JOIN categories c ON c.id = s.category_id
             $where
             ORDER BY c.sort_order, s.sort_order, p.sort_order, p.id",
            $params
        );
        Response::ok($rows);
    }

    public function show(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $p = Db::one('SELECT * FROM products WHERE id = ?', [$id]);
        if (!$p) Response::error('Not found', 404);
        $p['images'] = Db::all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id', [$id]);
        Response::ok($p);
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['name', 'subcategory_id']);
        $slug = Validator::uniqueSlug(
            'products',
            Validator::slug($b['slug'] ?? $b['name']),
            null,
            'subcategory_id',
            (int) $b['subcategory_id']
        );
        $id = Db::insert(
            'INSERT INTO products (subcategory_id, name, slug, short_desc, content_html, cover_image, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                (int) $b['subcategory_id'],
                $b['name'],
                $slug,
                $b['short_desc'] ?? null,
                $b['content_html'] ?? null,
                $b['cover_image'] ?? null,
                (int) ($b['sort_order'] ?? 0),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : 1,
            ]
        );
        $this->saveImages($id, $b['images'] ?? []);
        Response::ok(['id' => $id, 'slug' => $slug]);
    }

    public function update(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $b = Validator::body();
        $row = Db::one('SELECT * FROM products WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        $subId = isset($b['subcategory_id']) ? (int) $b['subcategory_id'] : (int) $row['subcategory_id'];
        $slug = isset($b['slug'])
            ? Validator::uniqueSlug('products', Validator::slug($b['slug']), $id, 'subcategory_id', $subId)
            : $row['slug'];

        Db::exec(
            'UPDATE products SET subcategory_id = ?, name = ?, slug = ?, short_desc = ?, content_html = ?, cover_image = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $subId,
                $b['name'] ?? $row['name'],
                $slug,
                $b['short_desc'] ?? $row['short_desc'],
                $b['content_html'] ?? $row['content_html'],
                $b['cover_image'] ?? $row['cover_image'],
                (int) ($b['sort_order'] ?? $row['sort_order']),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : (int) $row['is_active'],
                $id,
            ]
        );
        if (array_key_exists('images', $b)) {
            Db::exec('DELETE FROM product_images WHERE product_id = ?', [$id]);
            $this->saveImages($id, $b['images']);
        }
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM products WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }

    private function saveImages(int $productId, array $images): void
    {
        $i = 0;
        foreach ($images as $path) {
            if (!is_string($path) || $path === '') continue;
            Db::insert('INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)', [$productId, $path, $i++]);
        }
    }
}
