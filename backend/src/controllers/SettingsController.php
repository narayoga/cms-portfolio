<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Db;
use App\Response;
use App\Validator;

class SettingsController
{
    public function index(): void
    {
        Auth::require();
        $rows = Db::all('SELECT `key`, `value` FROM site_settings');
        $out = [];
        foreach ($rows as $r) $out[$r['key']] = $r['value'];
        Response::ok($out);
    }

    public function update(): void
    {
        Auth::require();
        $b = Validator::body();
        if (!is_array($b)) Response::error('Invalid body', 422);
        foreach ($b as $k => $v) {
            $key = (string) $k;
            $val = is_scalar($v) ? (string) $v : json_encode($v);
            Db::exec(
                'INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                [$key, $val]
            );
        }
        Response::ok();
    }
}
