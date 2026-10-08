<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class ProjectController
{
    public function index(): void
    {
        Auth::require();
        Response::ok(Db::all('SELECT * FROM projects ORDER BY published_at DESC, id DESC'));
    }

    public function store(): void
    {
        Auth::require();
        $b = Validator::body();
        Validator::require($b, ['title']);
        $slug = Validator::uniqueSlug('projects', Validator::slug($b['slug'] ?? $b['title']));
        $id = Db::insert(
            'INSERT INTO projects (title, category, location, products, owner, architect, contractor, slug, cover_image, content_html, published_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $b['title'],
                $b['category'] ?? null,
                $b['location'] ?? null,
                $b['products'] ?? null,
                $b['owner'] ?? null,
                $b['architect'] ?? null,
                $b['contractor'] ?? null,
                $slug,
                $b['cover_image'] ?? null,
                $b['content_html'] ?? null,
                $b['published_at'] ?? date('Y-m-d'),
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
        $row = Db::one('SELECT * FROM projects WHERE id = ?', [$id]);
        if (!$row) Response::error('Not found', 404);
        $slug = isset($b['slug']) ? Validator::uniqueSlug('projects', Validator::slug($b['slug']), $id) : $row['slug'];
        $keep = fn($k) => array_key_exists($k, $b) ? $b[$k] : $row[$k];
        Db::exec(
            'UPDATE projects SET title = ?, category = ?, location = ?, products = ?, owner = ?, architect = ?, contractor = ?, slug = ?, cover_image = ?, content_html = ?, published_at = ?, is_active = ? WHERE id = ?',
            [
                $b['title'] ?? $row['title'],
                $keep('category'),
                $keep('location'),
                $keep('products'),
                $keep('owner'),
                $keep('architect'),
                $keep('contractor'),
                $slug,
                $b['cover_image'] ?? $row['cover_image'],
                $b['content_html'] ?? $row['content_html'],
                $b['published_at'] ?? $row['published_at'],
                isset($b['is_active']) ? (int) (bool) $b['is_active'] : (int) $row['is_active'],
                $id,
            ]
        );
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        Auth::require();
        Db::exec('DELETE FROM projects WHERE id = ?', [(int) $params['id']]);
        Response::ok();
    }
}
