/**
 * Signed webhook to the sales bot when a customer opens a proposal (#1900,
 * epic #1894). The bot (Clara, decision D3) drafts the follow-up for Felipe;
 * nothing reaches the customer without his explicit OK (#1903).
 *
 * Sent on the first open and on a reopen 30 minutes or more after the
 * previous one. Internal previews, link previews and prefetches never record
 * an open (lib/proposal-page.ts), so they never reach this module.
 *
 * Request: POST JSON to PROPOSAL_WEBHOOK_URL with
 * `Authorization: Bearer PROPOSAL_WEBHOOK_KEY` (the receiver's own key) and an
 * envelope body `{"payload": "<JSON text>", "signature": "v1=<hex>", "ts": <unix s>}`.
 * The receiver (a Clara automation) only sees the body, `content-type` and
 * `user-agent`, so the signature travels inside the body:
 * - `ts`: unix seconds of the send (not of the open, which is `openedAt` in
 *   the payload), so the receiver's 5-minute window holds even if delivery is
 *   ever deferred;
 * - `signature`: `v1=` + hex HMAC-SHA256 of `<ts>.<payload>` under
 *   PROPOSAL_WEBHOOK_SECRET (verify with `verifyProposalWebhook`);
 * - `payload.eventId`: a retry repeats it, so the receiver deduplicates on it.
 *
 * The payload carries no proposal id or URL: the id opens the proposal and,
 * on a redirect, leads to the operator's booking token. `proposalRef` is a
 * one-way hash of the id that whoever created the proposal can recompute
 * (`createProposalRef`), and `leadId` says whose proposal it is.
 *
 * Never log the webhook URL, the key, the id or the lead id.
 */
import { z } from 'zod';

import { logger } from './logger';
import { timingSafeEqual } from './security';

export const PROPOSAL_REOPEN_NOTIFY_GAP_MS = 30 * 60 * 1000;
export const PROPOSAL_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const PROPOSAL_REF_CONTEXT = 'proposta-ref:v1';
const PROPOSAL_REF_HEX_LENGTH = 32;
const SIGNATURE_VERSION = 'v1';
const USER_AGENT = 'Anhanga-Proposal-Webhook/1';
// Worst case 3 × 5 s plus 1 s + 3 s of backoff, inside the ~30 s Cloudflare
// keeps a `waitUntil` alive after the response.
const ATTEMPT_TIMEOUT_MS = 5_000;
const RETRY_DELAYS_MS = [1_000, 3_000];

const proposalOpenedPayloadSchema = z.strictObject({
    event: z.literal('proposal.opened'),
    eventId: z.string().regex(/^[0-9a-f]{32}:\d+$/),
    proposalRef: z.string().regex(/^[0-9a-f]{32}$/),
    leadId: z.number().int().positive(),
    openCount: z.number().int().positive(),
    isFirstOpen: z.boolean(),
    openedAt: z.iso.datetime(),
    previousOpenAt: z.iso.datetime().nullable(),
});

export type ProposalOpenedPayload = z.infer<typeof proposalOpenedPayloadSchema>;

/** The body sent to the receiver: the signed payload text and its signature. */
export interface ProposalWebhookEnvelope {
    payload: string;
    signature: string;
    ts: number;
}

interface WebhookConfig {
    url: string;
    key: string;
    secret: string;
}

export interface ProposalWebhookDeps {
    fetch?: typeof fetch;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
}

export interface ProposalOpenNotice {
    id: string;
    leadId?: number;
    count: number;
    previousOpenAt: number | null;
    openedAt: number;
}

function toHex(bytes: ArrayBuffer): string {
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

function getWebhookConfig(): WebhookConfig | null {
    const url = process.env.PROPOSAL_WEBHOOK_URL?.trim();
    const key = process.env.PROPOSAL_WEBHOOK_KEY?.trim();
    const secret = process.env.PROPOSAL_WEBHOOK_SECRET?.trim();
    if (!url || !key || !secret) return null;
    try {
        return new URL(url).protocol === 'https:' ? { url, key, secret } : null;
    } catch {
        return null;
    }
}

/** One-way reference to a proposal: the id can't be recovered from it. */
export async function createProposalRef(id: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${PROPOSAL_REF_CONTEXT}:${id}`));
    return toHex(digest).slice(0, PROPOSAL_REF_HEX_LENGTH);
}

/** First open, or a reopen at least 30 minutes after the previous one. */
export function shouldNotifyProposalOpen(previousOpenAt: number | null, openedAt: number): boolean {
    return previousOpenAt === null || openedAt - previousOpenAt >= PROPOSAL_REOPEN_NOTIFY_GAP_MS;
}

export async function signProposalWebhook(secret: string, timestamp: number, payload: string): Promise<string> {
    return `${SIGNATURE_VERSION}=${await hmacSha256Hex(secret, `${timestamp}.${payload}`)}`;
}

/**
 * Receiver-side check of the envelope (raw JSON text or already parsed): a
 * valid signature of this exact payload text, with a `ts` no more than five
 * minutes from `now`, and a payload of the expected shape. Returns the
 * parsed payload, or null.
 */
export async function verifyProposalWebhook(input: {
    body: unknown;
    secret: string;
    now?: number;
}): Promise<ProposalOpenedPayload | null> {
    let envelope: unknown = input.body;
    if (typeof envelope === 'string') {
        try {
            envelope = JSON.parse(envelope);
        } catch {
            return null;
        }
    }
    if (typeof envelope !== 'object' || envelope === null) return null;
    const { payload, signature, ts } = envelope as Partial<Record<keyof ProposalWebhookEnvelope, unknown>>;
    if (typeof payload !== 'string' || typeof signature !== 'string' || !Number.isSafeInteger(ts)) return null;
    const timestamp = ts as number;
    const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000);
    if (Math.abs(nowSeconds - timestamp) > PROPOSAL_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS) return null;
    if (!timingSafeEqual(await signProposalWebhook(input.secret, timestamp, payload), signature)) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(payload);
    } catch {
        return null;
    }
    const result = proposalOpenedPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
}

function isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
}

function defaultSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliver(
    config: WebhookConfig,
    payload: ProposalOpenedPayload,
    deps: ProposalWebhookDeps,
): Promise<void> {
    const fetchImpl = deps.fetch ?? fetch;
    const sleep = deps.sleep ?? defaultSleep;
    const payloadText = JSON.stringify(payload);
    const ts = Math.floor((deps.now ?? Date.now)() / 1000);
    const envelope: ProposalWebhookEnvelope = {
        payload: payloadText,
        signature: await signProposalWebhook(config.secret, ts, payloadText),
        ts,
    };
    const body = JSON.stringify(envelope);
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Authorization: `Bearer ${config.key}`,
    };

    const attempts = RETRY_DELAYS_MS.length + 1;
    let outcome: { status?: number; errorName?: string } = {};
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetchImpl(config.url, {
                method: 'POST',
                headers,
                body,
                redirect: 'manual',
                signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
            });
            if (response.ok) {
                logger.info('PROPOSAL_WEBHOOK', { stage: 'delivered', attempt, openCount: payload.openCount });
                return;
            }
            outcome = { status: response.status };
            if (!isRetryable(response.status)) break;
        } catch (error) {
            outcome = { errorName: error instanceof Error ? error.name : typeof error };
        }
        if (attempt < attempts) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
    logger.error('PROPOSAL_WEBHOOK', { stage: 'failed', openCount: payload.openCount, ...outcome });
}

/**
 * Notifies the bot about a recorded open when it is due. Never throws: runs
 * inside the page's `waitUntil`, after the customer already has the response.
 */
export async function notifyProposalOpen(notice: ProposalOpenNotice, deps: ProposalWebhookDeps = {}): Promise<void> {
    try {
        if (!shouldNotifyProposalOpen(notice.previousOpenAt, notice.openedAt)) return;

        const config = getWebhookConfig();
        if (!config) {
            logger.info('PROPOSAL_WEBHOOK', { stage: 'not_configured' });
            return;
        }
        if (notice.leadId === undefined) {
            logger.warn('PROPOSAL_WEBHOOK', { stage: 'skipped_without_lead' });
            return;
        }

        const proposalRef = await createProposalRef(notice.id);
        const payload: ProposalOpenedPayload = {
            event: 'proposal.opened',
            // The count comes from an atomic RPUSH: racing opens get distinct ids.
            eventId: `${proposalRef}:${notice.count}`,
            proposalRef,
            leadId: notice.leadId,
            openCount: notice.count,
            isFirstOpen: notice.count === 1,
            openedAt: new Date(notice.openedAt).toISOString(),
            previousOpenAt: notice.previousOpenAt === null ? null : new Date(notice.previousOpenAt).toISOString(),
        };
        await deliver(config, payload, deps);
    } catch (error) {
        logger.error('PROPOSAL_WEBHOOK', {
            stage: 'unexpected',
            errorName: error instanceof Error ? error.name : typeof error,
        });
    }
}
