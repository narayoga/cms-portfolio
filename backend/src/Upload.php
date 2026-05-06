<?php
declare(strict_types=1);

namespace App;

class Upload
{
    private const ALLOWED_IMAGES = ['jpg','jpeg','png','webp','gif','svg'];
    private const ALLOWED_FILES  = ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','txt'];

    public static function handle(string $field = 'file', string $kind = 'any'): string
    {
        if (!isset($_FILES[$field])) {
            Response::error("No file uploaded ($field)", 422);
        }
        $f = $_FILES[$field];
        if ($f['error'] !== UPLOAD_ERR_OK) {
            Response::error('Upload error: ' . $f['error'], 400);
        }
        $max = (int) (env('UPLOAD_MAX_BYTES', '10485760'));
        if ($f['size'] > $max) {
            Response::error('File too large', 413);
        }
        $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
        $allowed = match ($kind) {
            'image' => self::ALLOWED_IMAGES,
            'file'  => self::ALLOWED_FILES,
            default => array_merge(self::ALLOWED_IMAGES, self::ALLOWED_FILES),
        };
        if (!in_array($ext, $allowed, true)) {
            Response::error("File type .$ext not allowed", 415);
        }

        $dir = __DIR__ . '/../public/uploads/' . date('Y/m');
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $name = bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = $dir . '/' . $name;
        if (!move_uploaded_file($f['tmp_name'], $dest)) {
            Response::error('Failed to save file', 500);
        }

        // public-relative path
        return '/uploads/' . date('Y/m') . '/' . $name;
    }
}
