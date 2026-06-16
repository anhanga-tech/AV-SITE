import test from 'node:test';
import assert from 'node:assert/strict';
import { sendContactToN8n } from '../services/n8n.ts';
import type { N8nContactPayload } from '../lib/n8n-payloads.ts';

const originalFetch = global.fetch;

function buildContactPayload(): N8nContactPayload {
    return {
        requestId: 'req-test-1',
        source: 'submit-contact',
        contact: {
            firstName: 'Felipe',
            lastName: 'William',
            whatsapp: '+5511988314487',
            email: 'felipe@example.com',
            emailOptIn: true,
            eventId: null,
            ctaSource: null,
            destination: null,
        },
        tracking: {
            utm_source: null,
            utm_medium: null,
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            extras: {},
        },
        meta: {
            receivedAt: new Date().toISOString(),
        },
    };
}

test('sendContactToN8n rejects non-HTTPS, non-local webhook URLs', async () => {
    await assert.rejects(
        sendContactToN8n('http://example.com/webhook', 'secret', 'req-1', buildContactPayload()),
        (error: unknown) => error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:500:'),
    );
});

test('sendContactToN8n rejects malformed webhook URLs', async () => {
    await assert.rejects(
        sendContactToN8n('not-a-url', 'secret', 'req-2', buildContactPayload()),
        (error: unknown) => error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:500:'),
    );
});

test('sendContactToN8n allows http://localhost webhook URLs', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    let called = false;
    global.fetch = (async () => {
        called = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await sendContactToN8n('http://localhost:5678/webhook', 'secret', 'req-3', buildContactPayload());

    assert.equal(called, true);
});

test('sendContactToN8n allows http://[::1] webhook URLs', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    let called = false;
    global.fetch = (async () => {
        called = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await sendContactToN8n('http://[::1]:5678/webhook', 'secret', 'req-3b', buildContactPayload());

    assert.equal(called, true);
});

test('sendContactToN8n allows https webhook URLs', async (t) => {
    t.after(() => {
        global.fetch = originalFetch;
    });

    let called = false;
    global.fetch = (async () => {
        called = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await sendContactToN8n('https://n8n.example.com/webhook', 'secret', 'req-4', buildContactPayload());

    assert.equal(called, true);
});
