<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class UserController
{
    public function index(): void
    {
        Auth::requireAdmin();
        $rows = Db::all('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
        Response::ok($rows);
    }

    public function store(): void
    {
        Auth::requireAdmin();
        $b = Validator::body();
        Validator::require($b, ['name', 'email', 'password', 'role']);
        if (!in_array($b['role'], ['admin', 'editor'], true)) {
            Response::error('Invalid role', 422);
        }
        if (Db::one('SELECT id FROM users WHERE email = ?', [$b['email']])) {
            Response::error('Email already exists', 409);
        }
        $id = Db::insert(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [$b['name'], $b['email'], password_hash($b['password'], PASSWORD_BCRYPT), $b['role']]
        );
        Response::ok(['id' => $id]);
    }

    public function update(array $params): void
    {
        Auth::requireAdmin();
        $id = (int) $params['id'];
        $b = Validator::body();
        $fields = [];
        $vals = [];
        foreach (['name', 'email', 'role'] as $f) {
            if (isset($b[$f])) {
                $fields[] = "$f = ?";
                $vals[] = $b[$f];
            }
        }
        if (!empty($b['password'])) {
            $fields[] = 'password_hash = ?';
            $vals[] = password_hash($b['password'], PASSWORD_BCRYPT);
        }
        if (empty($fields)) Response::error('Nothing to update', 422);
        $vals[] = $id;
        Db::exec('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?', $vals);
        Response::ok(['id' => $id]);
    }

    public function destroy(array $params): void
    {
        $u = Auth::requireAdmin();
        $id = (int) $params['id'];
        if ((int) ($u['sub'] ?? 0) === $id) {
            Response::error('Cannot delete yourself', 400);
        }
        Db::exec('DELETE FROM users WHERE id = ?', [$id]);
        Response::ok(['id' => $id]);
    }
}
