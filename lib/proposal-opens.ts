/**
 * Open log for `/proposta/<id>` (epic #1894, issue #1897).
 *
 * One Redis list per proposal, one JSON event per customer open holding only
 * its UTC instant. The list length is the open count. Its TTL is fixed at the
 * first open (`EXPIRE NX`), so no event is kept more than 90 days (decision D5).
 *
 * Place, device and an IP hash were collected at first, but nothing read
 * them, so they were dropped (data minimization, LGPD Art. 6º, III). Add a
 * field back only together with the feature that uses it.
 *
 * Never log the id (see lib/proposal-store.ts).
 */
import { logger } from './logger';
import { getRedisClient, type RedisClientLike } from './redis-client';

const DAY_SECONDS = 24 * 60 * 60;
export const PROPOSAL_OPENS_RETENTION_SECONDS = 90 * DAY_SECONDS;

const OPENS_KEY_PREFIX = 'proposta:abr';

// Also covers the store's reads: the page hands this one client to both.
export type ProposalOpensRedis = Pick<RedisClientLike, 'multi' | 'set' | 'mget'>;

export interface ProposalOpenEvent {
    at: string;
}

/** A recorded open: the new count, its instant, and the previous open's (null on the first). */
export interface RecordedProposalOpen {
    count: number;
    openedAt: number;
    previousOpenAt: number | null;
}

export interface ProposalOpensDeps {
    redis?: ProposalOpensRedis | null;
    now?: () => number;
}

export function opensKey(id: string): string {
    return `${OPENS_KEY_PREFIX}:${id}`;
}

/** The `at` of a stored event, raw JSON string or Upstash's auto-deserialized object. */
function storedEventTime(value: unknown): number | null {
    let event = value;
    if (typeof event === 'string') {
        try {
            event = JSON.parse(event);
        } catch {
            return null;
        }
    }
    if (!event || typeof event !== 'object') return null;
    const at = Date.parse(String((event as { at?: unknown }).at));
    return Number.isNaN(at) ? null : at;
}

/**
 * Appends one open and returns the new count with the previous open's time,
 * or `null` when it could not be recorded. Never throws: a counting failure
 * must not break the page.
 */
export async function recordProposalOpen(
    id: string,
    deps: ProposalOpensDeps = {},
): Promise<RecordedProposalOpen | null> {
    try {
        const redis = deps.redis !== undefined ? deps.redis : await getRedisClient();
        if (!redis) return null;

        const now = (deps.now ?? Date.now)();
        const event: ProposalOpenEvent = { at: new Date(now).toISOString() };
        const key = opensKey(id);
        // One transaction: an append whose TTL write failed would keep the
        // list past the 90 days, since nothing else expires it. Reading the
        // last event inside it gives each open its own predecessor, even
        // when two opens race.
        const transaction = redis.multi();
        transaction.lindex(key, -1);
        transaction.rpush(key, JSON.stringify(event));
        transaction.expire(key, PROPOSAL_OPENS_RETENTION_SECONDS, 'NX');
        const [previous, count] = await transaction.exec();
        if (typeof count !== 'number') return null;
        return { count, openedAt: now, previousOpenAt: storedEventTime(previous) };
    } catch (error) {
        // Name only: Upstash error messages carry the command, i.e. the key with the id.
        logger.error('PROPOSAL_OPENS: failed to record open', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return null;
    }
}
