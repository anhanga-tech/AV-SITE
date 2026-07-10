/**
 * Short-lived distributed lock keyed by a lead's idempotency key (issue #1136).
 *
 * A single Odoo `crm.lead` model has no unique constraint to lean on, so two
 * requests racing to create the same logical lead (retry, double-submit,
 * duplicate delivery) can both miss a find-before-create check and both
 * create a record. This lock serializes that narrow window: the loser waits
 * briefly and re-runs its own find-before-create instead of creating blind —
 * long enough to outlast the winner's Odoo round trip, not to guarantee the
 * record already exists.
 */
import { logger } from './logger';
import { getRedisClient, isEdgeRuntime } from './redis-client';

const LOCK_TTL_SECONDS = 15;
const WAIT_AFTER_LOCK_MISS_MS = 300;

// Local-dev-only fallback (mirrors lib/rate-limit.ts): module state resets per
// request on edge runtimes, so this Map is not a real lock there — it only
// helps within a single Node process (tests, `pnpm dev`).
const inMemoryLocks = new Map<string, number>();

function acquireInMemoryLock(key: string): boolean {
    const now = Date.now();
    const expiry = inMemoryLocks.get(key);
    if (expiry && expiry > now) return false;
    inMemoryLocks.set(key, now + LOCK_TTL_SECONDS * 1000);
    return true;
}

function releaseInMemoryLock(key: string): void {
    inMemoryLocks.delete(key);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` under a short-lived lock keyed by `idempotencyKey`. When the lock
 * is already held by a concurrent call, waits briefly and still invokes `fn`
 * — callers must implement `fn` as find-before-create so the delayed call
 * converges on the winner's record instead of creating a duplicate.
 */
export async function withLeadIdempotencyLock<T>(idempotencyKey: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `odoo:lead:lock:${idempotencyKey}`;
    const redis = await getRedisClient();

    if (!redis) {
        if (isEdgeRuntime()) {
            logger.warn('ODOO_LEAD_IDEMPOTENCY: Redis unavailable on edge runtime; concurrency lock is a no-op', { idempotencyKey });
        }
        if (!acquireInMemoryLock(lockKey)) {
            await sleep(WAIT_AFTER_LOCK_MISS_MS);
            return fn();
        }
        try {
            return await fn();
        } finally {
            releaseInMemoryLock(lockKey);
        }
    }

    const acquired = await redis.set(lockKey, '1', { nx: true, ex: LOCK_TTL_SECONDS });
    if (acquired !== 'OK') {
        await sleep(WAIT_AFTER_LOCK_MISS_MS);
        return fn();
    }

    try {
        return await fn();
    } finally {
        await redis.del(lockKey).catch(() => undefined);
    }
}
