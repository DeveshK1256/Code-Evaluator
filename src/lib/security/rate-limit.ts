/**
 * Rate Limiting Middleware
 *
 * In-memory rate limiter for API routes.
 * In production, this should be replaced with a distributed store (Redis, Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowMs: 60 * 1000 },
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
  upload: { maxRequests: 5, windowMs: 60 * 1000 },
  evaluation: { maxRequests: 20, windowMs: 60 * 1000 },
  github: { maxRequests: 10, windowMs: 60 * 1000 },
  export: { maxRequests: 30, windowMs: 60 * 1000 },
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.default!
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  record.count++;
  const remaining = Math.max(0, config.maxRequests - record.count);

  if (record.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return { allowed: true, remaining, resetAt: record.resetAt };
}

export function getRateLimitKey(request: Request, prefix: string = "api"): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}`;
}

export function getRateLimitHeaders(
  result: { remaining: number; resetAt: number }
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Periodic cleanup of stale entries.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);
