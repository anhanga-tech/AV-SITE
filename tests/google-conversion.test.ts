import test from 'node:test';
import assert from 'node:assert/strict';
import { sendGoogleConversion } from '../lib/conversions/google.ts';

const originalFetch = global.fetch;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalEnv = {
    GA4_MEASUREMENT_ID: process.env.GA4_MEASUREMENT_ID,
    GA4_API_SECRET: process.env.GA4_API_SECRET,
};

function restoreEnvValue(key: string, value: string | undefined) {
    if (value === undefined) {
        delete process.env[key];
        return;
    }
    process.env[key] = value;
}

function restoreEnv() {
    restoreEnvValue('GA4_MEASUREMENT_ID', originalEnv.GA4_MEASUREMENT_ID);
    restoreEnvValue('GA4_API_SECRET', originalEnv.GA4_API_SECRET);
}

function silenceLogger(t: { after: (fn: () => void) => void }) {
    console.log = (() => {}) as typeof console.log;
    console.warn = (() => {}) as typeof console.warn;
    console.error = (() => {}) as typeof console.error;
    t.after(() => {
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });
}

function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return (input as Request).url;
}

test('sendGoogleConversion returns failure when GA4_MEASUREMENT_ID is missing', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    delete process.env.GA4_MEASUREMENT_ID;
    process.env.GA4_API_SECRET = 'secret';

    const result = await sendGoogleConversion('lead_qualificado', { clientId: 'cid-1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Missing configuration');
});

test('sendGoogleConversion returns failure when GA4_API_SECRET is missing', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    delete process.env.GA4_API_SECRET;

    const result = await sendGoogleConversion('lead_qualificado', { clientId: 'cid-1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Missing configuration');
});

test('sendGoogleConversion returns failure when clientId is null', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    const result = await sendGoogleConversion('lead_qualificado', { clientId: null });
    assert.equal(result.success, false);
    assert.equal(result.error, 'Missing clientId');
});

test('sendGoogleConversion sends correct payload to GA4', async (t) => {
    const requests: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-ABCDE';
    process.env.GA4_API_SECRET = 'secret-123';

    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        requests.push({
            url: getUrl(input),
            method: init?.method || 'GET',
            body: init?.body ? JSON.parse(init.body as string) as Record<string, unknown> : {},
        });
        return new Response('{}', { status: 200 });
    }) as typeof fetch;

    const result = await sendGoogleConversion('lead_qualificado', {
        clientId: 'cid-abc',
        sessionId: 'sid-123',
        gclid: 'gclid-xyz',
        destination: 'Orlando',
        value: 5000,
        currency: 'BRL',
        transactionId: 'txn-1',
    });

    assert.equal(result.success, true);
    assert.equal(requests.length, 1);

    const req = requests[0]!;
    assert.ok(req.url.includes('G-ABCDE'));
    assert.ok(req.url.includes('secret-123'));
    assert.equal(new URL(req.url).hostname, 'www.google-analytics.com');
    assert.equal(req.method, 'POST');
    assert.equal(req.body.client_id, 'cid-abc');

    const events = req.body.events as Array<{ name: string; params: Record<string, unknown> }>;
    assert.equal(events[0]?.name, 'lead_qualificado');
    assert.equal(events[0]?.params.session_id, 'sid-123');
    assert.equal(events[0]?.params.gclid, 'gclid-xyz');
    assert.equal(events[0]?.params.destination, 'Orlando');
    assert.equal(events[0]?.params.value, 5000);
    assert.equal(events[0]?.params.currency, 'BRL');
    assert.equal(events[0]?.params.transaction_id, 'txn-1');
});

test('sendGoogleConversion applies BRL as default currency and 0 as default value', async (t) => {
    const requests: Array<{ body: Record<string, unknown> }> = [];
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    global.fetch = (async (_: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        requests.push({ body: init?.body ? JSON.parse(init.body as string) as Record<string, unknown> : {} });
        return new Response('{}', { status: 200 });
    }) as typeof fetch;

    await sendGoogleConversion('purchase', { clientId: 'cid-1' });

    const events = requests[0]!.body.events as Array<{ params: Record<string, unknown> }>;
    const params = events[0]!.params;
    assert.equal(params.currency, 'BRL');
    assert.equal(params.value, 0);
});

test('sendGoogleConversion omits optional params when absent', async (t) => {
    const requests: Array<{ body: Record<string, unknown> }> = [];
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    global.fetch = (async (_: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        requests.push({ body: init?.body ? JSON.parse(init.body as string) as Record<string, unknown> : {} });
        return new Response('{}', { status: 200 });
    }) as typeof fetch;

    await sendGoogleConversion('lead_qualificado', { clientId: 'cid-1' });

    const events = requests[0]!.body.events as Array<{ params: Record<string, unknown> }>;
    const params = events[0]!.params;
    assert.ok(!('session_id' in params));
    assert.ok(!('destination' in params));
    assert.ok(!('gclid' in params));
    assert.ok(!('transaction_id' in params));
});

test('sendGoogleConversion returns failure on non-ok HTTP response', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    global.fetch = (async (): Promise<Response> => new Response('Unauthorized', { status: 401 })) as typeof fetch;

    const result = await sendGoogleConversion('lead_qualificado', { clientId: 'cid-1' });
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('HTTP 401'));
});

test('sendGoogleConversion returns failure when fetch throws', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    global.fetch = (async (): Promise<Response> => { throw new Error('network failure'); }) as typeof fetch;

    const result = await sendGoogleConversion('lead_qualificado', { clientId: 'cid-1' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'network failure');
});

test('sendGoogleConversion returns success=true on 200 response', async (t) => {
    silenceLogger(t);
    t.after(() => { global.fetch = originalFetch; restoreEnv(); });

    process.env.GA4_MEASUREMENT_ID = 'G-TEST';
    process.env.GA4_API_SECRET = 'secret';

    global.fetch = (async (): Promise<Response> => new Response('{}', { status: 200 })) as typeof fetch;

    const result = await sendGoogleConversion('close_convert_lead', { clientId: 'cid-1', value: 1200 });
    assert.equal(result.success, true);
    assert.ok(!result.error);
});
