import { z } from 'zod';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, maskEmail } from '../lib/lead-logic';
import { logger } from '../lib/logger';
import { SubmitNpsBodySchema } from '../lib/schemas/submit-nps';
import { sendNpsToN8n } from '../services/n8n';
import type { N8nNpsPayload } from '../lib/n8n-payloads';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const N8N_WEBHOOK_ERROR_PATTERN = /^N8N_WEBHOOK_ERROR:(\d{3}):/;

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

function classifyNpsWebhookError(error: unknown): { status: number; stage: string } {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(N8N_WEBHOOK_ERROR_PATTERN);
  if (!match) return { status: 500, stage: 'unexpected' };
  const upstreamStatus = Number.parseInt(match[1], 10);
  return {
    status: upstreamStatus === 504 ? 504 : 502,
    stage: upstreamStatus === 504 ? 'webhook_timeout' : 'webhook_failed',
  };
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
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (!webhookUrl || !webhookSecret) {
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
  const npsPayload: N8nNpsPayload = {
    requestId,
    firstname:   cleanString(raw.firstname),
    email:       cleanString(raw.email),
    score:       raw.score,
    reason:      cleanString(raw.reason),
    highlight:   cleanString(raw.highlight),
    submittedAt: new Date().toISOString(),
  };

  logger.info('SUBMIT_NPS', {
    requestId,
    stage: 'sending',
    email: maskEmail(npsPayload.email),
    score: npsPayload.score,
  });

  try {
    await sendNpsToN8n(webhookUrl, webhookSecret, requestId, npsPayload);
  } catch (error: unknown) {
    const { status, stage } = classifyNpsWebhookError(error);
    logger.error('SUBMIT_NPS', { requestId, stage, error: error instanceof Error ? error.message : String(error) });
    return buildJsonResponse(
      {
        ok: false,
        requestId,
        code: status === 500 ? 'INTERNAL_ERROR' : 'WEBHOOK_ERROR',
        error: status === 500
          ? 'Erro interno. Tente novamente.'
          : 'Erro ao registrar avaliação. Tente novamente.',
      },
      status,
      corsHeaders,
      requestId,
    );
  }

  logger.info('SUBMIT_NPS', { requestId, stage: 'done', score: npsPayload.score });
  return buildJsonResponse(
    { ok: true, requestId, message: 'Avaliação registrada com sucesso.' },
    201,
    corsHeaders,
    requestId,
  );
}
