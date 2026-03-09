/**
 * Validates HubSpot webhook signatures (V3) using the Web Crypto API.
 * Docs: https://developers.hubspot.com/docs/api/webhooks/validating-signatures
 */

/**
 * Validates the HubSpot V3 signature.
 * @param request The incoming Request object.
 * @param body The raw request body as a string.
 * @param webhookSecret The HubSpot App Client Secret (HUBSPOT_WEBHOOK_SECRET).
 * @returns A promise that resolves to true if the signature is valid.
 */
export async function validateHubSpotSignature(
    request: Request,
    body: string,
    webhookSecret: string
): Promise<boolean> {
    const signature = request.headers.get('x-hubspot-signature-v3');
    const timestamp = request.headers.get('x-hubspot-request-timestamp');

    if (!signature || !timestamp) {
        console.error('[HubSpot Validation] Missing signature or timestamp header');
        return false;
    }

    // 1. Check for replay attacks (5 minute window)
    const now = Date.now();
    const requestTimestamp = parseInt(timestamp, 10);
    const fiveMinutesInMs = 5 * 60 * 1000;

    if (isNaN(requestTimestamp) || Math.abs(now - requestTimestamp) > fiveMinutesInMs) {
        console.error('[HubSpot Validation] Timestamp out of valid window or invalid', {
            requestTimestamp,
            now,
            diff: Math.abs(now - requestTimestamp)
        });
        return false;
    }

    // 2. Build the source string: Method + URI + Body + Timestamp
    // The URI should include protocol, host, and path.
    const method = request.method;
    const uri = request.url;
    const sourceString = method + uri + body + timestamp;

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(webhookSecret);
        const sourceData = encoder.encode(sourceString);

        // 3. Create HMAC SHA-256 hash
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, sourceData);

        // 4. Base64 encode the resulting hash
        const generatedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

        // 5. Compare signatures using a simple constant-time approach
        // We use a manual loop to prevent timing attacks.
        let isValid = true;
        if (generatedSignature.length !== signature.length) {
            isValid = false;
        }

        const len = Math.max(generatedSignature.length, signature.length);
        let result = 0;
        for (let i = 0; i < len; i++) {
            const a = generatedSignature.charCodeAt(i) || 0;
            const b = signature.charCodeAt(i) || 0;
            result |= (a ^ b);
        }

        isValid = isValid && (result === 0);

        if (!isValid) {
            console.error('[HubSpot Validation] Signature mismatch', {
                received: signature,
                generated: generatedSignature,
                uri,
                method,
                timestamp
            });
        }

        return isValid;
    } catch (error) {
        console.error('[HubSpot Validation] Error during validation:', error);
        return false;
    }
}
