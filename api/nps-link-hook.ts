/**
 * POST /api/nps-link-hook — inbound Odoo webhook that issues a customer's NPS
 * link (lib/nps-link.ts). Never called by the browser.
 *
 * Odoo's "Send Webhook Notification" action can't set headers or sign the
 * body: it POSTs `{"_model", "_id", "_action", ...}` as JSON to a fixed URL
 * with a 1-second timeout and ignores the answer. So:
 * - auth is a shared secret in the URL query, `?secret=<NPS_LINK_WEBHOOK_SECRET>`,
 *   compared in constant time. It lives only in the Odoo server action and in
 *   Cloudflare. `secret` is a redacted key in Sentry and in our logs
 *   (lib/error-tracking.ts, lib/logger.ts);
 * - the body is not trusted beyond `_id`: the lead is re-read from Odoo, and
 *   the link is written back to the lead, never returned. A leaked secret
 *   can at most make the site issue a link, once, to an eligible customer's
 *   own record;
 * - the answer (202) comes before the Odoo round trips, which run in
 *   `waitUntil`, so Odoo's 1-second timeout never cuts the work short.
 *
 * Throttled before the secret check, like create-offer-link. Never log the
 * secret, the lead id or the body.
 */
import { z } from 'zod';

import { buildJsonResponse, buildRateLimitHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { timingSafeEqual } from '../lib/security';
import { issueNpsLinkForLead, npsLinkOriginFor, type NpsLinkDeps } from '../lib/nps-link';

const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 4_096;
const RESPONSE_HEADERS = { 'Cache-Control': 'no-store' };

const BodySchema = z.object({
    _model: z.literal('crm.lead'),
    _id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

type ErrorCode =
    | 'METHOD_NOT_ALLOWED'
    | 'CONFIG_ERROR'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVICE_UNAVAILABLE'
    | 'VALIDATION_ERROR';

export interface NpsLinkHookDeps extends NpsLinkDeps {
    /** `null` means the endpoint is not configured. */
    webhookSecret?: string | null;
    /** The Pages context's `waitUntil`; without one the work is awaited inline. */
    waitUntil?: (promise: Promise<unknown>) => void;
    issue?: typeof issueNpsLinkForLead;
}

export function getNpsLinkWebhookSecret(): string | null {
    const secret = process.env.NPS_LINK_WEBHOOK_SECRET?.trim();
    return secret ? secret : null;
}

function json(body: Record<string, unknown>, status: number, requestId: string, headers: Record<string, string> = {}): Response {
    return buildJsonResponse(body, status, { ...RESPONSE_HEADERS, ...headers }, { requestId });
}

function fail(requestId: string, status: number, code: ErrorCode, error: string, headers?: Record<string, string>): Response {
    return json({ ok: false, requestId, code, error }, status, requestId, headers);
}

async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
    try {
        const text = await request.text();
        if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false };
        return { ok: true, value: JSON.parse(text) };
    } catch {
        return { ok: false };
    }
}

export async function handleNpsLinkHook(request: Request, deps: NpsLinkHookDeps = {}): Promise<Response> {
    const requestId = createRequestId();

    if (request.method !== 'POST') {
        return fail(requestId, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', { Allow: 'POST' });
    }

    const rate = await checkRateLimit(getClientIP(request), {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:nps-link-hook',
    });
    if (!rate.allowed) {
        logger.warn('NPS_LINK_HOOK', { requestId, stage: 'rate_limited', subjectKey: rate.subjectKey });
        if (rate.serviceUnavailable) {
            return fail(requestId, 503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.');
        }
        return fail(requestId, 429, 'RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em breve.', {
            'Retry-After': String(Math.ceil(rate.resetIn / 1000)),
            ...buildRateLimitHeaders({ ...rate, remaining: 0 }, RATE_LIMIT_MAX_REQUESTS),
        });
    }

    const secret = deps.webhookSecret === undefined ? getNpsLinkWebhookSecret() : deps.webhookSecret || null;
    if (!secret) {
        logger.error('NPS_LINK_HOOK', { requestId, stage: 'config_missing' });
        return fail(requestId, 500, 'CONFIG_ERROR', 'Endpoint não configurado.');
    }

    const provided = new URL(request.url).searchParams.get('secret') ?? '';
    if (!provided || !timingSafeEqual(provided, secret)) {
        logger.warn('NPS_LINK_HOOK', { requestId, stage: 'unauthorized' });
        return fail(requestId, 401, 'UNAUTHORIZED', 'Não autorizado.');
    }

    const raw = await readJson(request);
    const parsed = raw.ok ? BodySchema.safeParse(raw.value) : null;
    if (!parsed?.success) {
        logger.warn('NPS_LINK_HOOK', { requestId, stage: 'validation_failed' });
        return fail(requestId, 400, 'VALIDATION_ERROR', 'Pedido inválido.');
    }

    const work = (deps.issue ?? issueNpsLinkForLead)(parsed.data._id, { origin: npsLinkOriginFor(request.url), ...deps }).then((outcome) => {
        logger.info('NPS_LINK_HOOK', { requestId, stage: 'done', status: outcome.status });
    });
    if (deps.waitUntil) deps.waitUntil(work);
    else await work;

    return json({ ok: true, requestId }, 202, requestId);
}

export default function handler(request: Request): Promise<Response> {
    return handleNpsLinkHook(request);
}
