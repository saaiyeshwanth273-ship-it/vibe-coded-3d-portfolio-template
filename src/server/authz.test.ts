import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import {
  requireOwnerAuth,
  requireSameOrigin,
  signSessionToken,
  verifySignedSessionToken,
} from './authMiddleware';
import { withDbContext } from '../db/rls';
import { pool } from '../db/index';
import { contactMessages, projects, securitySettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureSeeded } from '../db/seed';
import { getOwnerEmail } from './security';

dotenv.config();

test.after(async () => {
  await pool.end();
});

test('HMAC session token signing and verification detects tampering', () => {
  const signed = signSessionToken('raw-secret-session-token-123456');
  assert.equal(verifySignedSessionToken(signed), 'raw-secret-session-token-123456');

  const tampered = signed.slice(0, -4) + 'dead';
  assert.equal(verifySignedSessionToken(tampered), null);
  assert.equal(verifySignedSessionToken('no-dot-token'), null);
});

test('CSRF requireSameOrigin allows safe GET and same-origin POST, blocks cross-origin POST', () => {
  let nextCalled = false;
  const mockRes = () => {
    const state = { statusCode: 200, body: null as any };
    return {
      state,
      status(code: number) {
        state.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        state.body = payload;
        return this;
      },
    };
  };

  // Same-origin POST
  const res1 = mockRes();
  requireSameOrigin(
    {
      method: 'POST',
      headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
    } as any,
    res1 as any,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);

  // Cross-origin POST blocked with 403
  nextCalled = false;
  const res2 = mockRes();
  requireSameOrigin(
    {
      method: 'POST',
      headers: { host: 'localhost:3000', origin: 'https://evil-attacker.example' },
    } as any,
    res2 as any,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, false);
  assert.equal(res2.state.statusCode, 403);
});

test('requireOwnerAuth rejects unauthenticated requests with 401', async () => {
  let nextCalled = false;
  let statusCode = 200;
  const res = {
    status(c: number) {
      statusCode = c;
      return this;
    },
    json() {
      return this;
    },
  };

  await requireOwnerAuth(
    { headers: {}, cookies: {} } as any,
    res as any,
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
});

test('PostgreSQL RLS enforces strict isolation between public visitors and owner context', async () => {
  await ensureSeeded();
  const ownerEmail = getOwnerEmail();

  // 1. Public role cannot read sensitive securitySettings or contactMessages
  const publicSecurityRows = await withDbContext({ role: 'public' }, async (tx) => {
    return tx.select().from(securitySettings);
  });
  assert.equal(publicSecurityRows.length, 0);

  const publicContactRows = await withDbContext({ role: 'public' }, async (tx) => {
    return tx.select().from(contactMessages);
  });
  assert.equal(publicContactRows.length, 0);

  // 2. Create an unpublished draft project as owner and verify public RLS hides it
  const draftSlug = `rls-draft-test-${Date.now()}`;
  const createdDraft = await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    const rows = await tx
      .insert(projects)
      .values({
        slug: draftSlug,
        title: 'Secret Unpublished Draft',
        tagline: 'Internal draft tagline',
        category: 'Test',
        description: 'Should never appear to public RLS queries.',
        problem: 'Draft problem statement',
        solution: 'Draft solution statement',
        architecture: 'Draft architecture statement',
        aiMethodology: 'Draft methodology',
        status: 'Draft',
        isPublished: false,
      })
      .returning();
    return rows[0];
  });

  try {
    const publicProjects = await withDbContext({ role: 'public' }, async (tx) => {
      return tx.select().from(projects).where(eq(projects.slug, draftSlug));
    });
    assert.equal(publicProjects.length, 0);

    // 3. Public role attempting to update existing projects affects 0 rows due to RLS USING filter
    const publicUpdatedRows = await withDbContext({ role: 'public' }, async (tx) => {
      return tx
        .update(projects)
        .set({ title: 'Hacked' })
        .where(eq(projects.id, createdDraft.id))
        .returning();
    });
    assert.equal(publicUpdatedRows.length, 0);

    // 4. Public role attempting to insert a new project is rejected by PostgreSQL RLS WITH CHECK
    await assert.rejects(async () => {
      await withDbContext({ role: 'public' }, async (tx) => {
        await tx.insert(projects).values({
          slug: `unauthorized-${Date.now()}`,
          title: 'Unauthorized Insert',
          tagline: '',
          category: 'Test',
          description: 'Blocked by RLS.',
          problem: '',
          solution: '',
          architecture: '',
          aiMethodology: '',
          status: 'Draft',
          isPublished: true,
        });
      });
    });
  } finally {
    // Clean up test draft as owner
    await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
      await tx.delete(projects).where(eq(projects.id, createdDraft.id));
    });
  }
});
