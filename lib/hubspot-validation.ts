/**
 * HubSpot Webhook Signature Validation (v3)
 * Docs: https://developers.hubspot.com/docs/api/webhooks/validating-signatures
 */

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
  if (isNaN(requestTime) || Math.abs(now - requestTime) > (5 * 60 * 1000)) {
    return false;
  }

  const sourceString = method + url + body + timestamp;

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

  return generatedSignature === signature;
}
