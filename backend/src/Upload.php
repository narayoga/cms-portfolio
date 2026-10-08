<?php
declare(strict_types=1);

namespace App;

class Upload
{
    private const ALLOWED_IMAGES = ['jpg','jpeg','png','webp','gif','svg'];
    private const ALLOWED_FILES  = ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip','rar','txt'];

    // Raster images are downscaled to this longest edge and re-encoded to keep
    // page weight low. gif/svg are left untouched (animation / vector).
    private const MAX_SIDE = 1600;
    private const QUALITY  = 80;

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

        self::optimizeImage($dest, $ext);

        // public-relative path
        return '/uploads/' . date('Y/m') . '/' . $name;
    }

    /**
     * Downscale + re-encode a JPEG/PNG in place. Best-effort: any failure
     * (GD missing, unreadable file, etc.) leaves the original untouched so an
     * upload never breaks because of optimization.
     *
     * webp/gif/svg are intentionally skipped: webp decoding can hard-fail
     * (uncatchable) on some libgd builds, and webp/svg are already compact.
     */
    private static function optimizeImage(string $path, string $ext): void
    {
        if (!in_array($ext, ['jpg', 'jpeg', 'png'], true)) return;
        if (!function_exists('imagecreatetruecolor')) return; // GD not installed

        // GD decode/encode failures surface as warnings, not exceptions, so
        // catch(\Throwable) alone can't shield the request. Promote them to
        // exceptions for the duration and always restore the handler.
        set_error_handler(static function (int $no, string $msg): bool {
            throw new \ErrorException($msg);
        });

        $src = $dst = null;
        try {
            $info = getimagesize($path);
            if ($info === false) return;
            [$w, $h] = $info;
            if ($w < 1 || $h < 1) return;

            $src = $ext === 'png' ? imagecreatefrompng($path) : imagecreatefromjpeg($path);
            if (!$src) return;

            $longest = max($w, $h);
            $scale = $longest > self::MAX_SIDE ? self::MAX_SIDE / $longest : 1.0;
            $nw = max(1, (int) round($w * $scale));
            $nh = max(1, (int) round($h * $scale));

            $dst = imagecreatetruecolor($nw, $nh);
            if ($ext === 'png') {
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
            }
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);

            // Encode to a buffer first. GD re-encoding (especially truecolor PNG)
            // can be larger than a well-optimized source, so only overwrite when
            // the result is actually smaller — never grow the file.
            ob_start();
            if ($ext === 'png') {
                imagepng($dst, null, 9); // lossless: max compression is always best
            } else {
                imagejpeg($dst, null, self::QUALITY);
            }
            $out = ob_get_clean();

            if ($out !== '' && strlen($out) < (int) filesize($path)) {
                file_put_contents($path, $out);
            }
        } catch (\Throwable $e) {
            // keep the original file on any error
        } finally {
            restore_error_handler();
            if ($src instanceof \GdImage) imagedestroy($src);
            if ($dst instanceof \GdImage) imagedestroy($dst);
        }
    }
}
