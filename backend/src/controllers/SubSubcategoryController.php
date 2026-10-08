<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class SubSubcategoryController
{
    public function index(): void
    {
        Auth::require();
        $subId = isset($_GET['subcategory_id']) ? (int) $_GET['subcategory_id'] : null;
        $sql =
            'SELECT ss.*, s.name AS subcategory_name, c.name AS category_name, p.name AS parent_name
             FROM sub_subcategories ss
             JOIN subcategories s ON s.id = ss.subcategory_id
             JOIN categories c ON c.id = s.category_id
             LEFT JOIN sub_subcategories p ON p.id = ss.parent_id';
        $params = [];
        if ($subId) {
            $sql .= ' WHERE ss.subcategory_id = ?';
            $params[] = $subId;
        }
        $sql .= ' ORDER BY c.sort_order, s.sort_order, COALESCE(ss.parent_id, ss.id), ss.parent_id IS NOT NULL, ss.sort_order, ss.id';
        Response::ok(Db::all($sql, $params));
    }

    public function show(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $row = Db::one('SELECT * FROM sub_subcategories WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        $row['advantages'] = Db::all(
            'SELECT id, label FROM sub_subcategory_advantages WHERE sub_subcategory_id = ? ORDER BY sort_order, id',
            [$id]
        );
        $features = Db::all(
            'SELECT id, title, image_path, images, description FROM sub_subcategory_features WHERE sub_subcategory_id = ? ORDER BY sort_order, id',
            [$id]
        );
        foreach ($features as &$f) {
            $imgs = !empty($f['images'])
                ? array_values(array_filter(array_map('trim', explode("\n", $f['images']))))
                : (!empty($f['image_path']) ? [$f['image_path']] : []);
            $f['images'] = $imgs;
        }
        unset($f);
        $row['features'] = $features;
        Response::ok($row);
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['name', 'subcategory_id']);
        $subId = (int) $b['subcategory_id'];
        $slug = Validator::uniqueSlug('sub_subcategories', Validator::slug($b['slug'] ?? $b['name']), null, 'subcategory_id', $subId);
        $id = Db::insert(
            'INSERT INTO sub_subcategories (subcategory_id, parent_id, type, name, slug, description, image_path, brand_logo, sort_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $subId,
                !empty($b['parent_id']) ? (int) $b['parent_id'] : null,
                in_array($b['type'] ?? 'product', ['group', 'product'], true) ? $b['type'] : 'product',
                $b['name'],
                $slug,
                $b['description'] ?? null,
                $b['image_path'] ?? null,
                $b['brand_logo'] ?? null,
                (int) ($b['sort_order'] ?? 0),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : 1,
            ]
        );
        $this->syncChildren($id, $b);
        Response::ok(['id' => $id, 'slug' => $slug]);
    }

    public function update(array $params): void
    {
        Auth::require();
        $id = (int) $params['id'];
        $b = Validator::body();
        $row = Db::one('SELECT * FROM sub_subcategories WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        $subId = isset($b['subcategory_id']) ? (int) $b['subcategory_id'] : (int) $row['subcategory_id'];
        $slug = isset($b['slug'])
            ? Validator::uniqueSlug('sub_subcategories', Validator::slug($b['slug']), $id, 'subcategory_id', $subId)
            : $row['slug'];
        Db::exec(
            'UPDATE sub_subcategories SET subcategory_id = ?, parent_id = ?, type = ?, name = ?, slug = ?, description = ?, image_path = ?, brand_logo = ?, sort_order = ?, is_active = ? WHERE id = ?',
            [
                $subId,
                array_key_exists('parent_id', $b) ? (!empty($b['parent_id']) ? (int) $b['parent_id'] : null) : $row['parent_id'],
                in_array($b['type'] ?? $row['type'], ['group', 'product'], true) ? ($b['type'] ?? $row['type']) : 'product',
                $b['name'] ?? $row['name'],
                $slug,
                $b['description'] ?? $row['description'],
                $b['image_path'] ?? $row['image_path'],
                $b['brand_logo'] ?? $row['brand_logo'],
                (int) ($b['sort_order'] ?? $row['sort_order']),
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : (int) $row['is_active'],
                $id,
            ]
        );
        $this->syncChildren($id, $b);
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM sub_subcategories WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }

    // Replace advantages + features when arrays are provided on the request.
    private function syncChildren(int $id, array $b): void
    {
        if (array_key_exists('advantages', $b) && is_array($b['advantages'])) {
            Db::exec('DELETE FROM sub_subcategory_advantages WHERE sub_subcategory_id = ?', [$id]);
            $i = 1;
            foreach ($b['advantages'] as $label) {
                $label = trim((string) $label);
                if ($label === '') continue;
                Db::insert(
                    'INSERT INTO sub_subcategory_advantages (sub_subcategory_id, label, sort_order) VALUES (?, ?, ?)',
                    [$id, $label, $i++]
                );
            }
        }
        if (array_key_exists('features', $b) && is_array($b['features'])) {
            Db::exec('DELETE FROM sub_subcategory_features WHERE sub_subcategory_id = ?', [$id]);
            $i = 1;
            foreach ($b['features'] as $f) {
                if (!is_array($f)) continue;
                $title = trim((string) ($f['title'] ?? ''));
                if ($title === '') continue;
                // Images: accept an array (multiple = carousel); fall back to a single image_path.
                $imgs = [];
                if (isset($f['images']) && is_array($f['images'])) {
                    $imgs = array_values(array_filter(array_map(fn($x) => trim((string) $x), $f['images'])));
                } elseif (!empty($f['image_path'])) {
                    $imgs = [trim((string) $f['image_path'])];
                }
                Db::insert(
                    'INSERT INTO sub_subcategory_features (sub_subcategory_id, title, image_path, images, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
                    [$id, $title, $imgs[0] ?? null, $imgs ? implode("\n", $imgs) : null, $f['description'] ?? null, $i++]
                );
            }
        }
    }
}
