/**
 * Short-lived distributed lock keyed by a lead's idempotency key (issue #1136).
 *
 * A single Odoo `crm.lead` model has no unique constraint to lean on, so two
 * requests racing to create the same logical lead (retry, double-submit,
 * duplicate delivery) can both miss a find-before-create check and both
 * create a record. This lock serializes that narrow window: the loser polls
 * for the lock to free up — actually waiting for the winner's Odoo round trip
 * to finish, not just a fixed pause — and only proceeds without it as a last
 * resort once the poll budget is exhausted.
 */
import { logger } from './logger';
import { getRedisClient, isEdgeRuntime } from './redis-client';

const LOCK_TTL_SECONDS = 15;
const LOCK_POLL_INTERVAL_MS = 200;
// A winner's find-before-create can take up to PER_CALL_TIMEOUT_MS
// (services/odoo.ts) per round trip; this budget gives the loser a real
// chance to outlast it while still leaving headroom in the caller's overall
// TOTAL_DEADLINE_MS for its own find-before-create afterward.
const LOCK_MAX_WAIT_MS = 3500;

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
 * Repeatedly calls `tryAcquire` until it succeeds or `LOCK_MAX_WAIT_MS`
 * elapses. Returns whether the lock was ultimately acquired.
 */
async function pollForLock(tryAcquire: () => Promise<boolean> | boolean): Promise<boolean> {
    const pollDeadline = Date.now() + LOCK_MAX_WAIT_MS;
    for (;;) {
        if (await tryAcquire()) return true;
        if (Date.now() >= pollDeadline) return false;
        await sleep(LOCK_POLL_INTERVAL_MS);
    }
}

/**
 * Runs `fn` under a short-lived lock keyed by `idempotencyKey`. When the lock
 * is already held by a concurrent call, polls for up to `LOCK_MAX_WAIT_MS`
 * before giving up and invoking `fn` unlocked — callers must implement `fn`
 * as find-before-create so a call that never got the lock still converges on
 * the winner's record instead of creating a duplicate.
 */
export async function withLeadIdempotencyLock<T>(idempotencyKey: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `odoo:lead:lock:${idempotencyKey}`;
    const redis = await getRedisClient();

    if (!redis) {
        if (isEdgeRuntime()) {
            logger.warn('ODOO_LEAD_IDEMPOTENCY: Redis unavailable on edge runtime; concurrency lock is a no-op', { idempotencyKey });
        }
        const acquired = await pollForLock(() => acquireInMemoryLock(lockKey));
        if (!acquired) {
            logger.warn('ODOO_LEAD_IDEMPOTENCY: in-memory lock still held after max wait; proceeding without it', { idempotencyKey });
            return fn();
        }
        try {
            return await fn();
        } finally {
            releaseInMemoryLock(lockKey);
        }
    }

    const acquired = await pollForLock(async () => (await redis.set(lockKey, '1', { nx: true, ex: LOCK_TTL_SECONDS })) === 'OK');
    if (!acquired) {
        logger.warn('ODOO_LEAD_IDEMPOTENCY: Redis lock still held after max wait; proceeding without it', { idempotencyKey });
        return fn();
    }

    try {
        return await fn();
    } finally {
        await redis.del(lockKey).catch(() => undefined);
    }
}
