/**
 * Retention limits for the `/proposta/<id>` keys in Redis (decision D5, P12
 * #1902). The TTLs set on write do the purge; this module only decides
 * whether a key's remaining TTL is within its limit, for the daily audit
 * (scripts/audit-proposal-retention.ts).
 *
 * Two limits apply. The global ceiling per prefix catches any key; the
 * per-proposal deadline (from the expiry stored in the tombstone, or the
 * first open) catches a short proposal kept past its own validity.
 *
 * No imports on purpose: the audit runs with plain `node`, without
 * installing dependencies, in the job that holds the Redis token.
 * tests/proposal-retention.test.ts keeps these limits equal to the ones the
 * store and the open log write.
 */

const DAY_SECONDS = 24 * 60 * 60;
const TOMBSTONE_GRACE_MS = 30 * DAY_SECONDS * 1000;
const OPENS_RETENTION_MS = 90 * DAY_SECONDS * 1000;
// Rounding and the gap between the app's clock and Redis's.
const DEADLINE_SLACK_MS = 60_000;

export const PROPOSAL_RETENTION_LIMITS: Readonly<Record<string, number>> = {
    // Proposal record: its validity, at most 15 days.
    'proposta:rec': 15 * DAY_SECONDS,
    // Expiry marker: validity + 30 days of grace.
    'proposta:exp': 45 * DAY_SECONDS,
    // Open log: 90 days from the first open.
    'proposta:abr': 90 * DAY_SECONDS,
};

/** Outcome for one key: within its limit, past it, without a TTL, or not a known proposal key. */
export type RetentionCheck = 'ok' | 'gone' | 'no_ttl' | 'over_limit' | 'unknown_key';

/** The known prefix of a well-formed key (`proposta:rec:<id>` etc.), or null. Safe to log. */
export function proposalKeyPrefix(key: string): string | null {
    const prefix = key.split(':', 2).join(':');
    if (PROPOSAL_RETENTION_LIMITS[prefix] === undefined || key.length <= prefix.length + 1) return null;
    return prefix;
}

/**
 * The instant a key must be gone by, from the proposal's stored expiry
 * (`proposta:exp:<id>` value, epoch ms) or its first open (epoch ms).
 * Undefined when the source is unknown; the global ceiling still applies.
 */
export function proposalKeyDeadline(
    prefix: string,
    source: { expiresAt?: number; firstOpenAt?: number },
): number | undefined {
    if (prefix === 'proposta:rec') return source.expiresAt;
    if (prefix === 'proposta:exp') return source.expiresAt === undefined ? undefined : source.expiresAt + TOMBSTONE_GRACE_MS;
    if (prefix === 'proposta:abr') return source.firstOpenAt === undefined ? undefined : source.firstOpenAt + OPENS_RETENTION_MS;
    return undefined;
}

/** `ttlSeconds` is Redis `TTL`: -1 without expiry, -2 already gone. */
export function checkProposalKeyRetention(
    key: string,
    ttlSeconds: number,
    options: { now?: number; deadline?: number } = {},
): RetentionCheck {
    // Gone first: a key that expired between SCAN and TTL, known or not, no longer exists.
    if (ttlSeconds === -2) return 'gone';
    const prefix = proposalKeyPrefix(key);
    if (prefix === null) return 'unknown_key';
    if (ttlSeconds < 0) return 'no_ttl';
    if (ttlSeconds > PROPOSAL_RETENTION_LIMITS[prefix]) return 'over_limit';
    const { now, deadline } = options;
    if (now !== undefined && deadline !== undefined && now + ttlSeconds * 1000 > deadline + DEADLINE_SLACK_MS) {
        return 'over_limit';
    }
    return 'ok';
}
