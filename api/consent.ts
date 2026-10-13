/**
 * POST /api/consent — grant/revoke de medição publicitária e revogação de
 * e-mail marketing. O corpo não concede e-mail marketing: isso só nasce de
 * um formulário (o checkbox é o ato). Revogar e-mail não confirma se o
 * cadastro existe.
 */
import { z } from 'zod';
import { buildCorsHeaders, buildJsonResponse, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { isValidEmail } from '../lib/lead-logic';
import { logger } from '../lib/logger';
import {
    effectiveAction,
    isAnonSubjectKey,
    isConsentEventId,
    type ConsentAction,
    type ConsentPurpose,
} from '../lib/consent-ledger';
import { ADS_NOTICE_VERSION, EMAIL_NOTICE_VERSION } from '../lib/consent-notices';
import { ConsentLedgerUnavailable, emailSubjectKey, getConsentStore } from '../lib/consent-store';
import { getOdooConfig, openOdooSession } from '../services/odoo';

const BodySchema = z.object({
    purpose: z.enum(['ads_measurement', 'email_marketing']),
    action: z.enum(['grant', 'revoke']),
    origin: z.string().min(1).max(40),
    eventId: z.string().min(8).max(80),
    subjectKey: z.string().min(8).max(80).optional(),
    email: z.string().max(254).optional(),
    occurredAt: z.string().max(40).optional(),
});

function json(body: Record<string, unknown>, status: number, requestId: string, cors: Record<string, string>): Response {
    return buildJsonResponse(body, status, cors, { requestId });
}

export default async function handler(request: Request): Promise<Response> {
    const requestId = createRequestId();
    const cors = buildCorsHeaders();

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') {
        return json({ ok: false, requestId, code: 'METHOD_NOT_ALLOWED', error: 'Método não permitido.' }, 405, requestId, cors);
    }

    const rate = await checkRateLimit(getClientIP(request), {
        limit: 10,
        windowMs: 60_000,
        prefix: 'ratelimit:consent',
    });
    if (!rate.allowed) {
        const status = rate.serviceUnavailable ? 503 : 429;
        const code = rate.serviceUnavailable ? 'SERVICE_UNAVAILABLE' : 'RATE_LIMIT_EXCEEDED';
        return json({ ok: false, requestId, code, error: 'Muitas tentativas. Tente novamente em breve.' }, status, requestId, cors);
    }

    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return json({ ok: false, requestId, code: 'VALIDATION_ERROR', error: 'JSON inválido.' }, 400, requestId, cors);
    }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success || !isConsentEventId(parsed.data.eventId)) {
        return json({ ok: false, requestId, code: 'VALIDATION_ERROR', error: 'Pedido inválido.' }, 400, requestId, cors);
    }

    const body = parsed.data;
    if (body.purpose === 'email_marketing' && body.action !== 'revoke') {
        return json({ ok: false, requestId, code: 'VALIDATION_ERROR', error: 'O opt-in de e-mail só é registrado no formulário.' }, 400, requestId, cors);
    }

    const occurredAt = body.occurredAt && !Number.isNaN(Date.parse(body.occurredAt))
        ? new Date(body.occurredAt).toISOString()
        : new Date().toISOString();

    try {
        const prepared = await resolveSubject(body);
        if (!prepared.ok) {
            return json({ ok: false, requestId, code: 'VALIDATION_ERROR', error: prepared.error }, 400, requestId, cors);
        }

        const store = getConsentStore();
        const outcome = await store.append({
            id: body.eventId,
            subjectKey: prepared.subjectKey,
            purpose: body.purpose,
            action: body.action,
            noticeVersion: body.purpose === 'ads_measurement' ? ADS_NOTICE_VERSION : EMAIL_NOTICE_VERSION,
            origin: body.origin,
            occurredAt,
        });
        const effective = effectiveAction(outcome.events, body.purpose);

        let sync: 'recorded' | 'pending' | 'skipped' = 'skipped';
        if (body.purpose === 'email_marketing' && body.action === 'revoke' && prepared.email) {
            sync = await revokeEmailAtOdoo(prepared.email);
        }

        logger.info('CONSENT', {
            requestId,
            stage: outcome.status,
            purpose: body.purpose,
            action: body.action,
            origin: body.origin,
            effective,
            sync,
        });

        return json({
            ok: true,
            requestId,
            eventId: body.eventId,
            subjectKey: prepared.subjectKey,
            effective,
            registered: effective === 'grant',
        }, 201, requestId, cors);
    } catch (error) {
        if (error instanceof ConsentLedgerUnavailable) {
            logger.error('CONSENT', { requestId, stage: 'ledger_unavailable' });
            return json({ ok: false, requestId, code: 'CONSENT_LEDGER_UNAVAILABLE', error: 'Não foi possível registrar o consentimento agora.' }, 503, requestId, cors);
        }
        logger.error('CONSENT', {
            requestId,
            stage: 'unexpected',
            detail: error instanceof Error ? error.message : 'unknown',
        });
        return json({ ok: false, requestId, code: 'INTERNAL_ERROR', error: 'Não foi possível registrar o consentimento.' }, 500, requestId, cors);
    }
}

async function resolveSubject(body: {
    purpose: ConsentPurpose;
    action: ConsentAction;
    subjectKey?: string;
    email?: string;
}): Promise<{ ok: true; subjectKey: string; email: string | null } | { ok: false; error: string }> {
    if (body.purpose === 'ads_measurement') {
        const subjectKey = body.subjectKey?.trim() ?? '';
        if (!isAnonSubjectKey(subjectKey)) return { ok: false, error: 'Identificador de consentimento inválido.' };
        return { ok: true, subjectKey, email: null };
    }

    const email = body.email?.trim().toLowerCase() ?? '';
    if (!email || !isValidEmail(email)) return { ok: false, error: 'E-mail inválido.' };
    return { ok: true, subjectKey: await emailSubjectKey(email), email };
}

/**
 * Revoga no Odoo sem criar parceiro. `upsertPartner({ email })` criaria um
 * contato vazio quando o e-mail não existe — a revogação não pode fazer isso.
 * A busca é direta; se não houver parceiro, o ledger sozinho basta.
 */
async function revokeEmailAtOdoo(email: string): Promise<'recorded' | 'pending'> {
    const config = getOdooConfig();
    if (!config) return 'recorded';
    try {
        const session = await openOdooSession(config);
        const partnerId = await session.findPartnerIdByEmail(email);
        if (partnerId) await session.writePartnerConsent(partnerId, false);
        return 'recorded';
    } catch (error) {
        logger.warn('CONSENT_SYNC', {
            stage: 'email_revoke_failed',
            detail: error instanceof Error ? error.message : 'unknown',
        });
        return 'pending';
    }
}
