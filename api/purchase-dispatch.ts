import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';
import { buildCorsHeaders, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { timingSafeEqual } from '../lib/hubspot-validation';
import { logger } from '../lib/logger';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const SANITIZED_DISPATCH_ERROR = 'Conversion dispatch failed';

interface ConversionDispatchPayloadInput {
  eventType?: unknown;
  attributionKey?: unknown;
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

type ConversionEventType = 'lead_qualificado' | 'close_convert_lead' | 'purchase';

const VALID_EVENT_TYPES: ReadonlySet<ConversionEventType> = new Set<ConversionEventType>(['lead_qualificado', 'close_convert_lead', 'purchase']);

const META_EVENT_MAP: Record<ConversionEventType, 'Lead' | 'Purchase'> = {
  lead_qualificado: 'Lead',
  close_convert_lead: 'Lead',
  purchase: 'Purchase',
};

interface ConversionDispatchPayload {
  eventType: ConversionEventType;
  deduplicationId: string;
  dealId?: string;
  attributionKey?: string;
  value: number;
  currency: string;
  destination?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  gaClientId?: string;
  gaSessionId?: string;
  gclid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  timestamp?: string;
}

type NormalizePayloadResult =
  | ConversionDispatchPayload
  | { error: 'Missing attributionKey' | 'Missing dealId' }
  | null;

type HandlerStepResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: Response };

type ConversionDispatchMode = 'full' | 'partial' | 'failed';

type ProviderDispatchResult = Awaited<ReturnType<typeof sendGoogleConversion>>;

interface ConversionDispatchOutcome {
  ga4Result: ProviderDispatchResult;
  metaResult: Awaited<ReturnType<typeof sendMetaConversion>>;
  mode: ConversionDispatchMode;
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

  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function truncateDetail(detail: string): string | undefined {
  const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
  return normalized ? normalized.substring(0, 600) : undefined;
}

function emitConversionLog(
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
    logger.warn('CONVERSION_DISPATCH', payload);
    return;
  }

  if (level === 'error') {
    logger.error('CONVERSION_DISPATCH', payload);
    return;
  }

  logger.info('CONVERSION_DISPATCH', payload);
}

function getExpectedSecret(): string | null {
  const secret = typeof process.env.N8N_WEBHOOK_SECRET === 'string'
    ? process.env.N8N_WEBHOOK_SECRET.trim()
    : '';
  return secret || null;
}

function isAuthorized(request: Request, expectedSecret: string): boolean {
  const providedSecret = request.headers.get('X-Webhook-Secret');
  const normalizedSecret = providedSecret?.trim() ?? '';
  return timingSafeEqual(normalizedSecret, expectedSecret);
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

function normalizePayload(raw: unknown): NormalizePayloadResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const payload = raw as ConversionDispatchPayloadInput;
  const rawEventType = toStringOrUndefined(payload.eventType) ?? 'purchase';
  if (!VALID_EVENT_TYPES.has(rawEventType as ConversionEventType)) {
    return null;
  }

  const eventType = rawEventType as ConversionEventType;
  const dealId = toStringOrUndefined(payload.dealId);
  const attributionKey = toStringOrUndefined(payload.attributionKey);
  let deduplicationId: string;

  if (eventType === 'lead_qualificado') {
    if (!attributionKey) {
      return { error: 'Missing attributionKey' };
    }
    deduplicationId = attributionKey;
  } else if (!dealId) {
    return { error: 'Missing dealId' };
  } else {
    deduplicationId = dealId;
  }
  const value = eventType === 'lead_qualificado' ? 0 : toNumberOrZero(payload.value);

  return {
    eventType,
    deduplicationId,
    dealId,
    attributionKey,
    value,
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

  emitConversionLog('warn', requestId, `${provider}_dispatch_failed`, {
    detail: truncateDetail(result.error ?? ''),
  });

  return {
    success: false,
    error: SANITIZED_DISPATCH_ERROR,
  };
}

function validateRequestMethod(request: Request, requestId: string): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders() });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse({ ok: false, requestId, error: 'Method not allowed' }, 405);
  }

  return null;
}

function validateAuthorization(request: Request, requestId: string): Response | null {
  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    emitConversionLog('error', requestId, 'config_missing_secret');
    return buildJsonResponse({ ok: false, requestId, error: 'Internal server error' }, 500);
  }

  if (!isAuthorized(request, expectedSecret)) {
    emitConversionLog('warn', requestId, 'unauthorized');
    return buildJsonResponse({ ok: false, requestId, error: 'Unauthorized' }, 401);
  }

  return null;
}

async function parseValidatedPayload(
  request: Request,
  requestId: string,
): Promise<HandlerStepResult<ConversionDispatchPayload>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: buildJsonResponse({ ok: false, requestId, error: 'Invalid JSON body' }, 400),
    };
  }

  const payload = normalizePayload(body);
  if (!payload) {
    return {
      ok: false,
      response: buildJsonResponse({ ok: false, requestId, error: 'Invalid payload' }, 400),
    };
  }

  if ('error' in payload) {
    return {
      ok: false,
      response: buildJsonResponse({ ok: false, requestId, error: payload.error }, 400),
    };
  }

  if (payload.value < 0) {
    return {
      ok: false,
      response: buildJsonResponse({ ok: false, requestId, error: 'Invalid value' }, 400),
    };
  }

  return { ok: true, value: payload };
}

async function enforceRateLimit(request: Request, requestId: string): Promise<Response | null> {
  const clientIP = getClientIP(request);
  const rateLimit = await checkRateLimit(clientIP, {
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    prefix: 'ratelimit:purchase-dispatch',
  });

  if (rateLimit.allowed) {
    return null;
  }

  if (rateLimit.serviceUnavailable) {
    emitConversionLog('error', requestId, 'service_unavailable', { clientIP });
    return buildJsonResponse(
      { ok: false, requestId, error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' },
      503,
    );
  }

  emitConversionLog('warn', requestId, 'rate_limited', {
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

function getDispatchMode(ga4Succeeded: boolean, metaSucceeded: boolean): ConversionDispatchMode {
  if (ga4Succeeded && metaSucceeded) {
    return 'full';
  }

  if (ga4Succeeded || metaSucceeded) {
    return 'partial';
  }

  return 'failed';
}

async function dispatchConversion(
  payload: ConversionDispatchPayload,
  requestId: string,
): Promise<ConversionDispatchOutcome> {
  const [ga4Result, metaResult] = await Promise.all([
    sendGoogleConversion(payload.eventType, {
      clientId: payload.gaClientId,
      sessionId: payload.gaSessionId,
      gclid: payload.gclid,
      destination: payload.destination,
      value: payload.value,
      currency: payload.currency,
      transactionId: payload.deduplicationId,
    }),
    sendMetaConversion({
      eventName: META_EVENT_MAP[payload.eventType],
      eventId: payload.deduplicationId,
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
      contentType: payload.eventType === 'purchase' ? 'travel_package' : 'destination_interest',
      timestamp: payload.timestamp,
    }),
  ]);

  const mode = getDispatchMode(ga4Result.success, metaResult.success);

  emitConversionLog('info', requestId, 'dispatch_complete', {
    eventType: payload.eventType,
    deduplicationId: payload.deduplicationId,
    mode,
    ga4: ga4Result.success ? 'ok' : 'failed',
    meta: metaResult.success ? 'ok' : 'failed',
  });

  return { ga4Result, metaResult, mode };
}

export default async function handler(request: Request): Promise<Response> {
  const requestId = createRequestId();
  const methodError = validateRequestMethod(request, requestId);
  if (methodError) {
    return methodError;
  }

  const authError = validateAuthorization(request, requestId);
  if (authError) {
    return authError;
  }

  const rateLimitError = await enforceRateLimit(request, requestId);
  if (rateLimitError) {
    return rateLimitError;
  }

  const parsedPayload = await parseValidatedPayload(request, requestId);
  if (parsedPayload.ok === false) {
    return parsedPayload.response;
  }

  const { ga4Result, metaResult, mode } = await dispatchConversion(parsedPayload.value, requestId);
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
