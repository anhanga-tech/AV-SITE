export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // in milliseconds
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

// True when running inside Vercel (production, preview, or development deployment).
// process.env.VERCEL_ENV is injected automatically by Vercel at build/runtime.
const IS_VERCEL_RUNTIME = Boolean(process.env.VERCEL_ENV);

async function getRedisClient(): Promise<RedisLike | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (IS_VERCEL_RUNTIME) {
      // Each Vercel Edge invocation gets a fresh V8 isolate — the in-memory Map
      // above resets on every request and provides no real protection.
      // Configure UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to enable
      // shared rate limiting across all Edge instances.
      console.error(
        'RateLimit: Upstash Redis not configured. ' +
        'In-memory fallback is non-functional on Vercel Edge Runtime (isolated V8 contexts per request). ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your Vercel environment variables.'
      );
    }
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  } catch {
    console.warn('RateLimit: @upstash/redis not available, using in-memory fallback');
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
      console.error('RateLimit: Redis error, falling back to in-memory', error);
      // Fallback to in-memory if Redis fails
    }
  }

  // In-memory fallback
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
    console.warn(`RateLimit: In-memory store capacity reached. Rejecting new key for ${clientIP}.`);
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
