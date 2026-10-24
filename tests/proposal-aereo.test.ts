import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { handleCreateProposal } from '../api/create-proposal.ts';
import { AEREO_PRICE_NOTE, fromAereoQuotation, parseTravelers } from '../lib/proposal-aereo.ts';
import { proposalContentSchema } from '../lib/proposal-content.ts';
import { handleProposalRequest } from '../lib/proposal-page.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// P10 (#1905): the air quotation skill's JSON becomes a proposal page, one
// option per link, with the same totals as the skill's PDF and WhatsApp text.
// The fixture is made up: the skill's own example is a real customer quote.

const API_SECRET = 'test-proposal-api-secret';
const PREVIEW_SECRET = 'test-proposal-preview-secret';
const LEAD_ID = 987654321;
const DAY_MS = 24 * 60 * 60 * 1000;

const QUOTATION = JSON.parse(await readFile(new URL('./fixtures/cotacao-aerea.json', import.meta.url), 'utf8'));

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
        headers: { authorization: `Bearer ${API_SECRET}`, 'cf-connecting-ip': `203.0.113.${(ipCounter += 1)}` },
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
    const clock = { now: Date.UTC(2026, 9, 24, 12) };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now } };
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

/** The customer's browser: a request without a user agent gets the link-preview page. */
function openPage(url: string): Request {
    return new Request(url, { headers: { 'user-agent': IPHONE } });
}

const AEREO_BODY = { type: 'aereo', leadId: LEAD_ID, firstName: 'Ana Paula', option: 1, quotation: QUOTATION };

function contentOf(option: number) {
    const result = fromAereoQuotation(QUOTATION, { option });
    assert.ok('content' in result, JSON.stringify(result));
    return result.content;
}

test('the totals are the ones the skill prints in the PDF and WhatsApp', () => {
    // From `gerar_proposta.py` on this fixture: per-leg rounding, conversion at 5,20.
    assert.deepEqual(contentOf(1).total.amount, 10741.74);
    assert.deepEqual(contentOf(1).total.usd, { amount: 2065.72, approximate: true, primary: true });
    assert.equal(contentOf(1).total.approximate, true);
    assert.deepEqual(contentOf(2).total.usd, { amount: 9876.54, primary: true });
    assert.equal(contentOf(2).total.amount, 51358.01);
});

test('a quotation shown only in reais has no dollar amount', () => {
    const brlOnly = { ...QUOTATION, moedas: ['BRL'] };
    const result = fromAereoQuotation(brlOnly, { option: 1 });
    assert.ok('content' in result);
    assert.equal(result.content.total.usd, undefined);
    assert.equal(result.content.total.amount, 10741.74);
});

test('converting a leg without the exchange rate is refused, not guessed', () => {
    const { cambio: _cambio, ...withoutRate } = QUOTATION;
    assert.deepEqual(fromAereoQuotation(withoutRate, { option: 1 }), { error: 'missing_exchange_rate' });
});

test('flights keep the quotation legs, local times, durations and baggage', () => {
    const { flights, travelers, destination } = contentOf(1);
    assert.equal(destination, 'São Paulo e Miami');
    assert.deepEqual(travelers, { adults: 2, children: 0, infants: 1 });
    assert.deepEqual(flights.map((flight) => [flight.leg, flight.number, flight.departure, flight.duration]), [
        ['Ida', 'XX 1001', '2026-12-10T23:10', '8:55'],
        ['Volta', 'XX 1002', '2026-12-20T09:00', '1:05'],
        ['Volta', 'XX 1003', '2026-12-20T20:00', '8:30'],
    ]);
    assert.equal(flights[0].baggage, '1 mala de 23 kg por adulto');
});

test('passengers are counted strictly and ages are dropped', () => {
    assert.deepEqual(parseTravelers('2 adultos + 1 bebê (8 meses)'), { adults: 2, children: 0, infants: 1 });
    assert.deepEqual(parseTravelers('1 adulto e 2 crianças (5 e 7 anos)'), { adults: 1, children: 2 });
    assert.deepEqual(parseTravelers('2 adultos, 1 criança, 1 bebê'), { adults: 2, children: 1, infants: 1 });
    assert.equal(parseTravelers('família de 4'), null);
    assert.equal(parseTravelers('2 crianças'), null, 'at least one adult');
    assert.equal(parseTravelers('2 adultos + 1 idoso'), null);
});

test('with several options the bot must say which one, and only that one is stored', async (t) => {
    const { deps, strings } = setup(t);
    const { option: _option, ...withoutOption } = AEREO_BODY;

    const missing = await handleCreateProposal(create(withoutOption), deps);
    assert.equal(missing.status, 400);
    assert.deepEqual([(await missing.json()).code, strings.size], ['INVALID_QUOTATION', 0]);

    const unknown = await handleCreateProposal(create({ ...AEREO_BODY, option: 3 }), deps);
    assert.equal((await unknown.json()).reason, 'option_not_found');

    const created = await handleCreateProposal(create(AEREO_BODY), deps);
    assert.equal(created.status, 201);
    const stored = JSON.stringify([...strings.values()]);
    assert.ok(!stored.includes('YY 2001') && !stored.includes('9876.54'), 'the other option is never stored');
});

test('the commission and per-leg prices never reach Redis nor the page (D2)', async (t) => {
    const { deps, strings } = setup(t);
    const response = await handleCreateProposal(create(AEREO_BODY), deps);
    const { data } = await response.json();
    assert.equal(data.mode, 'page');

    const stored = JSON.stringify([...strings.values()]);
    const page = await (await handleProposalRequest(openPage(data.url), data.id, deps)).text();
    for (const leak of ['remuneracao', '"rav"', '86.42', '302.54', '41.29', '1234.57', '4321.99', '8 meses']) {
        assert.ok(!stored.includes(leak), `stored: ${leak}`);
        assert.ok(!page.includes(leak), `page: ${leak}`);
    }
});

test('the page shows dollars first, reais below, infants, legs and the price note', async (t) => {
    const { deps } = setup(t);
    const { data } = await (await handleCreateProposal(create(AEREO_BODY), deps)).json();
    const page = await (await handleProposalRequest(openPage(data.url), data.id, deps)).text();

    assert.match(page, /<p class="amount">US\$\s2\.065,72\*<\/p>\n<p class="amount-alt">R\$\s10\.741,74\*<\/p>/);
    assert.match(page, /Ana, sua viagem para São Paulo e Miami/);
    assert.match(page, /2 adultos e 1 bebê/);
    assert.match(page, /<p class="label">Volta · 20\/12<\/p>/);
    assert.match(page, /1 mala de 23 kg por adulto/);
    assert.ok(page.includes(AEREO_PRICE_NOTE));
    assert.match(page, /<h2 id="bom-saber">Bom saber<\/h2>/);
    assert.match(page, /Embarque pelo Terminal 3\./);
    assert.match(page, /US\$ 1,00 = R\$ 5,2000/);
});

test('an air proposal is valid for 3 days; the bot may shorten it, never extend it', async (t) => {
    const { deps, clock } = setup(t);
    const standard = await (await handleCreateProposal(create(AEREO_BODY), deps)).json();
    assert.equal(Date.parse(standard.data.expiresAt), clock.now + 3 * DAY_MS);

    const shorter = await (await handleCreateProposal(create({ ...AEREO_BODY, validityDays: 1 }), deps)).json();
    assert.equal(Date.parse(shorter.data.expiresAt), clock.now + DAY_MS);

    const longer = await handleCreateProposal(create({ ...AEREO_BODY, validityDays: 4 }), deps);
    assert.equal(longer.status, 400);
});

test('with pages switched off an air proposal is refused: there is no link to fall back to', async (t) => {
    const { deps, strings } = setup(t, false);
    const response = await handleCreateProposal(create(AEREO_BODY), deps);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'PAGES_DISABLED');
    assert.equal(strings.size, 0);
});

test('an air proposal takes no operator link', async (t) => {
    const { deps } = setup(t);
    const response = await handleCreateProposal(create({ ...AEREO_BODY, redirectUrl: 'https://premium.infotravel.com.br/x' }), deps);
    assert.equal(response.status, 400);
});

test('times without an offset are accepted; with offsets, arrival must still follow departure', () => {
    const base = {
        destination: 'Miami',
        travelers: { adults: 1, children: 0 },
        transfers: [],
        extras: [],
        total: { amount: 100, currency: 'BRL' },
    };
    const flight = { airline: 'X', number: 'X 1', from: 'A', to: 'B' };
    // Westbound local times can look earlier: never compared without offsets.
    assert.ok(proposalContentSchema.safeParse({ ...base, flights: [{ ...flight, departure: '2026-12-10T10:00', arrival: '2026-12-10T09:30' }] }).success);
    assert.ok(!proposalContentSchema.safeParse({ ...base, flights: [{ ...flight, departure: '2026-12-10T10:00:00-03:00', arrival: '2026-12-10T09:30:00-03:00' }] }).success);
});
