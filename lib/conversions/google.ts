type GA4EventName = 'lead_qualificado' | 'purchase';

interface GA4ConversionPayload {
  clientId?: string | null;
  sessionId?: string | null;
  gclid?: string | null;
  destination?: string;
  value?: number;
  currency?: string;
}

type GA4ConversionResult = { success: boolean; error?: string };

const DEFAULT_CURRENCY = 'BRL';
const GA4_COLLECT_URL = process.env.GA4_DEBUG_MODE === 'true' ? 'https://www.google-analytics.com/debug/mp/collect' : 'https://www.google-analytics.com/mp/collect';

function buildGA4EventParams(payload: GA4ConversionPayload): Record<string, unknown> {
  const params: Record<string, unknown> = {
    currency: payload.currency ?? DEFAULT_CURRENCY,
    value: Number.isFinite(payload.value) ? payload.value : 0,
  };

  if (payload.sessionId) params.session_id = payload.sessionId;
  if (payload.destination) params.destination = payload.destination;
  if (payload.gclid) params.gclid = payload.gclid;

  return params;
}

function buildGA4RequestBody(eventName: GA4EventName, clientId: string, payload: GA4ConversionPayload): Record<string, unknown> {
  return {
    client_id: clientId,
    events: [{
      name: eventName,
      params: buildGA4EventParams(payload),
    }],
  };
}

function buildGA4Url(measurementId: string, apiSecret: string): string {
  return `${GA4_COLLECT_URL}?measurement_id=${measurementId}&api_secret=${apiSecret}`;
}

export async function sendGoogleConversion(
  eventName: GA4EventName,
  payload: GA4ConversionPayload,
): Promise<GA4ConversionResult> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn('[GA4 MP] vars não configuradas — pulando');
    return { success: false, error: 'Missing configuration' };
  }

  if (!payload.clientId) {
    console.warn('[GA4 MP] clientId ausente — pulando');
    return { success: false, error: 'Missing clientId' };
  }

  try {
    const url = buildGA4Url(measurementId, apiSecret);
    const body = buildGA4RequestBody(eventName, payload.clientId, payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[GA4 MP] Status inesperado: ${res.status}`, detail);
      return { success: false, error: `HTTP ${res.status}${detail ? `: ${detail}` : ''}` };
    }

    console.log(`[GA4 MP] ${eventName} enviado com sucesso`);
    return { success: true };
  } catch (error) {
    console.error('[GA4 MP] Falha ao enviar evento', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
