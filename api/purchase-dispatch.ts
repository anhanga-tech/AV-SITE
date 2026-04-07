import { sendGoogleConversion } from '../lib/conversions/google';
import { sendMetaConversion } from '../lib/conversions/meta';
import { buildCorsHeaders } from '../lib/network';

export const config = {
  runtime: 'edge',
};

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

function buildJsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(),
    },
  });
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

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders() });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const expectedSecret = getExpectedSecret();
  if (!expectedSecret) {
    return buildJsonResponse({ ok: false, error: 'Internal server error' }, 500);
  }

  if (!isAuthorized(request, expectedSecret)) {
    return buildJsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return buildJsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const payload = normalizePayload(body);
  if (!payload) {
    return buildJsonResponse({ ok: false, error: 'Missing dealId' }, 400);
  }

  const [ga4, meta] = await Promise.all([
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

  const mode = ga4.success && meta.success
    ? 'full'
    : ga4.success || meta.success
      ? 'partial'
      : 'failed';

  return buildJsonResponse(
    {
      ok: mode !== 'failed',
      mode,
      ga4,
      meta,
    },
    mode === 'failed' ? 502 : 200,
  );
}
