<?php
declare(strict_types=1);

namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class Auth
{
    public static function issue(array $user): string
    {
        $secret = env('JWT_SECRET', 'dev-secret');
        $ttl = (int) (env('JWT_TTL', '86400'));
        $now = time();
        $payload = [
            'iat' => $now,
            'exp' => $now + $ttl,
            'sub' => $user['id'],
            'role' => $user['role'],
            'name' => $user['name'],
            'email' => $user['email'],
        ];
        return JWT::encode($payload, $secret, 'HS256');
    }

    public static function decode(string $token): ?array
    {
        $secret = env('JWT_SECRET', 'dev-secret');
        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            return (array) $decoded;
        } catch (Throwable) {
            return null;
        }
    }

    public static function bearer(): ?string
    {
        $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (stripos($h, 'Bearer ') === 0) {
            return substr($h, 7);
        }
        return null;
    }

    public static function user(): ?array
    {
        $token = self::bearer();
        if (!$token) return null;
        return self::decode($token);
    }

    public static function require(): array
    {
        $u = self::user();
        if (!$u) Response::error('Unauthorized', 401);
        return $u;
    }

    public static function requireAdmin(): array
    {
        $u = self::require();
        if (($u['role'] ?? '') !== 'admin') {
            Response::error('Forbidden', 403);
        }
        return $u;
    }
}
