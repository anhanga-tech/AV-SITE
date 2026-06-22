import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sendMetaConversion } from '../lib/conversions/meta.ts';

const originalFetch = global.fetch;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalDateNow = Date.now;
const originalEnv = {
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
  restoreEnvValue('META_PIXEL_ID', originalEnv.META_PIXEL_ID);
  restoreEnvValue('META_ACCESS_TOKEN', originalEnv.META_ACCESS_TOKEN);
  restoreEnvValue('META_TEST_EVENT_CODE', originalEnv.META_TEST_EVENT_CODE);
}

function hashNormalized(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

test('sendMetaConversion should build the expected Meta CAPI payload', async (t) => {
  const requests: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];

  t.after(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Date.now = originalDateNow;
    restoreEnv();
  });

  Date.now = () => 1736366050123;
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';
  process.env.META_TEST_EVENT_CODE = 'TEST123';
  console.log = (() => {}) as typeof console.log;
  console.error = (() => {}) as typeof console.error;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    requests.push({
      url,
      method: init?.method || 'GET',
      body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined,
    });

    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const result = await sendMetaConversion({
    eventName: 'Lead',
    eventId: 'lead_123',
    email: ' Felipe@example.com ',
    firstName: ' Felipe ',
    lastName: ' William ',
    phone: '+55 (11) 99999-8888',
    fbclid: 'fbclid-1',
    fbp: 'fb.1.1736366050.1234567890',
    clientIpAddress: '203.0.113.42',
    clientUserAgent: 'Mozilla/5.0 (Macintosh)',
    value: 1200,
    currency: 'USD',
    contentName: 'Rio de Janeiro',
    contentType: 'destination_interest',
    timestamp: '1736366050',
  });

  assert.deepEqual(result, { success: true });
  assert.equal(requests.length, 1);
  // Security (CWE-598): the access token must never appear in the URL/query
  // string — it is sent in the POST body instead.
  assert.equal(requests[0]?.url, 'https://graph.facebook.com/v19.0/pixel-1/events');
  assert.ok(!requests[0]?.url.includes('token-1'), 'access token must not leak into the URL');
  assert.equal(requests[0]?.body?.access_token, 'token-1');
  assert.equal(requests[0]?.method, 'POST');

  const event = (requests[0]?.body?.data as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(event, 'meta event payload should exist');
  assert.equal(event?.event_name, 'Lead');
  assert.equal(event?.event_time, 1736366050);
  assert.equal(event?.event_id, 'lead_123');
  assert.equal(event?.action_source, 'website');
  assert.deepEqual(event?.custom_data, {
    currency: 'USD',
    value: 1200,
    content_name: 'Rio de Janeiro',
    content_type: 'destination_interest',
  });
  assert.deepEqual(event?.user_data, {
    em: [hashNormalized('felipe@example.com')],
    fn: [hashNormalized('felipe')],
    ln: [hashNormalized('william')],
    ph: [hashNormalized('5511999998888')],
    fbp: 'fb.1.1736366050.1234567890',
    fbc: 'fb.1.1736366050123.fbclid-1',
    client_ip_address: '203.0.113.42',
    client_user_agent: 'Mozilla/5.0 (Macintosh)',
  });
  assert.equal(requests[0]?.body?.test_event_code, 'TEST123');
});

test('sendMetaConversion should omit empty optional fields and use defaults', async (t) => {
  const requests: Array<{ body?: Record<string, unknown> }> = [];

  t.after(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Date.now = originalDateNow;
    restoreEnv();
  });

  Date.now = () => 1736366050123;
  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';
  delete process.env.META_TEST_EVENT_CODE;
  console.log = (() => {}) as typeof console.log;
  console.error = (() => {}) as typeof console.error;

  global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    requests.push({
      body: init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined,
    });

    return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
  }) as typeof fetch;

  const result = await sendMetaConversion({
    eventName: 'Purchase',
    email: '   ',
    firstName: '',
    lastName: ' ',
    phone: '()',
    contentName: '  ',
    contentType: '',
    currency: ' ',
    timestamp: 'invalid',
  });

  assert.deepEqual(result, { success: true });

  const event = (requests[0]?.body?.data as Array<Record<string, unknown>> | undefined)?.[0];
  assert.ok(event, 'meta event payload should exist');
  assert.equal(event?.event_time, 1736366050);
  assert.deepEqual(event?.user_data, {});
  assert.deepEqual(event?.custom_data, {
    currency: 'BRL',
    value: 0,
  });
  assert.ok(!('event_id' in (event || {})));
  assert.ok(!('test_event_code' in (requests[0]?.body || {})));
});

test('sendMetaConversion should return failure when Meta responds with an HTTP error', async (t) => {
  const errors: string[] = [];

  t.after(() => {
    global.fetch = originalFetch;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    Date.now = originalDateNow;
    restoreEnv();
  });

  process.env.META_PIXEL_ID = 'pixel-1';
  process.env.META_ACCESS_TOKEN = 'token-1';
  delete process.env.META_TEST_EVENT_CODE;
  console.log = (() => {}) as typeof console.log;
  console.error = ((...args: unknown[]) => {
    errors.push(args.map((arg) => String(arg)).join(' '));
  }) as typeof console.error;

  global.fetch = (async (): Promise<Response> => {
    return new Response('invalid token', { status: 400 });
  }) as typeof fetch;

  const result = await sendMetaConversion({
    eventName: 'Lead',
    email: 'felipe@example.com',
  });

  assert.equal(result.success, false);
  assert.match(result.error || '', /HTTP 400/);
  assert.ok(errors.some((entry) => entry.includes('META: Conversion failed with status 400')));
});
