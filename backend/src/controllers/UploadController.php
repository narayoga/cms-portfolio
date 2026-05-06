<?php
declare(strict_types=1);

namespace App\controllers;

use App\Auth;
use App\Response;
use App\Upload;

class UploadController
{
    public function upload(): void
    {
        Auth::require();
        $kind = $_GET['kind'] ?? 'any'; // image | file | any
        $path = Upload::handle('file', $kind);
        Response::ok(['path' => $path]);
    }
}
