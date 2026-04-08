import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const SANITIZED_DISPATCH_ERROR = 'Conversion dispatch failed';

interface PurchaseDispatchPayload {
  dealId?: unknown;
  value?: unknown;
  currency?: unknown;
  destination?: unknown;
  email?: unknown;
  phone?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  gaClientId?: unknown;
  gaSessionId?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  fbc?: unknown;
  fbp?: unknown;
  timestamp?: unknown;
}

function buildJsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string> = {},
): Response {
  const requestId = typeof body.requestId === 'string' ? body.requestId : undefined;

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
      ...buildCorsHeaders(),
      ...headers,
    },
  });
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function truncateDetail(detail: string): string | undefined {
  const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
  return normalized ? normalized.substring(0, 600) : undefined;
}

function emitPurchaseDispatchLog(
  level: 'info' | 'warn' | 'error',
  requestId: string,
  stage: string,
  details: Record<string, unknown> = {},
): void {
  const payload = {
    requestId,
    stage,
    ...details,
  };

  if (level === 'warn') {
    console.warn('PURCHASE_DISPATCH', payload);
    return;
  }

  if (level === 'error') {
    console.error('PURCHASE_DISPATCH', payload);
    return;
  }

  console.log('PURCHASE_DISPATCH', payload);
}

function getExpectedSecret(): string | null {
  const secret = typeof process.env.N8N_WEBHOOK_SECRET === 'string'
    ? process.env.N8N_WEBHOOK_SECRET.trim()
    : '';
  return secret || null;
}

function isAuthorized(request: Request, expectedSecret: string): boolean {
  const providedSecret = request.headers.get('X-Webhook-Secret');
  const normalizedSecret = providedSecret?.trim();
  return normalizedSecret === expectedSecret;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function toNumberOrZero(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number.parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePayload(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const payload = raw as PurchaseDispatchPayload;
  const dealId = toStringOrUndefined(payload.dealId);
  if (!dealId) {
    return null;
  }

  return {
    dealId,
    value: toNumberOrZero(payload.value),
    currency: toStringOrUndefined(payload.currency) ?? 'BRL',
    destination: toStringOrUndefined(payload.destination),
    email: toStringOrUndefined(payload.email),
    phone: toStringOrUndefined(payload.phone),
    firstName: toStringOrUndefined(payload.firstName),
    lastName: toStringOrUndefined(payload.lastName),
    gaClientId: toStringOrUndefined(payload.gaClientId),
    gaSessionId: toStringOrUndefined(payload.gaSessionId),
    gclid: toStringOrUndefined(payload.gclid),
    fbclid: toStringOrUndefined(payload.fbclid),
    fbc: toStringOrUndefined(payload.fbc),
    fbp: toStringOrUndefined(payload.fbp),
    timestamp: toStringOrUndefined(payload.timestamp),
  };
}

function sanitizeProviderResult(
  requestId: string,
  provider: 'ga4' | 'meta',
  result: { success: boolean; error?: string },
): { success: boolean; error?: string } {
  if (result.success) {
    return { success: true };
  }

  emitPurchaseDispatchLog('warn', requestId, `${provider}_dispatch_failed`, {
    detail: truncateDetail(result.error ?? ''),
  });

  return {
    success: false,
    error: SANITIZED_DISPATCH_ERROR,
  };
}

export default async function handler(request: Request): Promise<Response> {
  const requestId = createRequestId();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders() });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse({ ok: false, requestId, error: 'Method not allowed' }, 405);
  }

  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    emitPurchaseDispatchLog('error', requestId, 'config_missing_secret');
    return buildJsonResponse({ ok: false, requestId, error: 'Internal server error' }, 500);
  }

  if (!isAuthorized(request, expectedSecret)) {
    emitPurchaseDispatchLog('warn', requestId, 'unauthorized');
    return buildJsonResponse({ ok: false, requestId, error: 'Unauthorized' }, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return buildJsonResponse({ ok: false, requestId, error: 'Invalid JSON body' }, 400);
  }

  const payload = normalizePayload(body);
  if (!payload) {
    return buildJsonResponse({ ok: false, requestId, error: 'Missing dealId' }, 400);
  }

  if (payload.value < 0) {
    return buildJsonResponse({ ok: false, requestId, error: 'Invalid value' }, 400);
  }

  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP, {
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    prefix: 'ratelimit:purchase-dispatch',
  });

  if (!rateLimit.allowed) {
    emitPurchaseDispatchLog('warn', requestId, 'rate_limited', {
      clientIP,
      remaining: rateLimit.remaining,
      retryAfterSeconds: Math.ceil(rateLimit.resetIn / 1000),
    });

    return buildJsonResponse(
      {
        ok: false,
        requestId,
        error: 'Too many requests',
      },
      429,
      {
        'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.resetIn) / 1000)),
      },
    );
  }

  const [ga4Result, metaResult] = await Promise.all([
    sendGoogleConversion('purchase', {
      clientId: payload.gaClientId,
      sessionId: payload.gaSessionId,
      gclid: payload.gclid,
      destination: payload.destination,
      value: payload.value,
      currency: payload.currency,
      transactionId: payload.dealId,
    }),
    sendMetaConversion({
      eventName: 'Purchase',
      eventId: payload.dealId,
      email: payload.email,
      phone: payload.phone,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fbclid: payload.fbclid,
      fbc: payload.fbc,
      fbp: payload.fbp,
      value: payload.value,
      currency: payload.currency,
      contentName: payload.destination,
      contentType: 'travel_package',
      timestamp: payload.timestamp,
    }),
  ]);

  const mode = ga4Result.success && metaResult.success
    ? 'full'
    : ga4Result.success || metaResult.success
      ? 'partial'
      : 'failed';

  emitPurchaseDispatchLog('info', requestId, 'dispatch_complete', {
    dealId: payload.dealId,
    mode,
    ga4: ga4Result.success ? 'ok' : 'failed',
    meta: metaResult.success ? 'ok' : 'failed',
  });

  const ga4 = sanitizeProviderResult(requestId, 'ga4', ga4Result);
  const meta = sanitizeProviderResult(requestId, 'meta', metaResult);

  return buildJsonResponse(
    {
      ok: mode !== 'failed',
      requestId,
      mode,
      ga4,
      meta,
    },
    mode === 'failed' ? 502 : 200,
  );
}
