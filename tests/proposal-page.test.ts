import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { handleProposalRequest } from '../lib/proposal-page.ts';
import {
    createProposalId,
    isValidProposalId,
    loadProposal,
    PROPOSAL_TOMBSTONE_GRACE_SECONDS,
    PROPOSAL_VALIDITY_SECONDS,
    saveProposal,
    type ProposalRedis,
} from '../lib/proposal-store.ts';
import type { ProposalOpensRedis } from '../lib/proposal-opens.ts';
import { createFakeProposalRedis } from './helpers/fake-proposal-redis.ts';

// Issue #1895: `/proposta/<id>` is a private, expiring page whose random id is
// the only credential. Valid 15 days (D5); after that 410 with a WhatsApp CTA.

const ORIGIN = 'https://www.anhanga.tur.br';
const DAY_MS = 24 * 60 * 60 * 1000;

/** For paths that never reach an active proposal, so never record an open. */
function lookupOnly(redis: ProposalRedis): ProposalOpensRedis {
    return {
        ...redis,
        multi: () => {
            throw new Error('unexpected open recorded');
        },
    };
}

function setup() {
    const clock = { now: Date.UTC(2026, 9, 22, 12) };
    const { redis } = createFakeProposalRedis(clock);
    return { clock, redis, deps: { redis, now: () => clock.now } };
}

function request(id: string, method = 'GET'): Request {
    return new Request(`${ORIGIN}/proposta/${id}`, { method });
}

test('proposal ids are 16 base62 characters and not repeated', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => createProposalId()));
    assert.equal(ids.size, 2000);
    for (const id of ids) assert.ok(isValidProposalId(id), id);
});

test('isValidProposalId rejects anything but exactly 16 base62 characters', () => {
    for (const bad of ['', 'abc', 'Ab12Cd34Ef56Gh7', 'Ab12Cd34Ef56Gh789', 'Ab12Cd34Ef56Gh7-', '../../etc/passwd', 42]) {
        assert.equal(isValidProposalId(bad), false, String(bad));
    }
});

test('a saved proposal is active and serves a private noindex page', async () => {
    const { deps } = setup();
    const { id } = await saveProposal({}, deps);

    const response = await handleProposalRequest(request(id), id, deps);

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    const html = await response.text();
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    assert.ok(!html.includes(id), 'the page must not echo its own credential');
});

test('the proposal is valid for 15 days, then answers 410 with a WhatsApp button', async () => {
    const { clock, deps } = setup();
    const { id, expiresAt } = await saveProposal({}, deps);
    assert.equal(expiresAt, clock.now + PROPOSAL_VALIDITY_SECONDS * 1000);
    assert.equal(PROPOSAL_VALIDITY_SECONDS, 15 * 24 * 60 * 60);

    clock.now += 15 * DAY_MS - 1000;
    assert.equal((await handleProposalRequest(request(id), id, deps)).status, 200);

    clock.now += 1000;
    const response = await handleProposalRequest(request(id), id, deps);
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    const html = await response.text();
    assert.match(html, /Esta proposta expirou/);
    assert.match(html, /href="https:\/\/wa\.me\/5511955021519\?text=/);
});

test('the record is deleted at expiry; only the tombstone (an expiry instant) remains', async () => {
    const { clock, deps, redis } = setup();
    const { id, expiresAt } = await saveProposal({}, deps);

    clock.now = expiresAt;
    const [record, tombstone] = await redis.mget(`proposta:rec:${id}`, `proposta:exp:${id}`);
    assert.equal(record, null, 'proposal content must not outlive its validity');
    assert.equal(tombstone, expiresAt);
});

test('after the grace period an expired id answers 404, like one that never existed', async () => {
    const { clock, deps } = setup();
    const { id, expiresAt } = await saveProposal({}, deps);

    clock.now = expiresAt + PROPOSAL_TOMBSTONE_GRACE_SECONDS * 1000 - 1000;
    assert.equal((await loadProposal(id, deps)).status, 'expired');

    clock.now += 1000;
    assert.equal((await loadProposal(id, deps)).status, 'not_found');
});

test('an unknown id answers 404 and a malformed id never reaches Redis', async () => {
    const { deps } = setup();
    const unknown = await handleProposalRequest(request('Ab12Cd34Ef56Gh78'), 'Ab12Cd34Ef56Gh78', deps);
    assert.equal(unknown.status, 404);
    assert.equal(unknown.headers.get('Cache-Control'), 'private, no-store');

    let reads = 0;
    const counting: ProposalRedis = {
        set: async () => 'OK',
        mget: async (...keys) => {
            reads += 1;
            return keys.map(() => null);
        },
    };
    const malformed = await handleProposalRequest(request('nope'), 'nope', { redis: lookupOnly(counting) });
    assert.equal(malformed.status, 404);
    assert.equal(reads, 0);
});

test('Redis missing or failing answers 503, not a misleading 404', async () => {
    const id = createProposalId();
    const missing = await handleProposalRequest(request(id), id, { redis: null });
    assert.equal(missing.status, 503);

    const failing: ProposalRedis = {
        set: async () => 'OK',
        mget: async () => {
            throw new Error('upstash down');
        },
    };
    const failed = await handleProposalRequest(request(id), id, { redis: lookupOnly(failing) });
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('a Redis failure never logs the id, even when the error message carries the command', async (t) => {
    const id = createProposalId();
    const logged: string[] = [];
    for (const method of ['log', 'info', 'warn', 'error'] as const) {
        t.mock.method(console, method, (...args: unknown[]) => {
            logged.push(args.map((arg) => (arg instanceof Error ? `${arg.name}: ${arg.message}` : JSON.stringify(arg) ?? String(arg))).join(' '));
        });
    }
    const failing: ProposalRedis = {
        set: async () => 'OK',
        mget: async (...keys) => {
            // The shape @upstash/redis gives its errors.
            throw new Error(`ERR something failed, command was: ${JSON.stringify(['mget', ...keys])}`);
        },
    };

    assert.equal((await loadProposal(id, { redis: failing })).status, 'unavailable');
    assert.ok(logged.length > 0, 'the failure should still be logged');
    assert.ok(!logged.join('\n').includes(id), logged.join('\n'));
});

test('a corrupt stored record answers 503 instead of rendering it', async () => {
    const id = createProposalId();
    const corrupt: ProposalRedis = {
        set: async () => 'OK',
        mget: async () => [{ v: 1, createdAt: 'yesterday' }, null],
    };
    assert.equal((await handleProposalRequest(request(id), id, { redis: lookupOnly(corrupt) })).status, 503);
});

test('a record stored as a raw JSON string (no auto-deserialization) is still read', async () => {
    const id = createProposalId();
    const now = Date.UTC(2026, 9, 22, 12);
    const raw: ProposalRedis = {
        set: async () => 'OK',
        mget: async () => [JSON.stringify({ v: 1, createdAt: now, expiresAt: now + DAY_MS }), String(now + DAY_MS)],
    };
    assert.equal((await loadProposal(id, { redis: raw, now: () => now })).status, 'active');
});

test('HEAD gets the status without a body; other methods get 405', async () => {
    const { deps } = setup();
    const { id } = await saveProposal({}, deps);

    const head = await handleProposalRequest(request(id, 'HEAD'), id, deps);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');

    const post = await handleProposalRequest(request(id, 'POST'), id, deps);
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('Allow'), 'GET, HEAD');
});

test('the page sets its own security headers and a CSP that runs no script', async () => {
    // Pages Functions responses skip public/_headers, and a script-free CSP
    // keeps Cloudflare-injected tags (Zaraz, Web Analytics) from reading the URL.
    const response = await handleProposalRequest(request('Ab12Cd34Ef56Gh78'), 'Ab12Cd34Ef56Gh78', { redis: null });
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    assert.match(csp, /default-src 'none'/);
    assert.doesNotMatch(csp, /script-src/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
    assert.doesNotMatch(await response.text(), /<script/i);
});

test('the Pages Function routes /proposta/:id to the handler', async () => {
    const source = await readFile(new URL('../functions/proposta/[id].ts', import.meta.url), 'utf8');
    assert.match(source, /handleProposalRequest\(context\.request, id,/);
    assert.match(source, /context\.waitUntil\(promise\)/);
});

test('every robots.txt group that can crawl the site disallows /proposta/', async () => {
    const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
    // Crawlers obey only their most specific group, so a rule under `*` alone
    // would not bind the named groups. Groups that disallow `/` are covered.
    const groups = robots.split(/\n\s*\n/).filter((block) => /^User-agent:/m.test(block));
    assert.ok(groups.length >= 3);
    for (const group of groups) {
        const rules = group.split('\n').map((line) => line.replace(/#.*/, '').trim());
        if (rules.includes('Disallow: /')) continue;
        assert.ok(rules.includes('Disallow: /proposta/'), `group missing Disallow: /proposta/\n${group}`);
    }
});

test('the sitemap never lists a proposal URL', async () => {
    const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
    assert.doesNotMatch(sitemap, /\/proposta\//);
});
