<?php
declare(strict_types=1);

namespace App\controllers;

use App\Mailer;
use App\Response;
use App\Validator;

class ContactController
{
    public function submit(): void
    {
        $b = Validator::body();
        Validator::require($b, ['name', 'email', 'subject', 'message']);
        if (!filter_var($b['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email', 422);
        }
        // simple honeypot
        if (!empty($b['website'])) {
            Response::ok(); // silently drop bots
        }

        $name = htmlspecialchars($b['name'], ENT_QUOTES, 'UTF-8');
        $email = htmlspecialchars($b['email'], ENT_QUOTES, 'UTF-8');
        $subject = htmlspecialchars($b['subject'], ENT_QUOTES, 'UTF-8');
        $message = nl2br(htmlspecialchars($b['message'], ENT_QUOTES, 'UTF-8'));

        $html = "<h2>New Contact Form Submission</h2>"
              . "<p><strong>Name:</strong> $name</p>"
              . "<p><strong>Email:</strong> $email</p>"
              . "<p><strong>Subject:</strong> $subject</p>"
              . "<hr><div>$message</div>";

        $recipient = env('CONTACT_RECIPIENT', env('SMTP_FROM_EMAIL', 'info@example.com'));
        $ok = Mailer::send($recipient, 'Website Admin', "[Contact] $subject", $html, $b['email'], $b['name']);

        if (!$ok) Response::error('Failed to send message', 500);
        Response::ok(['sent' => true]);
    }
}
