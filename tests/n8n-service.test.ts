import test from 'node:test';
import assert from 'node:assert/strict';
import { sendNpsToN8n } from '../services/n8n.ts';
import type { N8nNpsPayload } from '../lib/n8n-payloads.ts';

// NPS is the only remaining n8n consumer after the Odoo lead cut-over; it carries
// the webhook URL-security coverage that used to ride on the contact sender.

const originalFetch = global.fetch;

function buildNpsPayload(): N8nNpsPayload {
    return {
        requestId: 'req-test-1',
        firstname: 'Felipe',
        email: 'felipe@example.com',
        score: 9,
        reason: 'Atendimento excelente',
        highlight: 'Roteiro impecável',
        submittedAt: new Date().toISOString(),
    };
}

test('sendNpsToN8n rejects non-HTTPS, non-local webhook URLs', async () => {
    await assert.rejects(
        sendNpsToN8n('http://example.com/webhook', 'secret', 'req-1', buildNpsPayload()),
        (error: unknown) => error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:500:'),
    );
});

test('sendNpsToN8n rejects malformed webhook URLs', async () => {
    await assert.rejects(
        sendNpsToN8n('not-a-url', 'secret', 'req-2', buildNpsPayload()),
        (error: unknown) => error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:500:'),
    );
});

test('sendNpsToN8n allows http://localhost webhook URLs', async (t) => {
    t.after(() => { global.fetch = originalFetch; });
    let called = false;
    global.fetch = (async () => { called = true; return new Response(JSON.stringify({ ok: true }), { status: 200 }); }) as typeof fetch;
    await sendNpsToN8n('http://localhost:5678/webhook', 'secret', 'req-3', buildNpsPayload());
    assert.equal(called, true);
});

test('sendNpsToN8n allows http://[::1] webhook URLs', async (t) => {
    t.after(() => { global.fetch = originalFetch; });
    let called = false;
    global.fetch = (async () => { called = true; return new Response(JSON.stringify({ ok: true }), { status: 200 }); }) as typeof fetch;
    await sendNpsToN8n('http://[::1]:5678/webhook', 'secret', 'req-3b', buildNpsPayload());
    assert.equal(called, true);
});

test('sendNpsToN8n allows https webhook URLs', async (t) => {
    t.after(() => { global.fetch = originalFetch; });
    let called = false;
    global.fetch = (async () => { called = true; return new Response(JSON.stringify({ ok: true }), { status: 200 }); }) as typeof fetch;
    await sendNpsToN8n('https://n8n.example.com/webhook', 'secret', 'req-4', buildNpsPayload());
    assert.equal(called, true);
});
