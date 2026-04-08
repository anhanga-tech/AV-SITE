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
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
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
  restoreEnvValue('UPSTASH_REDIS_REST_URL', originalEnv.UPSTASH_REDIS_REST_URL);
  restoreEnvValue('UPSTASH_REDIS_REST_TOKEN', originalEnv.UPSTASH_REDIS_REST_TOKEN);
}

function buildRequest(
  body: unknown,
  secret: string,
  headers: Record<string, string> = {},
): Request {
  return new Request('http://localhost/api/purchase-dispatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': secret,
      ...headers,
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

test('purchase-dispatch should hide missing webhook secret configuration', async (t) => {
  t.after(() => {
    restoreEnv();
  });

  delete process.env.N8N_WEBHOOK_SECRET;

  const response = await handler(buildRequest({ dealId: 'deal-1' }, 'wrong-secret'));

  assert.equal(response.status, 500);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.error, 'Internal server error');
});

test('purchase-dispatch should reject non-object JSON bodies', async (t) => {
  t.after(() => {
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';

  const response = await handler(buildRequest([], 'expected-secret'));

  assert.equal(response.status, 400);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.error, 'Missing dealId');
});

test('purchase-dispatch should include a request id in successful responses', async (t) => {
  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';

  global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.startsWith('https://www.google-analytics.com/mp/collect')) {
      return new Response(null, { status: 204 });
    }

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  const response = await handler(buildRequest({
    dealId: 'deal-request-id',
    value: 4200,
    gaClientId: '123456789.1234567890',
    fbclid: 'fbclid-123',
  }, 'expected-secret'));

  const data = await response.json() as Record<string, unknown>;
  const requestId = data.requestId;

  assert.equal(typeof requestId, 'string');
  assert.ok(String(requestId).length > 0);
  assert.equal(response.headers.get('X-Request-Id'), requestId);
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
    dealId: '  <deal-1>  ',
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
  assert.equal((gaEvent?.params as Record<string, unknown>)?.transaction_id, '<deal-1>');
  assert.equal((gaEvent?.params as Record<string, unknown>)?.session_id, '174');
  assert.equal((gaEvent?.params as Record<string, unknown>)?.value, 4200);

  const metaRequest = calls.find(call => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'));
  assert.ok(metaRequest, 'Meta request should exist');

  const metaEvent = (metaRequest!.body?.data as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(metaEvent, 'Meta event should exist');
  assert.equal(metaEvent?.event_name, 'Purchase');
  assert.equal(metaEvent?.event_id, '<deal-1>');
  assert.equal((metaEvent?.custom_data as Record<string, unknown>)?.value, 4200);
});

test('purchase-dispatch should reject negative purchase values', async (t) => {
  t.after(() => {
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';

  const response = await handler(buildRequest({
    dealId: 'deal-negative',
    value: -500,
  }, 'expected-secret'));

  assert.equal(response.status, 400);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.error, 'Invalid value');
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

test('purchase-dispatch should sanitize provider errors in failed responses', async (t) => {
  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';

  global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.startsWith('https://www.google-analytics.com/mp/collect')) {
      return new Response('ga4 upstream detail', { status: 400 });
    }

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response('meta upstream detail', { status: 400 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  const response = await handler(buildRequest({
    dealId: 'deal-failed',
    value: 3200,
    gaClientId: '123456789.1234567890',
    fbclid: 'fbclid-123',
  }, 'expected-secret'));

  assert.equal(response.status, 502);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.mode, 'failed');
  assert.equal((data.ga4 as Record<string, unknown>).success, false);
  assert.equal((data.ga4 as Record<string, unknown>).error, 'Conversion dispatch failed');
  assert.equal((data.meta as Record<string, unknown>).success, false);
  assert.equal((data.meta as Record<string, unknown>).error, 'Conversion dispatch failed');
});

test('purchase-dispatch should return partial mode when GA4 succeeds and Meta fails', async (t) => {
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
      return new Response('meta upstream detail', { status: 400 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  const response = await handler(buildRequest({
    dealId: 'deal-meta-failure',
    value: 1800,
    gaClientId: '123456789.1234567890',
    fbclid: 'fbclid-999',
  }, 'expected-secret'));

  assert.equal(response.status, 200);

  const data = await response.json() as Record<string, unknown>;
  assert.equal(data.ok, true);
  assert.equal(data.mode, 'partial');
  assert.equal((data.ga4 as Record<string, unknown>).success, true);
  assert.equal((data.meta as Record<string, unknown>).success, false);
  assert.equal((data.meta as Record<string, unknown>).error, 'Conversion dispatch failed');

  const gaRequest = calls.find(call => call.url.startsWith('https://www.google-analytics.com/mp/collect'));
  assert.ok(gaRequest, 'GA4 request should exist');

  const metaRequest = calls.find(call => call.url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events'));
  assert.ok(metaRequest, 'Meta request should exist');
});

test('purchase-dispatch should rate limit repeated requests from the same client', async (t) => {
  const calls: Array<{ url: string }> = [];
  const clientIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;

  t.after(() => {
    global.fetch = originalFetch;
    restoreEnv();
  });

  process.env.N8N_WEBHOOK_SECRET = 'expected-secret';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST12345';
  process.env.GA4_API_SECRET = 'test-api-secret';
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url });

    if (url.startsWith('https://www.google-analytics.com/mp/collect')) {
      return new Response(null, { status: 204 });
    }

    if (url.startsWith('https://graph.facebook.com/v19.0/pixel-1/events')) {
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'unexpected request' }), { status: 500 });
  }) as typeof fetch;

  let response: Response | undefined;
  for (let index = 0; index < 31; index += 1) {
    response = await handler(buildRequest({
      dealId: `deal-rate-${index}`,
      value: 1000 + index,
      gaClientId: '123456789.1234567890',
      fbclid: 'fbclid-123',
    }, 'expected-secret', {
      'x-real-ip': clientIp,
    }));
  }

  assert.ok(response);
  assert.equal(response!.status, 429);

  const data = await response!.json() as Record<string, unknown>;
  assert.equal(data.ok, false);
  assert.equal(data.error, 'Too many requests');
  assert.equal(typeof data.requestId, 'string');
  assert.equal(response!.headers.get('X-Request-Id'), data.requestId);
  assert.equal(calls.length, 60);
});
