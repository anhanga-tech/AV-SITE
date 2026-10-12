import { logger } from './logger';
import { getRedisClient, isEdgeRuntime, type RedisClientLike } from './redis-client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // in milliseconds
  /** True when denial is due to infrastructure unavailability, not quota exhaustion. */
  serviceUnavailable?: true;
  /**
   * Truncated HMAC-SHA-256 of the client IP. Safe to log.
   * Absent when production has no RATE_LIMIT_KEY_SECRET — the request is
   * denied before a key is derived, so nothing IP-shaped is recorded.
   */
  subjectKey?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/** Subset of the Redis client the limiter actually calls. Tests pass a fake. */
export type RateLimitRedis = Pick<RedisClientLike, 'pipeline' | 'expire'>;

// 128 bits of the HMAC. Long enough that two clients don't share a bucket,
// short enough to keep the Redis key small. The secret, not the length, is
// what stops someone with the key from recovering the IP.
const SUBJECT_KEY_HEX_LENGTH = 32;

// Local development only. Production (CF_PAGES / VERCEL_ENV) never uses this:
// a missing RATE_LIMIT_KEY_SECRET denies the request instead. The value is
// not a credential — it only keeps dev keys deterministic and free of the
// plaintext IP when the env var is unset.
const DEV_RATE_LIMIT_KEY_SECRET = 'dev-only-rate-limit-key';

let devFallbackWarned = false;

// On Vercel Edge Runtime, each request runs in an isolated V8 context.
// Module-level state does NOT persist across concurrent requests, making
// this Map non-functional as a shared rate limiter without Redis.
// It is kept only as a local-dev convenience (single-process, single-isolate).
const inMemoryStore = new Map<string, RateLimitEntry>();
const IN_MEMORY_MAX_ENTRIES = 2500;

/** Single read of the HMAC secret. Callers must not touch process.env themselves. */
export function getRateLimitKeySecret(): string | null {
  const secret = process.env.RATE_LIMIT_KEY_SECRET?.trim();
  return secret ? secret : null;
}

function devFallbackSecret(): string {
  if (!devFallbackWarned) {
    devFallbackWarned = true;
    logger.warn(
      'RateLimit: RATE_LIMIT_KEY_SECRET is unset. Using the deterministic development fallback.',
    );
  }
  return DEV_RATE_LIMIT_KEY_SECRET;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const bytes = new Uint8Array(signature);
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

type DerivedRateLimitKey =
  | { ok: true; storageKey: string; subjectKey: string }
  | { ok: false };

async function deriveRateLimitKey(prefix: string, clientIP: string): Promise<DerivedRateLimitKey> {
  const configured = getRateLimitKeySecret();
  if (!configured && isEdgeRuntime()) {
    logger.error(
      'RateLimit: RATE_LIMIT_KEY_SECRET is not set. Denying request instead of storing a plaintext IP.',
      { prefix },
    );
    return { ok: false };
  }

  const secret = configured ?? devFallbackSecret();
  const digest = await hmacSha256Hex(secret, clientIP);
  const subjectKey = digest.slice(0, SUBJECT_KEY_HEX_LENGTH);
  return { ok: true, storageKey: `${prefix}:${subjectKey}`, subjectKey };
}

/**
 * Shared rate limiter that uses Upstash Redis if configured,
 * falling back to in-memory storage for local development.
 *
 * The storage key is `prefix` plus an HMAC of the client IP. The IP itself
 * is never written to Redis, the in-memory map, or the limiter's logs.
 */
export async function checkRateLimit(
  clientIP: string,
  options: {
    limit: number;
    windowMs: number;
    prefix: string;
  },
  redisOverride?: RateLimitRedis,
): Promise<RateLimitResult> {
  const { limit, windowMs, prefix } = options;
  const derived = await deriveRateLimitKey(prefix, clientIP);
  if (!derived.ok) {
    return { allowed: false, remaining: 0, resetIn: windowMs, serviceUnavailable: true };
  }

  const { storageKey, subjectKey } = derived;
  const redis = redisOverride ?? (await getRedisClient());

  // On edge runtimes the in-memory store resets every request (isolated V8
  // context), so it provides zero real protection. Deny rather than allow when
  // Redis is unavailable — this is the safe-fail default. The tradeoff is that
  // a Redis outage will block all traffic on affected endpoints; this is
  // preferable to silently bypassing rate limits entirely.
  if (!redis && isEdgeRuntime()) {
    logger.error('RateLimit: Redis unavailable on edge runtime. Denying request to prevent rate limit bypass.', { prefix, subjectKey });
    return { allowed: false, remaining: 0, resetIn: windowMs, serviceUnavailable: true, subjectKey };
  }

  if (redis) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);

      // Batch reads to reduce network roundtrips; expiry is handled explicitly below.
      const p = redis.pipeline();
      p.incr(storageKey);
      p.ttl(storageKey);
      const [count, ttlResult] = await p.exec() as [number, number];
      let ttl = ttlResult;

      // Recover from keys with missing expiry to avoid permanent blocks.
      if (ttl < 0) {
        await redis.expire(storageKey, windowSeconds);
        ttl = windowSeconds;
      }

      const resetIn = ttl > 0 ? ttl * 1000 : windowMs;

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetIn,
        subjectKey,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // Error properties are non-enumerable and serialize to {} in CF Workers
      // JSON logs. Define toJSON so the runtime can serialize them while
      // keeping the original Error instance intact for Sentry stack traces.
      if (!('toJSON' in err)) {
        Object.defineProperty(err, 'toJSON', {
          value: () => ({ name: err.name, message: err.message, stack: err.stack }),
          configurable: true,
        });
      }
      if (isEdgeRuntime()) {
        logger.error('RateLimit: Redis error on edge runtime. Denying request.', { error: err, prefix, subjectKey });
        return { allowed: false, remaining: 0, resetIn: windowMs, serviceUnavailable: true, subjectKey };
      }
      logger.error('RateLimit: Redis error, falling back to in-memory', err);
    }
  }

  // In-memory fallback (local development only — isEdgeRuntime() is false here).
  return {
    ...checkInMemoryRateLimit(storageKey, subjectKey, options),
    subjectKey,
  };
}

/**
 * In-memory rate limiter logic separated for reusability and clarity.
 * `storageKey` is already pseudonymized — this function must not receive the IP.
 */
function checkInMemoryRateLimit(
  storageKey: string,
  subjectKey: string,
  options: {
    limit: number;
    windowMs: number;
    prefix: string;
  }
): RateLimitResult {
  const { limit, windowMs, prefix } = options;
  const now = Date.now();
  const entry = inMemoryStore.get(storageKey);

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
    logger.warn('RateLimit: in-memory store capacity reached. Rejecting new key.', { prefix, subjectKey });
    return {
      allowed: false,
      remaining: 0,
      resetIn: windowMs
    };
  }

  if (!entry || now > entry.resetTime) {
    inMemoryStore.set(storageKey, {
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
