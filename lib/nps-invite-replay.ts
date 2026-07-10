/**
 * Single-use tracking for NPS invitation tokens (issue #1137). A signature +
 * expiry check alone lets a captured link (forwarded e-mail, shared screen,
 * leaked analytics referrer) be replayed indefinitely within its validity
 * window; this marks a token's `jti` consumed on first successful submit so a
 * replay is rejected even though the signature and expiry still check out.
 */
import { logger } from './logger';

const KEY_PREFIX = 'nps:invite:used';

interface RedisSetLike {
    set(key: string, value: string, opts: { nx: true; ex: number }): Promise<string | null>;
}

// True when running inside a managed serverless edge runtime where module-level
// state resets per request. Both Vercel (VERCEL_ENV) and Cloudflare Pages
// (CF_PAGES) are detected; local development has neither variable set.
function isEdgeRuntime(): boolean {
    return Boolean(process.env.VERCEL_ENV || process.env.CF_PAGES);
}

async function getRedisClient(): Promise<RedisSetLike | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    try {
        // CF Workers do not support the `cache` field on fetch RequestInit; the
        // default entry point passes `cache: 'no-store'`, which throws there.
        const mod = process.env.CF_PAGES
            ? await import('@upstash/redis/cloudflare')
            : await import('@upstash/redis');
        return new mod.Redis({ url, token });
    } catch {
        return null;
    }
}

// Local-dev-only fallback (mirrors lib/rate-limit.ts): module state resets per
// request on edge runtimes, so this Set is not a real guard there — Upstash
// Redis is required in production.
const inMemoryConsumed = new Set<string>();

/**
 * Attempts to mark `jti` as consumed. Returns true the first time (the caller
 * may proceed), false if it was already consumed (reject as replayed).
 * `ttlSeconds` should cover the token's remaining validity window so the
 * Redis key doesn't outlive a token that could never be replayed again anyway.
 */
export async function consumeNpsInviteOnce(jti: string, ttlSeconds: number): Promise<boolean> {
    const key = `${KEY_PREFIX}:${jti}`;
    const redis = await getRedisClient();

    if (!redis) {
        if (isEdgeRuntime()) {
            logger.warn('NPS_INVITE_REPLAY: Redis unavailable on edge runtime; single-use guard is a no-op', { jti });
        }
        if (inMemoryConsumed.has(key)) return false;
        inMemoryConsumed.add(key);
        return true;
    }

    const result = await redis.set(key, '1', { nx: true, ex: Math.max(1, ttlSeconds) });
    return result === 'OK';
}
