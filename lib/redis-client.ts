import { logger } from './logger';

/** Subset of the Upstash Redis client surface used across `lib/` (rate limiting, idempotency locks). */
export interface RedisClientLike {
    pipeline(): { incr(key: string): void; ttl(key: string): void; exec(): Promise<unknown[]> };
    expire(key: string, seconds: number): Promise<unknown>;
    set(key: string, value: string, opts: { nx: true; ex: number }): Promise<string | null>;
    del(key: string): Promise<unknown>;
}

// True when running inside a managed serverless edge runtime where module-level
// state resets per request. Both Vercel (VERCEL_ENV) and Cloudflare Pages
// (CF_PAGES) are detected; local development has neither variable set.
// Implemented as a function so tests can control env vars at call time.
export function isEdgeRuntime(): boolean {
    return Boolean(process.env.VERCEL_ENV || process.env.CF_PAGES);
}

// Cached by (url, token) so a warm isolate/process reuses the same client
// instead of reconstructing it on every call, while still picking up a
// credential rotation (or a test swapping env vars) instead of serving a
// stale instance. On Cloudflare Workers this only helps requests that land on
// an already-warm isolate — a fresh isolate still starts with no cache — but
// costs nothing on the cold path either.
let cachedClient: { url: string; token: string; instance: RedisClientLike } | null = null;

export async function getRedisClient(): Promise<RedisClientLike | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        if (isEdgeRuntime()) {
            // Each serverless edge invocation (Vercel or Cloudflare) gets a fresh V8
            // isolate — any module-level in-memory fallback resets on every request
            // and provides no real protection. Configure Upstash Redis to enable
            // shared state across all edge instances.
            logger.error(
                'RedisClient: Upstash Redis not configured. ' +
                'In-memory fallback is non-functional on edge runtimes (isolated V8 contexts per request). ' +
                'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment variables.'
            );
        }
        return null;
    }

    if (cachedClient && cachedClient.url === url && cachedClient.token === token) {
        return cachedClient.instance;
    }

    try {
        // CF Workers do not support the `cache` field on fetch RequestInit.
        // The default entry point (`@upstash/redis`) passes `cache: 'no-store'`,
        // which throws at runtime. The `/cloudflare` entry omits it.
        const mod = process.env.CF_PAGES
            ? await import('@upstash/redis/cloudflare')
            : await import('@upstash/redis');
        const instance = new mod.Redis({ url, token });
        cachedClient = { url, token, instance };
        return instance;
    } catch {
        logger.warn('RedisClient: @upstash/redis not available, using in-memory fallback');
        return null;
    }
}
