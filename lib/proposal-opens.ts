/**
 * Open log for `/proposta/<id>` (epic #1894, issue #1897).
 *
 * One Redis list per proposal, one JSON event per customer open: UTC instant,
 * approximate country/city from Cloudflare, device type and a hashed IP. The
 * list length is the open count. Its TTL is fixed at the first open (`EXPIRE
 * NX`), so no event is kept more than 90 days (decision D5).
 *
 * The IP is never stored. It is hashed with a random salt that changes every
 * UTC day and is deleted within two days; once the salt is gone a stored hash
 * can't be linked back to an IP, even by someone holding every secret. Within
 * a day the same network yields the same hash, which is enough to tell "the
 * customer reopened it" from "someone else opened it".
 *
 * Never log the id (see lib/proposal-store.ts).
 */
import { getClientIP } from './network';
import { logger } from './logger';
import { getRedisClient, type RedisClientLike } from './redis-client';

const DAY_SECONDS = 24 * 60 * 60;
export const PROPOSAL_OPENS_RETENTION_SECONDS = 90 * DAY_SECONDS;
const SALT_TTL_SECONDS = 2 * DAY_SECONDS;
const IP_HASH_HEX_LENGTH = 16;
const MAX_GEO_LENGTH = 80;

const OPENS_KEY_PREFIX = 'proposta:abr';
const SALT_KEY_PREFIX = 'proposta:sal';

export type ProposalOpensRedis = Pick<RedisClientLike, 'multi' | 'set' | 'mget'>;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ProposalOpenEvent {
    at: string;
    device: DeviceType;
    country?: string;
    city?: string;
    ipHash?: string;
}

export interface ProposalOpensDeps {
    redis?: ProposalOpensRedis | null;
    now?: () => number;
}

/** Cloudflare's request metadata, present on Workers/Pages requests. */
interface CloudflareGeo {
    country?: unknown;
    city?: unknown;
}

export function opensKey(id: string): string {
    return `${OPENS_KEY_PREFIX}:${id}`;
}

export function classifyDevice(userAgent: string): DeviceType {
    if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
    // Android tablets omit "Mobile" from their UA; phones include it.
    if (/Android/i.test(userAgent)) return /Mobile/i.test(userAgent) ? 'mobile' : 'tablet';
    if (/Mobi|iPhone|iPod/i.test(userAgent)) return 'mobile';
    return 'desktop';
}

function geoField(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, MAX_GEO_LENGTH) : undefined;
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(message: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
    return toHex(new Uint8Array(digest));
}

/** Today's salt, created on first use. Concurrent creators converge on one value via `SET NX`. */
async function dailySalt(redis: ProposalOpensRedis, now: number): Promise<string | null> {
    const key = `${SALT_KEY_PREFIX}:${new Date(now).toISOString().slice(0, 10)}`;
    const [existing] = await redis.mget(key);
    if (typeof existing === 'string' && existing) return existing;

    // Prefixed so Upstash's JSON auto-deserialization never reads it as a
    // number (an all-digit hex string, or one with a single `e`, would be).
    const candidate = `s${toHex(crypto.getRandomValues(new Uint8Array(32)))}`;
    const created = await redis.set(key, candidate, { nx: true, ex: SALT_TTL_SECONDS });
    if (created !== null) return candidate;

    const [winner] = await redis.mget(key);
    return typeof winner === 'string' && winner ? winner : null;
}

// The id is part of the hash so one network opening two proposals on the same
// day gets unrelated hashes: the log never links one customer's proposals.
async function hashIp(request: Request, id: string, redis: ProposalOpensRedis, now: number): Promise<string | undefined> {
    const ip = getClientIP(request);
    if (!ip || ip === 'unknown') return undefined;
    const salt = await dailySalt(redis, now);
    if (!salt) return undefined;
    return (await sha256Hex(`${salt}:${id}:${ip}`)).slice(0, IP_HASH_HEX_LENGTH);
}

async function buildProposalOpenEvent(
    request: Request,
    id: string,
    redis: ProposalOpensRedis,
    now: number,
): Promise<ProposalOpenEvent> {
    const geo = (request as Request & { cf?: CloudflareGeo }).cf;
    const event: ProposalOpenEvent = {
        at: new Date(now).toISOString(),
        device: classifyDevice(request.headers.get('user-agent') ?? ''),
    };
    const country = geoField(geo?.country);
    const city = geoField(geo?.city);
    const ipHash = await hashIp(request, id, redis, now);
    if (country) event.country = country;
    if (city) event.city = city;
    if (ipHash) event.ipHash = ipHash;
    return event;
}

/**
 * Appends one open and returns the new open count, or `null` when it could
 * not be recorded. Never throws: a counting failure must not break the page.
 */
export async function recordProposalOpen(
    request: Request,
    id: string,
    deps: ProposalOpensDeps = {},
): Promise<number | null> {
    try {
        const redis = deps.redis !== undefined ? deps.redis : await getRedisClient();
        if (!redis) return null;

        const now = (deps.now ?? Date.now)();
        const event = await buildProposalOpenEvent(request, id, redis, now);
        const key = opensKey(id);
        // One transaction: an append whose TTL write failed would keep the
        // list past the 90 days, since nothing else expires it.
        const transaction = redis.multi();
        transaction.rpush(key, JSON.stringify(event));
        transaction.expire(key, PROPOSAL_OPENS_RETENTION_SECONDS, 'NX');
        const [count] = await transaction.exec();
        return typeof count === 'number' ? count : null;
    } catch (error) {
        // Name only: Upstash error messages carry the command, i.e. the key with the id.
        logger.error('PROPOSAL_OPENS: failed to record open', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return null;
    }
}
