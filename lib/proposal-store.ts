/**
 * Storage for the proposal link `/proposta/<id>` (epic #1894, issue #1895).
 *
 * The id is the only credential that opens a proposal, so it is random
 * (base62, ~95 bits), never sequential and never derived from a CRM or
 * operator id. Two Redis keys per proposal:
 *
 * - the record, with a TTL equal to the validity (15 days, decision D5), so
 *   the proposal content is gone the moment the link expires;
 * - a tombstone holding only the expiry instant, kept for a grace period
 *   after that, so an expired link answers 410 "Proposta expirada" instead of
 *   a 404 that would read as "this never existed".
 *
 * Never log the id: warn/error output reaches Sentry Logs, which the URL
 * scrubbers in lib/error-tracking.ts do not cover.
 */
import { z } from 'zod';

import { logger } from './logger';
import { parseAllowedRedirectUrl } from './proposal-redirect';
import { getRedisClient, type RedisClientLike } from './redis-client';

const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const PROPOSAL_ID_LENGTH = 16;
const PROPOSAL_ID_PATTERN = /^[0-9A-Za-z]{16}$/;
// Largest multiple of 62 that fits in a byte: bytes at or above it are
// discarded so every character is equally likely (a plain `% 62` is biased).
const UNBIASED_BYTE_LIMIT = 248;

const DAY_SECONDS = 24 * 60 * 60;
export const PROPOSAL_VALIDITY_SECONDS = 15 * DAY_SECONDS;
export const PROPOSAL_TOMBSTONE_GRACE_SECONDS = 30 * DAY_SECONDS;

const RECORD_KEY_PREFIX = 'proposta:rec';
const TOMBSTONE_KEY_PREFIX = 'proposta:exp';

export type ProposalRedis = Pick<RedisClientLike, 'set' | 'mget'>;

export interface ProposalStoreDeps {
    redis?: ProposalRedis | null;
    now?: () => number;
}

const proposalRecordSchema = z.object({
    v: z.literal(1),
    createdAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().positive(),
    // Present on a tracked-redirect proposal (#1896). Re-checked against the
    // allowlist on every read, so a stored URL can never become an open redirect.
    redirectUrl: z.string().refine((value) => parseAllowedRedirectUrl(value) === value).optional(),
});

export type ProposalRecord = z.infer<typeof proposalRecordSchema>;

export type ProposalLookup =
    | { status: 'active'; proposal: ProposalRecord }
    | { status: 'expired' }
    | { status: 'not_found' }
    | { status: 'unavailable' };

export function createProposalId(): string {
    let id = '';
    while (id.length < PROPOSAL_ID_LENGTH) {
        for (const byte of crypto.getRandomValues(new Uint8Array(PROPOSAL_ID_LENGTH * 2))) {
            if (byte >= UNBIASED_BYTE_LIMIT) continue;
            id += ID_ALPHABET[byte % ID_ALPHABET.length];
            if (id.length === PROPOSAL_ID_LENGTH) break;
        }
    }
    return id;
}

export function isValidProposalId(value: unknown): value is string {
    return typeof value === 'string' && PROPOSAL_ID_PATTERN.test(value);
}

function recordKey(id: string): string {
    return `${RECORD_KEY_PREFIX}:${id}`;
}

function tombstoneKey(id: string): string {
    return `${TOMBSTONE_KEY_PREFIX}:${id}`;
}

async function resolveRedis(deps: ProposalStoreDeps): Promise<ProposalRedis | null> {
    if (deps.redis !== undefined) return deps.redis;
    return getRedisClient();
}

/** Accepts both the raw JSON string and Upstash's auto-deserialized value. */
function parseStoredJson(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

/**
 * Stores a new proposal and returns its id. Throws when Redis is unavailable
 * or the write fails — the caller (the internal creation endpoint, #1899)
 * maps that to its own error response.
 */
export async function saveProposal(
    options: { validitySeconds?: number; redirectUrl?: string } = {},
    deps: ProposalStoreDeps = {},
): Promise<{ id: string; expiresAt: number }> {
    const redis = await resolveRedis(deps);
    if (!redis) throw new Error('PROPOSAL_STORE: Redis unavailable');

    const validitySeconds = options.validitySeconds ?? PROPOSAL_VALIDITY_SECONDS;
    if (!Number.isInteger(validitySeconds) || validitySeconds <= 0) {
        throw new Error('PROPOSAL_STORE: validitySeconds must be a positive integer');
    }

    let redirectUrl: string | undefined;
    if (options.redirectUrl !== undefined) {
        redirectUrl = parseAllowedRedirectUrl(options.redirectUrl) ?? undefined;
        if (!redirectUrl) throw new Error('PROPOSAL_STORE: redirectUrl is not an allowed operator link');
    }

    const now = (deps.now ?? Date.now)();
    const id = createProposalId();
    const record: ProposalRecord = { v: 1, createdAt: now, expiresAt: now + validitySeconds * 1000 };
    if (redirectUrl) record.redirectUrl = redirectUrl;

    // Tombstone first: if the record write then fails, the leftover tombstone
    // only makes a never-shared id answer 410, never exposes content.
    await redis.set(tombstoneKey(id), String(record.expiresAt), {
        ex: validitySeconds + PROPOSAL_TOMBSTONE_GRACE_SECONDS,
    });
    const written = await redis.set(recordKey(id), JSON.stringify(record), { nx: true, ex: validitySeconds });
    if (written === null) throw new Error('PROPOSAL_STORE: id collision');

    return { id, expiresAt: record.expiresAt };
}

export async function loadProposal(id: string, deps: ProposalStoreDeps = {}): Promise<ProposalLookup> {
    if (!isValidProposalId(id)) return { status: 'not_found' };

    const redis = await resolveRedis(deps);
    if (!redis) return { status: 'unavailable' };

    let stored: unknown[];
    try {
        stored = await redis.mget(recordKey(id), tombstoneKey(id));
    } catch (error) {
        // Name only: Upstash appends the failed command to its error message
        // (`command was: ["mget","proposta:rec:<id>",…]`), which is the id.
        logger.error('PROPOSAL_STORE: Redis read failed', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return { status: 'unavailable' };
    }

    const [rawRecord, rawTombstone] = stored;
    const now = (deps.now ?? Date.now)();

    if (rawRecord === null || rawRecord === undefined) {
        // No record: either it expired (tombstone still within the grace
        // period) or the id never existed / is past the grace period.
        return rawTombstone === null || rawTombstone === undefined
            ? { status: 'not_found' }
            : { status: 'expired' };
    }

    const parsed = proposalRecordSchema.safeParse(parseStoredJson(rawRecord));
    if (!parsed.success) {
        logger.error('PROPOSAL_STORE: stored record failed validation');
        return { status: 'unavailable' };
    }

    // The Redis TTL and `expiresAt` agree to the second; this covers the
    // window between them so the page never outlives its stated validity.
    if (now >= parsed.data.expiresAt) return { status: 'expired' };

    return { status: 'active', proposal: parsed.data };
}
