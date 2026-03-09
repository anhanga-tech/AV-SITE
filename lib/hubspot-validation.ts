/**
 * HubSpot Webhook V3 Signature Validation for Edge Runtime.
 */
export async function validateHubSpotSignature(
    request: Request,
    body: string,
    secret: string
): Promise<boolean> {
    const signature = request.headers.get('x-hubspot-signature-v3');
    const timestamp = request.headers.get('x-hubspot-request-timestamp');

    if (!signature || !timestamp) return false;

    // Replay attack protection (5-minute window)
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 300000) return false;

    // Source: Method + URI + Body + Timestamp
    const sourceString = request.method + request.url + body + timestamp;

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['sign']
        );
        const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(sourceString));
        const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

        return safeCompare(computedSignature, signature);
    } catch {
        return false;
    }
}

function safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
}
