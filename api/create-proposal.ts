/**
 * POST /api/create-proposal — internal endpoint the sales bot calls to create
 * a proposal link (#1899, epic #1894). Never called by the browser.
 *
 * Auth is a shared secret (PROPOSAL_API_SECRET) in `Authorization: Bearer`.
 * The response carries the customer link and the signed internal preview
 * link, so the endpoint refuses to run without PROPOSAL_PREVIEW_SECRET rather
 * than hand out a preview link that would count as a customer open.
 *
 * Types:
 * - `redirect`: tracked redirect to an allowlisted operator link (#1896);
 * - `infotravel`: reads the Infotravel quotation behind the link and stores a
 *   page (#1906). Any failure — API down, unexpected data, a total that doesn't
 *   add up — or pages switched off (PROPOSAL_PAGES_ENABLED) falls back to the
 *   tracked redirect for the same link; `mode` and `fallbackReason` say which.
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
import { InfotravelNormalizeError, normalizeInfotravelQuotation } from '../lib/infotravel-normalize';
import { buildProposalSentNote, postProposalNote, type ProposalOdooNotesDeps } from '../lib/proposal-odoo-notes';
import type { ProposalContent } from '../lib/proposal-content';
import { fromInfotravelNormalized } from '../lib/proposal-infotravel';
import { fetchInfotravelQuotation, InfotravelError, type InfotravelDeps } from '../services/infotravel';
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

const INFOTRAVEL_HOST = 'premium.infotravel.com.br';

const commonFields = {
    redirectUrl: z.string().min(1).max(4096),
    leadId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    // D5: links are valid for 15 days; the bot may shorten that, never extend it.
    validityDays: z.number().int().min(1).max(MAX_VALIDITY_DAYS).optional(),
};

const BodySchema = z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('redirect'), ...commonFields }),
    z.strictObject({
        type: z.literal('infotravel'),
        ...commonFields,
        // The customer's name comes from the bot only: the quotation's contact
        // is the agent. The page keeps just the first word (D6).
        firstName: z.string().trim().min(1).max(300).optional(),
    }),
]);

type FallbackReason = 'pages_disabled' | 'invalid_token' | 'timeout' | 'http_error' | 'unexpected_response'
    | 'unexpected_shape' | 'unsupported_quotation' | 'total_mismatch' | 'quotation_expired' | 'invalid_content';

/** Default off until the privacy policy covers proposal pages (#1925). */
function arePagesEnabled(): boolean {
    return process.env.PROPOSAL_PAGES_ENABLED?.trim().toLowerCase() === 'true';
}

/** The Infotravel quotation as page content, or why it falls back to the redirect. */
async function buildInfotravelContent(
    link: string,
    firstName: string | undefined,
    now: number,
    deps: InfotravelDeps,
): Promise<{ content: ProposalContent; quotationExpiresAt?: number } | { fallbackReason: FallbackReason }> {
    if (!arePagesEnabled()) return { fallbackReason: 'pages_disabled' };
    try {
        const quotation = await fetchInfotravelQuotation(link, deps);
        const normalized = normalizeInfotravelQuotation(quotation);
        const expiration = typeof normalized.validade === 'string' ? Date.parse(normalized.validade) : Number.NaN;
        if (!Number.isNaN(expiration) && expiration <= now) return { fallbackReason: 'quotation_expired' };
        return {
            content: fromInfotravelNormalized(normalized, { firstName }),
            quotationExpiresAt: Number.isNaN(expiration) ? undefined : expiration,
        };
    } catch (error) {
        if (error instanceof InfotravelError || error instanceof InfotravelNormalizeError) return { fallbackReason: error.reason };
        // Class only: the message can carry the link (and its token) or quotation data.
        logger.error('CREATE_PROPOSAL', {
            stage: 'infotravel_content_failed',
            errorName: error instanceof Error ? error.name : typeof error,
        });
        return { fallbackReason: 'invalid_content' };
    }
}

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

export interface CreateProposalDeps extends ProposalStoreDeps {
    odoo?: ProposalOdooNotesDeps;
    infotravel?: InfotravelDeps;
}

export async function handleCreateProposal(request: Request, deps: CreateProposalDeps = {}): Promise<Response> {
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
    if (!redirectUrl || (body.type === 'infotravel' && new URL(redirectUrl).hostname !== INFOTRAVEL_HOST)) {
        logger.warn('CREATE_PROPOSAL', { requestId, stage: 'redirect_not_allowed' });
        return fail(requestId, 400, 'REDIRECT_NOT_ALLOWED', 'Link da operadora não permitido.');
    }

    // The link as the bot sent it is what the operator's own page sends as `clientUrl`.
    const now = (deps.now ?? Date.now)();
    const built = body.type === 'infotravel' ? await buildInfotravelContent(body.redirectUrl, body.firstName, now, deps.infotravel ?? {}) : null;
    const content = built && 'content' in built ? built.content : undefined;
    // The page never says "válida até" past the operator's own quotation deadline.
    const requestedSeconds = (body.validityDays ?? MAX_VALIDITY_DAYS) * 24 * 60 * 60;
    const quotationExpiresAt = built && 'content' in built ? built.quotationExpiresAt : undefined;
    const validitySeconds = quotationExpiresAt === undefined
        ? requestedSeconds
        : Math.min(requestedSeconds, Math.floor((quotationExpiresAt - now) / 1000));
    const fallbackReason = built && 'fallbackReason' in built ? built.fallbackReason : undefined;
    const mode = content ? 'page' : 'redirect';

    let saved: { id: string; expiresAt: number };
    try {
        saved = await saveProposal(
            {
                ...(content ? { content } : { redirectUrl }),
                leadId: body.leadId,
                validitySeconds,
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
    // The proposal exists either way: a CRM failure is reported, not fatal (#1904).
    const crmNote = await postProposalNote(body.leadId, buildProposalSentNote({ url, expiresAt: saved.expiresAt }), deps.odoo);

    logger.info('CREATE_PROPOSAL', { requestId, stage: 'created', type: body.type, mode, fallbackReason, crmNote });

    return json({
        ok: true,
        requestId,
        data: {
            id: saved.id,
            url,
            previewUrl,
            expiresAt: new Date(saved.expiresAt).toISOString(),
            mode,
            ...(fallbackReason ? { fallbackReason } : {}),
            crmNote,
        },
    }, 201, requestId);
}

export default function handler(request: Request): Promise<Response> {
    return handleCreateProposal(request);
}
