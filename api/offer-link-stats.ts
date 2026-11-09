/**
 * GET /api/offer-link-stats?slug=… — click count for one offer, without
 * previews. Same `OFFER_LINK_SECRET` as the create endpoint. Never called by
 * the browser. Does not notify the CRM.
 */
import { buildJsonResponse, buildRateLimitHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { isOfferLinkAuthorized, getOfferLinkSecret, type OfferLinkApiDeps } from '../lib/offer-link-auth';
import { isValidOfferSlug } from '../lib/offer-link';
import { loadOffer, readOfferClicks } from '../lib/offer-link-store';

const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RESPONSE_HEADERS = { 'Cache-Control': 'no-store' };

type ErrorCode =
    | 'METHOD_NOT_ALLOWED'
    | 'CONFIG_ERROR'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVICE_UNAVAILABLE'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'STORE_UNAVAILABLE';

function json(body: Record<string, unknown>, status: number, requestId: string, headers: Record<string, string> = {}): Response {
    return buildJsonResponse(body, status, { ...RESPONSE_HEADERS, ...headers }, { requestId });
}

function fail(requestId: string, status: number, code: ErrorCode, error: string, headers?: Record<string, string>): Response {
    return json({ ok: false, requestId, code, error }, status, requestId, headers);
}

export async function handleOfferLinkStats(request: Request, deps: OfferLinkApiDeps = {}): Promise<Response> {
    const requestId = createRequestId();

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return fail(requestId, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', { Allow: 'GET, HEAD' });
    }

    // Throttle before the bearer check, same as create-proposal.
    const rate = await checkRateLimit(getClientIP(request), {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:offer-link-stats',
    });
    if (!rate.allowed) {
        logger.warn('OFFER_LINK_STATS', { requestId, stage: 'rate_limited', subjectKey: rate.subjectKey });
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
        logger.error('OFFER_LINK_STATS', { requestId, stage: 'config_missing' });
        return fail(requestId, 500, 'CONFIG_ERROR', 'Endpoint não configurado.');
    }

    if (!isOfferLinkAuthorized(request, secret)) {
        logger.warn('OFFER_LINK_STATS', { requestId, stage: 'unauthorized' });
        return fail(requestId, 401, 'UNAUTHORIZED', 'Não autorizado.', { 'WWW-Authenticate': 'Bearer' });
    }

    const slug = new URL(request.url).searchParams.get('slug')?.trim() ?? '';
    if (!isValidOfferSlug(slug)) {
        logger.warn('OFFER_LINK_STATS', { requestId, stage: 'validation_failed', issues: ['slug'] });
        return fail(requestId, 400, 'VALIDATION_ERROR', 'Pedido inválido.');
    }

    const lookup = await loadOffer(slug, deps);
    if (lookup.status === 'unavailable') {
        return fail(requestId, 503, 'STORE_UNAVAILABLE', 'Não foi possível ler o link agora.');
    }
    if (lookup.status === 'not_found') {
        return fail(requestId, 404, 'NOT_FOUND', 'Link não encontrado.');
    }

    const clicks = await readOfferClicks(slug, deps);
    if (!clicks) {
        return fail(requestId, 503, 'STORE_UNAVAILABLE', 'Não foi possível ler o link agora.');
    }

    const body = {
        ok: true,
        requestId,
        slug,
        clicks: clicks.clicks,
        lastClickAt: clicks.lastClickAt,
    };
    if (request.method === 'HEAD') {
        return new Response(null, { status: 200, headers: json(body, 200, requestId).headers });
    }
    return json(body, 200, requestId);
}

export default function handler(request: Request): Promise<Response> {
    return handleOfferLinkStats(request);
}
