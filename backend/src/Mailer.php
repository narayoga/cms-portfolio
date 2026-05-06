<?php
declare(strict_types=1);

namespace App;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    public static function send(string $toEmail, string $toName, string $subject, string $html, ?string $replyTo = null, ?string $replyToName = null): bool
    {
        $m = new PHPMailer(true);
        try {
            $m->isSMTP();
            $m->Host = env('SMTP_HOST', 'smtp.elasticemail.com');
            $m->SMTPAuth = true;
            $m->Username = env('SMTP_USER', '');
            $m->Password = env('SMTP_PASS', '');
            $m->Port = (int) env('SMTP_PORT', '2525');
            $m->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $m->CharSet = 'UTF-8';

            $m->setFrom(env('SMTP_FROM_EMAIL', 'no-reply@example.com'), env('SMTP_FROM_NAME', 'Website'));
            $m->addAddress($toEmail, $toName);
            if ($replyTo) {
                $m->addReplyTo($replyTo, $replyToName ?? '');
            }
            $m->isHTML(true);
            $m->Subject = $subject;
            $m->Body = $html;
            $m->AltBody = strip_tags($html);
            return $m->send();
        } catch (Exception $e) {
            error_log('Mailer error: ' . $m->ErrorInfo);
            return false;
        }
    }
}
