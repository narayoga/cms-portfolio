import nodemailer from 'nodemailer';
import { getEnv, getEnvNumber } from '../config/env';

type EmailOptions = {
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
  replyToEmail?: string;
  replyToName?: string;
};

/**
 * Remove HTML tags, used for the plain-text version of an email.
 */
function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Send an email through SMTP (Elastic Email).
 * Returns true when the email was sent, false when it failed.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: getEnv('SMTP_HOST', 'smtp.elasticemail.com'),
    port: getEnvNumber('SMTP_PORT', 2525),
    secure: false, // start without TLS ...
    requireTLS: true, // ... then upgrade with STARTTLS (same as the PHP backend)
    auth: {
      user: getEnv('SMTP_USER', ''),
      pass: getEnv('SMTP_PASS', ''),
    },
  });

  const fromAddress = {
    name: getEnv('SMTP_FROM_NAME', 'Website'),
    address: getEnv('SMTP_FROM_EMAIL', 'no-reply@example.com'),
  };

  let replyTo = undefined;
  if (options.replyToEmail !== undefined && options.replyToEmail !== '') {
    let replyToName = '';
    if (options.replyToName !== undefined) {
      replyToName = options.replyToName;
    }
    replyTo = { name: replyToName, address: options.replyToEmail };
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: { name: options.toName, address: options.toEmail },
      replyTo: replyTo,
      subject: options.subject,
      html: options.html,
      text: htmlToPlainText(options.html),
    });
    return true;
  } catch (error: any) {
    console.error('Mailer error:', error.message);
    return false;
  }
}
