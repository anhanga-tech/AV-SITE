import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { handleCreateOfferLink } from '../api/create-offer-link.ts';
import { handleOfferLinkStats } from '../api/offer-link-stats.ts';
import { ANHANGA_WHATSAPP_NUMBER, offerWhatsAppUrl } from '../lib/offer-link.ts';
import { handleOfferLinkRequest } from '../lib/offer-link-page.ts';
import { offerClicksKey, offerRecordKey, readOfferClicks } from '../lib/offer-link-store.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Tracked short link for the Anhangá Ofertas channel: /o/<slug>.

const SECRET = 'test-offer-link-secret';
const PROPOSAL_SECRET = 'test-proposal-api-secret';
const ORIGIN = 'https://www.anhanga.tur.br';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const WHATSAPP = 'WhatsApp/2.24.21.80 A';
const DAY_MS = 24 * 60 * 60 * 1000;
const MESSAGE = 'Quero a oferta Gramado janeiro 2027';
const SLUG = 'gramado-jan-2027';

let ipCounter = 0;

function setup(now = Date.UTC(2026, 10, 9, 15, 0)) {
    const clock = { now };
    const fake = createFakeProposalRedis(clock);
    return { clock, ...fake, deps: { redis: fake.redis, now: () => clock.now, secret: SECRET } };
}

function createRequest(
    body: unknown,
    options: { auth?: string | null; method?: string; ip?: string } = {},
): Request {
    const headers = new Headers({ 'content-type': 'application/json' });
    headers.set('cf-connecting-ip', options.ip ?? `198.51.100.${(ipCounter += 1) % 200}`);
    const auth = options.auth === undefined ? `Bearer ${SECRET}` : options.auth;
    if (auth !== null) headers.set('authorization', auth);
    const method = options.method ?? 'POST';
    return new Request(`${ORIGIN}/api/create-offer-link`, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(body),
    });
}

function statsRequest(slug: string, options: { auth?: string | null; method?: string; ip?: string } = {}): Request {
    const headers = new Headers();
    headers.set('cf-connecting-ip', options.ip ?? `198.51.100.${(ipCounter += 1) % 200}`);
    const auth = options.auth === undefined ? `Bearer ${SECRET}` : options.auth;
    if (auth !== null) headers.set('authorization', auth);
    const query = slug === '' ? '' : `?slug=${encodeURIComponent(slug)}`;
    return new Request(`${ORIGIN}/api/offer-link-stats${query}`, {
        method: options.method ?? 'GET',
        headers,
    });
}

function visit(slug: string, options: { method?: string; userAgent?: string | null; headers?: Record<string, string> } = {}): Request {
    const headers = new Headers(options.headers);
    if (options.userAgent !== null) headers.set('user-agent', options.userAgent ?? IPHONE);
    return new Request(`${ORIGIN}/o/${slug}`, { method: options.method ?? 'GET', headers });
}

const VALID = { slug: SLUG, message: MESSAGE, title: 'Gramado — férias janeiro 2027', expiresAt: '2027-02-01' };

test('a human GET counts one click and redirects to the stored WhatsApp text', async () => {
    const { deps } = setup();
    const created = await handleCreateOfferLink(createRequest(VALID), deps);
    assert.equal(created.status, 201);

    const pending: Promise<unknown>[] = [];
    const response = await handleOfferLinkRequest(visit(SLUG), SLUG, {
        ...deps,
        waitUntil: (promise) => { pending.push(promise); },
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), offerWhatsAppUrl(MESSAGE));
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(await response.text(), '');
    // The redirect does not wait on Redis: the write is handed to waitUntil.
    assert.equal(pending.length, 1);
    await Promise.all(pending);

    const stats = await handleOfferLinkStats(statsRequest(SLUG), deps);
    assert.equal(stats.status, 200);
    const body = await stats.json();
    assert.equal(body.clicks, 1);
    assert.equal(body.lastClickAt, '2026-11-09T15:00:00.000Z');
    assert.equal(body.slug, SLUG);

    const again = await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(again.status, 302);
    const after = await (await handleOfferLinkStats(statsRequest(SLUG), deps)).json();
    assert.equal(after.clicks, 2);
    assert.equal(after.lastClickAt, '2026-11-09T15:00:00.000Z');
});

test('a click event stores only the UTC instant', async () => {
    const { deps, listOf } = setup();
    await handleCreateOfferLink(createRequest(VALID), deps);
    await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.deepEqual(listOf(offerClicksKey(SLUG)), [{ at: '2026-11-09T15:00:00.000Z' }]);
});

test('WhatsApp preview, curl, HEAD and prefetch do not count', async () => {
    const { deps } = setup();
    await handleCreateOfferLink(createRequest(VALID), deps);

    const preview = await handleOfferLinkRequest(visit(SLUG, { userAgent: WHATSAPP }), SLUG, deps);
    assert.equal(preview.status, 200);
    const html = await preview.text();
    assert.match(html, /property="og:title" content="Gramado — férias janeiro 2027"/);
    assert.match(html, /property="og:image" content="https:\/\/media\.anhanga\.tur\.br\/images\/brand\/Anhang%C3%A1%20Viagens%20-%20logo\.png"/);
    assert.match(html, /property="og:image:alt" content="Anhangá Viagens"/);
    assert.match(html, /<img class="logo" src="https:\/\/media\.anhanga\.tur\.br\/images\/brand\/LOGO%20ANHANGA%20VIAGENS%20-%20AZUL\.svg" alt="Anhangá Viagens"/);
    assert.match(html, /<title>Gramado — férias janeiro 2027<\/title>/);
    assert.match(html, /noindex, nofollow/);
    assert.doesNotMatch(html, /<p class="brand">/);
    assert.doesNotMatch(html, /wa\.me/);
    assert.doesNotMatch(html, /Quero a oferta/);
    assert.doesNotMatch(html, /<script/i);
    assert.match(preview.headers.get('Content-Security-Policy') ?? '', /default-src 'none'/);
    assert.match(preview.headers.get('Content-Security-Policy') ?? '', /img-src https:\/\/media\.anhanga\.tur\.br/);
    assert.doesNotMatch(preview.headers.get('Content-Security-Policy') ?? '', /script-src/);

    const head = await handleOfferLinkRequest(visit(SLUG, { method: 'HEAD' }), SLUG, deps);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    assert.equal(head.headers.get('X-Robots-Tag'), 'noindex, nofollow');

    const curl = await handleOfferLinkRequest(visit(SLUG, { userAgent: 'curl/8.7.1' }), SLUG, deps);
    assert.equal(curl.status, 200);

    const prefetch = await handleOfferLinkRequest(
        visit(SLUG, { headers: { 'sec-purpose': 'prefetch' } }),
        SLUG,
        deps,
    );
    assert.equal(prefetch.status, 503);

    const bare = await handleOfferLinkRequest(visit(SLUG, { userAgent: null }), SLUG, deps);
    assert.equal(bare.status, 200);

    assert.equal((await readOfferClicks(SLUG, deps))?.clicks, 0);
});

test('an unknown slug is 404 Link inválido and a malformed slug never touches Redis', async () => {
    const { deps } = setup();
    let reads = 0;
    const redis = {
        ...deps.redis,
        async mget(...keys: string[]) {
            reads += 1;
            return deps.redis.mget(...keys);
        },
    };
    const missing = await handleOfferLinkRequest(visit('nunca-existiu'), 'nunca-existiu', { ...deps, redis });
    assert.equal(missing.status, 404);
    const html = await missing.text();
    assert.match(html, /<h1>Link inválido<\/h1>/);
    assert.match(html, /alt="Anhangá Viagens"/);
    assert.match(html, /LOGO%20ANHANGA%20VIAGENS%20-%20AZUL\.svg/);
    assert.match(html, /href="https:\/\/wa\.me\/5511955021519"/);
    assert.doesNotMatch(html, /wa\.me\/5511955021519\?/);

    reads = 0;
    for (const slug of ['AB', 'ab', 'a--b', '-abc', 'abc-', 'Gramado', 'foo_bar', 'a'.repeat(61)]) {
        const response = await handleOfferLinkRequest(visit(slug), slug, { ...deps, redis });
        assert.equal(response.status, 404, slug);
    }
    assert.equal(reads, 0);
});

test('an ended offer explains that and does not count', async () => {
    const { clock, deps } = setup(Date.parse('2027-01-31T02:00:00.000Z'));
    const created = await handleCreateOfferLink(createRequest({
        slug: SLUG,
        message: MESSAGE,
        expiresAt: '2027-02-01',
    }), deps);
    assert.equal(created.status, 201);
    assert.equal((await created.json()).expiresAt, '2027-02-01');

    const open = await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(open.status, 302);
    assert.equal((await readOfferClicks(SLUG, deps))?.clicks, 1);

    // 2027-02-01T00:00:00-03:00
    clock.now = Date.parse('2027-02-01T03:00:00.000Z');
    const ended = await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(ended.status, 410);
    const html = await ended.text();
    assert.match(html, /<h1>Esta oferta encerrou<\/h1>/);
    assert.match(html, /alt="Anhangá Viagens"/);
    assert.match(html, /LOGO%20ANHANGA%20VIAGENS%20-%20AZUL\.svg/);
    assert.match(html, /href="https:\/\/wa\.me\/5511955021519"/);
    assert.doesNotMatch(html, /Quero a oferta/);
    assert.doesNotMatch(html, /text=/);
    assert.equal((await readOfferClicks(SLUG, deps))?.clicks, 1);

    const preview = await handleOfferLinkRequest(visit(SLUG, { userAgent: WHATSAPP }), SLUG, deps);
    assert.equal(preview.status, 410);
    assert.equal((await readOfferClicks(SLUG, deps))?.clicks, 1);
});

test('the ended page becomes 404 after the grace period', async () => {
    const { clock, deps } = setup(Date.parse('2027-01-15T12:00:00.000Z'));
    await handleCreateOfferLink(createRequest({ slug: SLUG, message: MESSAGE, expiresAt: '2027-02-01' }), deps);
    clock.now = Date.parse('2027-02-01T03:00:00.000Z') + 30 * DAY_MS;
    const response = await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(response.status, 404);
});

test('create returns the public URL, and a repeated slug updates in place', async () => {
    const { deps } = setup();
    const first = await handleCreateOfferLink(createRequest(VALID), deps);
    assert.equal(first.status, 201);
    assert.equal(first.headers.get('Cache-Control'), 'no-store');
    assert.equal(first.headers.get('Access-Control-Allow-Origin'), null);
    const created = await first.json();
    assert.equal(created.ok, true);
    assert.equal(created.url, `${ORIGIN}/o/${SLUG}`);
    assert.equal(created.slug, SLUG);
    assert.equal(created.expiresAt, '2027-02-01');
    assert.equal(typeof created.requestId, 'string');

    await handleOfferLinkRequest(visit(SLUG), SLUG, deps);

    const updatedMessage = 'Quero a oferta Gramado em janeiro';
    const second = await handleCreateOfferLink(createRequest({
        slug: SLUG,
        message: updatedMessage,
    }), deps);
    assert.equal(second.status, 201);
    const updated = await second.json();
    assert.equal(updated.url, created.url);
    assert.equal(updated.expiresAt, null);

    const response = await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), offerWhatsAppUrl(updatedMessage));
    const preview = await handleOfferLinkRequest(visit(SLUG, { userAgent: WHATSAPP }), SLUG, deps);
    assert.match(await preview.text(), /Oferta \| Anhangá Viagens/);
    assert.equal((await readOfferClicks(SLUG, deps))?.clicks, 2);
});

test('the API rejects bad slugs, URLs in the text, extra fields and a past expiry', async () => {
    const { deps, strings } = setup();
    const cases: unknown[] = [
        {},
        { slug: SLUG },
        { message: MESSAGE },
        { slug: 'AB', message: MESSAGE },
        { slug: 'ab', message: MESSAGE },
        { slug: 'a--b', message: MESSAGE },
        { slug: 'Gramado', message: MESSAGE },
        { slug: `a${'b'.repeat(60)}`, message: MESSAGE },
        { slug: SLUG, message: '' },
        { slug: SLUG, message: '   ' },
        { slug: SLUG, message: 'a'.repeat(301) },
        { slug: SLUG, message: 'Veja https://exemplo.com/oferta' },
        { slug: SLUG, message: 'Veja www.exemplo.com' },
        { slug: SLUG, message: 'abre bit.ly/abc' },
        { slug: SLUG, message: 'linha\nhttps://exemplo.com' },
        { slug: SLUG, message: MESSAGE, title: 'https://exemplo.com' },
        { slug: SLUG, message: MESSAGE, redirectUrl: 'https://exemplo.com' },
        { slug: SLUG, message: MESSAGE, phone: '5511999999999' },
        { slug: SLUG, message: MESSAGE, expiresAt: '2020-01-01' },
        { slug: SLUG, message: MESSAGE, expiresAt: '2027-02-31' },
        { slug: SLUG, message: MESSAGE, expiresAt: '01/02/2027' },
        { slug: SLUG, message: MESSAGE, expiresAt: '2030-01-01' },
    ];
    for (const body of cases) {
        const response = await handleCreateOfferLink(createRequest(body), deps);
        assert.equal(response.status, 400, JSON.stringify(body));
        assert.equal((await response.json()).code, 'VALIDATION_ERROR');
    }
    const invalidJson = new Request(`${ORIGIN}/api/create-offer-link`, {
        method: 'POST',
        headers: { authorization: `Bearer ${SECRET}`, 'cf-connecting-ip': '198.51.100.199' },
        body: '{not json',
    });
    assert.equal((await handleCreateOfferLink(invalidJson, deps)).status, 400);
    assert.equal(strings.size, 0);

    const ok = await handleCreateOfferLink(createRequest({
        slug: SLUG,
        message: 'a'.repeat(300),
        title: 'São Paulo',
    }), deps);
    assert.equal(ok.status, 201);
    assert.equal((await ok.json()).expiresAt, null);
});

test('accented text is URL-encoded in the redirect and a URL-free sentence is accepted', async () => {
    const { deps } = setup();
    const message = 'Quero a oferta São Paulo';
    assert.equal((await handleCreateOfferLink(createRequest({ slug: 'sao-paulo', message }), deps)).status, 201);
    const response = await handleOfferLinkRequest(visit('sao-paulo'), 'sao-paulo', deps);
    assert.equal(
        response.headers.get('Location'),
        `https://wa.me/${ANHANGA_WHATSAPP_NUMBER}?text=Quero%20a%20oferta%20S%C3%A3o%20Paulo`,
    );
});

test('authentication requires OFFER_LINK_SECRET and ignores the proposal secret', async () => {
    const { deps } = setup();
    let writes = 0;
    const redis = {
        ...deps.redis,
        async set(...args: Parameters<typeof deps.redis.set>) {
            writes += 1;
            return deps.redis.set(...args);
        },
    };
    const guarded = { ...deps, redis, secret: null as string | null };
    const missing = await handleCreateOfferLink(createRequest(VALID, { auth: `Bearer ${SECRET}` }), guarded);
    assert.equal(missing.status, 500);
    assert.equal((await missing.json()).code, 'CONFIG_ERROR');

    guarded.secret = SECRET;
    for (const auth of [null, 'Bearer errado', `Bearer ${PROPOSAL_SECRET}`, SECRET]) {
        const response = await handleCreateOfferLink(createRequest(VALID, { auth }), guarded);
        assert.equal(response.status, 401, String(auth));
        assert.equal(response.headers.get('WWW-Authenticate'), 'Bearer');
    }
    const stats = await handleOfferLinkStats(statsRequest(SLUG, { auth: null }), guarded);
    assert.equal(stats.status, 401);
    assert.equal(writes, 0);
});

test('the endpoints read OFFER_LINK_SECRET from the environment when no override is passed', async (t) => {
    const saved = process.env.OFFER_LINK_SECRET;
    t.after(() => {
        if (saved === undefined) delete process.env.OFFER_LINK_SECRET;
        else process.env.OFFER_LINK_SECRET = saved;
    });
    const { deps } = setup();
    const fromEnv = { redis: deps.redis, now: deps.now };
    delete process.env.OFFER_LINK_SECRET;
    assert.equal((await handleCreateOfferLink(createRequest(VALID), fromEnv)).status, 500);
    process.env.OFFER_LINK_SECRET = SECRET;
    assert.equal((await handleCreateOfferLink(createRequest({ slug: 'le-ambiente', message: MESSAGE }), fromEnv)).status, 201);
    delete process.env.OFFER_LINK_SECRET;
});

test('stats validates the slug, hides unknown offers and reports zero clicks', async () => {
    const { deps } = setup();
    await handleCreateOfferLink(createRequest({ slug: SLUG, message: MESSAGE }), deps);

    const empty = await (await handleOfferLinkStats(statsRequest(SLUG), deps)).json();
    assert.equal(empty.clicks, 0);
    assert.equal(empty.lastClickAt, null);

    assert.equal((await handleOfferLinkStats(statsRequest('nao-existe'), deps)).status, 404);
    assert.equal((await handleOfferLinkStats(statsRequest('NAO'), deps)).status, 400);
    assert.equal((await handleOfferLinkStats(statsRequest(''), deps)).status, 400);
    assert.equal((await handleOfferLinkStats(statsRequest(SLUG, { method: 'POST' }), deps)).status, 405);
    assert.equal((await handleCreateOfferLink(createRequest(VALID, { method: 'GET' }), deps)).status, 405);
});

test('create is rate limited per client and a storage failure does not log the message', async (t) => {
    const upstash = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    t.after(() => {
        if (upstash.url !== undefined) process.env.UPSTASH_REDIS_REST_URL = upstash.url;
        if (upstash.token !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = upstash.token;
    });

    const { deps } = setup();
    const ip = '203.0.113.90';
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 31; attempt += 1) {
        const slug = `oferta-${attempt}`;
        statuses.push((await handleCreateOfferLink(createRequest({ slug, message: MESSAGE }, { ip }), deps)).status);
    }
    assert.deepEqual(statuses.slice(0, 30), Array(30).fill(201));
    assert.equal(statuses[30], 429);

    const guesses: number[] = [];
    const guessIp = '203.0.113.91';
    for (let attempt = 0; attempt < 31; attempt += 1) {
        guesses.push((await handleCreateOfferLink(
            createRequest(VALID, { ip: guessIp, auth: 'Bearer errado' }),
            deps,
        )).status);
    }
    assert.deepEqual(guesses.slice(0, 30), Array(30).fill(401));
    assert.equal(guesses[30], 429);

    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => JSON.stringify(arg) ?? String(arg)).join(' '));
        });
    }
    const failing = {
        ...deps.redis,
        async set() {
            throw new Error('command was: ["set","oferta:rec:gramado"]');
        },
        async mget() {
            return [null];
        },
    };
    const response = await handleCreateOfferLink(
        createRequest({ slug: 'outra-oferta', message: 'CANARIO-MENSAGEM-OFERTA' }, { ip: '203.0.113.92' }),
        { ...deps, redis: failing },
    );
    assert.equal(response.status, 503);
    const blob = logged.join('\n');
    assert.equal(blob.includes('CANARIO-MENSAGEM-OFERTA'), false);
    assert.equal(blob.includes(SECRET), false);
});

test('record TTL matches the expiry grace, and clicks keep 90 days from the first open', async () => {
    const { clock, deps, strings, listTtlMs } = setup(Date.parse('2026-11-09T15:00:00.000Z'));
    await handleCreateOfferLink(createRequest({ slug: SLUG, message: MESSAGE, expiresAt: '2027-02-01' }), deps);
    const expiresAt = Date.parse('2027-02-01T03:00:00.000Z');
    const record = strings.get(offerRecordKey(SLUG));
    assert.ok(record);
    const expectedTtl = Math.ceil((expiresAt - clock.now) / 1000) + 30 * 24 * 60 * 60;
    assert.equal(record.expiresAt - clock.now, expectedTtl * 1000);

    await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    const firstTtl = listTtlMs(offerClicksKey(SLUG));
    assert.equal(firstTtl, 90 * DAY_MS);
    clock.now += 10 * DAY_MS;
    await handleOfferLinkRequest(visit(SLUG), SLUG, deps);
    assert.equal(listTtlMs(offerClicksKey(SLUG)), 80 * DAY_MS);
});

test('an offer without an end date is kept for 366 days from the last write', async () => {
    const { clock, deps, strings } = setup();
    await handleCreateOfferLink(createRequest({ slug: SLUG, message: MESSAGE }), deps);
    const record = strings.get(offerRecordKey(SLUG));
    assert.ok(record);
    assert.equal(record.expiresAt - clock.now, 366 * DAY_MS);
});

test('the Pages function routes /o/:slug through waitUntil', async () => {
    const source = await readFile(new URL('../functions/o/[slug].ts', import.meta.url), 'utf8');
    assert.match(source, /handleOfferLinkRequest\(context\.request, slug,/);
    assert.match(source, /context\.waitUntil\(promise\)/);
});

test('robots.txt disallows /o/ for every group that can crawl, and the sitemap omits it', async () => {
    const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
    const groups = robots.split(/\n\s*\n/).filter((block) => /^User-agent:/m.test(block));
    assert.ok(groups.length >= 3);
    for (const group of groups) {
        const rules = group.split('\n').map((line) => line.replace(/#.*/, '').trim());
        if (rules.includes('Disallow: /')) continue;
        assert.ok(rules.includes('Disallow: /o/'), `group missing Disallow: /o/\n${group}`);
    }
    const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
    assert.doesNotMatch(sitemap, /\/o\//);
});

test('the redirect number is the one already in utils/whatsapp.ts', async () => {
    const source = await readFile(new URL('../utils/whatsapp.ts', import.meta.url), 'utf8');
    assert.match(source, new RegExp(`WHATSAPP_NUMBER = '${ANHANGA_WHATSAPP_NUMBER}'`));
    assert.equal(offerWhatsAppUrl('oi'), `https://wa.me/${ANHANGA_WHATSAPP_NUMBER}?text=oi`);
});

test('a title is escaped on the preview page', async () => {
    const { deps } = setup();
    const title = '<img alt="x" onerror="alert(1)">';
    assert.equal((await handleCreateOfferLink(createRequest({ slug: SLUG, message: MESSAGE, title }), deps)).status, 201);
    const preview = await handleOfferLinkRequest(visit(SLUG, { userAgent: WHATSAPP }), SLUG, deps);
    const html = await preview.text();
    assert.doesNotMatch(html, /<img alt="x"/);
    assert.match(html, /&lt;img alt=&quot;x&quot;/);
    assert.match(html, /<img class="logo" [^>]*alt="Anhangá Viagens"/);
});
