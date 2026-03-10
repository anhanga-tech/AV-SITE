export async function createHubSpotTestSignature(
  method: string,
  url: string,
  body: string,
  timestamp: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(method + url + body + timestamp)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}
