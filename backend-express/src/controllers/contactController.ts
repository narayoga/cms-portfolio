import type { Request, Response } from 'express';
import { sendOk, sendError } from '../lib/response';
import { getEnv } from '../config/env';
import { getBody, isEmptyValue } from '../lib/values';
import { findMissingField, isValidEmail } from '../lib/validator';
import { sendEmail } from '../lib/mailer';

/**
 * Make text safe to put inside HTML (so nobody can inject HTML into the email).
 */
function escapeHtml(text: any): string {
  let safeText = String(text);
  safeText = safeText.replace(/&/g, '&amp;');
  safeText = safeText.replace(/</g, '&lt;');
  safeText = safeText.replace(/>/g, '&gt;');
  safeText = safeText.replace(/"/g, '&quot;');
  safeText = safeText.replace(/'/g, '&#039;');
  return safeText;
}

/**
 * Put a <br /> before every line break so new lines show up in the email.
 */
function newLinesToBreaks(text: string): string {
  return text.replace(/(\r\n|\n|\r)/g, '<br />$1');
}

/**
 * POST /api/public/contact
 * Body: { name, email, subject, message, website? }
 * "website" is a hidden field (honeypot): real visitors leave it empty, bots fill it in.
 */
export async function submitContactForm(request: Request, response: Response) {
  const body = getBody(request);

  const missingField = findMissingField(body, ['name', 'email', 'subject', 'message']);
  if (missingField !== null) {
    sendError(response, 'Missing field: ' + missingField, 422);
    return;
  }

  if (isValidEmail(body.email) === false) {
    sendError(response, 'Invalid email', 422);
    return;
  }

  // A bot filled in the hidden field: pretend everything worked, but send nothing
  if (isEmptyValue(body.website) === false) {
    sendOk(response);
    return;
  }

  const name = escapeHtml(body.name);
  const email = escapeHtml(body.email);
  const subject = escapeHtml(body.subject);
  const message = newLinesToBreaks(escapeHtml(body.message));

  const html =
    '<h2>New Contact Form Submission</h2>' +
    '<p><strong>Name:</strong> ' + name + '</p>' +
    '<p><strong>Email:</strong> ' + email + '</p>' +
    '<p><strong>Subject:</strong> ' + subject + '</p>' +
    '<hr><div>' + message + '</div>';

  const defaultRecipient = getEnv('SMTP_FROM_EMAIL', 'info@example.com');
  const recipient = getEnv('CONTACT_RECIPIENT', defaultRecipient);

  const emailWasSent = await sendEmail({
    toEmail: recipient,
    toName: 'Website Admin',
    subject: '[Contact] ' + subject,
    html: html,
    replyToEmail: String(body.email),
    replyToName: String(body.name),
  });

  if (emailWasSent === false) {
    sendError(response, 'Failed to send message', 500);
    return;
  }

  sendOk(response, { sent: true });
}
