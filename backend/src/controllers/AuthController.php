<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class AuthController
{
    public function login(): void
    {
        $b = Validator::body();
        Validator::require($b, ['email', 'password']);
        $user = Db::one('SELECT * FROM users WHERE email = ?', [$b['email']]);
        if (!$user || !password_verify($b['password'], $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
        }
        $token = Auth::issue($user);
        Response::ok([
            'token' => $token,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ],
        ]);
    }

    public function me(): void
    {
        $u = Auth::require();
        Response::ok([
            'id' => $u['sub'] ?? null,
            'name' => $u['name'] ?? null,
            'email' => $u['email'] ?? null,
            'role' => $u['role'] ?? null,
        ]);
    }
}
