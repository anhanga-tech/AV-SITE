import { logger } from './logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // in milliseconds
  /** True when denial is due to infrastructure unavailability, not quota exhaustion. */
  serviceUnavailable?: true;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RedisLike {
  pipeline(): { incr(key: string): void; ttl(key: string): void; exec(): Promise<unknown[]> };
  expire(key: string, seconds: number): Promise<unknown>;
}

// On Vercel Edge Runtime, each request runs in an isolated V8 context.
// Module-level state does NOT persist across concurrent requests, making
// this Map non-functional as a shared rate limiter without Redis.
// It is kept only as a local-dev convenience (single-process, single-isolate).
const inMemoryStore = new Map<string, RateLimitEntry>();
const IN_MEMORY_MAX_ENTRIES = 2500;

// True when running inside a managed serverless edge runtime where module-level
// state resets per request. Both Vercel (VERCEL_ENV) and Cloudflare Pages
// (CF_PAGES) are detected; local development has neither variable set.
// Implemented as a function so tests can control env vars at call time.
function isEdgeRuntime(): boolean {
  return Boolean(process.env.VERCEL_ENV || process.env.CF_PAGES);
}

async function getRedisClient(): Promise<RedisLike | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (isEdgeRuntime()) {
      // Each serverless edge invocation (Vercel or Cloudflare) gets a fresh V8
      // isolate — the in-memory Map above resets on every request and provides
      // no real protection. Configure Upstash Redis to enable shared rate
      // limiting across all edge instances.
      logger.error(
        'RateLimit: Upstash Redis not configured. ' +
        'In-memory fallback is non-functional on edge runtimes (isolated V8 contexts per request). ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables.'
      );
    }
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  } catch {
    logger.warn('RateLimit: @upstash/redis not available, using in-memory fallback');
    return null;
  }
}

/**
 * Shared rate limiter that uses Upstash Redis if configured,
 * falling back to in-memory storage for local development.
 */
export async function checkRateLimit(
  clientIP: string,
  options: {
    limit: number;
    windowMs: number;
    prefix: string;
  }
): Promise<RateLimitResult> {
  const { limit, windowMs, prefix } = options;
  const redis = await getRedisClient();

  // On edge runtimes the in-memory store resets every request (isolated V8
  // context), so it provides zero real protection. Deny rather than allow when
  // Redis is unavailable — this is the safe-fail default. The tradeoff is that
  // a Redis outage will block all traffic on affected endpoints; this is
  // preferable to silently bypassing rate limits entirely.
  if (!redis && isEdgeRuntime()) {
    logger.error('RateLimit: Redis unavailable on edge runtime. Denying request to prevent rate limit bypass.', { prefix, clientIP });
    return { allowed: false, remaining: 0, resetIn: windowMs, serviceUnavailable: true };
  }

  if (redis) {
    try {
      const key = `${prefix}:${clientIP}`;
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Batch reads to reduce network roundtrips; expiry is handled explicitly below.
      const p = redis.pipeline();
      p.incr(key);
      p.ttl(key);
      const [count, ttlResult] = await p.exec() as [number, number];
      let ttl = ttlResult;

      // Recover from keys with missing expiry to avoid permanent blocks.
      if (ttl < 0) {
        await redis.expire(key, windowSeconds);
        ttl = windowSeconds;
      }

      const resetIn = ttl > 0 ? ttl * 1000 : windowMs;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetIn,
      };
    } catch (error) {
      const errInfo = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { value: String(error) };
      if (isEdgeRuntime()) {
        logger.error('RateLimit: Redis error on edge runtime. Denying request.', { error: errInfo, prefix, clientIP });
        return { allowed: false, remaining: 0, resetIn: windowMs, serviceUnavailable: true };
      }
      logger.error('RateLimit: Redis error, falling back to in-memory', { error: errInfo });
    }
  }

  // In-memory fallback (local development only — isEdgeRuntime() is false here).
  return checkInMemoryRateLimit(clientIP, options);
}

/**
 * In-memory rate limiter logic separated for reusability and clarity.
 */
function checkInMemoryRateLimit(
  clientIP: string,
  options: {
    limit: number;
    windowMs: number;
    prefix: string;
  }
): RateLimitResult {
  const { limit, windowMs, prefix } = options;
  const now = Date.now();
  const key = `${prefix}:${clientIP}`;
  const entry = inMemoryStore.get(key);

  // Periodic GC for in-memory store
  if (inMemoryStore.size > 2000) {
    const keysToDelete: string[] = [];
    for (const [k, v] of inMemoryStore.entries()) {
      if (now > v.resetTime) {
        keysToDelete.push(k);
      }
      if (keysToDelete.length > 500) break;
    }
    keysToDelete.forEach(k => inMemoryStore.delete(k));
  }

  if (inMemoryStore.size >= IN_MEMORY_MAX_ENTRIES && !entry) {
    logger.warn(`RateLimit: In-memory store capacity reached. Rejecting new key for ${clientIP}.`);
    return {
      allowed: false,
      remaining: 0,
      resetIn: windowMs
    };
  }

  if (!entry || now > entry.resetTime) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetIn: windowMs
    };
  }

  entry.count++;
  const allowed = entry.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - entry.count),
    resetIn: entry.resetTime - now
  };
}
