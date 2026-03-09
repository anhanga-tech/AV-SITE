import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHubSpotSignature } from '../lib/hubspot-validation.ts';

// Helper to generate a valid signature for tests using Node's crypto
import crypto from 'node:crypto';

async function generateTestSignature(method: string, url: string, body: string, timestamp: string, secret: string) {
    const sourceString = method + url + body + timestamp;
    return crypto
        .createHmac('sha256', secret)
        .update(sourceString)
        .digest('base64');
}

test('validateHubSpotSignature: should validate a correct signature', async () => {
    const secret = 'test-secret';
    const timestamp = Date.now().toString();
    const body = JSON.stringify([{ eventId: 1, subscriptionType: 'deal.creation' }]);
    const method = 'POST';
    const url = 'https://example.com/api/hubspot-webhook';

    const validSignature = await generateTestSignature(method, url, body, timestamp, secret);

    const request = new Request(url, {
        method,
        headers: {
            'x-hubspot-signature-v3': validSignature,
            'x-hubspot-request-timestamp': timestamp,
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, true);
});

test('validateHubSpotSignature: should fail if signature is missing', async () => {
    const secret = 'test-secret';
    const timestamp = Date.now().toString();
    const body = '{}';
    const url = 'https://example.com/api/hubspot-webhook';

    const request = new Request(url, {
        method: 'POST',
        headers: {
            'x-hubspot-request-timestamp': timestamp,
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, false);
});

test('validateHubSpotSignature: should fail if timestamp is missing', async () => {
    const secret = 'test-secret';
    const body = '{}';
    const url = 'https://example.com/api/hubspot-webhook';

    const request = new Request(url, {
        method: 'POST',
        headers: {
            'x-hubspot-signature-v3': 'some-sig',
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, false);
});

test('validateHubSpotSignature: should fail if signature is incorrect', async () => {
    const secret = 'test-secret';
    const timestamp = Date.now().toString();
    const body = '{}';
    const url = 'https://example.com/api/hubspot-webhook';

    const request = new Request(url, {
        method: 'POST',
        headers: {
            'x-hubspot-signature-v3': 'invalid-signature',
            'x-hubspot-request-timestamp': timestamp,
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, false);
});

test('validateHubSpotSignature: should fail if timestamp is outside of the 5-minute window', async () => {
    const secret = 'test-secret';
    const oldTimestamp = (Date.now() - 6 * 60 * 1000).toString();
    const body = '{}';
    const method = 'POST';
    const url = 'https://example.com/api/hubspot-webhook';

    const validSignature = await generateTestSignature(method, url, body, oldTimestamp, secret);

    const request = new Request(url, {
        method,
        headers: {
            'x-hubspot-signature-v3': validSignature,
            'x-hubspot-request-timestamp': oldTimestamp,
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, false);
});

test('validateHubSpotSignature: should handle invalid timestamp format', async () => {
    const secret = 'test-secret';
    const body = '{}';
    const url = 'https://example.com/api/hubspot-webhook';

    const request = new Request(url, {
        method: 'POST',
        headers: {
            'x-hubspot-signature-v3': 'some-sig',
            'x-hubspot-request-timestamp': 'not-a-number',
        },
    });

    const isValid = await validateHubSpotSignature(request, body, secret);
    assert.strictEqual(isValid, false);
});
