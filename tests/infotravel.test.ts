import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { handleCreateProposal } from '../api/create-proposal.ts';
import { scrubSensitiveUrl } from '../lib/error-tracking.ts';
import { htmlToText, normalizeInfotravelQuotation } from '../lib/infotravel-normalize.ts';
import { handleProposalRequest } from '../lib/proposal-page.ts';
import { loadProposal } from '../lib/proposal-store.ts';
import { companyCodeFromToken, extractInfotravelToken, fetchInfotravelQuotation } from '../services/infotravel.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1906: an Infotravel link becomes a proposal page, read from the
// operator's public tRPC API; any failure falls back to the tracked redirect.
// The raw fixtures are hand-built with the fields the adapter reads, plus
// made-up versions of the fields it must drop (agent, agency CNPJ, RCA unit,
// commission, supplier on-call phone, locators, payment terms).

const RAW_BOOKING = JSON.parse(readFileSync(new URL('./fixtures/infotravel-raw-booking.json', import.meta.url), 'utf8'));
const RAW_HOTEL = JSON.parse(readFileSync(new URL('./fixtures/infotravel-raw-hotel.json', import.meta.url), 'utf8'));
const BOOKING = RAW_BOOKING[0].result.data.json;
const HOTEL = RAW_HOTEL[0].result.data.json;
// Built at runtime: no token-looking literal in the repo (GitGuardian).
const TOKEN = Buffer.from(`RCA | 7654321 | ${'0'.repeat(32)}`).toString('base64');
const LINK = `https://premium.infotravel.com.br/orcamento-web/pt/link?token=${TOKEN}&shouldShowPay=true`;
const API_SECRET = 'test-proposal-api-secret';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const FORBIDDEN = /Agente Ficticio|agente\.ficticio|AGENCIA FICTICIA|00\.000\.000|UNIDADE FICTICIA|Plantão|990000|9900005|9900007|Santander|Parcelado|rcaturismo|152[.,]85|RklDVElDSU8/;

type Route = (url: URL) => Response | Promise<Response>;

function trpc(json: unknown): Response {
    return Response.json([{ result: { data: { json } } }]);
}

function operatorApi(overrides: { booking?: Route; hotel?: Route } = {}) {
    const calls: URL[] = [];
    const fetchStub = (async (input: string | URL | Request) => {
        const url = new URL(String(input));
        calls.push(url);
        if (url.pathname.endsWith('/main.getBooking')) return (overrides.booking ?? (() => trpc(BOOKING)))(url);
        if (url.pathname.endsWith('/main.getHotel')) return (overrides.hotel ?? (() => trpc(HOTEL)))(url);
        return new Response(null, { status: 404 });
    }) as typeof fetch;
    return { fetch: fetchStub, calls, input: (url: URL) => JSON.parse(url.searchParams.get('input') ?? '{}')[0].json };
}

function withEnv(t: { after: (fn: () => void) => void }, env: Record<string, string | undefined>) {
    const saved = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
    const apply = (values: Record<string, string | undefined>) => {
        for (const [name, value] of Object.entries(values)) {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        }
    };
    apply(env);
    t.after(() => apply(saved));
}

let ipCounter = 0;

function create(body: Record<string, unknown>): Request {
    return new Request('https://www.anhanga.tur.br/api/create-proposal', {
        method: 'POST',
        headers: { authorization: `Bearer ${API_SECRET}`, 'cf-connecting-ip': `198.51.100.${(ipCounter += 1)}` },
        body: JSON.stringify(body),
    });
}

function setup(t: { after: (fn: () => void) => void }, pagesEnabled = true) {
    withEnv(t, {
        PROPOSAL_API_SECRET: API_SECRET,
        PROPOSAL_PREVIEW_SECRET: PREVIEW_SECRET,
        PROPOSAL_PAGES_ENABLED: pagesEnabled ? 'true' : undefined,
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
    });
    const clock = { now: Date.UTC(2027, 0, 20, 15, 30) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

const INFOTRAVEL_BODY = { type: 'infotravel', redirectUrl: LINK, leadId: 987654321, firstName: 'Ana Paula Souza' };

test('the token is read from the raw query, base64 padding and plus signs intact', () => {
    assert.equal(extractInfotravelToken('https://premium.infotravel.com.br/orcamento-web/pt/link?token=ab+cd/ef==&shouldShowPay=true'), 'ab+cd/ef==');
    assert.equal(extractInfotravelToken('https://premium.infotravel.com.br/orcamento-web/pt/link?x=1&token=ab%2Bcd%2Fef%3D%3D'), 'ab+cd/ef==');
    assert.equal(extractInfotravelToken('https://premium.infotravel.com.br/orcamento-web/pt/link?tokens=abcdefgh'), null);
    assert.equal(extractInfotravelToken('https://premium.infotravel.com.br/orcamento-web/pt/link?token=%E0%A4%A'), null);
    assert.equal(companyCodeFromToken(TOKEN), 'RCA');
    assert.equal(companyCodeFromToken(Buffer.from('rca; drop | 1').toString('base64')), null);
    assert.equal(companyCodeFromToken('!!!'), null);
});

test('the client makes the operator page\'s own two GETs, on the fixed API host', async () => {
    const api = operatorApi();

    const quotation = await fetchInfotravelQuotation(LINK, { fetch: api.fetch });

    assert.deepEqual(quotation, { booking: BOOKING, hotel: HOTEL });
    assert.equal(api.calls.length, 2);
    for (const url of api.calls) {
        assert.equal(url.origin, 'https://premium.infotravel.com.br');
        assert.equal(url.searchParams.get('batch'), '1');
    }
    assert.equal(api.calls[0].pathname, '/orcamento-web/api/trpc/main.getBooking');
    assert.deepEqual(api.input(api.calls[0]), { token: TOKEN, clientUrl: LINK });
    assert.equal(api.calls[1].pathname, '/orcamento-web/api/trpc/main.getHotel');
    assert.deepEqual(api.input(api.calls[1]), { companyCode: 'RCA', hotelKey: BOOKING.bookingPackages[0].bookingHotels[0].hotel.keyDetail, clientUrl: LINK });
});

test('API failures are typed, never echoing the upstream body', async () => {
    const cases: Array<[Route, string]> = [
        [() => new Response('token RCA | 7654321 invalid', { status: 500 }), 'http_error'],
        [() => Response.json([{ error: { json: { message: 'bad token' } } }]), 'unexpected_response'],
        [() => new Response('<html>', { status: 200 }), 'unexpected_response'],
        [() => {
            throw new TypeError('fetch failed');
        }, 'http_error'],
    ];
    for (const [booking, reason] of cases) {
        await assert.rejects(fetchInfotravelQuotation(LINK, { fetch: operatorApi({ booking }).fetch }), (error: Error & { reason?: string }) => {
            assert.equal(error.reason, reason);
            assert.ok(!error.message.includes('7654321') && !error.message.includes('bad token'));
            return true;
        });
    }
    let now = 0;
    await assert.rejects(
        fetchInfotravelQuotation(LINK, { fetch: operatorApi({ booking: () => ((now += 7000), trpc(BOOKING)) }).fetch, now: () => now }),
        { reason: 'timeout' },
    );
});

test('the quotation normalizes with a total equal to the sum of every price, and nothing internal', () => {
    const normalized = normalizeInfotravelQuotation({ booking: BOOKING, hotel: HOTEL });

    assert.deepEqual(normalized.total, { amount: 6633.45, currency: 'BRL' });
    assert.deepEqual(normalized.passageiros, { adultos: 2, idades: [34, 31] });
    assert.equal((normalized.quarto as { tipo: string }).tipo, 'Suíte com Vista ao Mar');
    assert.doesNotMatch(JSON.stringify(normalized), FORBIDDEN);
});

test('a quotation the page can\'t represent faithfully is refused', () => {
    const pack = BOOKING.bookingPackages[0];
    const variant = (packChanges: Record<string, unknown>, bookingChanges: Record<string, unknown> = {}) =>
        ({ ...BOOKING, ...bookingChanges, bookingPackages: [{ ...pack, ...packChanges }] });
    const refused = (booking: unknown, reason: string) =>
        assert.throws(() => normalizeInfotravelQuotation({ booking, hotel: HOTEL }), { reason });

    refused(variant({}, { bookingAmount: { currency: 'BRL', amount: 6633.46 } }), 'total_mismatch');
    refused(variant({ fares: [] }), 'total_mismatch');
    refused(variant({ bookingInsurances: [{ fares: [] }] }), 'unsupported_quotation');
    refused(variant({}, { status: 'CONFIRMED' }), 'unsupported_quotation');
    refused(variant({ bookingHotels: [{ ...pack.bookingHotels[0], rooms: [pack.bookingHotels[0].rooms[0], pack.bookingHotels[0].rooms[0]] }] }), 'unsupported_quotation');
    refused(variant({ fares: [{ type: 'RAV_COMMISSION', price: { currency: 'USD', amount: 152.85, exchange: 5.1 } }] }), 'unsupported_quotation');
    refused({ ...BOOKING, bookingPackages: [pack, pack] }, 'unsupported_quotation');
    assert.throws(() => normalizeInfotravelQuotation({ booking: BOOKING, hotel: null }), { reason: 'unexpected_shape' });
});

test('operator HTML becomes plain text', () => {
    assert.equal(htmlToText('<p><strong>Um</strong> parque</p><p>Ap&oacute;s o show &amp; fim&#33;</p>'), 'Um parque Após o show & fim!');
    assert.equal(htmlToText('&Ccedil;&atilde;o &ecirc; &uacute;nico 2&ordm;'), 'Ção ê único 2º');
    assert.equal(htmlToText('&bogus;'), '&bogus;');
    assert.equal(htmlToText('&lt;script&gt;x&lt;/script&gt;'), '<script>x</script>');
    assert.equal(htmlToText('<br>'), undefined);
});

test('an Infotravel link becomes a page proposal with the customer\'s first name and the total', async (t) => {
    const { deps } = setup(t);
    const api = operatorApi();

    const response = await handleCreateProposal(create(INFOTRAVEL_BODY), { ...deps, infotravel: { fetch: api.fetch } });
    const { data } = await response.json();

    assert.equal(response.status, 201);
    assert.equal(data.mode, 'page');
    assert.equal(data.fallbackReason, undefined);
    const stored = await loadProposal(data.id, deps);
    assert.ok(stored.status === 'active' && stored.proposal.content && !stored.proposal.redirectUrl);

    const page = await handleProposalRequest(new Request(data.url, { headers: { 'user-agent': IPHONE } }), data.id, deps);
    const html = (await page.text()).replace(/\u00a0/g, ' ');
    assert.equal(page.status, 200);
    assert.ok(html.includes('Ana, sua viagem para Balneario Camboriu'));
    assert.ok(html.includes('R$ 6.633,45'));
    assert.ok(!html.includes('Paula') && !html.includes('Souza'));
    assert.doesNotMatch(html, FORBIDDEN);
});

test('pages stay off until enabled (#1925): the link falls back to the tracked redirect', async (t) => {
    const { deps } = setup(t, false);
    const api = operatorApi();

    const { data } = await (await handleCreateProposal(create(INFOTRAVEL_BODY), { ...deps, infotravel: { fetch: api.fetch } })).json();

    assert.equal(data.mode, 'redirect');
    assert.equal(data.fallbackReason, 'pages_disabled');
    assert.equal(api.calls.length, 0);
});

test('any extraction failure falls back to the tracked redirect for the same link', async (t) => {
    const { deps } = setup(t);
    const cases: Array<[{ booking?: Route; hotel?: Route }, string]> = [
        [{ booking: () => new Response(null, { status: 403 }) }, 'http_error'],
        [{ hotel: () => Response.json({ unexpected: true }) }, 'unexpected_response'],
        [{ booking: () => trpc({ ...BOOKING, bookingAmount: { currency: 'BRL', amount: 1 } }) }, 'total_mismatch'],
    ];
    for (const [routes, reason] of cases) {
        const { data } = await (await handleCreateProposal(create(INFOTRAVEL_BODY), { ...deps, infotravel: { fetch: operatorApi(routes).fetch } })).json();
        assert.equal(data.mode, 'redirect', reason);
        assert.equal(data.fallbackReason, reason);

        const redirect = await handleProposalRequest(new Request(data.url, { headers: { 'user-agent': IPHONE } }), data.id, deps);
        assert.equal(redirect.status, 302);
        assert.equal(redirect.headers.get('Location'), LINK.replace('shouldShowPay=true', 'shouldShowPay=false'));
    }
});

test('the booking token never reaches the logs, and the tRPC input is redacted in Sentry URLs', async (t) => {
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const { deps } = setup(t);

    await handleCreateProposal(create(INFOTRAVEL_BODY), { ...deps, infotravel: { fetch: operatorApi().fetch } });
    await handleCreateProposal(create(INFOTRAVEL_BODY), { ...deps, infotravel: { fetch: operatorApi({ booking: () => new Response(null, { status: 500 }) }).fetch } });

    const output = logged.join('\n');
    assert.match(output, /CREATE_PROPOSAL/);
    assert.ok(!output.includes(TOKEN) && !output.includes(encodeURIComponent(TOKEN)));

    const apiUrl = `https://premium.infotravel.com.br/orcamento-web/api/trpc/main.getBooking?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: { token: TOKEN, clientUrl: LINK } } }))}`;
    const scrubbed = scrubSensitiveUrl(apiUrl);
    assert.ok(!scrubbed.includes(TOKEN) && !scrubbed.includes(encodeURIComponent(TOKEN)), scrubbed);
    assert.match(scrubbed, /input=\[redacted\]/);
});
