import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import submitLead from '../api/submit-lead.ts';
import submitContact from '../api/submit-contact.ts';
import {
    leadCreatedDeliveryId,
    notifyLeadCreated,
    signLeadCreatedWebhook,
} from '../lib/lead-created-webhook.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv } from './odoo-mock.ts';

// Quando o site cria um crm.lead novo, a agente Lis (OpenBot) recebe um
// webhook assinado com o id do lead — e nada de dado pessoal.

const WEBHOOK_URL = 'https://hooks.example.test/openbot/lead';
const WEBHOOK_SECRET = 'test-lead-webhook-secret';
const NOW = Date.parse('2026-11-26T12:00:00.000Z');
const NOW_SECONDS = 1795694400;

interface Delivery {
    url: string;
    body: string;
    headers: Record<string, string>;
}

const originalFetch = global.fetch;

function withWebhookEnv(t: { after: (fn: () => void) => void }, env: Record<string, string | undefined>) {
    const saved = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
    for (const [name, value] of Object.entries(env)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
    }
    t.after(() => {
        for (const [name, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    });
}

function configured(t: { after: (fn: () => void) => void }) {
    withWebhookEnv(t, { OPENBOT_LEAD_WEBHOOK_URL: WEBHOOK_URL, OPENBOT_LEAD_WEBHOOK_SECRET: WEBHOOK_SECRET });
}

function recordingFetch(statuses: number[]) {
    const deliveries: Delivery[] = [];
    let call = 0;
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
        deliveries.push({
            url: String(input),
            body: String(init?.body),
            headers: Object.fromEntries(new Headers(init?.headers).entries()),
        });
        const status = statuses[Math.min(call, statuses.length - 1)];
        call += 1;
        return new Response(null, { status });
    }) as typeof fetch;
    return { deliveries, fetchImpl };
}

const noSleep = async () => undefined;

function captureLogs(t: { after: (fn: () => void) => void }): string[] {
    const lines: string[] = [];
    const methods = ['log', 'info', 'warn', 'error'] as const;
    const saved = methods.map((name) => console[name]);
    for (const name of methods) {
        console[name] = (...args: unknown[]) => {
            lines.push(args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '));
        };
    }
    t.after(() => methods.forEach((name, index) => { console[name] = saved[index]; }));
    return lines;
}

test('signLeadCreatedWebhook bate com o vetor fixo (HMAC-SHA256 de "<ts>.<delivery>.<corpo>")', async () => {
    const body = '{"type":"crm.lead.created","occurredAt":"2026-11-26T12:00:00.000Z","data":{"lead_id":4242,"source":"site","form":"submit-lead"}}';
    const signature = await signLeadCreatedWebhook(WEBHOOK_SECRET, NOW_SECONDS, 'lead-4242', body);
    assert.equal(signature, 'sha256=1925f4c517840b56826747fb5ec0c93630d490ede0a6ec9d2a9d168cb32bc4a5');
});

test('notifyLeadCreated envia corpo sem dado pessoal, delivery id lead-<id> e assinatura dos bytes exatos', async (t) => {
    configured(t);
    const { deliveries, fetchImpl } = recordingFetch([202]);

    await notifyLeadCreated({ leadId: 4242, form: 'submit-contact' }, { fetch: fetchImpl, now: () => NOW, sleep: noSleep });

    assert.equal(deliveries.length, 1);
    const [delivery] = deliveries;
    assert.equal(delivery.url, WEBHOOK_URL);
    assert.equal(delivery.headers['content-type'], 'application/json');
    assert.equal(delivery.headers['x-openbot-timestamp'], String(NOW_SECONDS));
    assert.equal(delivery.headers['x-openbot-delivery-id'], 'lead-4242');
    assert.match(delivery.headers['x-openbot-delivery-id'], /^[A-Za-z0-9][A-Za-z0-9._:-]*$/);
    assert.deepEqual(JSON.parse(delivery.body), {
        type: 'crm.lead.created',
        occurredAt: '2026-11-26T12:00:00.000Z',
        data: { lead_id: 4242, source: 'site', form: 'submit-contact' },
    });
    // Verificação independente (node:crypto) sobre a string exata enviada.
    const expected = createHmac('sha256', WEBHOOK_SECRET)
        .update(`${NOW_SECONDS}.lead-4242.${delivery.body}`)
        .digest('hex');
    assert.equal(delivery.headers['x-openbot-signature'], `sha256=${expected}`);
});

test('notifyLeadCreated sem a variável do segredo pula o disparo com aviso', async (t) => {
    withWebhookEnv(t, { OPENBOT_LEAD_WEBHOOK_URL: WEBHOOK_URL, OPENBOT_LEAD_WEBHOOK_SECRET: undefined });
    const logs = captureLogs(t);
    const { deliveries, fetchImpl } = recordingFetch([202]);

    await notifyLeadCreated({ leadId: 1, form: 'submit-lead' }, { fetch: fetchImpl });

    assert.equal(deliveries.length, 0);
    assert.ok(logs.some((line) => line.includes('not_configured')));
});

test('notifyLeadCreated tenta de novo em 503 e nunca lança; log sem segredo nem URL', async (t) => {
    configured(t);
    const logs = captureLogs(t);
    const { deliveries, fetchImpl } = recordingFetch([503]);

    await notifyLeadCreated({ leadId: 7, form: 'submit-lead' }, { fetch: fetchImpl, now: () => NOW, sleep: noSleep });

    assert.equal(deliveries.length, 3);
    assert.equal(new Set(deliveries.map((d) => d.headers['x-openbot-delivery-id'])).size, 1);
    const joined = logs.join('\n');
    assert.match(joined, /failed/);
    assert.ok(!joined.includes(WEBHOOK_SECRET));
    assert.ok(!joined.includes(WEBHOOK_URL));
});

test('notifyLeadCreated não repete em 401 e aceita 200 (duplicado) como entregue', async (t) => {
    configured(t);
    const rejected = recordingFetch([401]);
    await notifyLeadCreated({ leadId: 8, form: 'submit-lead' }, { fetch: rejected.fetchImpl, sleep: noSleep });
    assert.equal(rejected.deliveries.length, 1);

    const duplicate = recordingFetch([200]);
    await notifyLeadCreated({ leadId: 8, form: 'submit-lead' }, { fetch: duplicate.fetchImpl, sleep: noSleep });
    assert.equal(duplicate.deliveries.length, 1);
});

test('notifyLeadCreated engole erro de rede sem lançar', async (t) => {
    configured(t);
    const failing = (async () => { throw new TypeError('network down'); }) as typeof fetch;
    await notifyLeadCreated({ leadId: 9, form: 'submit-lead' }, { fetch: failing, sleep: noSleep });
});

test('leadCreatedDeliveryId usa o formato lead-<id>', () => {
    assert.equal(leadCreatedDeliveryId(555), 'lead-555');
});

// --- integração com os formulários -----------------------------------------

function routeFetch(odooFetch: typeof fetch, deliveries: Delivery[]): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input) === WEBHOOK_URL) {
            deliveries.push({
                url: String(input),
                body: String(init?.body),
                headers: Object.fromEntries(new Headers(init?.headers).entries()),
            });
            return new Response(null, { status: 202 });
        }
        return odooFetch(input, init);
    }) as typeof fetch;
}

function restore() {
    global.fetch = originalFetch;
    clearOdooEnv();
}

function leadRequest(path: string, body: Record<string, unknown>, ip: string): Request {
    return new Request(`http://localhost${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify(body),
    });
}

const LEAD_BODY = {
    firstName: 'Teste',
    lastName: 'Webhook',
    email: 'teste.webhook@example.com',
    whatsapp: '+5511900000000',
    event_id: 'lead_webhook_evt_1',
    bantSummary: 'Need: Praia | Authority: casal | Budget: 20k | Timeline: setembro',
    destination: 'Recife',
    utms: {},
    tracking: {},
};

test('submit-lead dispara o webhook via waitUntil no lead novo e não dispara no replay idempotente', async (t) => {
    t.after(restore);
    configured(t);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 101, leadId: 555 });
    const deliveries: Delivery[] = [];
    global.fetch = routeFetch(mock.fetch, deliveries);

    const pending: Promise<unknown>[] = [];
    const runtime = { waitUntil: (promise: Promise<unknown>) => { pending.push(promise); } };

    const first = await submitLead(leadRequest('/api/submit-lead', LEAD_BODY, '127.0.1.10'), runtime);
    assert.equal(first.status, 201);
    assert.equal(pending.length, 1, 'o disparo vai para o waitUntil, depois da resposta');
    await Promise.all(pending);

    const second = await submitLead(leadRequest('/api/submit-lead', LEAD_BODY, '127.0.1.10'), runtime);
    assert.equal(second.status, 201);
    assert.equal(pending.length, 1, 'replay com o mesmo event_id não dispara de novo');

    assert.equal(deliveries.length, 1);
    const sent = JSON.parse(deliveries[0].body) as { data: Record<string, unknown> };
    assert.deepEqual(sent.data, { lead_id: 555, source: 'site', form: 'submit-lead' });
    for (const pii of ['Teste', 'Webhook', 'teste.webhook@example.com', '5511900000000', 'Recife']) {
        assert.ok(!deliveries[0].body.includes(pii), `o corpo não pode levar ${pii}`);
    }
});

test('submit-contact dispara com form submit-contact', async (t) => {
    t.after(restore);
    configured(t);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 202, leadId: 777 });
    const deliveries: Delivery[] = [];
    global.fetch = routeFetch(mock.fetch, deliveries);

    const pending: Promise<unknown>[] = [];
    const response = await submitContact(
        leadRequest('/api/submit-contact', { firstName: 'Ana', whatsapp: '+5511911111111', eventId: 'contact_webhook_evt_1' }, '127.0.1.20'),
        { waitUntil: (promise) => { pending.push(promise); } },
    );
    assert.equal(response.status, 200);
    await Promise.all(pending);

    assert.equal(deliveries.length, 1);
    assert.deepEqual((JSON.parse(deliveries[0].body) as { data: unknown }).data, { lead_id: 777, source: 'site', form: 'submit-contact' });
});

test('falha do webhook não muda a resposta do formulário', async (t) => {
    t.after(restore);
    configured(t);
    setOdooEnv();
    const mock = createOdooMock({ newPartnerId: 303, leadId: 888 });
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input) === WEBHOOK_URL) throw new TypeError('network down');
        return mock.fetch(input, init);
    }) as typeof fetch;

    const pending: Promise<unknown>[] = [];
    const response = await submitLead(
        leadRequest('/api/submit-lead', { ...LEAD_BODY, event_id: 'lead_webhook_evt_fail' }, '127.0.1.30'),
        { waitUntil: (promise) => { pending.push(promise); } },
    );
    assert.equal(response.status, 201);
    await assert.doesNotReject(Promise.all(pending));
});
