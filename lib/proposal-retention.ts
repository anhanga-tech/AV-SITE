/**
 * Retention limits for the `/proposta/<id>` keys in Redis (decision D5, P12
 * #1902). The TTLs set on write do the purge; this module only decides
 * whether a key's remaining TTL is within its limit, for the daily audit
 * (scripts/audit-proposal-retention.ts).
 *
 * No imports on purpose: the audit runs with plain `node`, without
 * installing dependencies, in the job that holds the Redis token.
 * tests/proposal-retention.test.ts keeps these limits equal to the ones the
 * store and the open log write.
 */

const DAY_SECONDS = 24 * 60 * 60;

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

/** `ttlSeconds` is Redis `TTL`: -1 without expiry, -2 already gone. */
export function checkProposalKeyRetention(key: string, ttlSeconds: number): RetentionCheck {
    const prefix = key.split(':', 2).join(':');
    const limit = PROPOSAL_RETENTION_LIMITS[prefix];
    if (limit === undefined || key.length <= prefix.length + 1) return 'unknown_key';
    if (ttlSeconds === -2) return 'gone';
    if (ttlSeconds < 0) return 'no_ttl';
    return ttlSeconds > limit ? 'over_limit' : 'ok';
}
