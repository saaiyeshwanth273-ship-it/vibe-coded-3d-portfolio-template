import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { eq, ne } from 'drizzle-orm';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { withDbContext } from './src/db/rls.ts';
import {
  adminSessions,
  contactMessages,
  passwordResetTokens,
  profileSettings,
  securitySettings,
  seoSettings,
  themeSettings,
  uploadedAssets,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  AuthenticatedRequest,
  SESSION_COOKIE_NAME,
  createOwnerSession,
  requireOwnerAuth,
  requireSameOrigin,
  resolveOwnerFromRequest,
  revokeSessionByCookie,
} from './src/server/authMiddleware.ts';
import {
  ResourceKey,
  createResourceItem,
  deleteResourceItem,
  getAdminOverview,
  getPublicPortfolio,
  getPublicProjectBySlug,
  isValidResourceKey,
  recordAuditLog,
  reorderResourceItems,
  togglePublishResourceItem,
  updateResourceItem,
} from './src/server/portfolioService.ts';
import { createRateLimiter, getClientIp, hashIp } from './src/server/rateLimit.ts';
import { sendOwnerContactEmail } from './src/server/mailer.ts';
import { buildVerifiedResumePdf } from './src/server/resumeGenerator.ts';
import {
  checkRemoteGithubRepoLive,
  ensureSanitizedGitRepoOnDisk,
  publishSanitizedTemplateToGitHub,
  startOrGetGithubDeviceFlow,
} from './src/server/templateRepoBuilder.ts';
import {
  detectFileSignature,
  generateSecureToken,
  generateTotpSecret,
  getOwnerEmail,
  hashPassword,
  isAuthorizedOwnerEmail,
  isSafeStoredFilename,
  sanitizePlainText,
  sanitizeSafeBaseUrl,
  sha256Hex,
  validateContactSubmission,
  verifyPassword,
  verifyTotpCode,
} from './src/server/security.ts';
import {
  aboutThemeSchema,
  achievementSchema,
  aiCategorySchema,
  aiModelSchema,
  certificationSchema,
  experienceSchema,
  exploringItemSchema,
  leadershipRoleSchema,
  messageStatusSchema,
  profileUpdateSchema,
  projectSchema,
  publishToggleSchema,
  reorderSchema,
  securityUpdateSchema,
  seoSettingsSchema,
  skillSchema,
  socialLinkSchema,
  themeSettingsSchema,
  timelineEventSchema,
} from './src/server/validation.ts';

dotenv.config();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB strict limit
    files: 1,
  },
});

const RESOURCE_SCHEMAS: Record<ResourceKey, typeof aboutThemeSchema> = {
  about_themes: aboutThemeSchema as never,
  exploring_items: exploringItemSchema as never,
  skills: skillSchema as never,
  ai_categories: aiCategorySchema as never,
  ai_models: aiModelSchema as never,
  projects: projectSchema as never,
  achievements: achievementSchema as never,
  leadership_roles: leadershipRoleSchema as never,
  experiences: experienceSchema as never,
  certifications: certificationSchema as never,
  timeline_events: timelineEventSchema as never,
  social_links: socialLinkSchema as never,
};

let dynamicContactLimit = 5;

function escapeHtmlAttr(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      frameguard: false,
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://apis.google.com',
            'https://www.gstatic.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com'],
          connectSrc: [
            "'self'",
            'https://identitytoolkit.googleapis.com',
            'https://securetoken.googleapis.com',
            'https://www.googleapis.com',
            'ws:',
            'wss:',
          ],
          frameSrc: [
            "'self'",
            'https://your-firebase-project-id.firebaseapp.com',
            'https://accounts.google.com',
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'", 'https://aistudio.google.com', 'https://*.google.com'],
        },
      },
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());

  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 12,
    keyPrefix: 'auth',
  });

  const contactRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: () => dynamicContactLimit,
    keyPrefix: 'contact',
  });

  const adminRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 240,
    keyPrefix: 'admin',
  });

  const publicReadRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120,
    keyPrefix: 'pub_read',
  });

  const resumeDownloadRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'resume_dl',
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // SEO robots.txt — explicitly disallows private CMS and API endpoints
  app.get('/robots.txt', (req, res) => {
    const baseUrl = sanitizeSafeBaseUrl(process.env.APP_URL, req.get('host'), req.protocol);
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/login',
        'Disallow: /api/',
        `Sitemap: ${baseUrl}/sitemap.xml`,
      ].join('\n'),
    );
  });

  // Dynamic SEO sitemap.xml
  app.get('/sitemap.xml', publicReadRateLimiter, async (req, res) => {
    try {
      const portfolio = await getPublicPortfolio();
      const baseUrl = sanitizeSafeBaseUrl(process.env.APP_URL, req.get('host'), req.protocol);

      const urls = [
        `${baseUrl}/`,
        ...portfolio.projects.map((p) => `${baseUrl}/projects/${encodeURIComponent(p.slug)}`),
      ];

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          (u) =>
            `  <url><loc>${escapeHtmlAttr(u)}</loc><changefreq>weekly</changefreq><priority>${
              u === `${baseUrl}/` ? '1.0' : '0.8'
            }</priority></url>`,
        ),
        '</urlset>',
      ].join('\n');

      res.type('application/xml').send(xml);
    } catch {
      res.status(500).type('text/plain').send('Error generating sitemap');
    }
  });

  // Public portfolio data (RLS enforced: published records only, private tables excluded)
  app.get('/api/portfolio', publicReadRateLimiter, async (_req, res) => {
    try {
      const data = await getPublicPortfolio();
      res.setHeader('Cache-Control', 'no-store');
      res.json(data);
    } catch (err) {
      console.error('Failed to load public portfolio:', err);
      res.status(500).json({ error: 'Unable to load portfolio content.' });
    }
  });

  // Public project detail endpoint
  app.get('/api/projects/:slug', publicReadRateLimiter, async (req, res) => {
    try {
      const slug = sanitizePlainText(String(req.params.slug || ''), 100).toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Invalid project identifier.' });
      }
      const project = await getPublicProjectBySlug(slug);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.json(project);
    } catch (err) {
      console.error('Failed to load project detail:', err);
      res.status(500).json({ error: 'Unable to load project details.' });
    }
  });

  // Public Resume PDF Download
  app.get('/api/resume/download', resumeDownloadRateLimiter, async (req, res) => {
    try {
      const portfolio = await getPublicPortfolio();
      const profile = portfolio.profile;
      if (!profile || !profile.resumeEnabled) {
        return res.status(404).json({ error: 'Resume download is currently unavailable.' });
      }

      const dispositionType = req.query.inline === '1' ? 'inline' : 'attachment';
      const safeDownloadName = sanitizePlainText(
        profile.resumeFilename || 'Alex_Rivera_Resume.pdf',
        100,
      ).replace(/[^a-zA-Z0-9._-]/g, '_');

      // If owner uploaded a custom PDF asset, serve it securely
      if (profile.resumeUrl && profile.resumeUrl.startsWith('/api/uploads/')) {
        const storedName = profile.resumeUrl.replace('/api/uploads/', '');
        if (isSafeStoredFilename(storedName) && storedName.endsWith('.pdf')) {
          const fullPath = path.join(UPLOADS_DIR, storedName);
          if (fs.existsSync(fullPath)) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader(
              'Content-Disposition',
              `${dispositionType}; filename="${safeDownloadName}"`,
            );
            return fs.createReadStream(fullPath).pipe(res);
          }
        }
      }

      // Generate a full-portfolio PDF 1.4 resume from verified database records
      const pdfBuffer = buildVerifiedResumePdf({
        fullName: profile.fullName,
        subheading: profile.subheading,
        education: profile.education,
        specialization: profile.specialization,
        university: profile.university,
        institution: profile.institution,
        contactEmail: profile.contactEmail,
        showEmailPublicly: profile.showEmailPublicly,
        brandStatement: profile.brandStatement,
        shortIntro: profile.shortIntro,
        careerDirection: profile.careerDirection,
        currentInterests: profile.currentInterests,
        aboutThemes: portfolio.aboutThemes.map((t) => ({
          title: t.title,
          subtitle: t.subtitle,
          narrative: t.narrative,
        })),
        exploringItems: portfolio.exploringItems.map((e) => ({
          title: e.title,
          category: e.category,
          summary: e.summary,
        })),
        skills: portfolio.skills.map((s) => ({ name: s.name, category: s.category })),
        aiCategories: portfolio.aiCategories.map((c) => ({ name: c.name })),
        aiModels: portfolio.aiModels.map((m) => ({
          name: m.name,
          providerOrFamily: m.providerOrFamily,
          experienceLevel: m.experienceLevel,
        })),
        projects: portfolio.projects.map((p) => ({
          title: p.title,
          tagline: p.tagline,
          category: p.category,
          status: p.status,
          developmentDate: p.developmentDate,
          description: p.description,
          solution: p.solution,
          features: p.features,
          techStack: p.techStack,
          aiModelsUsed: p.aiModelsUsed,
          githubUrl: p.githubUrl,
        })),
        achievements: portfolio.achievements.map((a) => ({
          title: a.title,
          eventOrIssuer: a.eventOrIssuer,
          teamContext: a.teamContext,
          description: a.description,
        })),
        leadership: portfolio.leadershipRoles.map((l) => ({
          position: l.position,
          organization: l.organization,
          startDate: l.startDate,
          endDate: l.endDate,
          description: l.description,
        })),
        experiences: portfolio.experiences.map((e) => ({
          position: e.position,
          organization: e.organization,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description,
          skillsUsed: e.skillsUsed,
        })),
        certifications: portfolio.certifications.map((c) => ({
          title: c.title,
          issuer: c.issuer,
          issueDate: c.issueDate,
          skillsCovered: c.skillsCovered,
        })),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(pdfBuffer.length));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Disposition', `${dispositionType}; filename="${safeDownloadName}"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('Resume download failed:', err);
      return res.status(500).json({ error: 'Unable to generate resume PDF.' });
    }
  });

  // ==========================================================================
  // SANITIZED OPEN-SOURCE PORTFOLIO TEMPLATE REPOSITORY ENDPOINTS
  // ==========================================================================
  const templateActionRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 25,
    keyPrefix: 'template-action',
  });

  // 1. Inspect Sanitized Template Repository Manifest & Security Audit
  app.get('/api/template/manifest', publicReadRateLimiter, async (_req, res) => {
    try {
      const workspaceRoot = process.cwd();
      const { commitHash, files, audit } = ensureSanitizedGitRepoOnDisk(workspaceRoot);
      const remoteStatus = await checkRemoteGithubRepoLive();
      const readmeFile = files.find((f) => f.relativePath === 'README.md');
      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        repoName: 'vibe-coded-3d-portfolio-template',
        defaultGithubUrl: remoteStatus.htmlUrl,
        remoteGithubLive: remoteStatus.live,
        description:
          'Open-source interactive 3D circuit command hub and full-stack developer portfolio template (zero secrets, zero personal details).',
        isTemplateReady: audit.passed,
        gitInitialized: true,
        commitHash,
        audit,
        readmeContent: readmeFile ? readmeFile.content : '',
        files: files.map((f) => ({
          path: f.relativePath,
          sizeBytes: f.sizeBytes,
        })),
      });
    } catch (err) {
      console.error('Failed to build template manifest:', err);
      return res.status(500).json({ error: 'Unable to build sanitized template manifest.' });
    }
  });

  // 1b. Read Sanitized Template File Content
  app.get('/api/template/file', publicReadRateLimiter, (req, res) => {
    try {
      const requestedPath =
        typeof req.query?.path === 'string' ? req.query.path.trim() : 'README.md';
      const workspaceRoot = process.cwd();
      const { files } = ensureSanitizedGitRepoOnDisk(workspaceRoot);
      const match = files.find((f) => f.relativePath === requestedPath);
      if (!match) {
        return res.status(404).json({ error: 'File not found in sanitized template repository.' });
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        path: match.relativePath,
        sizeBytes: match.sizeBytes,
        content: match.content,
      });
    } catch (err) {
      console.error('Failed to read template file:', err);
      return res.status(500).json({ error: 'Unable to read sanitized template file.' });
    }
  });

  // 2. Download Sanitized Template Git Repository Archive (.tar.gz)
  app.get('/api/template/download-bundle', templateActionRateLimiter, (_req, res) => {
    try {
      const workspaceRoot = process.cwd();
      const { tarballPath, audit } = ensureSanitizedGitRepoOnDisk(workspaceRoot);
      if (!audit.passed || !fs.existsSync(tarballPath)) {
        return res.status(500).json({ error: 'Sanitized template bundle failed security audit.' });
      }
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="vibe-coded-3d-portfolio-template.tar.gz"',
      );
      return fs.createReadStream(tarballPath).pipe(res);
    } catch (err) {
      console.error('Template bundle download failed:', err);
      return res.status(500).json({ error: 'Unable to download template repository archive.' });
    }
  });

  // 3. GitHub OAuth Device Flow Auto-Publisher (1-Click Authorization without manual token creation)
  app.get('/api/template/device-flow', publicReadRateLimiter, async (req, res) => {
    try {
      const forceNew = req.query?.refresh === '1';
      const flow = await startOrGetGithubDeviceFlow(process.cwd(), forceNew);
      res.setHeader('Cache-Control', 'no-store');
      return res.json(flow);
    } catch (err: any) {
      console.error('Device flow check failed:', err);
      return res.status(500).json({
        error: err?.message || 'Unable to initialize GitHub Device Authorization.',
      });
    }
  });

  // 4. One-Click Publish Sanitized Template Repository to GitHub
  app.post(
    '/api/template/publish-github',
    requireSameOrigin,
    templateActionRateLimiter,
    async (req, res) => {
      try {
        const rawToken =
          typeof req.body?.githubToken === 'string'
            ? req.body.githubToken.trim()
            : process.env.GITHUB_TOKEN || '';
        const rawRepoName =
          typeof req.body?.repoName === 'string' && req.body.repoName.trim()
            ? sanitizePlainText(req.body.repoName.trim(), 80)
            : 'vibe-coded-3d-portfolio-template';

        if (!rawToken || rawToken.length < 10 || rawToken.length > 256) {
          return res.status(400).json({
            error:
              'Please provide a valid GitHub Personal Access Token (with repo or public_repo scope) to push the sanitized template to your GitHub account.',
          });
        }

        const result = await publishSanitizedTemplateToGitHub({
          workspaceRoot: process.cwd(),
          githubToken: rawToken,
          repoName: rawRepoName,
          isPrivate: false,
        });

        return res.json({
          ok: true,
          htmlUrl: result.htmlUrl,
          fullName: result.fullName,
          filesCommitted: result.filesCommitted,
          commitSha: result.commitSha,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to publish template to GitHub.';
        return res.status(400).json({ error: sanitizePlainText(msg, 300) });
      }
    },
  );

  // Safe uploaded asset delivery endpoint
  app.get('/api/uploads/:filename', publicReadRateLimiter, (req, res) => {
    const filename = String(req.params.filename || '');
    if (!isSafeStoredFilename(filename)) {
      return res.status(400).json({ error: 'Invalid asset filename.' });
    }

    const fullPath = path.resolve(UPLOADS_DIR, filename);
    if (!fullPath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (filename.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
    return res.sendFile(fullPath);
  });

  // Public Contact Form Endpoint (Rate-limited, Honeypot, Timing Check, Header Injection & XSS Guard)
  app.post('/api/contact', requireSameOrigin, contactRateLimiter, async (req, res) => {
    try {
      await ensureSeeded();
      const body = req.body || {};
      const validation = validateContactSubmission({
        name: String(body.name ?? ''),
        email: String(body.email ?? ''),
        subject: String(body.subject ?? ''),
        message: String(body.message ?? ''),
        website: typeof body.website === 'string' ? body.website : '',
        formLoadedAt: typeof body.formLoadedAt === 'number' ? body.formLoadedAt : undefined,
      });

      if (!validation.ok) {
        return res.status(400).json({ error: validation.reason });
      }

      const ipHash = hashIp(getClientIp(req));
      const ownerRecipient = await withDbContext({ role: 'public' }, async (tx) => {
        await tx.insert(contactMessages).values({
          senderName: validation.sanitized.name,
          senderEmail: validation.sanitized.email,
          subject: validation.sanitized.subject,
          message: validation.sanitized.message,
          status: 'unread',
          ipHash,
        });
        const profRows = await tx
          .select({ contactEmail: profileSettings.contactEmail })
          .from(profileSettings)
          .limit(1);
        return profRows[0]?.contactEmail?.trim() || getOwnerEmail();
      });

      const mailResult = await sendOwnerContactEmail({
        to: ownerRecipient,
        senderName: validation.sanitized.name,
        senderEmail: validation.sanitized.email,
        subject: validation.sanitized.subject,
        message: validation.sanitized.message,
      });

      return res.status(201).json({
        ok: true,
        emailSent: mailResult.sent,
        deliveryProvider: mailResult.provider,
        message: mailResult.sent
          ? `Thank you for reaching out. Your message has been emailed to ${ownerRecipient} and saved to the portfolio inbox.`
          : `Your message has been saved to ${ownerRecipient}'s portfolio inbox. Automated server email forwarding is awaiting SMTP or Resend credentials — you can also send directly via your email app below.`,
      });
    } catch (err) {
      console.error('Contact form submission failed:', err);
      return res.status(500).json({ error: 'Unable to submit your message right now.' });
    }
  });

  // Auth Session Inspection
  app.get('/api/auth/session', publicReadRateLimiter, async (req, res) => {
    try {
      await ensureSeeded();
      const owner = await resolveOwnerFromRequest(req);
      const ownerEmail = getOwnerEmail();

      const secInfo = await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
        const rows = await tx.select().from(securitySettings).limit(1);
        return rows[0];
      });

      const hasPasswordConfigured = Boolean(
        secInfo?.passwordHash || process.env.OWNER_PASSWORD_HASH,
      );

      if (!owner) {
        return res.json({
          authenticated: false,
          hasPasswordConfigured,
          totpEnabled: Boolean(secInfo?.totpEnabled),
        });
      }

      return res.json({
        authenticated: true,
        email: owner.email,
        authProvider: owner.authProvider,
        hasPasswordConfigured,
        totpEnabled: Boolean(secInfo?.totpEnabled),
      });
    } catch (err) {
      console.error('Session status check failed:', err);
      return res.status(500).json({ error: 'Unable to check session status.' });
    }
  });

  // Owner Sign-In (supports Firebase Google ID Token OR Server-Verified Email/Password + optional TOTP)
  app.post('/api/auth/session', requireSameOrigin, authRateLimiter, async (req, res) => {
    try {
      await ensureSeeded();
      const body = req.body || {};
      const ownerEmail = getOwnerEmail();
      const ipHash = hashIp(getClientIp(req));
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 240);

      const secInfo = await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
        const rows = await tx.select().from(securitySettings).limit(1);
        return rows[0];
      });
      const ttlHours = secInfo?.sessionTtlHours || 24;

      // Flow 1: Firebase Google OAuth ID Token
      if (typeof body.idToken === 'string' && body.idToken.trim().length > 0) {
        let decoded;
        try {
          decoded = await adminAuth.verifyIdToken(body.idToken.trim());
        } catch {
          return res.status(401).json({ error: 'Invalid or expired authentication token.' });
        }

        if (!isAuthorizedOwnerEmail(decoded.email, decoded.email_verified === true)) {
          return res.status(403).json({
            error: 'Access denied. This CMS is restricted exclusively to the designated portfolio owner.',
          });
        }

        if (secInfo?.totpEnabled && secInfo.totpSecret) {
          const totpCode = typeof body.totpCode === 'string' ? body.totpCode : '';
          if (!totpCode) {
            return res.status(200).json({ requiresTotp: true });
          }
          if (!verifyTotpCode(secInfo.totpSecret, totpCode)) {
            return res.status(401).json({ error: 'Invalid 2FA verification code.' });
          }
        }

        const session = await createOwnerSession({
          email: ownerEmail,
          authProvider: 'google',
          userAgent,
          ipHash,
          ttlHours,
        });

        await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
          await recordAuditLog(tx, ownerEmail, 'LOGIN', 'auth', 'Owner signed in via Google Auth');
        });

        res.cookie(SESSION_COOKIE_NAME, session.cookieValue, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          expires: session.expiresAt,
          path: '/',
        });

        return res.json({
          authenticated: true,
          email: ownerEmail,
          authProvider: 'google',
        });
      }

      // Flow 2: Owner Email & Password Login
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      const totpCode = typeof body.totpCode === 'string' ? body.totpCode : '';

      const storedHash = secInfo?.passwordHash || process.env.OWNER_PASSWORD_HASH || '';
      if (!storedHash) {
        return res.status(400).json({
          error:
            'Password login is not configured yet. Sign in with your Google owner account first to set a CMS password in Security Settings.',
        });
      }

      // Constant-behavior check to prevent user enumeration
      const emailMatches = isAuthorizedOwnerEmail(email, true);
      const passwordValid = verifyPassword(password, storedHash);

      if (!emailMatches || !passwordValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      if (secInfo?.totpEnabled && secInfo.totpSecret) {
        if (!totpCode) {
          return res.status(200).json({ requiresTotp: true });
        }
        if (!verifyTotpCode(secInfo.totpSecret, totpCode)) {
          return res.status(401).json({ error: 'Invalid 2FA verification code.' });
        }
      }

      const session = await createOwnerSession({
        email: ownerEmail,
        authProvider: 'password',
        userAgent,
        ipHash,
        ttlHours,
      });

      await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
        await recordAuditLog(tx, ownerEmail, 'LOGIN', 'auth', 'Owner signed in via Password');
      });

      res.cookie(SESSION_COOKIE_NAME, session.cookieValue, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        expires: session.expiresAt,
        path: '/',
      });

      return res.json({
        authenticated: true,
        email: ownerEmail,
        authProvider: 'password',
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  // Owner Logout & Session Revocation
  app.delete('/api/auth/session', requireSameOrigin, async (req, res) => {
    try {
      const cookieVal = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
      await revokeSessionByCookie(cookieVal);
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      return res.json({ ok: true });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to end session.' });
    }
  });

  // Password Reset Request (anti-user-enumeration response)
  app.post('/api/auth/password-reset/request', requireSameOrigin, authRateLimiter, async (req, res) => {
    try {
      await ensureSeeded();
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const ownerEmail = getOwnerEmail();

      if (isAuthorizedOwnerEmail(email, true)) {
        const rawResetToken = generateSecureToken(24);
        const tokenHash = sha256Hex(rawResetToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
          await tx.insert(passwordResetTokens).values({
            tokenHash,
            ownerEmail,
            expiresAt,
          });
          await recordAuditLog(
            tx,
            ownerEmail,
            'PASSWORD_RESET_REQUEST',
            'auth',
            'Generated single-use password reset token',
          );
        });

        // Log securely on server console for local/CLI owner recovery without exposing in public HTTP response
        console.info(
          `[CMS Password Reset] Owner reset token issued (expires in 15m): ${rawResetToken}`,
        );
      }

      return res.json({
        ok: true,
        message:
          'If this email matches the designated owner account, a single-use password reset token has been issued.',
      });
    } catch (err) {
      console.error('Password reset request error:', err);
      return res.status(500).json({ error: 'Unable to process password reset request.' });
    }
  });

  // Password Reset Confirmation
  app.post('/api/auth/password-reset/confirm', requireSameOrigin, authRateLimiter, async (req, res) => {
    try {
      await ensureSeeded();
      const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      const ownerEmail = getOwnerEmail();

      if (!token || newPassword.length < 10 || newPassword.length > 128) {
        return res.status(400).json({
          error: 'Valid reset token and a new password (10–128 characters) are required.',
        });
      }

      const tokenHash = sha256Hex(token);
      const newHash = hashPassword(newPassword);

      const applied = await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
        const rows = await tx
          .select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.tokenHash, tokenHash))
          .limit(1);

        const record = rows[0];
        if (!record || record.usedAt || record.expiresAt <= new Date()) {
          return false;
        }

        await tx
          .update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordResetTokens.id, record.id));

        await tx
          .update(securitySettings)
          .set({ passwordHash: newHash, updatedAt: new Date() });

        // Revoke all existing sessions on password reset
        await tx.update(adminSessions).set({ isRevoked: true });

        await recordAuditLog(
          tx,
          ownerEmail,
          'PASSWORD_RESET_COMPLETE',
          'auth',
          'Owner password updated and existing sessions revoked',
        );
        return true;
      });

      if (!applied) {
        return res.status(400).json({ error: 'Invalid or expired password reset token.' });
      }

      return res.json({
        ok: true,
        message: 'Password updated successfully. Please sign in with your new credentials.',
      });
    } catch (err) {
      console.error('Password reset confirm error:', err);
      return res.status(500).json({ error: 'Unable to complete password reset.' });
    }
  });

  // ============================================================================
  // PRIVATE OWNER-ONLY CMS API ROUTES (/api/admin/*)
  // ============================================================================
  app.use('/api/admin', adminRateLimiter, requireSameOrigin, requireOwnerAuth);

  app.get('/api/admin/overview', async (req: AuthenticatedRequest, res) => {
    try {
      const data = await getAdminOverview(req.owner!.email);
      res.setHeader('Cache-Control', 'no-store');
      res.json(data);
    } catch (err) {
      console.error('Admin overview failed:', err);
      res.status(500).json({ error: 'Failed to load CMS workspace.' });
    }
  });

  app.put('/api/admin/profile', async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid profile data.',
        });
      }

      const { expectedVersion, ...fields } = parsed.data;
      const updated = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx.select().from(profileSettings).limit(1);
          const current = rows[0];
          if (!current) throw new Error('NOT_FOUND');
          if (typeof expectedVersion === 'number' && current.version !== expectedVersion) {
            throw new Error('CONFLICT_DETECTED');
          }
          const result = await tx
            .update(profileSettings)
            .set({
              ...fields,
              version: current.version + 1,
              updatedAt: new Date(),
            })
            .where(eq(profileSettings.id, current.id))
            .returning();

          await recordAuditLog(tx, req.owner!.email, 'UPDATE', 'profile_settings', 'Updated profile');
          return result[0];
        },
      );

      return res.json(updated);
    } catch (err: any) {
      if (err?.message === 'CONFLICT_DETECTED') {
        return res.status(409).json({
          error: 'Profile was modified elsewhere. Refresh to load the latest version.',
        });
      }
      console.error('Profile update failed:', err);
      return res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  app.put('/api/admin/seo', async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = seoSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid SEO settings.',
        });
      }

      const updated = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx.select().from(seoSettings).limit(1);
          const current = rows[0];
          if (!current) throw new Error('NOT_FOUND');
          const result = await tx
            .update(seoSettings)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(seoSettings.id, current.id))
            .returning();
          await recordAuditLog(tx, req.owner!.email, 'UPDATE', 'seo_settings', 'Updated SEO metadata');
          return result[0];
        },
      );

      return res.json(updated);
    } catch (err) {
      console.error('SEO update failed:', err);
      return res.status(500).json({ error: 'Failed to update SEO settings.' });
    }
  });

  app.put('/api/admin/theme', async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = themeSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid theme settings.',
        });
      }

      const updated = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx.select().from(themeSettings).limit(1);
          const current = rows[0];
          if (!current) throw new Error('NOT_FOUND');
          const result = await tx
            .update(themeSettings)
            .set({ ...parsed.data, updatedAt: new Date() })
            .where(eq(themeSettings.id, current.id))
            .returning();
          await recordAuditLog(
            tx,
            req.owner!.email,
            'UPDATE',
            'theme_settings',
            'Updated theme configuration',
          );
          return result[0];
        },
      );

      return res.json(updated);
    } catch (err) {
      console.error('Theme update failed:', err);
      return res.status(500).json({ error: 'Failed to update theme settings.' });
    }
  });

  app.post('/api/admin/security/totp-setup', async (req: AuthenticatedRequest, res) => {
    try {
      const setup = generateTotpSecret(req.owner!.email);
      await withDbContext({ role: 'owner', email: req.owner!.email }, async (tx) => {
        const rows = await tx.select().from(securitySettings).limit(1);
        if (rows[0]) {
          await tx
            .update(securitySettings)
            .set({ totpSecret: setup.secret, updatedAt: new Date() })
            .where(eq(securitySettings.id, rows[0].id));
        }
        await recordAuditLog(tx, req.owner!.email, 'TOTP_SETUP', 'security_settings', 'Generated 2FA secret');
      });

      return res.json({
        secret: setup.secret,
        otpauthUrl: setup.otpauthUrl,
      });
    } catch (err) {
      console.error('TOTP setup failed:', err);
      return res.status(500).json({ error: 'Failed to initialize 2FA setup.' });
    }
  });

  app.put('/api/admin/security', async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = securityUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid security configuration.',
        });
      }

      const { newPassword, totpAction, totpCode, sessionTtlHours, contactRateLimitPer15Min } =
        parsed.data;

      const updated = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx.select().from(securitySettings).limit(1);
          const current = rows[0];
          if (!current) throw new Error('NOT_FOUND');

          const patch: Record<string, unknown> = { updatedAt: new Date() };
          if (newPassword) {
            patch.passwordHash = hashPassword(newPassword);
            if (typeof req.owner?.sessionId === 'number') {
              await tx
                .update(adminSessions)
                .set({ isRevoked: true })
                .where(ne(adminSessions.id, req.owner.sessionId));
            } else {
              await tx.update(adminSessions).set({ isRevoked: true });
            }
          }

          if (totpAction === 'enable') {
            if (!current.totpSecret || !totpCode || !verifyTotpCode(current.totpSecret, totpCode)) {
              throw new Error('INVALID_TOTP');
            }
            patch.totpEnabled = true;
          } else if (totpAction === 'disable') {
            patch.totpEnabled = false;
            patch.totpSecret = '';
          }

          if (typeof sessionTtlHours === 'number') {
            patch.sessionTtlHours = sessionTtlHours;
          }
          if (typeof contactRateLimitPer15Min === 'number') {
            patch.contactRateLimitPer15Min = contactRateLimitPer15Min;
            dynamicContactLimit = contactRateLimitPer15Min;
          }

          const result = await tx
            .update(securitySettings)
            .set(patch as never)
            .where(eq(securitySettings.id, current.id))
            .returning();

          await recordAuditLog(
            tx,
            req.owner!.email,
            'UPDATE',
            'security_settings',
            'Updated CMS security configuration',
          );
          return result[0];
        },
      );

      return res.json({
        ownerEmail: updated.ownerEmail,
        hasPasswordConfigured: Boolean(updated.passwordHash || process.env.OWNER_PASSWORD_HASH),
        totpEnabled: updated.totpEnabled,
        sessionTtlHours: updated.sessionTtlHours,
        contactRateLimitPer15Min: updated.contactRateLimitPer15Min,
        updatedAt: updated.updatedAt,
      });
    } catch (err: any) {
      if (err?.message === 'INVALID_TOTP') {
        return res.status(400).json({
          error: 'Please generate a 2FA secret and enter a valid 6-digit authenticator code to enable 2FA.',
        });
      }
      console.error('Security update failed:', err);
      return res.status(500).json({ error: 'Failed to update security settings.' });
    }
  });

  app.delete('/api/admin/sessions/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid session ID.' });
      }

      await withDbContext({ role: 'owner', email: req.owner!.email }, async (tx) => {
        await tx
          .update(adminSessions)
          .set({ isRevoked: true })
          .where(eq(adminSessions.id, id));
        await recordAuditLog(tx, req.owner!.email, 'REVOKE_SESSION', 'admin_sessions', `Revoked session #${id}`);
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error('Session revoke failed:', err);
      return res.status(500).json({ error: 'Failed to revoke session.' });
    }
  });

  // Contact Messages Management
  app.patch('/api/admin/messages/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid message ID.' });
      }
      const parsed = messageStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid status value.' });
      }

      const updated = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx
            .update(contactMessages)
            .set({ status: parsed.data.status })
            .where(eq(contactMessages.id, id))
            .returning();
          if (!rows[0]) throw new Error('NOT_FOUND');
          await recordAuditLog(
            tx,
            req.owner!.email,
            'UPDATE',
            'contact_messages',
            `Marked message #${id} as ${parsed.data.status}`,
          );
          return rows[0];
        },
      );

      return res.json(updated);
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Message not found.' });
      }
      console.error('Message status update failed:', err);
      return res.status(500).json({ error: 'Failed to update message status.' });
    }
  });

  app.delete('/api/admin/messages/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid message ID.' });
      }

      await withDbContext({ role: 'owner', email: req.owner!.email }, async (tx) => {
        const rows = await tx
          .delete(contactMessages)
          .where(eq(contactMessages.id, id))
          .returning();
        if (!rows[0]) throw new Error('NOT_FOUND');
        await recordAuditLog(tx, req.owner!.email, 'DELETE', 'contact_messages', `Deleted message #${id}`);
      });

      return res.json({ ok: true });
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Message not found.' });
      }
      console.error('Message delete failed:', err);
      return res.status(500).json({ error: 'Failed to delete message.' });
    }
  });

  // File Upload Endpoint (Magic-byte verified: JPEG, PNG, WebP, PDF only; max 5MB)
  app.post(
    '/api/admin/upload',
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            error:
              err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
                ? 'File exceeds the 5 MB maximum size limit.'
                : 'Invalid file upload payload.',
          });
        }
        return next();
      });
    },
    async (req: AuthenticatedRequest, res) => {
    try {
      const file = req.file;
      if (!file || !file.buffer) {
        return res.status(400).json({ error: 'No file provided.' });
      }

      const category = sanitizePlainText(String(req.body?.category || 'project'), 40);
      const allowedCategories = ['profile', 'project', 'certificate', 'resume'];
      const safeCategory = allowedCategories.includes(category) ? category : 'project';

      const sig = detectFileSignature(file.buffer);
      if (!sig.valid || !sig.mimeType || !sig.extension) {
        return res.status(400).json({
          error:
            'Unsupported or invalid file signature. Only verified JPEG, PNG, WebP images and PDF documents are permitted.',
        });
      }

      if (safeCategory === 'resume' && sig.mimeType !== 'application/pdf') {
        return res.status(400).json({ error: 'Resume upload must be a valid PDF document.' });
      }

      const safeFilename = `${generateSecureToken(16)}.${sig.extension}`;
      const targetPath = path.resolve(UPLOADS_DIR, safeFilename);
      if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
        return res.status(400).json({ error: 'Invalid storage path.' });
      }

      fs.writeFileSync(targetPath, file.buffer, { flag: 'wx' });

      const originalName = sanitizePlainText(file.originalname || safeFilename, 160);
      const assetRecord = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const inserted = await tx
            .insert(uploadedAssets)
            .values({
              filename: safeFilename,
              originalName,
              mimeType: sig.mimeType!,
              sizeBytes: file.buffer.length,
              assetCategory: safeCategory,
              isPublic: true,
            })
            .returning();

          await recordAuditLog(
            tx,
            req.owner!.email,
            'UPLOAD',
            'uploaded_assets',
            `Uploaded ${safeCategory} asset ${safeFilename}`,
          );
          return inserted[0];
        },
      );

      return res.status(201).json({
        ...assetRecord,
        url: `/api/uploads/${safeFilename}`,
      });
    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Failed to process file upload.' });
    }
  });

  app.delete('/api/admin/uploads/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid asset ID.' });
      }

      const deleted = await withDbContext(
        { role: 'owner', email: req.owner!.email },
        async (tx) => {
          const rows = await tx
            .delete(uploadedAssets)
            .where(eq(uploadedAssets.id, id))
            .returning();
          if (!rows[0]) throw new Error('NOT_FOUND');
          await recordAuditLog(
            tx,
            req.owner!.email,
            'DELETE',
            'uploaded_assets',
            `Deleted asset ${rows[0].filename}`,
          );
          return rows[0];
        },
      );

      if (isSafeStoredFilename(deleted.filename)) {
        const fullPath = path.resolve(UPLOADS_DIR, deleted.filename);
        if (fullPath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      return res.json({ ok: true });
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Asset not found.' });
      }
      console.error('Asset deletion failed:', err);
      return res.status(500).json({ error: 'Failed to delete asset.' });
    }
  });

  // Generic Resource CRUD, Reorder, & Publish Endpoints for all 12 CMS collections
  app.patch('/api/admin/:resource/reorder', async (req: AuthenticatedRequest, res) => {
    try {
      const resource = String(req.params.resource || '');
      if (!isValidResourceKey(resource)) {
        return res.status(404).json({ error: 'Unknown resource collection.' });
      }
      const parsed = reorderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid reorder ID list.' });
      }

      await reorderResourceItems(resource, parsed.data.ids, req.owner!.email);
      return res.json({ ok: true });
    } catch (err) {
      console.error('Reorder failed:', err);
      return res.status(500).json({ error: 'Failed to reorder items.' });
    }
  });

  app.patch('/api/admin/:resource/:id/publish', async (req: AuthenticatedRequest, res) => {
    try {
      const resource = String(req.params.resource || '');
      const id = Number(req.params.id);
      if (!isValidResourceKey(resource) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid resource or ID.' });
      }

      const parsed = publishToggleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid publish status.' });
      }

      const updated = await togglePublishResourceItem(
        resource,
        id,
        parsed.data.isPublished,
        req.owner!.email,
      );
      return res.json(updated);
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Item not found.' });
      }
      console.error('Publish toggle failed:', err);
      return res.status(500).json({ error: 'Failed to update publish status.' });
    }
  });

  app.post('/api/admin/:resource', async (req: AuthenticatedRequest, res) => {
    try {
      const resource = String(req.params.resource || '');
      if (!isValidResourceKey(resource)) {
        return res.status(404).json({ error: 'Unknown resource collection.' });
      }

      const schema = RESOURCE_SCHEMAS[resource];
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Validation failed.',
        });
      }

      const { expectedVersion: _ignored, ...cleanData } = parsed.data as Record<string, unknown>;
      const created = await createResourceItem(resource, cleanData, req.owner!.email);
      return res.status(201).json(created);
    } catch (err: any) {
      if (err?.cause?.code === '23505') {
        return res.status(409).json({ error: 'An entry with that unique slug already exists.' });
      }
      console.error('Create item failed:', err);
      return res.status(500).json({ error: 'Failed to create item.' });
    }
  });

  app.put('/api/admin/:resource/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const resource = String(req.params.resource || '');
      const id = Number(req.params.id);
      if (!isValidResourceKey(resource) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid resource or ID.' });
      }

      const schema = RESOURCE_SCHEMAS[resource];
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Validation failed.',
        });
      }

      const { expectedVersion, ...cleanData } = parsed.data as Record<string, unknown> & {
        expectedVersion?: number;
      };
      const updated = await updateResourceItem(
        resource,
        id,
        cleanData,
        expectedVersion,
        req.owner!.email,
      );
      return res.json(updated);
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Item not found.' });
      }
      if (err?.message === 'CONFLICT_DETECTED') {
        return res.status(409).json({
          error: 'This item was modified in another session. Reload before saving.',
        });
      }
      if (err?.cause?.code === '23505') {
        return res.status(409).json({ error: 'An entry with that unique slug already exists.' });
      }
      console.error('Update item failed:', err);
      return res.status(500).json({ error: 'Failed to update item.' });
    }
  });

  app.delete('/api/admin/:resource/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const resource = String(req.params.resource || '');
      const id = Number(req.params.id);
      if (!isValidResourceKey(resource) || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid resource or ID.' });
      }

      await deleteResourceItem(resource, id, req.owner!.email);
      return res.json({ ok: true });
    } catch (err: any) {
      if (err?.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Item not found.' });
      }
      console.error('Delete item failed:', err);
      return res.status(500).json({ error: 'Failed to delete item.' });
    }
  });

  // Catch-all for unknown /api routes
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Frontend Vite Dev Middleware or Production Static Bundle + Dynamic SEO Injection
  let vite: Awaited<ReturnType<typeof createViteServer>> | null = null;
  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const publicDir = path.resolve(process.cwd(), 'public');
    if (fs.existsSync(publicDir)) {
      app.use(express.static(publicDir, { index: false }));
    }
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: false }));
  }

  app.get('*', async (req, res, next) => {
    try {
      const templatePath = isProd
        ? path.resolve(process.cwd(), 'dist', 'index.html')
        : path.resolve(process.cwd(), 'index.html');

      let html = fs.readFileSync(templatePath, 'utf8');
      if (vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }

      // Inject SEO metadata dynamically for public routes
      if (!req.path.startsWith('/admin')) {
        try {
          const portfolio = await getPublicPortfolio();
          const seo = portfolio.seo;
          if (seo) {
            html = html
              .replace(/<title>.*?<\/title>/, `<title>${escapeHtmlAttr(seo.siteTitle)}</title>`)
              .replace(
                /<meta name="description" content=".*?" \/>/,
                `<meta name="description" content="${escapeHtmlAttr(seo.metaDescription)}" />`,
              )
              .replace(
                /<meta property="og:title" content=".*?" \/>/,
                `<meta property="og:title" content="${escapeHtmlAttr(seo.ogTitle)}" />`,
              )
              .replace(
                /<meta property="og:description" content=".*?" \/>/,
                `<meta property="og:description" content="${escapeHtmlAttr(seo.ogDescription)}" />`,
              );
          }
        } catch {
          // Serve base HTML gracefully if DB is temporarily unreachable
        }
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      next(e);
    }
  });

  // Global error handler — prevents internal stack trace leakage
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (
        typeof err === 'object' &&
        err !== null &&
        'type' in err &&
        (err as { type?: string }).type === 'entity.parse.failed'
      ) {
        return res.status(400).json({ error: 'Malformed JSON request body.' });
      }
      if (
        typeof err === 'object' &&
        err !== null &&
        'type' in err &&
        (err as { type?: string }).type === 'entity.too.large'
      ) {
        return res.status(413).json({ error: 'Request payload is too large.' });
      }
      console.error('Unhandled request error:', err);
      if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Internal server error.' });
      }
      return res.status(500).type('text/plain').send('Internal Server Error');
    },
  );

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
