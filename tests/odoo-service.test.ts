import test from 'node:test';
import assert from 'node:assert/strict';
import { getOdooConfig, openOdooSession } from '../services/odoo.ts';
import { createOdooMock, setOdooEnv, clearOdooEnv, ODOO_TEST_ENV } from './odoo-mock.ts';

const originalFetch = global.fetch;

function config() {
    setOdooEnv();
    const cfg = getOdooConfig();
    assert.ok(cfg, 'config should be present');
    return cfg!;
}

test('getOdooConfig — returns null when any var is missing', (t) => {
    t.after(clearOdooEnv);
    setOdooEnv();
    delete process.env.ODOO_API_KEY;
    assert.equal(getOdooConfig(), null);
});

test('getOdooConfig — returns the full config when present', (t) => {
    t.after(clearOdooEnv);
    setOdooEnv();
    assert.deepEqual(getOdooConfig(), {
        url: ODOO_TEST_ENV.ODOO_URL,
        db: ODOO_TEST_ENV.ODOO_DB,
        login: ODOO_TEST_ENV.ODOO_LOGIN,
        apiKey: ODOO_TEST_ENV.ODOO_API_KEY,
    });
});

test('upsertPartner — creates a new partner when none matches the e-mail', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingPartnerId: null, newPartnerId: 202 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.upsertPartner({ name: 'Ana Silva', email: 'ana@example.com' });

    assert.equal(id, 202);
    assert.deepEqual(mock.calls.map((c) => `${c.model}.${c.method}`), ['res.partner.search_read', 'res.partner.create']);
});

test('upsertPartner — updates the existing partner (dedup by e-mail)', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingPartnerId: 99 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.upsertPartner({ name: 'Ana Silva', email: 'ana@example.com', x_lgpd_consent: true });

    assert.equal(id, 99);
    const write = mock.calls.find((c) => c.method === 'write');
    assert.ok(write, 'should write to the existing partner');
    assert.deepEqual(write!.args[0], [99]);
});

test('upsertPartner — appends to the existing comment instead of overwriting it', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingPartnerId: 50, existingComment: 'Nota do vendedor' });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    await session.upsertPartner({ name: 'Ana', email: 'ana@example.com', comment: 'Nova nota do quiz' });

    const write = mock.calls.find((c) => c.method === 'write')!;
    const fields = write.args[1] as Record<string, unknown>;
    assert.equal(fields.comment, 'Nota do vendedor\n\nNova nota do quiz');
});

test('upsertPartner — uses the new comment when the partner has none', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingPartnerId: 51, existingComment: false });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    await session.upsertPartner({ name: 'Ana', email: 'ana@example.com', comment: 'Primeira nota' });

    const write = mock.calls.find((c) => c.method === 'write')!;
    assert.equal((write.args[1] as Record<string, unknown>).comment, 'Primeira nota');
});

// Non-destructive upsert — a public form must not overwrite populated scalar
// fields of a partner it matched by e-mail/phone (issue #1021).

test('upsertPartner — does not overwrite populated name/phone/email on an existing match', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({
        existingPartnerId: 60,
        existingFields: { name: 'Ana Carolina Silva', email: 'ana@example.com', phone: '+5511999998888' },
    });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    await session.upsertPartner({
        name: 'Hacker',
        email: 'ana@example.com',
        phone: '+5511000000000',
        comment: 'nota',
    });

    const fields = mock.calls.find((c) => c.method === 'write')!.args[1] as Record<string, unknown>;
    assert.equal('name' in fields, false, 'populated name must not be overwritten');
    assert.equal('phone' in fields, false, 'populated phone must not be overwritten');
    assert.equal('email' in fields, false, 'populated email must not be overwritten');
    assert.equal(fields.comment, 'nota', 'additive comment still applies');
});

test('upsertPartner — fills a blank protected field on an existing match (enrichment)', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    // Matched by e-mail; phone is unset (Odoo reports `false`), so it may be filled.
    const mock = createOdooMock({
        existingPartnerId: 61,
        existingFields: { name: 'Ana', email: 'ana@example.com', phone: false },
    });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    await session.upsertPartner({ name: 'Ana', email: 'ana@example.com', phone: '+5511999998888' });

    const fields = mock.calls.find((c) => c.method === 'write')!.args[1] as Record<string, unknown>;
    assert.equal(fields.phone, '+5511999998888', 'a blank field is enriched, not blocked');
    assert.equal('name' in fields, false, 'populated name stays untouched');
});

test('upsertPartner — does not overwrite an existing NPS score (0 counts as populated)', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({
        existingPartnerId: 62,
        existingFields: { email: 'ana@example.com', x_nps_score: 0 },
    });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    await session.upsertPartner({ email: 'ana@example.com', x_nps_score: 10, comment: 'nps' });

    const fields = mock.calls.find((c) => c.method === 'write')!.args[1] as Record<string, unknown>;
    assert.equal('x_nps_score' in fields, false, 'an existing score (even 0) must not be overwritten');
});

test('upsertPartner — skips the write when the guard leaves nothing to persist', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({
        existingPartnerId: 63,
        existingFields: { name: 'Ana', email: 'ana@example.com', x_lgpd_consent: true },
    });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.upsertPartner({ name: 'Ana', email: 'ana@example.com', x_lgpd_consent: true });

    assert.equal(id, 63);
    assert.equal(mock.calls.some((c) => c.method === 'write'), false, 'no write when only no-op overwrites remain');
});

test('createLead — issues a crm.lead.create and returns the id', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ leadId: 777 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.createLead({ name: 'Lead', type: 'opportunity' });

    assert.equal(id, 777);
    assert.ok(mock.createdLead());
});

test('resolveCampaignId — returns the existing utm.campaign id when the name matches', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingCampaignId: 42 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.resolveCampaignId('Verão 2026');

    assert.equal(id, 42);
    assert.equal(mock.calls.some((c) => c.model === 'utm.campaign' && c.method === 'create'), false);
});

test('resolveCampaignId — creates a new utm.campaign when none matches', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingCampaignId: null, newCampaignId: 88 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.resolveCampaignId('  Campanha Nova  ');

    assert.equal(id, 88);
    const create = mock.calls.find((c) => c.model === 'utm.campaign' && c.method === 'create');
    assert.ok(create, 'should create a utm.campaign');
    assert.equal((create!.args[0] as Record<string, unknown>).name, 'Campanha Nova');
});

test('resolveCampaignId — recovers from a concurrent create conflict via retry search', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });

    // Bespoke stateful mock: the shared createOdooMock returns a fixed
    // search_read result regardless of call order, but this scenario needs the
    // *first* search_read to miss and the *retry* (after the failed create) to
    // find the id a concurrent request just created.
    let createAttempted = false;
    global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const body = JSON.parse(String(init?.body ?? '{}')) as { params: { service: string; method: string; args: unknown[] } };
        const { service, method, args } = body.params;
        if (service === 'common' && method === 'authenticate') {
            return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: 7 }), { status: 200 });
        }
        const ormMethod = args[4] as string;
        if (ormMethod === 'search_read') {
            const result = createAttempted ? [{ id: 77 }] : [];
            return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), { status: 200 });
        }
        if (ormMethod === 'create') {
            createAttempted = true;
            return new Response(
                JSON.stringify({ jsonrpc: '2.0', id: 1, error: { message: 'duplicate key value violates unique constraint' } }),
                { status: 200 },
            );
        }
        throw new Error(`unexpected ORM call: ${ormMethod}`);
    }) as typeof fetch;

    const session = await openOdooSession(config());
    const id = await session.resolveCampaignId('Lançamento Verão');

    assert.equal(id, 77, 'should recover the id the concurrent request created, not throw');
});

test('resolveCampaignId — rethrows when the retry search also finds nothing', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ existingCampaignId: null, campaignCreateShouldFail: true });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());

    await assert.rejects(
        () => session.resolveCampaignId('Campanha Fantasma'),
        (e: unknown) => e instanceof Error && e.message.startsWith('ODOO_ERROR:502:'),
    );
});

test('openOdooSession — rejects with ODOO_ERROR:401 when auth fails', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    global.fetch = createOdooMock({ uid: 0 }).fetch;

    await assert.rejects(
        () => openOdooSession(config()),
        (e: unknown) => e instanceof Error && e.message.startsWith('ODOO_ERROR:401:'),
    );
});

test('openOdooSession — normalizes upstream HTTP failures to ODOO_ERROR:<status>', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    global.fetch = createOdooMock({ failStatus: 503 }).fetch;

    await assert.rejects(
        () => openOdooSession(config()),
        (e: unknown) => e instanceof Error && e.message.startsWith('ODOO_ERROR:503:'),
    );
});
