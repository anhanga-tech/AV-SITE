import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, maskEmail } from '../lib/lead-logic';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

interface NpsPayload {
  firstname: string;
  email: string;
  score: number;
  reason: string;
  highlight: string;
  submittedAt: string;
}

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

function validateNpsPayload(
  raw: unknown,
): { valid: true; data: NpsPayload } | { valid: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Payload inválido.' };
  }

  const obj = raw as Record<string, unknown>;

  const firstname = cleanString(typeof obj.firstname === 'string' ? obj.firstname : '');
  const email = cleanString(typeof obj.email === 'string' ? obj.email : '');
  const score = obj.score;
  const reason = cleanString(typeof obj.reason === 'string' ? obj.reason : '');
  const highlight = cleanString(typeof obj.highlight === 'string' ? obj.highlight : '');
  const submittedAt =
    typeof obj.submittedAt === 'string' && obj.submittedAt
      ? obj.submittedAt
      : new Date().toISOString();

  if (!firstname || firstname.length > 100) {
    return { valid: false, error: 'Nome inválido.' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { valid: false, error: 'E-mail inválido.' };
  }

  if (
    typeof score !== 'number' ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 10
  ) {
    return { valid: false, error: 'Nota deve ser um número inteiro entre 0 e 10.' };
  }

  if (!reason || reason.length > 2000) {
    return {
      valid: false,
      error: 'O motivo da nota é obrigatório (máximo 2000 caracteres).',
    };
  }

  if (highlight.length > 2000) {
    return { valid: false, error: 'Momento marcante deve ter no máximo 2000 caracteres.' };
  }

  return {
    valid: true,
    data: { firstname, email, score, reason, highlight, submittedAt },
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

  const webhookUrl = cleanString(process.env.NPS_WEBHOOK_URL);
  if (!webhookUrl) {
    console.error('SUBMIT_NPS', { requestId, stage: 'config', code: 'SERVER_CONFIG_ERROR' });
    return buildJsonResponse(
      { ok: false, requestId, code: 'SERVER_CONFIG_ERROR', error: 'Serviço de NPS indisponível no momento.' },
      500,
      corsHeaders,
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

  const validation = validateNpsPayload(rawBody);
  if (validation.valid === false) {
    return buildJsonResponse(
      { ok: false, requestId, code: 'VALIDATION_ERROR', error: validation.error },
      400,
      corsHeaders,
      requestId,
    );
  }

  const payload = validation.data;

  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP, {
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    prefix: 'ratelimit:submit-nps',
  });

  if (!rateLimit.allowed) {
    console.warn('SUBMIT_NPS', {
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

  console.log('SUBMIT_NPS', {
    requestId,
    stage: 'sending',
    email: maskEmail(payload.email),
    score: payload.score,
  });

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, requestId }),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text().catch(() => '');
      console.error('SUBMIT_NPS', {
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

    console.log('SUBMIT_NPS', { requestId, stage: 'done', score: payload.score });
    return buildJsonResponse(
      { ok: true, requestId, message: 'Avaliação registrada com sucesso.' },
      201,
      corsHeaders,
      requestId,
    );
  } catch (err) {
    console.error('SUBMIT_NPS', {
      requestId,
      stage: 'unexpected',
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
