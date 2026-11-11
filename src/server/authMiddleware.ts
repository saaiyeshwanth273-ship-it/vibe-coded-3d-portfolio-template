import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { and, eq, gt } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { withDbContext } from '../db/rls.ts';
import { adminSessions, users } from '../db/schema.ts';
import {
  generateSecureToken,
  getOwnerEmail,
  isAllowedSameSiteOrigin,
  isAuthorizedOwnerEmail,
  sha256Hex,
} from './security.ts';

export const SESSION_COOKIE_NAME = 'saai_cms_session';

const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : EPHEMERAL_SESSION_SECRET;
}

export function signSessionToken(rawToken: string): string {
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(rawToken)
    .digest('hex');
  return `${rawToken}.${sig}`;
}

export function verifySignedSessionToken(cookieValue: string): string | null {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 2) return null;
  const [rawToken, sig] = parts;
  if (!rawToken || !sig || sig.length !== 64) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(rawToken)
      .digest('hex');
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    return rawToken;
  } catch {
    return null;
  }
}

export interface OwnerAuthContext {
  email: string;
  authProvider: 'google' | 'password';
  sessionId?: number;
}

export interface AuthenticatedRequest extends Request {
  owner?: OwnerAuthContext;
}

export async function createOwnerSession(params: {
  email: string;
  authProvider: 'google' | 'password';
  userAgent: string;
  ipHash: string;
  ttlHours: number;
}): Promise<{ cookieValue: string; expiresAt: Date }> {
  const rawToken = generateSecureToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + params.ttlHours * 3600 * 1000);

  await withDbContext({ role: 'owner', email: params.email }, async (tx) => {
    await tx.insert(adminSessions).values({
      sessionTokenHash: tokenHash,
      ownerEmail: params.email.toLowerCase(),
      authProvider: params.authProvider,
      userAgent: params.userAgent.slice(0, 240),
      ipHash: params.ipHash,
      isRevoked: false,
      expiresAt,
    });
  });

  return {
    cookieValue: signSessionToken(rawToken),
    expiresAt,
  };
}

export async function revokeSessionByCookie(cookieValue: string | undefined): Promise<void> {
  if (!cookieValue) return;
  const rawToken = verifySignedSessionToken(cookieValue);
  if (!rawToken) return;
  const tokenHash = sha256Hex(rawToken);
  const ownerEmail = getOwnerEmail();

  await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
    await tx
      .update(adminSessions)
      .set({ isRevoked: true })
      .where(eq(adminSessions.sessionTokenHash, tokenHash));
  });
}

export async function resolveOwnerFromRequest(req: Request): Promise<OwnerAuthContext | null> {
  const ownerEmail = getOwnerEmail();

  // 1. Check HttpOnly signed session cookie backed by PostgreSQL admin_sessions
  const cookieVal = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (cookieVal) {
    const rawToken = verifySignedSessionToken(cookieVal);
    if (rawToken) {
      const tokenHash = sha256Hex(rawToken);
      const sessionRows = await withDbContext({ role: 'owner', email: ownerEmail }, async (tx) => {
        return tx
          .select()
          .from(adminSessions)
          .where(
            and(
              eq(adminSessions.sessionTokenHash, tokenHash),
              eq(adminSessions.isRevoked, false),
              gt(adminSessions.expiresAt, new Date()),
            ),
          )
          .limit(1);
      });

      const session = sessionRows[0];
      if (session && isAuthorizedOwnerEmail(session.ownerEmail, true)) {
        return {
          email: session.ownerEmail,
          authProvider: session.authProvider === 'google' ? 'google' : 'password',
          sessionId: session.id,
        };
      }
    }
  }

  // 2. Check Firebase Bearer ID Token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (isAuthorizedOwnerEmail(decoded.email, decoded.email_verified === true)) {
          await withDbContext({ role: 'owner', email: decoded.email! }, async (tx) => {
            await tx
              .insert(users)
              .values({
                uid: decoded.uid,
                email: decoded.email!.toLowerCase(),
                role: 'owner',
              })
              .onConflictDoUpdate({
                target: users.uid,
                set: { email: decoded.email!.toLowerCase(), role: 'owner' },
              });
          });
          return {
            email: decoded.email!.toLowerCase(),
            authProvider: 'google',
          };
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Enforces both authentication and strict owner-only authorization on all /api/admin/* endpoints.
 */
export async function requireOwnerAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // If a Bearer token is supplied for a non-owner account, explicitly return 403 Forbidden
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.slice('Bearer '.length).trim();
      if (idToken) {
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          if (!isAuthorizedOwnerEmail(decoded.email, decoded.email_verified === true)) {
            return res.status(403).json({
              error: 'Forbidden: Only the designated portfolio owner can access this resource.',
            });
          }
        } catch {
          return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
        }
      }
    }

    const owner = await resolveOwnerFromRequest(req);
    if (!owner) {
      return res.status(401).json({ error: 'Unauthorized: Owner authentication required.' });
    }

    req.owner = owner;
    return next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(401).json({ error: 'Unauthorized: Authentication check failed.' });
  }
}

/**
 * CSRF & Origin verification for state-changing HTTP methods.
 */
export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  const forwardedHost =
    typeof req.headers['x-forwarded-host'] === 'string'
      ? req.headers['x-forwarded-host']
      : undefined;
  const allowedAppUrl = process.env.APP_URL;
  const hasCustomHeader = Boolean(req.headers['x-requested-with'] || req.headers.authorization);

  if (
    !isAllowedSameSiteOrigin({
      origin,
      host,
      forwardedHost,
      appUrl: allowedAppUrl,
      hasCustomHeader,
    })
  ) {
    return res.status(403).json({
      error: origin
        ? 'Forbidden: Cross-origin state mutation blocked.'
        : 'Forbidden: Missing CSRF request verification.',
    });
  }

  return next();
}
