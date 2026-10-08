<?php
// Router for PHP built-in dev server — serves static files, falls back to index.php
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$file = __DIR__ . DIRECTORY_SEPARATOR . ltrim(str_replace('/', DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);
if ($path !== '/' && file_exists($file) && !is_dir($file)) {
    return false; // serve static file directly
}
require __DIR__ . '/index.php';
