/**
 * POST /api/create-offer-link — internal endpoint that registers one offer
 * slug for the Anhangá Ofertas channel. Never called by the browser.
 *
 * Auth is `Authorization: Bearer` with `OFFER_LINK_SECRET`, a secret of its
 * own (not `PROPOSAL_API_SECRET`). A repeated slug updates the stored text,
 * title and expiry and returns the same public URL.
 *
 * Never log the message or the secret. The public URL carries only the slug.
 */
import { buildJsonResponse, buildRateLimitHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { isOfferLinkAuthorized, getOfferLinkSecret, type OfferLinkApiDeps } from '../lib/offer-link-auth';
import {
    OFFER_EXPIRES_MAX_AHEAD_MS,
    offerPublicUrl,
    parseOfferExpiryDate,
} from '../lib/offer-link';
import { saveOffer } from '../lib/offer-link-store';
import { createOfferLinkBodySchema } from '../lib/schemas/offer-link';

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 4_096;
const RESPONSE_HEADERS = { 'Cache-Control': 'no-store' };

type ErrorCode =
    | 'METHOD_NOT_ALLOWED'
    | 'CONFIG_ERROR'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVICE_UNAVAILABLE'
    | 'VALIDATION_ERROR'
    | 'STORE_UNAVAILABLE';

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

export async function handleCreateOfferLink(request: Request, deps: OfferLinkApiDeps = {}): Promise<Response> {
    const requestId = createRequestId();

    if (request.method !== 'POST') {
        return fail(requestId, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', { Allow: 'POST' });
    }

    // Throttle before the bearer check, same as create-proposal: a limit that
    // only applies after a correct secret does not bound guessing.
    const rate = await checkRateLimit(getClientIP(request), {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:create-offer-link',
    });
    if (!rate.allowed) {
        logger.warn('CREATE_OFFER_LINK', { requestId, stage: 'rate_limited', subjectKey: rate.subjectKey });
        if (rate.serviceUnavailable) {
            return fail(requestId, 503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.');
        }
        return fail(requestId, 429, 'RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em breve.', {
            'Retry-After': String(Math.ceil(rate.resetIn / 1000)),
            ...buildRateLimitHeaders({ ...rate, remaining: 0 }, RATE_LIMIT_MAX_REQUESTS),
        });
    }

    const secret = deps.secret === undefined ? getOfferLinkSecret() : deps.secret || null;
    if (!secret) {
        logger.error('CREATE_OFFER_LINK', { requestId, stage: 'config_missing' });
        return fail(requestId, 500, 'CONFIG_ERROR', 'Endpoint não configurado.');
    }

    if (!isOfferLinkAuthorized(request, secret)) {
        logger.warn('CREATE_OFFER_LINK', { requestId, stage: 'unauthorized' });
        return fail(requestId, 401, 'UNAUTHORIZED', 'Não autorizado.', { 'WWW-Authenticate': 'Bearer' });
    }

    const raw = await readJson(request);
    if (!raw.ok) return fail(requestId, 400, 'VALIDATION_ERROR', 'JSON inválido.');

    const parsed = createOfferLinkBodySchema.safeParse(raw.value);
    if (!parsed.success) {
        logger.warn('CREATE_OFFER_LINK', {
            requestId,
            stage: 'validation_failed',
            issues: parsed.error.issues.map((issue) => issue.path.join('.') || issue.code),
        });
        return fail(requestId, 400, 'VALIDATION_ERROR', 'Pedido inválido.');
    }

    const body = parsed.data;
    const now = (deps.now ?? Date.now)();
    const expiresAt = body.expiresAt === undefined ? null : parseOfferExpiryDate(body.expiresAt);
    if (body.expiresAt !== undefined && (expiresAt === null || expiresAt <= now || expiresAt - now > OFFER_EXPIRES_MAX_AHEAD_MS)) {
        logger.warn('CREATE_OFFER_LINK', { requestId, stage: 'validation_failed', issues: ['expiresAt'] });
        return fail(requestId, 400, 'VALIDATION_ERROR', 'Pedido inválido.');
    }

    try {
        const saved = await saveOffer({
            slug: body.slug,
            message: body.message,
            title: body.title ?? null,
            expiresAt,
            expiresOn: body.expiresAt ?? null,
        }, deps);
        logger.info('CREATE_OFFER_LINK', { requestId, stage: 'saved', slug: body.slug });
        return json({
            ok: true,
            requestId,
            url: offerPublicUrl(body.slug),
            slug: body.slug,
            expiresAt: saved.expiresOn,
        }, 201, requestId);
    } catch (error) {
        logger.error('CREATE_OFFER_LINK', {
            requestId,
            stage: 'store_failed',
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return fail(requestId, 503, 'STORE_UNAVAILABLE', 'Não foi possível gravar o link agora.');
    }
}

export default function handler(request: Request): Promise<Response> {
    return handleCreateOfferLink(request);
}
