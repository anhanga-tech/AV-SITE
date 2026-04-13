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

export function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export function normalizeHubSpotRequestUri(url: string): string {
  return HUBSPOT_URI_DECODE_RULES.reduce(
    (normalizedUrl, [pattern, replacement]) => normalizedUrl.replace(pattern, replacement),
    url
  );
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
  const keyData = encoder.encode(clientSecret);
  const messageData = encoder.encode(sourceString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const generatedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return timingSafeEqual(generatedSignature, signature);
}
