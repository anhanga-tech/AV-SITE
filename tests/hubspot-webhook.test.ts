import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/hubspot-webhook.ts';

const originalFetch = global.fetch;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalDateNow = Date.now;
const originalEnv = {
  HUBSPOT_WEBHOOK_SECRET: process.env.HUBSPOT_WEBHOOK_SECRET,
  HUBSPOT_TOKEN: process.env.HUBSPOT_TOKEN,
  GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
  GA4_API_SECRET: process.env.GA4_API_SECRET,
  META_PIXEL_ID: process.env.META_PIXEL_ID,
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
  META_TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE,
};

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function restoreEnv() {
  restoreEnvValue('HUBSPOT_WEBHOOK_SECRET', originalEnv.HUBSPOT_WEBHOOK_SECRET);
  restoreEnvValue('HUBSPOT_TOKEN', originalEnv.HUBSPOT_TOKEN);
  restoreEnvValue('GA4_MEASUREMENT_ID', originalEnv.GA4_MEASUREMENT_ID);
  restoreEnvValue('GA4_API_SECRET', originalEnv.GA4_API_SECRET);
  restoreEnvValue('META_PIXEL_ID', originalEnv.META_PIXEL_ID);
  restoreEnvValue('META_ACCESS_TOKEN', originalEnv.META_ACCESS_TOKEN);
  restoreEnvValue('META_TEST_EVENT_CODE', originalEnv.META_TEST_EVENT_CODE);
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
    Date.now = originalDateNow;
    restoreEnv();
  });

  const secret = 'test-secret';
  Date.now = () => 1736366050123;
  process.env.HUBSPOT_WEBHOOK_SECRET = secret;
  process.env.HUBSPOT_TOKEN = 'test-token';
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
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
  assert.ok(warns.some(message => message.includes('HUBSPOT_WEBHOOK: Conversion tracking incomplete for deal 123')));
  assert.ok(!logs.some(message => message.includes('HUBSPOT_WEBHOOK: Conversion sent for deal 123')));
});

test('hubspot-webhook should send purchase conversion to Meta and derive fbc from fbclid', async (t) => {
  const logs: string[] = [];
  const warns: string[] = [];

  t.after(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    Date.now = originalDateNow;
    restoreEnv();
  });

  const secret = 'test-secret';
  process.env.HUBSPOT_WEBHOOK_SECRET = secret;
  process.env.HUBSPOT_TOKEN = 'test-token';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';

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
  const signature = await signRequest(body, timestamp, secret);

  const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    const parsedBody = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ url, method, body: parsedBody });

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
          phone: '+55 (11) 99999-8888',
          hs_google_click_id: 'gclid-123',
          hs_facebook_click_id: 'fbclid-123',
          ga_client_id: '123456789.1234567890'
        }
      }), { status: 200 });
    }

    if (url.startsWith('https://www.google-analytics.com/mp/collect')) {
      return new Response(null, { status: 204 });
    }

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
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

  const metaRequest = calls.find(call => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'));
  assert.ok(metaRequest, 'meta request should exist');

  const metaEvent = (metaRequest!.body?.data as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(metaEvent, 'meta event payload should exist');
  assert.equal(metaEvent?.event_name, 'Purchase');
  assert.equal((metaEvent?.custom_data as Record<string, unknown>)?.value, 1000);
  assert.match(
    String((metaEvent?.user_data as Record<string, unknown>)?.fbc || ''),
    /^fb\.1\.\d+\.fbclid-123$/,
  );
  assert.ok(!warns.some(message => message.includes('Conversion tracking incomplete')));
  assert.ok(logs.some(message => message.includes('HUBSPOT_WEBHOOK: Conversion sent for deal 123')));
});
