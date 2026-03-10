/**
 * HubSpot Webhook Signature Validation (v3)
 * Docs: https://developers.hubspot.com/docs/api/webhooks/validating-signatures
 */

const HUBSPOT_MAX_REQUEST_AGE_MS = 5 * 60 * 1000;
const HUBSPOT_URI_DECODE_RULES: Array<[RegExp, string]> = [
  [/%3A/gi, ':'],
  [/%2F/gi, '/'],
  [/%3F/gi, '?'],
  [/%40/gi, '@'],
  [/%21/gi, '!'],
  [/%24/gi, '$'],
  [/%27/gi, '\''],
  [/%28/gi, '('],
  [/%29/gi, ')'],
  [/%2A/gi, '*'],
  [/%2C/gi, ','],
  [/%3B/gi, ';']
];

export function normalizeHubSpotRequestUri(url: string): string {
  return HUBSPOT_URI_DECODE_RULES.reduce(
    (normalizedUrl, [pattern, replacement]) => normalizedUrl.replace(pattern, replacement),
    url
  );
}

function decodeBase64Value(value: string): ArrayBuffer {
  const decodedValue = atob(value);
  const decodedBytes = new Uint8Array(decodedValue.length);

  for (let index = 0; index < decodedValue.length; index += 1) {
    decodedBytes[index] = decodedValue.charCodeAt(index);
  }

  return decodedBytes.buffer;
}

export async function validateHubSpotSignature(
  signature: string | null,
  timestamp: string | null,
  body: string,
  url: string,
  method: string,
  clientSecret: string
): Promise<boolean> {
  if (!signature || !timestamp) return false;

  // Validate timestamp age (e.g., 5 minutes) to prevent replay attacks
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > HUBSPOT_MAX_REQUEST_AGE_MS) {
    return false;
  }

  const normalizedUrl = normalizeHubSpotRequestUri(url);
  const sourceString = method + normalizedUrl + body + timestamp;
  const encoder = new TextEncoder();

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(clientSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      decodeBase64Value(signature),
      encoder.encode(sourceString)
    );
  } catch {
    return false;
  }
}
