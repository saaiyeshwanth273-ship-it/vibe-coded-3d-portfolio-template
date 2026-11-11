import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const isOwnerSql = sql`current_setting('app.current_role', true) = 'owner'`;
const isPublishedOrOwnerSql = sql`is_published = true OR current_setting('app.current_role', true) = 'owner'`;

function createPublicContentPolicies(prefix: string) {
  return [
    pgPolicy(`${prefix}_public_select`, {
      for: 'select',
      to: 'public',
      using: isPublishedOrOwnerSql,
    }),
    pgPolicy(`${prefix}_owner_insert`, {
      for: 'insert',
      to: 'public',
      withCheck: isOwnerSql,
    }),
    pgPolicy(`${prefix}_owner_update`, {
      for: 'update',
      to: 'public',
      using: isOwnerSql,
      withCheck: isOwnerSql,
    }),
    pgPolicy(`${prefix}_owner_delete`, {
      for: 'delete',
      to: 'public',
      using: isOwnerSql,
    }),
  ];
}

function createSingletonConfigPolicies(prefix: string) {
  return [
    pgPolicy(`${prefix}_public_select`, {
      for: 'select',
      to: 'public',
      using: sql`true`,
    }),
    pgPolicy(`${prefix}_owner_insert`, {
      for: 'insert',
      to: 'public',
      withCheck: isOwnerSql,
    }),
    pgPolicy(`${prefix}_owner_update`, {
      for: 'update',
      to: 'public',
      using: isOwnerSql,
      withCheck: isOwnerSql,
    }),
    pgPolicy(`${prefix}_owner_delete`, {
      for: 'delete',
      to: 'public',
      using: isOwnerSql,
    }),
  ];
}

function createOwnerOnlyPolicies(prefix: string) {
  return [
    pgPolicy(`${prefix}_owner_all`, {
      for: 'all',
      to: 'public',
      using: isOwnerSql,
      withCheck: isOwnerSql,
    }),
  ];
}

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(),
    email: text('email').notNull(),
    role: text('role').notNull().default('visitor'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => createOwnerOnlyPolicies('users'),
);

export const profileSettings = pgTable(
  'profile_settings',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    headline: text('headline').notNull(),
    subheading: text('subheading').notNull(),
    brandStatement: text('brand_statement').notNull(),
    shortIntro: text('short_intro').notNull(),
    statusText: text('status_text').notNull(),
    education: text('education').notNull(),
    specialization: text('specialization').notNull(),
    university: text('university').notNull(),
    institution: text('institution').notNull(),
    currentInternship: text('current_internship').notNull(),
    leadershipSummary: text('leadership_summary').notNull(),
    currentInterests: text('current_interests').notNull(),
    careerDirection: text('career_direction').notNull(),
    contactEmail: text('contact_email').notNull(),
    showEmailPublicly: boolean('show_email_publicly').notNull().default(true),
    profileImageUrl: text('profile_image_url').notNull().default(''),
    resumeUrl: text('resume_url').notNull().default(''),
    resumeFilename: text('resume_filename').notNull().default(''),
    resumeEnabled: boolean('resume_enabled').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createSingletonConfigPolicies('profile_settings'),
);

export const aboutThemes = pgTable(
  'about_themes',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    narrative: text('narrative').notNull(),
    highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
    accentToken: text('accent_token').notNull().default('cyan'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('about_themes'),
);

export const exploringItems = pgTable(
  'exploring_items',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    summary: text('summary').notNull(),
    details: text('details').notNull().default(''),
    accentToken: text('accent_token').notNull().default('blue'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('exploring_items'),
);

export const skills = pgTable(
  'skills',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull().default(''),
    connectedTo: jsonb('connected_to').$type<string[]>().notNull().default([]),
    accentToken: text('accent_token').notNull().default('cyan'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('skills'),
);

export const aiCategories = pgTable(
  'ai_categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().default(''),
    accentToken: text('accent_token').notNull().default('violet'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('ai_categories'),
);

export const aiModels = pgTable(
  'ai_models',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .references(() => aiCategories.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    providerOrFamily: text('provider_or_family').notNull().default(''),
    experienceLevel: text('experience_level').notNull().default('Exploring'),
    experienceNotes: text('experience_notes').notNull().default(''),
    useCases: jsonb('use_cases').$type<string[]>().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('ai_models'),
);

export const aiCategoriesRelations = relations(aiCategories, ({ many }) => ({
  models: many(aiModels),
}));

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  category: one(aiCategories, {
    fields: [aiModels.categoryId],
    references: [aiCategories.id],
  }),
}));

export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    tagline: text('tagline').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    keyPrinciple: text('key_principle').notNull().default(''),
    problem: text('problem').notNull(),
    solution: text('solution').notNull(),
    architecture: text('architecture').notNull(),
    aiMethodology: text('ai_methodology').notNull(),
    techStack: jsonb('tech_stack').$type<string[]>().notNull().default([]),
    aiModelsUsed: jsonb('ai_models_used').$type<string[]>().notNull().default([]),
    features: jsonb('features').$type<string[]>().notNull().default([]),
    futureImprovements: jsonb('future_improvements').$type<string[]>().notNull().default([]),
    screenshots: jsonb('screenshots').$type<string[]>().notNull().default([]),
    githubUrl: text('github_url').notNull().default(''),
    liveDemoUrl: text('live_demo_url').notNull().default(''),
    status: text('status').notNull().default('Active Development'),
    developmentDate: text('development_date').notNull().default(''),
    isFeatured: boolean('is_featured').notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('projects'),
);

export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    eventOrIssuer: text('event_or_issuer').notNull(),
    recognitionTier: text('recognition_tier').notNull(),
    teamContext: text('team_context').notNull().default(''),
    description: text('description').notNull(),
    highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
    achievedDate: text('achieved_date').notNull().default(''),
    certificateUrl: text('certificate_url').notNull().default(''),
    photoUrl: text('photo_url').notNull().default(''),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('achievements'),
);

export const leadershipRoles = pgTable(
  'leadership_roles',
  {
    id: serial('id').primaryKey(),
    position: text('position').notNull(),
    organization: text('organization').notNull(),
    roleType: text('role_type').notNull().default('Student Leadership'),
    startDate: text('start_date').notNull().default(''),
    endDate: text('end_date').notNull().default(''),
    isCurrent: boolean('is_current').notNull().default(true),
    description: text('description').notNull().default(''),
    responsibilities: jsonb('responsibilities').$type<string[]>().notNull().default([]),
    activities: jsonb('activities').$type<string[]>().notNull().default([]),
    achievements: jsonb('achievements').$type<string[]>().notNull().default([]),
    highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('leadership_roles'),
);

export const experiences = pgTable(
  'experiences',
  {
    id: serial('id').primaryKey(),
    organization: text('organization').notNull(),
    position: text('position').notNull(),
    employmentType: text('employment_type').notNull().default('Internship'),
    startDate: text('start_date').notNull().default(''),
    endDate: text('end_date').notNull().default(''),
    isCurrent: boolean('is_current').notNull().default(true),
    description: text('description').notNull().default(''),
    responsibilities: jsonb('responsibilities').$type<string[]>().notNull().default([]),
    skillsUsed: jsonb('skills_used').$type<string[]>().notNull().default([]),
    achievements: jsonb('achievements').$type<string[]>().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('experiences'),
);

export const certifications = pgTable(
  'certifications',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    issuer: text('issuer').notNull(),
    issueDate: text('issue_date').notNull().default(''),
    credentialId: text('credential_id').notNull().default(''),
    credentialUrl: text('credential_url').notNull().default(''),
    certificateFileUrl: text('certificate_file_url').notNull().default(''),
    skillsCovered: jsonb('skills_covered').$type<string[]>().notNull().default([]),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('certifications'),
);

export const timelineEvents = pgTable(
  'timeline_events',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    organization: text('organization').notNull(),
    category: text('category').notNull(),
    dateLabel: text('date_label').notNull().default(''),
    summary: text('summary').notNull(),
    accentToken: text('accent_token').notNull().default('blue'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('timeline_events'),
);

export const socialLinks = pgTable(
  'social_links',
  {
    id: serial('id').primaryKey(),
    platform: text('platform').notNull(),
    label: text('label').notNull(),
    url: text('url').notNull(),
    iconKey: text('icon_key').notNull().default('link'),
    displayOrder: integer('display_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    version: integer('version').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createPublicContentPolicies('social_links'),
);

export const contactMessages = pgTable(
  'contact_messages',
  {
    id: serial('id').primaryKey(),
    senderName: text('sender_name').notNull(),
    senderEmail: text('sender_email').notNull(),
    subject: text('subject').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('unread'),
    ipHash: text('ip_hash').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => [
    pgPolicy('contact_messages_public_insert', {
      for: 'insert',
      to: 'public',
      withCheck: sql`true`,
    }),
    pgPolicy('contact_messages_owner_select', {
      for: 'select',
      to: 'public',
      using: isOwnerSql,
    }),
    pgPolicy('contact_messages_owner_update', {
      for: 'update',
      to: 'public',
      using: isOwnerSql,
      withCheck: isOwnerSql,
    }),
    pgPolicy('contact_messages_owner_delete', {
      for: 'delete',
      to: 'public',
      using: isOwnerSql,
    }),
  ],
);

export const seoSettings = pgTable(
  'seo_settings',
  {
    id: serial('id').primaryKey(),
    siteTitle: text('site_title').notNull(),
    metaDescription: text('meta_description').notNull(),
    ogTitle: text('og_title').notNull(),
    ogDescription: text('og_description').notNull(),
    canonicalUrl: text('canonical_url').notNull().default(''),
    keywords: text('keywords').notNull(),
    authorName: text('author_name').notNull(),
    structuredDataRole: text('structured_data_role').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createSingletonConfigPolicies('seo_settings'),
);

export const themeSettings = pgTable(
  'theme_settings',
  {
    id: serial('id').primaryKey(),
    defaultColorMode: text('default_color_mode').notNull().default('dark'),
    defaultUniverseMode: text('default_universe_mode').notNull().default('circuit'),
    highQualityDefault: boolean('high_quality_default').notNull().default(true),
    soundEffectsDefault: boolean('sound_effects_default').notNull().default(false),
    accentPrimary: text('accent_primary').notNull().default('#4169FF'),
    accentViolet: text('accent_violet').notNull().default('#8257FF'),
    accentCyan: text('accent_cyan').notNull().default('#48DDF5'),
    accentGold: text('accent_gold').notNull().default('#F2B84B'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createSingletonConfigPolicies('theme_settings'),
);

export const securitySettings = pgTable(
  'security_settings',
  {
    id: serial('id').primaryKey(),
    ownerEmail: text('owner_email').notNull(),
    passwordHash: text('password_hash').notNull().default(''),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    totpSecret: text('totp_secret').notNull().default(''),
    sessionTtlHours: integer('session_ttl_hours').notNull().default(24),
    contactRateLimitPer15Min: integer('contact_rate_limit_per_15_min').notNull().default(5),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  () => createOwnerOnlyPolicies('security_settings'),
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: serial('id').primaryKey(),
    sessionTokenHash: text('session_token_hash').notNull().unique(),
    ownerEmail: text('owner_email').notNull(),
    authProvider: text('auth_provider').notNull(),
    userAgent: text('user_agent').notNull().default(''),
    ipHash: text('ip_hash').notNull().default(''),
    isRevoked: boolean('is_revoked').notNull().default(false),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => createOwnerOnlyPolicies('admin_sessions'),
);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: serial('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    ownerEmail: text('owner_email').notNull(),
    usedAt: timestamp('used_at'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => createOwnerOnlyPolicies('password_reset_tokens'),
);

export const uploadedAssets = pgTable(
  'uploaded_assets',
  {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull().unique(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    assetCategory: text('asset_category').notNull(),
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => [
    pgPolicy('uploaded_assets_public_select', {
      for: 'select',
      to: 'public',
      using: sql`is_public = true OR current_setting('app.current_role', true) = 'owner'`,
    }),
    pgPolicy('uploaded_assets_owner_insert', {
      for: 'insert',
      to: 'public',
      withCheck: isOwnerSql,
    }),
    pgPolicy('uploaded_assets_owner_update', {
      for: 'update',
      to: 'public',
      using: isOwnerSql,
      withCheck: isOwnerSql,
    }),
    pgPolicy('uploaded_assets_owner_delete', {
      for: 'delete',
      to: 'public',
      using: isOwnerSql,
    }),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorEmail: text('actor_email').notNull(),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    details: text('details').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  () => createOwnerOnlyPolicies('audit_logs'),
);
