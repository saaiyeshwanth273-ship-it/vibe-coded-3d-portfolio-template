import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectFileSignature,
  generateTotpSecret,
  getOwnerEmail,
  hasEmailHeaderInjection,
  hashPassword,
  isAllowedSameSiteOrigin,
  isAuthorizedOwnerEmail,
  isSafePublicPdfAssetFilename,
  isSafeStoredFilename,
  sanitizePlainText,
  sanitizeSafeBaseUrl,
  sanitizeSafeUrl,
  validateContactSubmission,
  verifyPassword,
  verifyTotpCode,
} from './security';
import { getClientIp } from './rateLimit';
import { buildVerifiedResumePdf } from './resumeGenerator';
import {
  ensureSanitizedGitRepoOnDisk,
  scrubContentForTemplate,
} from './templateRepoBuilder';
import { projectSchema } from './validation';
import fs from 'node:fs';

test('scrypt password hashing verifies correct passwords and rejects wrong passwords', () => {
  const hash = hashPassword('NexusRAG-Owner-2026!');
  assert.ok(hash.includes(':'));
  assert.equal(verifyPassword('NexusRAG-Owner-2026!', hash), true);
  assert.equal(verifyPassword('WrongPassword123', hash), false);
  assert.equal(verifyPassword('', hash), false);
  assert.equal(verifyPassword('NexusRAG-Owner-2026!', 'malformed'), false);
});

test('owner email authorization enforces exact designated owner and verified status', () => {
  const owner = getOwnerEmail();
  assert.equal(owner, 'alex.rivera@example.com');
  assert.equal(isAuthorizedOwnerEmail('alex.rivera@example.com', true), true);
  assert.equal(isAuthorizedOwnerEmail('alex.rivera@example.com', false), false);
  assert.equal(isAuthorizedOwnerEmail('intruder@gmail.com', true), false);
  assert.equal(isAuthorizedOwnerEmail(undefined, true), false);
});

test('TOTP 2FA secret generation and code verification work with valid tokens and reject bad tokens', () => {
  const setup = generateTotpSecret('alex.rivera@example.com');
  assert.ok(setup.secret.length >= 16);
  assert.ok(setup.otpauthUrl.startsWith('otpauth://totp/'));
  assert.equal(verifyTotpCode(setup.secret, '000000-invalid'), false);
  assert.equal(verifyTotpCode(setup.secret, '12345'), false);
});

test('XSS, dangerous URL schemes, embedded URL credentials, Host header injection, and IP spoofing are neutralized', () => {
  const clean = sanitizePlainText('<script>alert(1)</script>Hello\u0000World', 100);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('\u0000'), false);
  assert.ok(clean.includes('HelloWorld'));

  assert.equal(
    sanitizeSafeUrl('https://github.com/your-username/nexusrag-engine'),
    'https://github.com/your-username/nexusrag-engine',
  );
  assert.equal(sanitizeSafeUrl('/api/uploads/123.png'), '/api/uploads/123.png');
  assert.throws(() => sanitizeSafeUrl('javascript:alert(1)'), /Disallowed URL protocol/);
  assert.throws(() => sanitizeSafeUrl('data:text/html,<script>alert(1)</script>'), /Disallowed URL protocol/);
  assert.throws(() => sanitizeSafeUrl('vbscript:msgbox(1)'), /Disallowed URL protocol/);
  assert.throws(
    () => sanitizeSafeUrl('https://admin:secret@evil.example.com/phish'),
    /embedded credentials/,
  );

  // Host header poisoning guard
  assert.equal(
    sanitizeSafeBaseUrl('', 'evil.com/injected\r\nSet-Cookie: bad=1', 'https'),
    'http://localhost:3000',
  );
  assert.equal(
    sanitizeSafeBaseUrl('', 'saai-portfolio.run.app', 'https'),
    'https://saai-portfolio.run.app',
  );

  // Client IP extraction prefers Express trusted req.ip over spoofed X-Forwarded-For first hop
  const fakeReq = {
    ip: '203.0.113.50',
    headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.50' },
  } as never;
  assert.equal(getClientIp(fakeReq), '203.0.113.50');
});

test('magic-byte file signature inspector allows genuine PNG/JPEG/PDF and rejects disguised HTML/scripts', () => {
  const validPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const validJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  ]);
  const validPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n', 'utf8');
  const disguisedScript = Buffer.from('<html><script>alert(1)</script></html>', 'utf8');

  assert.equal(detectFileSignature(validPng).extension, 'png');
  assert.equal(detectFileSignature(validJpeg).extension, 'jpg');
  assert.equal(detectFileSignature(validPdf).extension, 'pdf');
  assert.equal(detectFileSignature(disguisedScript).valid, false);
});

test('stored filename path-traversal check rejects directory traversal payloads', () => {
  assert.equal(isSafeStoredFilename('a1b2c3d4e5f67890.png'), true);
  assert.equal(isSafeStoredFilename('../server.ts'), false);
  assert.equal(isSafeStoredFilename('../../etc/passwd.png'), false);
  assert.equal(isSafeStoredFilename('a1b2c3d4e5f67890.exe'), false);
  assert.equal(isSafePublicPdfAssetFilename('Alex_Rivera_resume_8bdab9ad.pdf'), true);
  assert.equal(isSafePublicPdfAssetFilename('../Alex_Rivera_resume_8bdab9ad.pdf'), false);
  assert.equal(isSafePublicPdfAssetFilename('dir/Alex_Rivera_resume_8bdab9ad.pdf'), false);
  assert.equal(isSafePublicPdfAssetFilename('malicious.exe'), false);
});

test('proxy-aware same-site origin validator permits same host, forwarded host, and preview sibling while blocking cross-site origins', () => {
  assert.equal(
    isAllowedSameSiteOrigin({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
    }),
    true,
  );
  assert.equal(
    isAllowedSameSiteOrigin({
      origin: 'https://ais-pre-abc-123.asia-east1.run.app',
      host: 'localhost:3000',
      appUrl: 'https://ais-dev-abc-123.asia-east1.run.app',
    }),
    true,
  );
  assert.equal(
    isAllowedSameSiteOrigin({
      origin: 'https://custom.proxy.example.com',
      host: 'localhost:3000',
      forwardedHost: 'custom.proxy.example.com',
    }),
    true,
  );
  assert.equal(
    isAllowedSameSiteOrigin({
      origin: 'https://evil-attacker.example.com',
      host: 'localhost:3000',
      appUrl: 'https://ais-dev-abc-123.asia-east1.run.app',
    }),
    false,
  );
});

test('contact form validation blocks honeypot bots, sub-second submissions, header injection, and link spam', () => {
  const valid = validateContactSubmission({
    name: 'Aarav Rao',
    email: 'aarav@example.com',
    subject: 'NexusRAG Architecture Inquiry',
    message: 'Hello Saai, I read your NexusRAG hybrid retrieval notes and would love to connect.',
    website: '',
    formLoadedAt: Date.now() - 5000,
  });
  assert.equal(valid.ok, true);

  const botHoneypot = validateContactSubmission({
    name: 'Bot',
    email: 'bot@spam.com',
    subject: 'Offer',
    message: 'Click this link right now please!',
    website: 'https://spam.example.com',
    formLoadedAt: Date.now() - 5000,
  });
  assert.equal(botHoneypot.ok, false);

  const fastBot = validateContactSubmission({
    name: 'Fast Bot',
    email: 'bot@spam.com',
    subject: 'Instant',
    message: 'Submitted too fast for a human visitor.',
    website: '',
    formLoadedAt: Date.now() - 100,
  });
  assert.equal(fastBot.ok, false);

  assert.equal(hasEmailHeaderInjection('user@test.com\r\nBcc: victim@test.com'), true);

  const spamLinks = validateContactSubmission({
    name: 'Link Spammer',
    email: 'spam@example.com',
    subject: 'Links',
    message: 'Visit https://a.com https://b.com https://c.com https://d.com https://e.com right now!',
    website: '',
    formLoadedAt: Date.now() - 5000,
  });
  assert.equal(spamLinks.ok, false);
});

test('Zod strict schema rejects unknown mass-assignment fields like isAdmin or ownerId', () => {
  const badPayload = projectSchema.safeParse({
    slug: 'test-project',
    title: 'Test Project',
    category: 'AI',
    description: 'Valid description text',
    isAdmin: true,
    ownerId: 1,
  });
  assert.equal(badPayload.success, false);
});

test('verified PDF resume generator produces a valid PDF 1.4 buffer with authentic profile details', () => {
  const pdf = buildVerifiedResumePdf({
    fullName: 'Alex Rivera',
    subheading: 'AI Enthusiast | Prompt Engineer | Developer',
    education: 'B.Tech Computer Science, Specialization in AI/ML',
    specialization: 'AI/ML',
    university: 'Metropolitan Institute of Technology',
    institution: 'School of Computing & AI',
    contactEmail: 'alex.rivera@example.com',
    showEmailPublicly: true,
    skills: [{ name: 'Python', category: 'Programming Languages' }],
    projects: [
      {
        title: 'NexusRAG',
        tagline: 'Complex regulations in. Clear actions out.',
        description: 'Hybrid RAG compliance assistant using Gemma reasoning.',
        techStack: ['Python', 'Gemma', 'BM25'],
        githubUrl: 'https://github.com/your-username/nexusrag-engine',
      },
    ],
    achievements: [
      {
        title: 'School of Computing & AI Bootcamp — Performance Medal',
        eventOrIssuer: 'School of Computing & AI',
        description: 'Awarded Performance Medal during School of Computing & AI Bootcamp.',
      },
    ],
    leadership: [
      {
        position: 'Vice President',
        organization: 'University Engineering Council',
        description: 'Serving as Vice President of the student council.',
      },
    ],
    experiences: [
      {
        position: 'Intern',
        organization: 'Acme AI Labs',
        startDate: '',
        description: 'Currently interning at Acme AI Labs.',
      },
    ],
  });

  const header = pdf.subarray(0, 8).toString('utf8');
  assert.equal(header, '%PDF-1.4');
  const fullText = pdf.toString('utf8');
  assert.ok(fullText.includes('Alex Rivera'));
  assert.ok(fullText.includes('NexusRAG'));
  assert.ok(fullText.includes('/Subtype /Link'));
  assert.ok(fullText.includes('/URI (mailto:alex.rivera@example.com)'));
  assert.ok(fullText.includes('/URI (https://www.linkedin.com/in/alex-rivera-dev)'));
  assert.ok(fullText.includes('/URI (https://github.com/your-username)'));
  assert.ok(fullText.includes('/URI (https://github.com/your-username/nexusrag-engine)'));
});

test('open-source template repository builder scrubs all API keys, secret tokens, and personal details', () => {
  const sampleRaw = `
    const apiKey = "YOUR_FIREBASE_WEB_API_KEY";
    const oauthId = "000000000000-yourclientid.apps.googleusercontent.com";
    const ghPat = "YOUR_GITHUB_TOKEN";
    const owner = "Alex Rivera <alex.rivera@example.com> from San Francisco, CA at Metropolitan Institute of Technology & School of Computing & AI";
  `;
  const scrubbed = scrubContentForTemplate('src/example.ts', sampleRaw);
  assert.equal(scrubbed.includes('AIzaSyDsgPbEdb'), false);
  assert.equal(scrubbed.includes('623709580732-61akergcff9qrsr4on97kr30uuhi55lq'), false);
  assert.equal(scrubbed.includes('ghp_1234567890'), false);
  assert.equal(scrubbed.includes('Alex Rivera'), false);
  assert.equal(scrubbed.includes('your-username'), false);
  assert.equal(scrubbed.includes('Erode'), false);
  assert.equal(scrubbed.includes('Metropolitan Institute of Technology'), false);
  assert.ok(scrubbed.includes('Alex Rivera'));
  assert.ok(scrubbed.includes('alex.rivera@example.com'));

  const bundle = ensureSanitizedGitRepoOnDisk(process.cwd());
  assert.equal(bundle.audit.passed, true);
  assert.equal(bundle.audit.apiKeysFound, 0);
  assert.equal(bundle.audit.secretsFound, 0);
  assert.equal(bundle.audit.personalDetailsFound, 0);
  assert.ok(bundle.files.length >= 25);
  assert.ok(bundle.commitHash.length >= 4);
  assert.equal(fs.existsSync(bundle.tarballPath), true);
});

