import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/hubspot-webhook.ts';
import { createHubSpotTestSignature } from './helpers/hubspot-signature.ts';

const originalFetch = global.fetch;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalEnv = {
  HUBSPOT_WEBHOOK_SECRET: process.env.HUBSPOT_WEBHOOK_SECRET,
  HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
  GOOGLE_ADS_CONVERSION_ID: process.env.GOOGLE_ADS_CONVERSION_ID,
  GOOGLE_ADS_CONVERSION_LABEL_PURCHASE: process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE,
  META_PIXEL_ID: process.env.META_PIXEL_ID,
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
};

function restoreEnv() {
  process.env.HUBSPOT_WEBHOOK_SECRET = originalEnv.HUBSPOT_WEBHOOK_SECRET;
  process.env.HUBSPOT_TOKEN = originalEnv.HUBSPOT_TOKEN;
  process.env.GOOGLE_ADS_CONVERSION_ID = originalEnv.GOOGLE_ADS_CONVERSION_ID;
  process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE = originalEnv.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE;
  process.env.META_PIXEL_ID = originalEnv.META_PIXEL_ID;
  process.env.META_ACCESS_TOKEN = originalEnv.META_ACCESS_TOKEN;
}

test('hubspot-webhook should reject invalid signature', async (t) => {
  t.after(() => {
    restoreEnv();
  });

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
  const logs: string[] = [];
  const warns: string[] = [];

  t.after(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    restoreEnv();
  });

  const secret = 'test-secret';
  process.env.HUBSPOT_WEBHOOK_SECRET = secret;
  process.env.HUBSPOT_TOKEN = 'test-token';
  delete process.env.GOOGLE_ADS_CONVERSION_ID;
  delete process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE;
  delete process.env.META_PIXEL_ID;
  delete process.env.META_ACCESS_TOKEN;

  console.log = ((...args: unknown[]) => {
    logs.push(args.map(arg => String(arg)).join(' '));
  }) as typeof console.log;
  console.warn = ((...args: unknown[]) => {
    warns.push(args.map(arg => String(arg)).join(' '));
  }) as typeof console.warn;
  console.error = (() => {}) as typeof console.error;

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
  const signature = await createHubSpotTestSignature(
    'POST',
    'http://localhost/api/hubspot-webhook',
    body,
    timestamp,
    secret
  );

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
  assert.ok(warns.some(message => message.includes('HUBSPOT_WEBHOOK: Conversion tracking incomplete for deal 123')));
  assert.ok(!logs.some(message => message.includes('HUBSPOT_WEBHOOK: Conversion sent for deal 123')));
});

test('hubspot-webhook should reject non-array payloads', async (t) => {
  t.after(() => {
    restoreEnv();
  });

  const secret = 'test-secret';
  process.env.HUBSPOT_WEBHOOK_SECRET = secret;
  process.env.HUBSPOT_TOKEN = 'test-token';

  const body = JSON.stringify({ subscriptionType: 'deal.propertyChange' });
  const timestamp = Date.now().toString();
  const signature = await createHubSpotTestSignature(
    'POST',
    'http://localhost/api/hubspot-webhook',
    body,
    timestamp,
    secret
  );

  const response = await handler(new Request('http://localhost/api/hubspot-webhook', {
    method: 'POST',
    headers: {
      'X-HubSpot-Signature-v3': signature,
      'X-HubSpot-Request-Timestamp': timestamp,
      'Content-Type': 'application/json'
    },
    body
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid payload format' });
});
