import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/hubspot-webhook.ts';

const originalFetch = global.fetch;
const originalEnv = {
  HUBSPOT_WEBHOOK_SECRET: process.env.HUBSPOT_WEBHOOK_SECRET,
  HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
};

function restoreEnv() {
  process.env.HUBSPOT_WEBHOOK_SECRET = originalEnv.HUBSPOT_WEBHOOK_SECRET;
  process.env.HUBSPOT_TOKEN = originalEnv.HUBSPOT_TOKEN;
}

async function signRequest(body: string, timestamp: string, secret: string) {
  const method = 'POST';
  const url = 'http://localhost/api/hubspot-webhook';
  const sourceString = method + url + body + timestamp;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(sourceString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

test('hubspot-webhook should reject invalid signature', async (t) => {
  process.env.HUBSPOT_WEBHOOK_SECRET = 'secret';
  process.env.HUBSPOT_TOKEN = 'token';

  const body = JSON.stringify([]);
  const response = await handler(new Request('http://localhost/api/hubspot-webhook', {
    method: 'POST',
    headers: {
      'X-HubSpot-Signature-v3': 'invalid',
      'X-HubSpot-Request-Timestamp': Date.now().toString(),
      'Content-Type': 'application/json'
    },
    body
  }));

  assert.equal(response.status, 401);
});

test('hubspot-webhook should process closed won deal event', async (t) => {
  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  const secret = 'test-secret';
  process.env.HUBSPOT_WEBHOOK_SECRET = secret;
  process.env.HUBSPOT_TOKEN = 'test-token';

  const events = [
    {
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 123
    }
  ];

  const body = JSON.stringify(events);
  const timestamp = Date.now().toString();
  const signature = await signRequest(body, timestamp, secret);

  const calls: Array<{ url: string; method: string }> = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    calls.push({ url, method });

    if (url.includes('/crm/v3/objects/deals/123')) {
      return new Response(JSON.stringify({
        id: '123',
        properties: { amount: '1000', dealname: 'Test Deal' }
      }), { status: 200 });
    }

    if (url.includes('/crm/v4/objects/deals/123/associations/contacts')) {
      return new Response(JSON.stringify({
        results: [{ toObjectId: 'contact-1' }]
      }), { status: 200 });
    }

    if (url.includes('/crm/v3/objects/contacts/contact-1')) {
      return new Response(JSON.stringify({
        id: 'contact-1',
        properties: {
          email: 'test@example.com',
          firstname: 'John',
          lastname: 'Doe',
          hs_google_click_id: 'gclid-123'
        }
      }), { status: 200 });
    }

    return new Response(JSON.stringify({}), { status: 200 });
  }) as typeof fetch;

  const response = await handler(new Request('http://localhost/api/hubspot-webhook', {
    method: 'POST',
    headers: {
      'X-HubSpot-Signature-v3': signature,
      'X-HubSpot-Request-Timestamp': timestamp,
      'Content-Type': 'application/json'
    },
    body
  }));

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);

  assert.ok(calls.some(c => c.url.includes('/deals/123')));
  assert.ok(calls.some(c => c.url.includes('/associations/contacts')));
  assert.ok(calls.some(c => c.url.includes('/contacts/contact-1')));
});
