import { asc, desc, eq, sql } from 'drizzle-orm';
import { ScopedDb, withDbContext } from '../db/rls.ts';
import {
  aboutThemes,
  achievements,
  adminSessions,
  aiCategories,
  aiModels,
  auditLogs,
  certifications,
  contactMessages,
  experiences,
  exploringItems,
  leadershipRoles,
  profileSettings,
  projects,
  securitySettings,
  seoSettings,
  skills,
  socialLinks,
  themeSettings,
  timelineEvents,
  uploadedAssets,
} from '../db/schema.ts';
import { ensureSeeded } from '../db/seed.ts';
import { getEmailDeliveryStatus } from './mailer.ts';
import { getOwnerEmail } from './security.ts';

export const RESOURCE_TABLES = {
  about_themes: aboutThemes,
  exploring_items: exploringItems,
  skills: skills,
  ai_categories: aiCategories,
  ai_models: aiModels,
  projects: projects,
  achievements: achievements,
  leadership_roles: leadershipRoles,
  experiences: experiences,
  certifications: certifications,
  timeline_events: timelineEvents,
  social_links: socialLinks,
} as const;

export type ResourceKey = keyof typeof RESOURCE_TABLES;

export function isValidResourceKey(key: string): key is ResourceKey {
  return Object.prototype.hasOwnProperty.call(RESOURCE_TABLES, key);
}

export async function recordAuditLog(
  tx: ScopedDb,
  actorEmail: string,
  action: string,
  resource: string,
  details = '',
) {
  await tx.insert(auditLogs).values({
    actorEmail: actorEmail.toLowerCase(),
    action,
    resource,
    details: details.slice(0, 500),
  });
}

export async function getPublicPortfolio() {
  await ensureSeeded();

  return withDbContext({ role: 'public' }, async (tx) => {
    const [
      profileRows,
      themes,
      exploring,
      skillList,
      categories,
      models,
      projectList,
      achievementList,
      leadershipList,
      experienceList,
      certificationList,
      timelineList,
      socialList,
      seoRows,
      themeRows,
    ] = await Promise.all([
      tx.select().from(profileSettings).limit(1),
      tx
        .select()
        .from(aboutThemes)
        .where(eq(aboutThemes.isPublished, true))
        .orderBy(asc(aboutThemes.displayOrder), asc(aboutThemes.id)),
      tx
        .select()
        .from(exploringItems)
        .where(eq(exploringItems.isPublished, true))
        .orderBy(asc(exploringItems.displayOrder), asc(exploringItems.id)),
      tx
        .select()
        .from(skills)
        .where(eq(skills.isPublished, true))
        .orderBy(asc(skills.displayOrder), asc(skills.id)),
      tx
        .select()
        .from(aiCategories)
        .where(eq(aiCategories.isPublished, true))
        .orderBy(asc(aiCategories.displayOrder), asc(aiCategories.id)),
      tx
        .select()
        .from(aiModels)
        .where(eq(aiModels.isPublished, true))
        .orderBy(asc(aiModels.displayOrder), asc(aiModels.id)),
      tx
        .select()
        .from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(asc(projects.displayOrder), asc(projects.id)),
      tx
        .select()
        .from(achievements)
        .where(eq(achievements.isPublished, true))
        .orderBy(asc(achievements.displayOrder), asc(achievements.id)),
      tx
        .select()
        .from(leadershipRoles)
        .where(eq(leadershipRoles.isPublished, true))
        .orderBy(asc(leadershipRoles.displayOrder), asc(leadershipRoles.id)),
      tx
        .select()
        .from(experiences)
        .where(eq(experiences.isPublished, true))
        .orderBy(asc(experiences.displayOrder), asc(experiences.id)),
      tx
        .select()
        .from(certifications)
        .where(eq(certifications.isPublished, true))
        .orderBy(asc(certifications.displayOrder), asc(certifications.id)),
      tx
        .select()
        .from(timelineEvents)
        .where(eq(timelineEvents.isPublished, true))
        .orderBy(asc(timelineEvents.displayOrder), asc(timelineEvents.id)),
      tx
        .select()
        .from(socialLinks)
        .where(eq(socialLinks.isPublished, true))
        .orderBy(asc(socialLinks.displayOrder), asc(socialLinks.id)),
      tx.select().from(seoSettings).limit(1),
      tx.select().from(themeSettings).limit(1),
    ]);

    const rawProfile = profileRows[0];
    const safeProfile = rawProfile
      ? {
          ...rawProfile,
          contactEmail: rawProfile.showEmailPublicly ? rawProfile.contactEmail : '',
        }
      : null;

    return {
      profile: safeProfile,
      aboutThemes: themes,
      exploringItems: exploring.map((item) => ({
        ...item,
        details: item.details && /editable in cms/i.test(item.details) ? '' : item.details,
      })),
      skills: skillList,
      aiCategories: categories,
      aiModels: models,
      projects: projectList,
      achievements: achievementList,
      leadershipRoles: leadershipList.map((role) => ({
        ...role,
        responsibilities: (role.responsibilities || []).filter(
          (r) => !/editable in cms/i.test(r),
        ),
        activities: (role.activities || []).filter((a) => !/editable in cms/i.test(a)),
        achievements: (role.achievements || []).filter((a) => !/editable in cms/i.test(a)),
      })),
      experiences: experienceList.map((exp) => ({
        ...exp,
        startDate:
          (exp.startDate || '').replace(/\(\s*editable in cms[^)]*\)/gi, '').trim() || 'Current',
        responsibilities: (exp.responsibilities || []).filter(
          (r) => !/editable in cms/i.test(r),
        ),
        achievements: (exp.achievements || []).filter((a) => !/editable in cms/i.test(a)),
      })),
      certifications: certificationList,
      timelineEvents: timelineList,
      socialLinks: socialList,
      seo: seoRows[0] || null,
      theme: themeRows[0] || null,
    };
  });
}

export async function getPublicProjectBySlug(slug: string) {
  await ensureSeeded();
  return withDbContext({ role: 'public' }, async (tx) => {
    const rows = await tx
      .select()
      .from(projects)
      .where(eq(projects.slug, slug.toLowerCase()))
      .limit(1);
    const project = rows[0];
    if (!project || !project.isPublished) return null;
    return project;
  });
}

export async function getAdminOverview(ownerEmail: string) {
  await ensureSeeded();

  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const [
      profileRows,
      themes,
      exploring,
      skillList,
      categories,
      models,
      projectList,
      achievementList,
      leadershipList,
      experienceList,
      certificationList,
      timelineList,
      socialList,
      messages,
      seoRows,
      themeRows,
      secRows,
      sessions,
      assets,
      logs,
    ] = await Promise.all([
      tx.select().from(profileSettings).limit(1),
      tx.select().from(aboutThemes).orderBy(asc(aboutThemes.displayOrder), asc(aboutThemes.id)),
      tx
        .select()
        .from(exploringItems)
        .orderBy(asc(exploringItems.displayOrder), asc(exploringItems.id)),
      tx.select().from(skills).orderBy(asc(skills.displayOrder), asc(skills.id)),
      tx.select().from(aiCategories).orderBy(asc(aiCategories.displayOrder), asc(aiCategories.id)),
      tx.select().from(aiModels).orderBy(asc(aiModels.displayOrder), asc(aiModels.id)),
      tx.select().from(projects).orderBy(asc(projects.displayOrder), asc(projects.id)),
      tx.select().from(achievements).orderBy(asc(achievements.displayOrder), asc(achievements.id)),
      tx
        .select()
        .from(leadershipRoles)
        .orderBy(asc(leadershipRoles.displayOrder), asc(leadershipRoles.id)),
      tx.select().from(experiences).orderBy(asc(experiences.displayOrder), asc(experiences.id)),
      tx
        .select()
        .from(certifications)
        .orderBy(asc(certifications.displayOrder), asc(certifications.id)),
      tx
        .select()
        .from(timelineEvents)
        .orderBy(asc(timelineEvents.displayOrder), asc(timelineEvents.id)),
      tx.select().from(socialLinks).orderBy(asc(socialLinks.displayOrder), asc(socialLinks.id)),
      tx.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
      tx.select().from(seoSettings).limit(1),
      tx.select().from(themeSettings).limit(1),
      tx.select().from(securitySettings).limit(1),
      tx
        .select({
          id: adminSessions.id,
          ownerEmail: adminSessions.ownerEmail,
          authProvider: adminSessions.authProvider,
          userAgent: adminSessions.userAgent,
          isRevoked: adminSessions.isRevoked,
          expiresAt: adminSessions.expiresAt,
          createdAt: adminSessions.createdAt,
        })
        .from(adminSessions)
        .orderBy(desc(adminSessions.createdAt))
        .limit(20),
      tx.select().from(uploadedAssets).orderBy(desc(uploadedAssets.createdAt)),
      tx.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
    ]);

    const sec = secRows[0];
    const safeSecurity = sec
      ? {
          ownerEmail: sec.ownerEmail,
          hasPasswordConfigured: Boolean(sec.passwordHash || process.env.OWNER_PASSWORD_HASH),
          totpEnabled: sec.totpEnabled,
          sessionTtlHours: sec.sessionTtlHours,
          contactRateLimitPer15Min: sec.contactRateLimitPer15Min,
          updatedAt: sec.updatedAt,
        }
      : {
          ownerEmail: getOwnerEmail(),
          hasPasswordConfigured: Boolean(process.env.OWNER_PASSWORD_HASH),
          totpEnabled: false,
          sessionTtlHours: 24,
          contactRateLimitPer15Min: 5,
          updatedAt: new Date(),
        };

    const recipientEmail = profileRows[0]?.contactEmail?.trim() || getOwnerEmail();
    return {
      profile: profileRows[0] || null,
      aboutThemes: themes,
      exploringItems: exploring,
      skills: skillList,
      aiCategories: categories,
      aiModels: models,
      projects: projectList,
      achievements: achievementList,
      leadershipRoles: leadershipList,
      experiences: experienceList,
      certifications: certificationList,
      timelineEvents: timelineList,
      socialLinks: socialList,
      contactMessages: messages,
      seo: seoRows[0] || null,
      theme: themeRows[0] || null,
      security: safeSecurity,
      activeSessions: sessions,
      uploadedAssets: assets,
      auditLogs: logs,
      emailDelivery: getEmailDeliveryStatus(process.env, recipientEmail),
    };
  });
}

export async function createResourceItem(
  resource: ResourceKey,
  data: Record<string, unknown>,
  ownerEmail: string,
) {
  const table = RESOURCE_TABLES[resource];
  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const [{ maxOrder }] = await tx
      .select({ maxOrder: sql<number>`COALESCE(MAX(${table.displayOrder}), -1)` })
      .from(table);

    const insertPayload = {
      ...data,
      displayOrder: Number(maxOrder) + 1,
      version: 1,
      updatedAt: new Date(),
    };

    const inserted = await tx
      .insert(table)
      .values(insertPayload as never)
      .returning();

    await recordAuditLog(tx, ownerEmail, 'CREATE', resource, `Created item #${inserted[0]?.id}`);
    return inserted[0];
  });
}

export async function updateResourceItem(
  resource: ResourceKey,
  id: number,
  data: Record<string, unknown>,
  expectedVersion: number | undefined,
  ownerEmail: string,
) {
  const table = RESOURCE_TABLES[resource];
  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const existingRows = await tx.select().from(table).where(eq(table.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    if (
      typeof expectedVersion === 'number' &&
      'version' in existing &&
      existing.version !== expectedVersion
    ) {
      throw new Error('CONFLICT_DETECTED');
    }

    const nextVersion = ('version' in existing ? Number(existing.version) : 1) + 1;
    const updated = await tx
      .update(table)
      .set({
        ...data,
        version: nextVersion,
        updatedAt: new Date(),
      } as never)
      .where(eq(table.id, id))
      .returning();

    await recordAuditLog(tx, ownerEmail, 'UPDATE', resource, `Updated item #${id}`);
    return updated[0];
  });
}

export async function togglePublishResourceItem(
  resource: ResourceKey,
  id: number,
  isPublished: boolean,
  ownerEmail: string,
) {
  const table = RESOURCE_TABLES[resource];
  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const updated = await tx
      .update(table)
      .set({
        isPublished,
        updatedAt: new Date(),
      } as never)
      .where(eq(table.id, id))
      .returning();

    if (!updated[0]) {
      throw new Error('NOT_FOUND');
    }

    await recordAuditLog(
      tx,
      ownerEmail,
      isPublished ? 'PUBLISH' : 'UNPUBLISH',
      resource,
      `${isPublished ? 'Published' : 'Unpublished'} item #${id}`,
    );
    return updated[0];
  });
}

export async function reorderResourceItems(
  resource: ResourceKey,
  ids: number[],
  ownerEmail: string,
) {
  const table = RESOURCE_TABLES[resource];
  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    for (let idx = 0; idx < ids.length; idx++) {
      await tx
        .update(table)
        .set({ displayOrder: idx, updatedAt: new Date() } as never)
        .where(eq(table.id, ids[idx]));
    }
    await recordAuditLog(tx, ownerEmail, 'REORDER', resource, `Reordered ${ids.length} items`);
  });
}

export async function deleteResourceItem(resource: ResourceKey, id: number, ownerEmail: string) {
  const table = RESOURCE_TABLES[resource];
  return withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const deleted = await tx.delete(table).where(eq(table.id, id)).returning();
    if (!deleted[0]) {
      throw new Error('NOT_FOUND');
    }
    await recordAuditLog(tx, ownerEmail, 'DELETE', resource, `Deleted item #${id}`);
    return deleted[0];
  });
}
