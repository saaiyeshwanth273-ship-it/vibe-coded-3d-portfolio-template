import { z } from 'zod';
import { sanitizePlainText, sanitizeSafeUrl } from './security.ts';

const safeText = (maxLen: number, minLen = 0) =>
  z
    .string()
    .transform((v) => sanitizePlainText(v, maxLen))
    .refine((v) => v.length >= minLen, {
      message: `Must be at least ${minLen} characters.`,
    });

const safeUrlField = (options: { allowMailto?: boolean; allowRelative?: boolean } = {}) =>
  z
    .string()
    .max(2048)
    .transform((v) => sanitizeSafeUrl(v, options));

const safeStringArray = (maxItems = 30, maxItemLen = 200) =>
  z
    .array(z.string().transform((s) => sanitizePlainText(s, maxItemLen)))
    .max(maxItems)
    .transform((arr) => arr.filter((s) => s.length > 0));

const accentTokenSchema = z.enum(['blue', 'violet', 'cyan', 'gold']).default('cyan');

export const profileUpdateSchema = z
  .object({
    fullName: safeText(120, 2),
    headline: safeText(200, 2),
    subheading: safeText(300, 2),
    brandStatement: safeText(500, 5),
    shortIntro: safeText(800, 5),
    statusText: safeText(200, 2),
    education: safeText(250, 2),
    specialization: safeText(250, 2),
    university: safeText(160, 2),
    institution: safeText(160, 2),
    currentInternship: safeText(250, 2),
    leadershipSummary: safeText(400, 2),
    currentInterests: safeText(500, 2),
    careerDirection: safeText(600, 2),
    contactEmail: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    showEmailPublicly: z.boolean(),
    profileImageUrl: safeUrlField({ allowRelative: true }),
    resumeUrl: safeUrlField({ allowRelative: true }),
    resumeFilename: safeText(200, 0),
    resumeEnabled: z.boolean(),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const aboutThemeSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, numbers, and hyphens.')
      .min(2)
      .max(80),
    title: safeText(120, 2),
    subtitle: safeText(220, 2),
    narrative: safeText(2000, 5),
    highlights: safeStringArray(12, 160),
    accentToken: accentTokenSchema,
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const exploringItemSchema = z
  .object({
    title: safeText(140, 2),
    category: safeText(100, 2),
    summary: safeText(800, 5),
    details: safeText(2000, 0).default(''),
    accentToken: accentTokenSchema,
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const skillSchema = z
  .object({
    name: safeText(120, 1),
    category: safeText(100, 2),
    description: safeText(500, 0).default(''),
    connectedTo: safeStringArray(20, 120),
    accentToken: accentTokenSchema,
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const aiCategorySchema = z
  .object({
    name: safeText(120, 2),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/)
      .min(2)
      .max(100),
    description: safeText(500, 0).default(''),
    accentToken: accentTokenSchema,
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const aiModelSchema = z
  .object({
    categoryId: z.number().int().positive(),
    name: safeText(120, 1),
    providerOrFamily: safeText(120, 0).default(''),
    experienceLevel: z.enum(['Exploring', 'Prompting', 'Experimenting', 'Building With']),
    experienceNotes: safeText(600, 0).default(''),
    useCases: safeStringArray(10, 100),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const projectSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/)
      .min(2)
      .max(100),
    title: safeText(160, 2),
    tagline: safeText(240, 0).default(''),
    category: safeText(120, 2),
    description: safeText(2000, 5),
    keyPrinciple: safeText(500, 0).default(''),
    problem: safeText(2500, 0).default(''),
    solution: safeText(2500, 0).default(''),
    architecture: safeText(3000, 0).default(''),
    aiMethodology: safeText(2500, 0).default(''),
    techStack: safeStringArray(25, 100),
    aiModelsUsed: safeStringArray(15, 100),
    features: safeStringArray(20, 240),
    futureImprovements: safeStringArray(20, 240),
    screenshots: z.array(safeUrlField({ allowRelative: true })).max(12),
    githubUrl: safeUrlField({ allowRelative: false }),
    liveDemoUrl: safeUrlField({ allowRelative: true }),
    status: safeText(80, 0).default('Active'),
    developmentDate: safeText(80, 0).default(''),
    isFeatured: z.boolean().default(false),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const achievementSchema = z
  .object({
    title: safeText(180, 2),
    eventOrIssuer: safeText(180, 2),
    recognitionTier: z.enum(['medal', 'second_place', 'finalist', 'recognition']),
    teamContext: safeText(160, 0).default(''),
    description: safeText(1500, 5),
    highlights: safeStringArray(12, 140),
    achievedDate: safeText(80, 0).default(''),
    certificateUrl: safeUrlField({ allowRelative: true }),
    photoUrl: safeUrlField({ allowRelative: true }),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const leadershipRoleSchema = z
  .object({
    position: safeText(160, 2),
    organization: safeText(180, 2),
    roleType: safeText(100, 2),
    startDate: safeText(80, 0).default(''),
    endDate: safeText(80, 0).default(''),
    isCurrent: z.boolean().default(true),
    description: safeText(1500, 0).default(''),
    responsibilities: safeStringArray(20, 240),
    activities: safeStringArray(20, 240),
    achievements: safeStringArray(20, 240),
    highlights: safeStringArray(12, 120),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const experienceSchema = z
  .object({
    organization: safeText(180, 2),
    position: safeText(160, 2),
    employmentType: safeText(100, 2),
    startDate: safeText(80, 0).default(''),
    endDate: safeText(80, 0).default(''),
    isCurrent: z.boolean().default(true),
    description: safeText(1500, 0).default(''),
    responsibilities: safeStringArray(20, 240),
    skillsUsed: safeStringArray(20, 100),
    achievements: safeStringArray(20, 240),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const certificationSchema = z
  .object({
    title: safeText(180, 2),
    issuer: safeText(160, 2),
    issueDate: safeText(80, 0).default(''),
    credentialId: safeText(120, 0).default(''),
    credentialUrl: safeUrlField({ allowRelative: false }),
    certificateFileUrl: safeUrlField({ allowRelative: true }),
    skillsCovered: safeStringArray(15, 100),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const timelineEventSchema = z
  .object({
    title: safeText(180, 2),
    organization: safeText(160, 2),
    category: z.enum(['Education', 'Achievement', 'Leadership', 'Internship', 'Project']),
    dateLabel: safeText(80, 0).default(''),
    summary: safeText(800, 5),
    accentToken: accentTokenSchema,
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const socialLinkSchema = z
  .object({
    platform: safeText(80, 2),
    label: safeText(80, 2),
    url: safeUrlField({ allowMailto: true, allowRelative: false }),
    iconKey: z.enum(['linkedin', 'github', 'mail', 'code', 'globe', 'terminal']).default('link' as never),
    isPublished: z.boolean().default(true),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const seoSettingsSchema = z
  .object({
    siteTitle: safeText(120, 5),
    metaDescription: safeText(300, 10),
    ogTitle: safeText(120, 5),
    ogDescription: safeText(300, 10),
    canonicalUrl: safeUrlField({ allowRelative: false }),
    keywords: safeText(400, 2),
    authorName: safeText(120, 2),
    structuredDataRole: safeText(160, 2),
  })
  .strict();

export const themeSettingsSchema = z
  .object({
    defaultColorMode: z.enum(['dark', 'light']),
    defaultUniverseMode: z.enum(['circuit']),
    highQualityDefault: z.boolean(),
    soundEffectsDefault: z.boolean(),
    accentPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accentViolet: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accentCyan: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accentGold: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })
  .strict();

export const reorderSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(200),
  })
  .strict();

export const publishToggleSchema = z
  .object({
    isPublished: z.boolean(),
  })
  .strict();

export const messageStatusSchema = z
  .object({
    status: z.enum(['unread', 'read', 'archived']),
  })
  .strict();

export const securityUpdateSchema = z
  .object({
    newPassword: z.string().min(10).max(128).optional(),
    totpAction: z.enum(['keep', 'enable', 'disable']).default('keep'),
    totpCode: z.string().max(12).optional(),
    sessionTtlHours: z.number().int().min(1).max(168).optional(),
    contactRateLimitPer15Min: z.number().int().min(1).max(60).optional(),
  })
  .strict();
