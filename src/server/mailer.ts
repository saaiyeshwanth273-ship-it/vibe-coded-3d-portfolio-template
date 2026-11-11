import nodemailer from 'nodemailer';
import { getOwnerEmail } from './security.ts';

export type EmailProvider = 'smtp' | 'resend' | 'none';

export interface EmailDeliveryStatus {
  configured: boolean;
  provider: EmailProvider;
  recipientEmail: string;
}

export interface ContactEmailPayload {
  to: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: EmailProvider;
  error?: string;
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getEmailDeliveryStatus(
  env: Record<string, string | undefined> = process.env,
  recipientEmail: string = getOwnerEmail(),
): EmailDeliveryStatus {
  const cleanRecipient = recipientEmail.trim() || getOwnerEmail();
  if (env.SMTP_USER?.trim() && env.SMTP_PASS?.trim()) {
    return {
      configured: true,
      provider: 'smtp',
      recipientEmail: cleanRecipient,
    };
  }
  if (env.RESEND_API_KEY?.trim()) {
    return {
      configured: true,
      provider: 'resend',
      recipientEmail: cleanRecipient,
    };
  }
  return {
    configured: false,
    provider: 'none',
    recipientEmail: cleanRecipient,
  };
}

export function formatContactEmailHtml(payload: ContactEmailPayload): string {
  const safeName = escapeEmailHtml(payload.senderName);
  const safeEmail = escapeEmailHtml(payload.senderEmail);
  const safeSubject = escapeEmailHtml(payload.subject);
  const safeMessage = escapeEmailHtml(payload.message).replace(/\r?\n/g, '<br />');

  return [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#080B18;color:#F4F5FA;border:1px solid #23335A;">',
    '<p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#48DDF5;margin:0 0 8px 0;">Portfolio Direct Message</p>',
    `<h2 style="font-size:20px;margin:0 0 16px 0;color:#FFFFFF;">${safeSubject}</h2>`,
    '<table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;">',
    `<tr><td style="padding:6px 0;color:#9AA6C8;width:90px;">From:</td><td style="padding:6px 0;color:#FFFFFF;font-weight:600;">${safeName}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#9AA6C8;">Reply-To:</td><td style="padding:6px 0;color:#48DDF5;">${safeEmail}</td></tr>`,
    '</table>',
    `<div style="padding:16px;background:#0E162D;border-left:3px solid #4169FF;font-size:14px;line-height:1.6;color:#E2E8F0;">${safeMessage}</div>`,
    '<p style="margin:20px 0 0 0;font-size:11px;color:#8B98B8;">Sent via Alex Rivera Portfolio · Reply directly to this email to respond to the sender.</p>',
    '</div>',
  ].join('');
}

export function formatContactEmailText(payload: ContactEmailPayload): string {
  return [
    'Portfolio Direct Message',
    '========================',
    `From: ${payload.senderName} <${payload.senderEmail}>`,
    `Subject: ${payload.subject}`,
    '',
    payload.message,
  ].join('\n');
}

export interface MailerDependencies {
  env?: Record<string, string | undefined>;
  createTransport?: typeof nodemailer.createTransport;
  fetchFn?: typeof fetch;
}

export async function sendOwnerContactEmail(
  payload: ContactEmailPayload,
  deps: MailerDependencies = {},
): Promise<SendEmailResult> {
  const env = deps.env ?? process.env;
  const status = getEmailDeliveryStatus(env, payload.to);
  const mailSubject = `[Portfolio] ${payload.subject}`;
  const html = formatContactEmailHtml(payload);
  const text = formatContactEmailText(payload);

  if (status.provider === 'smtp') {
    try {
      const port = Number(env.SMTP_PORT || 465);
      const host = env.SMTP_HOST?.trim() || 'smtp.gmail.com';
      const user = env.SMTP_USER!.trim();
      const pass = env.SMTP_PASS!.trim();
      const fromAddr = env.SMTP_FROM?.trim() || `Portfolio Contact <${user}>`;

      const createTransportFn = deps.createTransport ?? nodemailer.createTransport;
      const transporter = createTransportFn({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: fromAddr,
        to: status.recipientEmail,
        replyTo: `"${payload.senderName.replace(/"/g, '')}" <${payload.senderEmail}>`,
        subject: mailSubject,
        text,
        html,
      });

      return { sent: true, provider: 'smtp' };
    } catch (err: any) {
      console.error('SMTP email dispatch failed:', err?.message || err);
      return {
        sent: false,
        provider: 'smtp',
        error: err?.message || 'SMTP send failed',
      };
    }
  }

  if (status.provider === 'resend') {
    try {
      const fetchImpl = deps.fetchFn ?? fetch;
      const apiKey = env.RESEND_API_KEY!.trim();
      const fromAddr = env.RESEND_FROM?.trim() || 'Portfolio Contact <onboarding@resend.dev>';

      const resp = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [status.recipientEmail],
          reply_to: payload.senderEmail,
          subject: mailSubject,
          html,
          text,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.error('Resend API email dispatch failed:', resp.status, errText);
        return {
          sent: false,
          provider: 'resend',
          error: `Resend HTTP ${resp.status}`,
        };
      }

      return { sent: true, provider: 'resend' };
    } catch (err: any) {
      console.error('Resend email dispatch error:', err?.message || err);
      return {
        sent: false,
        provider: 'resend',
        error: err?.message || 'Resend error',
      };
    }
  }

  return { sent: false, provider: 'none' };
}
