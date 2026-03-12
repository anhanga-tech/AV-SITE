import { createHash } from 'node:crypto';

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
  value?: number;
  currency?: string;
  contentName?: string;
  contentType?: string;
  timestamp?: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
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

function toUnixSeconds(timestamp?: string): number {
  const fallback = Math.floor(Date.now() / 1000);
  const normalized = normalizeString(timestamp);
  if (!normalized) return fallback;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 1_000_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : fallback;
}

function deriveFbc(payload: MetaConversionPayload): string | undefined {
  const fbc = normalizeString(payload.fbc);
  if (fbc) return fbc;

  const fbclid = normalizeString(payload.fbclid);
  if (!fbclid) return undefined;

  return `fb.1.${Date.now()}.${fbclid}`;
}

export async function sendMetaConversion(
  payload: MetaConversionPayload
): Promise<{ success: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('META: Missing Pixel ID or Access Token');
    return { success: false, error: 'Missing configuration' };
  }

  try {
    const userData: Record<string, unknown> = {};
    const email = normalizeString(payload.email);
    const firstName = normalizeString(payload.firstName);
    const lastName = normalizeString(payload.lastName);
    const phone = normalizePhone(payload.phone);
    const fbp = normalizeString(payload.fbp);
    const fbc = deriveFbc(payload);

    if (email) userData.em = [sha256(email)];
    if (firstName) userData.fn = [sha256(firstName)];
    if (lastName) userData.ln = [sha256(lastName)];
    if (phone) userData.ph = [sha256(phone)];
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;

    const customData: Record<string, unknown> = {
      currency: normalizeString(payload.currency) ?? 'BRL',
      value: Number.isFinite(payload.value) ? payload.value : 0,
    };

    const contentName = normalizeString(payload.contentName);
    const contentType = normalizeString(payload.contentType);
    const eventId = normalizeString(payload.eventId);
    if (contentName) customData.content_name = contentName;
    if (contentType) customData.content_type = contentType;

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: payload.eventName,
          event_time: toUnixSeconds(payload.timestamp),
          action_source: 'website',
          user_data: userData,
          custom_data: customData,
          ...(eventId ? { event_id: eventId } : {}),
        },
      ],
    };

    const testEventCode = normalizeString(process.env.META_TEST_EVENT_CODE);
    if (testEventCode) {
      body.test_event_code = testEventCode;
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`META: Conversion failed with status ${response.status}`, detail);
      return {
        success: false,
        error: `HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
      };
    }

    console.log(`META: ${payload.eventName} conversion sent successfully`);
    return { success: true };
  } catch (error) {
    console.error('META: Conversion failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
