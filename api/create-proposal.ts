/**
 * POST /api/create-proposal — internal endpoint the sales bot calls to create
 * a proposal link (#1899, epic #1894). Never called by the browser.
 *
 * Auth is a shared secret (PROPOSAL_API_SECRET) in `Authorization: Bearer`.
 * The response carries the customer link and the signed internal preview
 * link, so the endpoint refuses to run without PROPOSAL_PREVIEW_SECRET rather
 * than hand out a preview link that would count as a customer open.
 *
 * Phase 1 accepts only `type: 'redirect'` (tracked redirect to an allowlisted
 * operator link). Air and operator-extracted proposals arrive with their page
 * templates (#1905, #1906).
 *
 * Never log the body, the id, the lead id or the operator URL: the URL holds
 * the booking token and the id opens the proposal.
 */
import { z } from 'zod';

import { buildJsonResponse, buildRateLimitHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { createProposalPreviewSignature, getProposalPreviewSecret, PROPOSAL_PREVIEW_PARAM } from '../lib/proposal-preview';
import { parseAllowedRedirectUrl } from '../lib/proposal-redirect';
import { PROPOSAL_VALIDITY_SECONDS, saveProposal, type ProposalStoreDeps } from '../lib/proposal-store';
import { timingSafeEqual } from '../lib/security';

// Links always point at production, even when created from a preview deploy.
const PROPOSAL_BASE_URL = 'https://www.anhanga.tur.br/proposta';
const MAX_VALIDITY_DAYS = PROPOSAL_VALIDITY_SECONDS / (24 * 60 * 60);
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 8_192;
// No CORS headers on purpose: no page may call this.
const RESPONSE_HEADERS = { 'Cache-Control': 'no-store' };

const BodySchema = z.strictObject({
    type: z.literal('redirect'),
    redirectUrl: z.string().min(1).max(4096),
    leadId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    // D5: links are valid for 15 days; the bot may shorten that, never extend it.
    validityDays: z.number().int().min(1).max(MAX_VALIDITY_DAYS).optional(),
});

type ErrorCode =
    | 'METHOD_NOT_ALLOWED'
    | 'CONFIG_ERROR'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVICE_UNAVAILABLE'
    | 'VALIDATION_ERROR'
    | 'REDIRECT_NOT_ALLOWED'
    | 'STORE_UNAVAILABLE';

function json(body: Record<string, unknown>, status: number, requestId: string, headers: Record<string, string> = {}): Response {
    return buildJsonResponse(body, status, { ...RESPONSE_HEADERS, ...headers }, { requestId });
}

function fail(requestId: string, status: number, code: ErrorCode, error: string, headers?: Record<string, string>): Response {
    return json({ ok: false, requestId, code, error }, status, requestId, headers);
}

function getApiSecret(): string | null {
    const secret = process.env.PROPOSAL_API_SECRET?.trim();
    return secret ? secret : null;
}

function isAuthorized(request: Request, secret: string): boolean {
    const header = request.headers.get('authorization')?.trim() ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    return match !== null && timingSafeEqual(match[1], secret);
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

export async function handleCreateProposal(request: Request, deps: ProposalStoreDeps = {}): Promise<Response> {
    const requestId = createRequestId();

    if (request.method !== 'POST') {
        return fail(requestId, 405, 'METHOD_NOT_ALLOWED', 'Método não permitido.', { Allow: 'POST' });
    }

    const apiSecret = getApiSecret();
    const previewSecret = getProposalPreviewSecret();
    if (!apiSecret || !previewSecret) {
        logger.error('CREATE_PROPOSAL', {
            requestId,
            stage: 'config_missing',
            apiSecret: Boolean(apiSecret),
            previewSecret: Boolean(previewSecret),
        });
        return fail(requestId, 500, 'CONFIG_ERROR', 'Endpoint não configurado.');
    }

    if (!isAuthorized(request, apiSecret)) {
        logger.warn('CREATE_PROPOSAL', { requestId, stage: 'unauthorized' });
        return fail(requestId, 401, 'UNAUTHORIZED', 'Não autorizado.', { 'WWW-Authenticate': 'Bearer' });
    }

    const rate = await checkRateLimit(getClientIP(request), {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:create-proposal',
    });
    if (!rate.allowed) {
        logger.warn('CREATE_PROPOSAL', { requestId, stage: 'rate_limited', subjectKey: rate.subjectKey });
        if (rate.serviceUnavailable) {
            return fail(requestId, 503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.');
        }
        return fail(requestId, 429, 'RATE_LIMIT_EXCEEDED', 'Muitas requisições. Tente novamente em breve.', {
            'Retry-After': String(Math.ceil(rate.resetIn / 1000)),
            ...buildRateLimitHeaders({ ...rate, remaining: 0 }, RATE_LIMIT_MAX_REQUESTS),
        });
    }

    const raw = await readJson(request);
    if (!raw.ok) return fail(requestId, 400, 'VALIDATION_ERROR', 'JSON inválido.');

    const parsed = BodySchema.safeParse(raw.value);
    if (!parsed.success) {
        // Paths only: the values may hold the booking token.
        logger.warn('CREATE_PROPOSAL', {
            requestId,
            stage: 'validation_failed',
            issues: parsed.error.issues.map((issue) => issue.path.join('.') || issue.code),
        });
        return fail(requestId, 400, 'VALIDATION_ERROR', 'Pedido inválido.');
    }

    const body = parsed.data;
    // Checked here so anything saveProposal throws afterwards is storage.
    const redirectUrl = parseAllowedRedirectUrl(body.redirectUrl);
    if (!redirectUrl) {
        logger.warn('CREATE_PROPOSAL', { requestId, stage: 'redirect_not_allowed' });
        return fail(requestId, 400, 'REDIRECT_NOT_ALLOWED', 'Link da operadora não permitido.');
    }

    let saved: { id: string; expiresAt: number };
    try {
        saved = await saveProposal(
            {
                redirectUrl,
                leadId: body.leadId,
                validitySeconds: (body.validityDays ?? MAX_VALIDITY_DAYS) * 24 * 60 * 60,
            },
            deps,
        );
    } catch (error) {
        // Name only: Upstash errors quote the failed command, i.e. the key and id.
        logger.error('CREATE_PROPOSAL', {
            requestId,
            stage: 'store_failed',
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return fail(requestId, 503, 'STORE_UNAVAILABLE', 'Não foi possível criar a proposta agora.');
    }

    const url = `${PROPOSAL_BASE_URL}/${saved.id}`;
    const signature = await createProposalPreviewSignature(saved.id, previewSecret);
    const previewUrl = `${url}?${PROPOSAL_PREVIEW_PARAM}=${signature}`;

    logger.info('CREATE_PROPOSAL', { requestId, stage: 'created', type: body.type });

    return json({
        ok: true,
        requestId,
        data: {
            id: saved.id,
            url,
            previewUrl,
            expiresAt: new Date(saved.expiresAt).toISOString(),
        },
    }, 201, requestId);
}

export default function handler(request: Request): Promise<Response> {
    return handleCreateProposal(request);
}
