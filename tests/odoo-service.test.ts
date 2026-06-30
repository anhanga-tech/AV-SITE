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

test('createLead — issues a crm.lead.create and returns the id', async (t) => {
    t.after(() => { global.fetch = originalFetch; clearOdooEnv(); });
    const mock = createOdooMock({ leadId: 777 });
    global.fetch = mock.fetch;

    const session = await openOdooSession(config());
    const id = await session.createLead({ name: 'Lead', type: 'opportunity' });

    assert.equal(id, 777);
    assert.ok(mock.createdLead());
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
