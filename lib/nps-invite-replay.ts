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
    del(key: string): Promise<unknown>;
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
            logger.error('NPS_INVITE_REPLAY: Redis unavailable on edge runtime; denying invitation consumption', { jti });
            return false;
        }
        if (inMemoryConsumed.has(key)) return false;
        inMemoryConsumed.add(key);
        return true;
    }

    const result = await redis.set(key, '1', { nx: true, ex: Math.max(1, ttlSeconds) });
    return result === 'OK';
}

/**
 * Releases a `jti` marked consumed by `consumeNpsInviteOnce`. Call this only
 * when the Odoo write that was supposed to follow actually failed — the token
 * is consumed *before* the write (so concurrent double-submits are still
 * rejected atomically), but a transient provider failure must not permanently
 * burn a customer's single-use invite; releasing it lets a retry with the
 * same link succeed instead of forcing a brand-new invitation to be issued.
 */
export async function releaseNpsInvite(jti: string): Promise<void> {
    const key = `${KEY_PREFIX}:${jti}`;
    const redis = await getRedisClient();

    if (!redis) {
        inMemoryConsumed.delete(key);
        return;
    }

    await redis.del(key).catch((error) => {
        logger.warn('NPS_INVITE_REPLAY: failed to release jti after a send failure', {
            jti,
            detail: error instanceof Error ? error.message : String(error),
        });
    });
}
