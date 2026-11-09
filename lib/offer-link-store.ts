/**
 * Storage for `/o/<slug>` (canal Anhangá Ofertas).
 *
 * Two Redis keys, both with a TTL so nothing lives without an expiry:
 *
 * - `oferta:rec:<slug>` — the offer (message, optional title, optional
 *   expiry). Not a person's data. Kept until `expiresAt` plus 30 days, or
 *   366 days from the last write when the offer has no end date.
 * - `oferta:clk:<slug>` — one JSON `{ at }` per human click. The list length
 *   is the click count. TTL is fixed at the first click (`EXPIRE NX`), so no
 *   event is kept more than 90 days.
 *
 * No IP, not even hashed: nothing reads it (same minimization as proposal
 * opens). No CRM note and no webhook. Never log the message; Upstash errors
 * quote the command, so log only `error.name`.
 */
import { z } from 'zod';

import { logger } from './logger';
import {
    OFFER_CLICKS_RETENTION_SECONDS,
    isValidOfferSlug,
    offerRecordTtlSeconds,
} from './offer-link';
import { getRedisClient, type RedisClientLike } from './redis-client';

const RECORD_KEY_PREFIX = 'oferta:rec';
const CLICKS_KEY_PREFIX = 'oferta:clk';

/**
 * `llen` / `lindex` exist on the Upstash client (it proxies every command)
 * but are not part of the small `RedisClientLike` surface the rest of the
 * site uses. The cast stays inside this module.
 */
export type OfferLinkRedis = Pick<RedisClientLike, 'set' | 'mget' | 'multi'> & {
    llen(key: string): Promise<number>;
    lindex(key: string, index: number): Promise<unknown>;
};

export interface OfferLinkStoreDeps {
    redis?: OfferLinkRedis | null;
    now?: () => number;
}

const offerRecordSchema = z.object({
    v: z.literal(1),
    message: z.string().min(1),
    title: z.string().min(1).nullable(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    /** Epoch ms, or null when the offer has no end date. */
    expiresAt: z.number().int().positive().nullable(),
    /** The `YYYY-MM-DD` the caller sent, echoed back by the API. */
    expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export type OfferRecord = z.infer<typeof offerRecordSchema>;

export type OfferLookup =
    | { status: 'active'; offer: OfferRecord }
    | { status: 'expired'; offer: OfferRecord }
    | { status: 'not_found' }
    | { status: 'unavailable' };

export interface OfferClickStats {
    clicks: number;
    lastClickAt: string | null;
}

export function offerRecordKey(slug: string): string {
    return `${RECORD_KEY_PREFIX}:${slug}`;
}

export function offerClicksKey(slug: string): string {
    return `${CLICKS_KEY_PREFIX}:${slug}`;
}

async function resolveRedis(deps: OfferLinkStoreDeps): Promise<OfferLinkRedis | null> {
    if (deps.redis !== undefined) return deps.redis;
    const client = await getRedisClient();
    // Upstash proxies every command, including LLEN and LINDEX, which the
    // shared RedisClientLike surface does not declare.
    return client ? client as unknown as OfferLinkRedis : null;
}

function parseStoredJson(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

function storedEventTime(value: unknown): string | null {
    let event = value;
    if (typeof event === 'string') {
        try {
            event = JSON.parse(event);
        } catch {
            return null;
        }
    }
    if (!event || typeof event !== 'object') return null;
    const at = (event as { at?: unknown }).at;
    if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return null;
    return at;
}

export async function loadOffer(slug: string, deps: OfferLinkStoreDeps = {}): Promise<OfferLookup> {
    if (!isValidOfferSlug(slug)) return { status: 'not_found' };

    const redis = await resolveRedis(deps);
    if (!redis) return { status: 'unavailable' };

    let stored: unknown[];
    try {
        stored = await redis.mget(offerRecordKey(slug));
    } catch (error) {
        logger.error('OFFER_LINK: Redis read failed', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return { status: 'unavailable' };
    }

    const raw = stored[0];
    if (raw === null || raw === undefined) return { status: 'not_found' };

    const parsed = offerRecordSchema.safeParse(parseStoredJson(raw));
    if (!parsed.success) {
        logger.error('OFFER_LINK: stored record failed validation');
        return { status: 'unavailable' };
    }

    const now = (deps.now ?? Date.now)();
    if (parsed.data.expiresAt !== null && now >= parsed.data.expiresAt) {
        return { status: 'expired', offer: parsed.data };
    }
    return { status: 'active', offer: parsed.data };
}

export interface SaveOfferInput {
    slug: string;
    message: string;
    title: string | null;
    expiresAt: number | null;
    expiresOn: string | null;
}

/**
 * Creates or replaces the offer. A repeated slug updates message, title and
 * expiry and keeps `createdAt` and the click list. Throws when Redis is down;
 * the endpoint maps that to 503.
 */
export async function saveOffer(input: SaveOfferInput, deps: OfferLinkStoreDeps = {}): Promise<OfferRecord> {
    const redis = await resolveRedis(deps);
    if (!redis) throw new Error('OFFER_LINK: Redis unavailable');

    const now = (deps.now ?? Date.now)();
    const existing = await loadOffer(input.slug, { ...deps, redis });
    if (existing.status === 'unavailable') throw new Error('OFFER_LINK: Redis unavailable');

    const record: OfferRecord = {
        v: 1,
        message: input.message,
        title: input.title,
        createdAt: existing.status === 'not_found' ? now : existing.offer.createdAt,
        updatedAt: now,
        expiresAt: input.expiresAt,
        expiresOn: input.expiresOn,
    };

    const ttl = offerRecordTtlSeconds(record.expiresAt, now);
    await redis.set(offerRecordKey(input.slug), JSON.stringify(record), { ex: ttl });
    return record;
}

/**
 * Appends one human click. Returns the new count, or null when it could not
 * be recorded. Never throws: a counting failure must not break the redirect.
 */
export async function recordOfferClick(slug: string, deps: OfferLinkStoreDeps = {}): Promise<number | null> {
    try {
        const redis = await resolveRedis(deps);
        if (!redis) return null;

        const now = (deps.now ?? Date.now)();
        const key = offerClicksKey(slug);
        const transaction = redis.multi();
        transaction.rpush(key, JSON.stringify({ at: new Date(now).toISOString() }));
        transaction.expire(key, OFFER_CLICKS_RETENTION_SECONDS, 'NX');
        const [count] = await transaction.exec();
        return typeof count === 'number' ? count : null;
    } catch (error) {
        logger.error('OFFER_LINK: failed to record click', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return null;
    }
}

/** Clicks excluding previews. `lastClickAt` is the UTC instant of the latest one. */
export async function readOfferClicks(slug: string, deps: OfferLinkStoreDeps = {}): Promise<OfferClickStats | null> {
    try {
        const redis = await resolveRedis(deps);
        if (!redis) return null;
        const key = offerClicksKey(slug);
        const clicks = await redis.llen(key);
        if (!Number.isInteger(clicks) || clicks < 0) return null;
        if (clicks === 0) return { clicks: 0, lastClickAt: null };
        const last = await redis.lindex(key, -1);
        return { clicks, lastClickAt: storedEventTime(last) };
    } catch (error) {
        logger.error('OFFER_LINK: failed to read clicks', {
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return null;
    }
}
