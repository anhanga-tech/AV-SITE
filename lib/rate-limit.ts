import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

const redis = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
})();

function getRedisClient() {
  return redis;
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
  const redis = getRedisClient();

  if (redis) {
    try {
      const key = `${prefix}:${clientIP}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      const ttl = await redis.ttl(key);
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
