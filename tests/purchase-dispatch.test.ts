import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/purchase-dispatch.ts';

const originalFetch = global.fetch;
const originalEnv = {
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
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
  restoreEnvValue('N8N_WEBHOOK_SECRET', originalEnv.N8N_WEBHOOK_SECRET);
  restoreEnvValue('GA4_MEASUREMENT_ID', originalEnv.GA4_MEASUREMENT_ID);
  restoreEnvValue('GA4_API_SECRET', originalEnv.GA4_API_SECRET);
  restoreEnvValue('META_PIXEL_ID', originalEnv.META_PIXEL_ID);
  restoreEnvValue('META_ACCESS_TOKEN', originalEnv.META_ACCESS_TOKEN);
  restoreEnvValue('META_TEST_EVENT_CODE', originalEnv.META_TEST_EVENT_CODE);
}

function buildRequest(
  body: Record<string, unknown>,
  secret: string,
): Request {
  return new Request('http://localhost/api/purchase-dispatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
    },
    body: JSON.stringify(body),
  });
}

test('purchase-dispatch should reject invalid webhook secret', async (t) => {
  t.after(() => {
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';

  const response = await handler(buildRequest({ dealId: 'deal-1' }, 'wrong-secret'));

  assert.equal(response.status, 401);
});

test('purchase-dispatch should send GA4 and Meta purchase payloads', async (t) => {
  const calls: Array<{ url: string; body?: Record<string, unknown> }> = [];

  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ url, body });

    if (url.startsWith('https://www.google-analytics.com/mp/collect')) {
      return new Response(null, { status: 204 });
    }

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  const response = await handler(buildRequest({
    dealId: 'deal-1',
    value: 4200,
    currency: 'BRL',
    destination: 'Japao',
    email: 'cliente@example.com',
    phone: '+55 (11) 98888-7777',
    firstName: 'Gabrielle',
    lastName: 'Rodrigues',
    gaClientId: '123456789.1234567890',
    gaSessionId: '174',
    gclid: 'gclid-123',
    fbclid: 'fbclid-123',
    fbp: 'fb.1.1736366050.1234567890',
    timestamp: '2026-04-07T12:00:00.000Z',
  }, 'expected-secret'));

  assert.equal(response.status, 200);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'full');

  const gaRequest = calls.find(call => call.url.startsWith('https://www.google-analytics.com/mp/collect'));
  assert.ok(gaRequest, 'GA4 request should exist');

  const gaEvent = (gaRequest!.body?.events as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(gaEvent, 'GA4 event should exist');
  assert.equal(gaRequest!.body?.client_id, '123456789.1234567890');
  assert.equal(gaEvent?.name, 'purchase');
  assert.equal((gaEvent?.params as Record<string, unknown>)?.transaction_id, 'deal-1');
  assert.equal((gaEvent?.params as Record<string, unknown>)?.session_id, '174');
  assert.equal((gaEvent?.params as Record<string, unknown>)?.value, 4200);

  const metaRequest = calls.find(call => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'));
  assert.ok(metaRequest, 'Meta request should exist');

  const metaEvent = (metaRequest!.body?.data as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(metaEvent, 'Meta event should exist');
  assert.equal(metaEvent?.event_name, 'Purchase');
  assert.equal(metaEvent?.event_id, 'deal-1');
  assert.equal((metaEvent?.custom_data as Record<string, unknown>)?.value, 4200);
});

test('purchase-dispatch should return partial mode when GA4 lacks client id but Meta succeeds', async (t) => {
  const calls: Array<{ url: string; body?: Record<string, unknown> }> = [];

  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ url, body });

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  const response = await handler(buildRequest({
    dealId: 'deal-2',
    value: 1800,
    email: 'cliente@example.com',
    phone: '+55 (11) 97777-6666',
    firstName: 'Felipe',
    lastName: 'Williams',
    fbclid: 'fbclid-999',
  }, 'expected-secret'));

  assert.equal(response.status, 200);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'partial');
  assert.equal((data.ga4 as Record<string, unknown>).success, false);
  assert.equal((data.meta as Record<string, unknown>).success, true);

  const metaRequest = calls.find(call => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'));
  assert.ok(metaRequest, 'Meta request should exist');

  const gaRequest = calls.find(call => call.url.startsWith('https://www.google-analytics.com/mp/collect'));
  assert.equal(gaRequest, undefined);
});
