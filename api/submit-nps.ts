import { z } from 'zod';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, maskEmail } from '../lib/lead-logic';
import { logger } from '../lib/logger';
import { SubmitNpsBodySchema } from '../lib/schemas/submit-nps';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function buildJsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  requestId?: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
      ...corsHeaders,
    },
  });
}

function mapNpsZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue?.path[0];
  if (path === 'firstname') return 'Nome inválido.';
  if (path === 'email') return 'E-mail inválido.';
  if (path === 'score') return 'Nota deve ser um número inteiro entre 0 e 10.';
  if (path === 'reason') return 'O motivo da nota é obrigatório (máximo 2000 caracteres).';
  if (path === 'highlight') return 'Momento marcante deve ter no máximo 2000 caracteres.';
  return 'Payload inválido.';
}

export default async function handler(request: Request): Promise<Response> {
  const requestId = createRequestId();
  const corsHeaders = buildCorsHeaders();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse(
      { ok: false, requestId, code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed' },
      405,
      corsHeaders,
      requestId,
    );
  }

  const webhookUrl = process.env.NPS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    logger.error('SUBMIT_NPS', { requestId, stage: 'config', code: 'SERVER_CONFIG_ERROR' });
    return buildJsonResponse(
      { ok: false, requestId, code: 'SERVER_CONFIG_ERROR', error: 'Serviço de NPS indisponível no momento.' },
      500,
      corsHeaders,
      requestId,
    );
  }

  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP, {
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    prefix: 'ratelimit:submit-nps',
  });

  if (!rateLimit.allowed) {
    logger.warn('SUBMIT_NPS', {
      requestId,
      stage: 'rate_limited',
      clientIP,
      remaining: rateLimit.remaining,
    });
    return buildJsonResponse(
      {
        ok: false,
        requestId,
        code: 'RATE_LIMIT_EXCEEDED',
        error: 'Muitas tentativas. Tente novamente em breve.',
      },
      429,
      {
        ...corsHeaders,
        'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.resetIn) / 1000)),
      },
      requestId,
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return buildJsonResponse(
      { ok: false, requestId, code: 'VALIDATION_ERROR', error: 'JSON inválido no corpo da requisição.' },
      400,
      corsHeaders,
      requestId,
    );
  }

  const parsed = SubmitNpsBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return buildJsonResponse(
      { ok: false, requestId, code: 'VALIDATION_ERROR', error: mapNpsZodError(parsed.error) },
      400,
      corsHeaders,
      requestId,
    );
  }

  const raw = parsed.data;
  const payload = {
    firstname: cleanString(raw.firstname),
    email:     cleanString(raw.email),
    score:     raw.score,
    reason:    cleanString(raw.reason),
    highlight: cleanString(raw.highlight),
  };

  // cleanString can zero out strings that Zod accepted as non-empty (e.g. whitespace-only)
  if (!payload.firstname || !payload.email || !payload.reason) {
    return buildJsonResponse(
      { ok: false, requestId, code: 'VALIDATION_ERROR', error: 'Payload inválido.' },
      400,
      corsHeaders,
      requestId,
    );
  }

  logger.info('SUBMIT_NPS', {
    requestId,
    stage: 'sending',
    email: maskEmail(payload.email),
    score: payload.score,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, submittedAt: new Date().toISOString(), requestId }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!webhookRes.ok) {
      const text = await webhookRes.text().catch(() => '');
      logger.error('SUBMIT_NPS', {
        requestId,
        stage: 'webhook_failed',
        status: webhookRes.status,
        detail: text.slice(0, 200),
      });
      return buildJsonResponse(
        { ok: false, requestId, code: 'WEBHOOK_ERROR', error: 'Erro ao registrar avaliação. Tente novamente.' },
        502,
        corsHeaders,
        requestId,
      );
    }

    logger.info('SUBMIT_NPS', { requestId, stage: 'done', score: payload.score });
    return buildJsonResponse(
      { ok: true, requestId, message: 'Avaliação registrada com sucesso.' },
      201,
      corsHeaders,
      requestId,
    );
  } catch (err) {
    clearTimeout(timeoutId);
    logger.error('SUBMIT_NPS', {
      requestId,
      stage: err instanceof Error && err.name === 'AbortError' ? 'webhook_timeout' : 'unexpected',
      errorType: err instanceof Error ? err.name : typeof err,
    });
    return buildJsonResponse(
      { ok: false, requestId, code: 'INTERNAL_ERROR', error: 'Erro interno. Tente novamente.' },
      500,
      corsHeaders,
      requestId,
    );
  }
}
