import { logger } from '../logger';
import { readTruncatedProviderDetail } from './provider-detail';

interface MetaConversionPayload {
  eventName: 'Lead' | 'Purchase';
  eventId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentType?: string;
  timestamp?: string;
}

type MetaConversionResult = { success: boolean; error?: string };

const DEFAULT_CURRENCY = 'BRL';
const META_GRAPH_VERSION = 'v19.0';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return toHex(buffer);
}

function normalizeString(value?: string): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePhone(value?: string): string | undefined {
  const digits = normalizeString(value)?.replace(/\D/g, '');
  return digits ? digits : undefined;
}

function toUnixSeconds(timestamp: string | undefined, nowMs: number): number {
  const fallback = Math.floor(nowMs / 1000);
  const normalized = normalizeString(timestamp);
  if (!normalized) return fallback;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 1_000_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : fallback;
}

function deriveFbc(payload: MetaConversionPayload, nowMs: number): string | undefined {
  const fbc = normalizeString(payload.fbc);
  if (fbc) return fbc;

  const fbclid = normalizeString(payload.fbclid);
  if (!fbclid) return undefined;

  return `fb.1.${nowMs}.${fbclid}`;
}

async function buildMetaUserData(payload: MetaConversionPayload, nowMs: number): Promise<Record<string, unknown>> {
  const userData: Record<string, unknown> = {};
  const email = normalizeString(payload.email);
  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const phone = normalizePhone(payload.phone);
  const fbp = normalizeString(payload.fbp);
  const fbc = deriveFbc(payload, nowMs);
  // client_ip_address / client_user_agent are sent raw (NOT hashed) per the Meta
  // CAPI spec — Meta uses them for event matching, not as hashed identifiers.
  const clientIpAddress = normalizeString(payload.clientIpAddress);
  const clientUserAgent = normalizeString(payload.clientUserAgent);

  if (email) userData.em = [await sha256(email)];
  if (firstName) userData.fn = [await sha256(firstName)];
  if (lastName) userData.ln = [await sha256(lastName)];
  if (phone) userData.ph = [await sha256(phone)];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (clientIpAddress) userData.client_ip_address = clientIpAddress;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;

  return userData;
}

function buildMetaCustomData(payload: MetaConversionPayload): Record<string, unknown> {
  const customData: Record<string, unknown> = {
    currency: normalizeString(payload.currency) ?? DEFAULT_CURRENCY,
    value: Number.isFinite(payload.value) ? payload.value : 0,
  };

  const contentName = normalizeString(payload.contentName);
  const contentType = normalizeString(payload.contentType);
  if (contentName) customData.content_name = contentName;
  if (contentType) customData.content_type = contentType;

  return customData;
}

async function buildMetaRequestBody(
  payload: MetaConversionPayload,
  accessToken: string,
  testEventCode: string | undefined,
  nowMs: number
): Promise<Record<string, unknown>> {
  const eventId = normalizeString(payload.eventId);
  const body: Record<string, unknown> = {
    // access_token is sent in the POST body rather than the query string so the
    // secret never appears in a URL (CWE-598). Outbound request URLs can be
    // captured by edge/CDN observability, proxies, and APM tooling; request
    // bodies are not. Meta's Graph API accepts access_token as a body param.
    access_token: accessToken,
    data: [
      {
        event_name: payload.eventName,
        event_time: toUnixSeconds(payload.timestamp, nowMs),
        action_source: 'website',
        user_data: await buildMetaUserData(payload, nowMs),
        custom_data: buildMetaCustomData(payload),
        ...(eventId ? { event_id: eventId } : {}),
      },
    ],
  };

  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  return body;
}

function buildMetaUrl(pixelId: string): string {
  return `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`;
}

async function postMetaConversion(url: string, body: Record<string, unknown>): Promise<Response> {
  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function handleMetaResponse(
  payload: MetaConversionPayload,
  response: Response
): Promise<MetaConversionResult> {
  if (!response.ok) {
    // Untrusted, unbounded upstream body — truncate at the boundary before it
    // reaches logs/Sentry or the returned error string.
    const detail = await readTruncatedProviderDetail(response);
    logger.error(`META: Conversion failed with status ${response.status}`, detail);
    return {
      success: false,
      error: `HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
    };
  }

  logger.info(`META: ${payload.eventName} conversion sent successfully`);
  return { success: true };
}

export async function sendMetaConversion(
  payload: MetaConversionPayload
): Promise<MetaConversionResult> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    logger.warn('META: Missing Pixel ID or Access Token');
    return { success: false, error: 'Missing configuration' };
  }

  try {
    const nowMs = Date.now();
    const testEventCode = normalizeString(process.env.META_TEST_EVENT_CODE);
    const body = await buildMetaRequestBody(payload, accessToken, testEventCode, nowMs);
    const url = buildMetaUrl(pixelId);
    const response = await postMetaConversion(url, body);
    return await handleMetaResponse(payload, response);
  } catch (error) {
    logger.error('META: Conversion failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
