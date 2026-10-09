import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { sendEmail } from '../../src/lib/mailer';

// Never send real emails from the tests: replace sendEmail with a fake function
vi.mock('../../src/lib/mailer', function () {
  return { sendEmail: vi.fn() };
});

const fakeSendEmail = vi.mocked(sendEmail);

const VALID_MESSAGE = {
  name: 'Budi',
  email: 'budi@example.com',
  subject: 'Price request',
  message: 'Hello,\nplease send a price list.',
};

describe('POST /api/public/contact', function () {
  beforeEach(function () {
    fakeSendEmail.mockReset();
    fakeSendEmail.mockResolvedValue(true);
  });

  it('sends the message to the site admin', async function () {
    const response = await request(app).post('/api/public/contact').send(VALID_MESSAGE);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, data: { sent: true } });
    expect(fakeSendEmail).toHaveBeenCalledTimes(1);

    const emailOptions = fakeSendEmail.mock.calls[0][0];
    expect(emailOptions.toEmail).toBe('admin@test.local');
    expect(emailOptions.subject).toBe('[Contact] Price request');
    expect(emailOptions.replyToEmail).toBe('budi@example.com');
    // New lines in the message become <br />
    expect(emailOptions.html).toContain('Hello,<br />');
  });

  it('escapes HTML so nobody can inject code into the email', async function () {
    await request(app)
      .post('/api/public/contact')
      .send({ ...VALID_MESSAGE, name: '<script>alert(1)</script>' });

    const emailOptions = fakeSendEmail.mock.calls[0][0];
    expect(emailOptions.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(emailOptions.html).not.toContain('<script>');
  });

  it('answers 422 when a field is missing', async function () {
    const response = await request(app)
      .post('/api/public/contact')
      .send({ ...VALID_MESSAGE, message: '' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Missing field: message');
    expect(fakeSendEmail).not.toHaveBeenCalled();
  });

  it('answers 422 for an invalid email address', async function () {
    const response = await request(app)
      .post('/api/public/contact')
      .send({ ...VALID_MESSAGE, email: 'not-an-email' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid email');
  });

  it('bots that fill in the hidden "website" field get "ok" but nothing is sent', async function () {
    const response = await request(app)
      .post('/api/public/contact')
      .send({ ...VALID_MESSAGE, website: 'http://spam.example' });

    expect(response.status).toBe(200);
    expect(fakeSendEmail).not.toHaveBeenCalled();
  });

  it('answers 500 when the email could not be sent', async function () {
    fakeSendEmail.mockResolvedValue(false);

    const response = await request(app).post('/api/public/contact').send(VALID_MESSAGE);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to send message');
  });
});
