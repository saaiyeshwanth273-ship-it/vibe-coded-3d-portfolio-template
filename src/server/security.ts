import crypto from 'node:crypto';
import * as OTPAuth from 'otpauth';

const DEFAULT_OWNER_EMAIL = 'alex.rivera@example.com';

export function getOwnerEmail(): string {
  return (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
}

export function isAuthorizedOwnerEmail(
  email: string | null | undefined,
  emailVerified = true,
): boolean {
  if (!email || !emailVerified) return false;
  const candidate = email.trim().toLowerCase();
  const expected = getOwnerEmail();
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hashes a password with a 16-byte random salt using Node's scrypt KDF.
 */
export function hashPassword(password: string): string {
  if (password.length < 10 || password.length > 128) {
    throw new Error('Password must be between 10 and 128 characters.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifies a password against a stored `salt:hash` string in constant time.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.includes(':')) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex || expectedHex.length !== 128) return false;

  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateTotpSecret(ownerEmail: string): {
  secret: string;
  otpauthUrl: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: 'Alex Rivera CMS',
    label: ownerEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  return {
    secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTotpCode(secretBase32: string, code: string): boolean {
  if (!secretBase32 || !code) return false;
  const cleaned = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;

  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Alex Rivera CMS',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });
    const delta = totp.validate({ token: cleaned, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Strips HTML tags and control characters from plain-text fields to prevent XSS.
 */
export function sanitizePlainText(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates URLs to allow only safe HTTP(S), relative `/`, or mailto: links.
 * Rejects javascript:, data:, vbscript:, file:, and embedded credentials.
 */
export function sanitizeSafeUrl(
  rawUrl: string,
  options: { allowMailto?: boolean; allowRelative?: boolean } = {},
): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    throw new Error('Unsafe control characters in URL.');
  }

  if (options.allowRelative !== false && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (/[<>"'`\\]/.test(trimmed) || trimmed.includes('..')) {
      throw new Error('Unsafe relative URL.');
    }
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials are not allowed.');
  }

  const protocol = parsed.protocol.toLowerCase();
  const allowedProtocols = ['https:', 'http:'];
  if (options.allowMailto) {
    allowedProtocols.push('mailto:');
  }

  if (!allowedProtocols.includes(protocol)) {
    throw new Error(`Disallowed URL protocol: ${protocol}`);
  }

  return parsed.toString();
}

/**
 * Prevents Host-header poisoning when constructing canonical base URLs for robots.txt and sitemap.xml.
 */
export function sanitizeSafeBaseUrl(
  appUrl: string | undefined,
  hostHeader: string | undefined,
  protocol = 'https',
): string {
  if (appUrl && appUrl.startsWith('http')) {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // Fall through to validated hostHeader
    }
  }
  const safeProto = protocol === 'http' ? 'http' : 'https';
  const cleanHost = (hostHeader || '').trim().toLowerCase();
  if (/^[a-z0-9.-]+(:\d{1,5})?$/.test(cleanHost)) {
    return `${safeProto}://${cleanHost}`;
  }
  return 'http://localhost:3000';
}

export function hasEmailHeaderInjection(value: string): boolean {
  return /[\r\n]/.test(value);
}

export function validateContactSubmission(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  formLoadedAt?: number;
  nowMs?: number;
}): { ok: true; sanitized: { name: string; email: string; subject: string; message: string } } | { ok: false; reason: string; isSpam?: boolean } {
  // Honeypot field must remain empty
  if (payload.website && payload.website.trim().length > 0) {
    return { ok: false, reason: 'Automated submission rejected.', isSpam: true };
  }

  // Minimum human dwell check (at least 300ms between form render and submit)
  if (typeof payload.formLoadedAt === 'number' && Number.isFinite(payload.formLoadedAt)) {
    const now = payload.nowMs ?? Date.now();
    const elapsed = now - payload.formLoadedAt;
    if (elapsed >= 0 && elapsed < 300) {
      return { ok: false, reason: 'Submission sent too quickly. Please review and try again.', isSpam: true };
    }
  }

  if (
    hasEmailHeaderInjection(payload.name) ||
    hasEmailHeaderInjection(payload.email) ||
    hasEmailHeaderInjection(payload.subject)
  ) {
    return { ok: false, reason: 'Invalid characters detected in header fields.' };
  }

  const name = sanitizePlainText(payload.name, 120);
  const email = payload.email.trim().toLowerCase().slice(0, 254);
  const subject = sanitizePlainText(payload.subject, 200);
  const message = sanitizePlainText(payload.message, 4000);

  if (name.length < 2) {
    return { ok: false, reason: 'Please enter your name (at least 2 characters).' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { ok: false, reason: 'Please provide a valid email address.' };
  }

  if (subject.length < 2) {
    return { ok: false, reason: 'Please enter a subject (at least 2 characters).' };
  }

  if (message.length < 3) {
    return { ok: false, reason: 'Please write a message of at least 3 characters.' };
  }

  // Reject excessive link spam (> 4 URLs in a contact message)
  const urlMatches = message.match(/https?:\/\//gi);
  if (urlMatches && urlMatches.length > 4) {
    return { ok: false, reason: 'Message contains too many external links.', isSpam: true };
  }

  return {
    ok: true,
    sanitized: { name, email, subject, message },
  };
}

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

/**
 * Inspects actual file magic bytes rather than trusting client-supplied MIME types or extensions.
 */
export function detectFileSignature(buffer: Buffer): {
  valid: boolean;
  mimeType?: AllowedMimeType;
  extension?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png', extension: 'png' };
  }

  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, mimeType: 'image/webp', extension: 'webp' };
  }

  // PDF: %PDF-
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { valid: true, mimeType: 'application/pdf', extension: 'pdf' };
  }

  return { valid: false };
}

export function isSafeStoredFilename(filename: string): boolean {
  return /^[a-f0-9-]{16,64}\.(jpg|png|webp|pdf)$/i.test(filename) && !filename.includes('..');
}

export function isSafePublicPdfAssetFilename(filename: string): boolean {
  return (
    /^[a-zA-Z0-9_-]{3,120}\.pdf$/i.test(filename) &&
    !filename.includes('..') &&
    !filename.includes('/') &&
    !filename.includes('\\')
  );
}

/**
 * Validates same-origin / reverse-proxy forwarded host / Cloud Run preview twin origins
 * while blocking cross-site CSRF requests.
 */
export function isAllowedSameSiteOrigin(params: {
  origin?: string;
  host?: string;
  forwardedHost?: string;
  appUrl?: string;
  hasCustomHeader?: boolean;
}): boolean {
  const { origin, host, forwardedHost, appUrl, hasCustomHeader } = params;
  if (!origin) {
    return Boolean(hasCustomHeader);
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const originHost = originUrl.host.toLowerCase();
  const normalizedHost = (host || '').trim().toLowerCase();
  const normalizedForwardedHost = (forwardedHost || '').split(',')[0].trim().toLowerCase();

  if (normalizedHost && originHost === normalizedHost) {
    return true;
  }
  if (normalizedForwardedHost && originHost === normalizedForwardedHost) {
    return true;
  }

  if (appUrl && appUrl.startsWith('http')) {
    try {
      const appHost = new URL(appUrl).host.toLowerCase();
      if (originHost === appHost) {
        return true;
      }
      // Allow matching Cloud Run preview sibling (-dev- vs -pre-) for the same applet deployment
      const devSibling = appHost.replace(/^ais-pre-/, 'ais-dev-');
      const preSibling = appHost.replace(/^ais-dev-/, 'ais-pre-');
      if (originHost === devSibling || originHost === preSibling) {
        return true;
      }
    } catch {
      // Ignore malformed APP_URL
    }
  }

  return false;
}
