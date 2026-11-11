import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 5000;

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 24);
}

/**
 * Extracts client IP safely by preferring `req.ip` (computed by Express using `trust proxy: 1`),
 * preventing attackers from spoofing `X-Forwarded-For` headers to bypass rate limits.
 */
export function getClientIp(req: Request): string {
  if (typeof req.ip === 'string' && req.ip.trim().length > 0) {
    return req.ip.trim();
  }
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const hops = forwarded
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      return hops[hops.length - 1];
    }
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number | (() => number);
  keyPrefix: string;
}) {
  const buckets = new Map<string, RateBucket>();
  let lastCleanup = Date.now();

  const evictExpired = (now: number) => {
    for (const [k, b] of buckets.entries()) {
      if (b.resetAt <= now) {
        buckets.delete(k);
      }
    }
    lastCleanup = now;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (now - lastCleanup > 60_000 || buckets.size >= MAX_BUCKETS) {
      evictExpired(now);
      if (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) {
          buckets.delete(oldestKey);
        }
      }
    }

    const key = `${options.keyPrefix}:${hashIp(getClientIp(req))}`;
    const limit =
      typeof options.maxRequests === 'function' ? options.maxRequests() : options.maxRequests;

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - 1)));
      return next();
    }

    if (existing.count >= limit) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - existing.count)));
    return next();
  };
}
