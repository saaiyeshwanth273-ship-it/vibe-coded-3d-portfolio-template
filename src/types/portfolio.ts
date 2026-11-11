export type AccentToken = 'blue' | 'violet' | 'cyan' | 'gold';
export type UniverseMode = 'circuit';
export type ColorMode = 'dark' | 'light';

export interface ProfileSettings {
  id: number;
  fullName: string;
  headline: string;
  subheading: string;
  brandStatement: string;
  shortIntro: string;
  statusText: string;
  education: string;
  specialization: string;
  university: string;
  institution: string;
  currentInternship: string;
  leadershipSummary: string;
  currentInterests: string;
  careerDirection: string;
  contactEmail: string;
  showEmailPublicly: boolean;
  profileImageUrl: string;
  resumeUrl: string;
  resumeFilename: string;
  resumeEnabled: boolean;
  version: number;
  updatedAt: string;
}

export interface AboutTheme {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  narrative: string;
  highlights: string[];
  accentToken: AccentToken;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface ExploringItem {
  id: number;
  title: string;
  category: string;
  summary: string;
  details: string;
  accentToken: AccentToken;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface SkillItem {
  id: number;
  name: string;
  category: string;
  description: string;
  connectedTo: string[];
  accentToken: AccentToken;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface AiCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  accentToken: AccentToken;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface AiModelItem {
  id: number;
  categoryId: number;
  name: string;
  providerOrFamily: string;
  experienceLevel: 'Exploring' | 'Prompting' | 'Experimenting' | 'Building With';
  experienceNotes: string;
  useCases: string[];
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface ProjectItem {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  description: string;
  keyPrinciple: string;
  problem: string;
  solution: string;
  architecture: string;
  aiMethodology: string;
  techStack: string[];
  aiModelsUsed: string[];
  features: string[];
  futureImprovements: string[];
  screenshots: string[];
  githubUrl: string;
  liveDemoUrl: string;
  status: string;
  developmentDate: string;
  isFeatured: boolean;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface AchievementItem {
  id: number;
  title: string;
  eventOrIssuer: string;
  recognitionTier: 'medal' | 'second_place' | 'finalist' | 'recognition';
  teamContext: string;
  description: string;
  highlights: string[];
  achievedDate: string;
  certificateUrl: string;
  photoUrl: string;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface LeadershipRole {
  id: number;
  position: string;
  organization: string;
  roleType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  activities: string[];
  achievements: string[];
  highlights: string[];
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface ExperienceItem {
  id: number;
  organization: string;
  position: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  skillsUsed: string[];
  achievements: string[];
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface CertificationItem {
  id: number;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
  certificateFileUrl: string;
  skillsCovered: string[];
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface TimelineEventItem {
  id: number;
  title: string;
  organization: string;
  category: 'Education' | 'Achievement' | 'Leadership' | 'Internship' | 'Project';
  dateLabel: string;
  summary: string;
  accentToken: AccentToken;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface SocialLinkItem {
  id: number;
  platform: string;
  label: string;
  url: string;
  iconKey: string;
  displayOrder: number;
  isPublished: boolean;
  version: number;
}

export interface ContactMessageItem {
  id: number;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
}

export interface SeoSettings {
  id: number;
  siteTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  keywords: string;
  authorName: string;
  structuredDataRole: string;
}

export interface ThemeSettings {
  id: number;
  defaultColorMode: ColorMode;
  defaultUniverseMode: UniverseMode;
  highQualityDefault: boolean;
  soundEffectsDefault: boolean;
  accentPrimary: string;
  accentViolet: string;
  accentCyan: string;
  accentGold: string;
}

export interface PublicPortfolioPayload {
  profile: ProfileSettings | null;
  aboutThemes: AboutTheme[];
  exploringItems: ExploringItem[];
  skills: SkillItem[];
  aiCategories: AiCategory[];
  aiModels: AiModelItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  leadershipRoles: LeadershipRole[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  timelineEvents: TimelineEventItem[];
  socialLinks: SocialLinkItem[];
  seo: SeoSettings | null;
  theme: ThemeSettings | null;
}

export interface SecuritySettingsView {
  ownerEmail: string;
  hasPasswordConfigured: boolean;
  totpEnabled: boolean;
  sessionTtlHours: number;
  contactRateLimitPer15Min: number;
  updatedAt: string;
}

export interface AdminSessionRecord {
  id: number;
  ownerEmail: string;
  authProvider: string;
  userAgent: string;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface UploadedAssetRecord {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  assetCategory: string;
  isPublic: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: number;
  actorEmail: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
}

export interface EmailDeliveryStatusView {
  configured: boolean;
  provider: 'smtp' | 'resend' | 'none';
  recipientEmail: string;
}

export interface AdminOverviewPayload extends PublicPortfolioPayload {
  contactMessages: ContactMessageItem[];
  security: SecuritySettingsView;
  activeSessions: AdminSessionRecord[];
  uploadedAssets: UploadedAssetRecord[];
  auditLogs: AuditLogRecord[];
  emailDelivery?: EmailDeliveryStatusView;
}
