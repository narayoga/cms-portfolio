<?php
declare(strict_types=1);

namespace App;

class Validator
{
    public static function body(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') return $_POST;
        $json = json_decode($raw, true);
        return is_array($json) ? $json : [];
    }

    public static function require(array $data, array $fields): void
    {
        foreach ($fields as $f) {
            if (!isset($data[$f]) || $data[$f] === '') {
                Response::error("Missing field: $f", 422);
            }
        }
    }

    public static function slug(string $text): string
    {
        $s = strtolower(trim($text));
        $s = preg_replace('/[^a-z0-9]+/', '-', $s);
        return trim($s ?? '', '-');
    }

    public static function uniqueSlug(string $table, string $base, ?int $excludeId = null, ?string $scopeColumn = null, mixed $scopeValue = null): string
    {
        $slug = $base !== '' ? $base : 'item';
        $i = 1;
        while (true) {
            $sql = "SELECT id FROM `$table` WHERE slug = :slug";
            $params = [':slug' => $slug];
            if ($excludeId !== null) {
                $sql .= " AND id <> :id";
                $params[':id'] = $excludeId;
            }
            if ($scopeColumn !== null) {
                $sql .= " AND `$scopeColumn` = :scope";
                $params[':scope'] = $scopeValue;
            }
            $row = Db::one($sql, $params);
            if (!$row) return $slug;
            $i++;
            $slug = $base . '-' . $i;
        }
    }
}
