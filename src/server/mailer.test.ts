import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatContactEmailHtml,
  getEmailDeliveryStatus,
  sendOwnerContactEmail,
} from './mailer.ts';

test('getEmailDeliveryStatus detects SMTP, Resend, or unconfigured state cleanly', () => {
  assert.deepEqual(getEmailDeliveryStatus({}, 'alex.rivera@example.com'), {
    configured: false,
    provider: 'none',
    recipientEmail: 'alex.rivera@example.com',
  });

  assert.deepEqual(
    getEmailDeliveryStatus(
      { SMTP_USER: 'alex.rivera@example.com', SMTP_PASS: 'app-pass-16chars' },
      'alex.rivera@example.com',
    ),
    {
      configured: true,
      provider: 'smtp',
      recipientEmail: 'alex.rivera@example.com',
    },
  );

  assert.deepEqual(
    getEmailDeliveryStatus({ RESEND_API_KEY: 're_test_key' }, 'alex.rivera@example.com'),
    {
      configured: true,
      provider: 'resend',
      recipientEmail: 'alex.rivera@example.com',
    },
  );
});

test('formatContactEmailHtml escapes HTML injection payloads safely', () => {
  const html = formatContactEmailHtml({
    to: 'alex.rivera@example.com',
    senderName: '<script>alert(1)</script>Alice',
    senderEmail: 'alice@example.com',
    subject: 'Hello & <Welcome>',
    message: 'Line 1\nLine 2 <b>bold</b>',
  });

  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;Alice'));
  assert.ok(html.includes('Hello &amp; &lt;Welcome&gt;'));
  assert.ok(html.includes('Line 1<br />Line 2 &lt;b&gt;bold&lt;/b&gt;'));
});

test('sendOwnerContactEmail sends via SMTP transport when SMTP credentials are provided', async () => {
  let capturedMail: any = null;
  const result = await sendOwnerContactEmail(
    {
      to: 'alex.rivera@example.com',
      senderName: 'Recruiter Name',
      senderEmail: 'recruiter@company.com',
      subject: 'AI Internship Opportunity',
      message: 'We would love to connect regarding an AI engineering role.',
    },
    {
      env: {
        SMTP_USER: 'alex.rivera@example.com',
        SMTP_PASS: 'abcdefghijklmnop',
      },
      createTransport: (() => ({
        sendMail: async (mail: any) => {
          capturedMail = mail;
          return { messageId: '<msg-1@gmail.com>' };
        },
      })) as any,
    },
  );

  assert.equal(result.sent, true);
  assert.equal(result.provider, 'smtp');
  assert.equal(capturedMail.to, 'alex.rivera@example.com');
  assert.ok(capturedMail.replyTo.includes('recruiter@company.com'));
  assert.equal(capturedMail.subject, '[Portfolio] AI Internship Opportunity');
});

test('sendOwnerContactEmail sends via Resend API when RESEND_API_KEY is configured', async () => {
  let fetchedUrl = '';
  let fetchedInit: any = null;
  const result = await sendOwnerContactEmail(
    {
      to: 'alex.rivera@example.com',
      senderName: 'Hackathon Lead',
      senderEmail: 'lead@university.edu',
      subject: 'Speaker Invite',
      message: 'Would you like to speak at our AI builder meetup?',
    },
    {
      env: { RESEND_API_KEY: 're_live_mock' },
      fetchFn: (async (url: string | URL | Request, init?: RequestInit) => {
        fetchedUrl = String(url);
        fetchedInit = init;
        return new Response(JSON.stringify({ id: 'email_123' }), { status: 200 });
      }) as typeof fetch,
    },
  );

  assert.equal(result.sent, true);
  assert.equal(result.provider, 'resend');
  assert.equal(fetchedUrl, 'https://api.resend.com/emails');
  const body = JSON.parse(fetchedInit.body);
  assert.deepEqual(body.to, ['alex.rivera@example.com']);
  assert.equal(body.reply_to, 'lead@university.edu');
});

test('sendOwnerContactEmail returns sent: false gracefully when no mail provider is configured', async () => {
  const result = await sendOwnerContactEmail(
    {
      to: 'alex.rivera@example.com',
      senderName: 'Visitor',
      senderEmail: 'visitor@example.com',
      subject: 'Quick Question',
      message: 'Testing unconfigured fallback.',
    },
    { env: {} },
  );

  assert.equal(result.sent, false);
  assert.equal(result.provider, 'none');
});
