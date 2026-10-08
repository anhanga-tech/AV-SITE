import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleNpsInviteRequest, isNpsInviteRequest } from '../lib/nps-invite-redirect.ts';
import { createNpsInviteToken } from '../lib/nps-invite.ts';
import { parseNpsInviteInfo, readCookie } from '../lib/nps-invite-cookie.ts';

// Issue #1666: the invite token is a bearer credential AND reversible PII
// (base64url JSON with e-mail + first name). Zaraz's automatic Pageview ships
// the page URL — query included — to GA4 before any page code runs, so the
// token must never be in the URL of the HTML that loads.

const SECRET = 'test-nps-invite-secret';
const ORIGIN = 'https://www.anhanga.tur.br';

function withSecret(t: { after: (fn: () => void) => void }) {
    process.env.NPS_INVITE_SECRET = SECRET;
    t.after(() => {
        delete process.env.NPS_INVITE_SECRET;
    });
}

async function validToken(overrides?: { firstname?: string; expiresInMs?: number }) {
    return createNpsInviteToken({ email: 'maria@example.com', firstname: 'Maria', ...overrides }, SECRET);
}

function decodedPayloadEmail(token: string): string {
    const [payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).email;
}

/** The tab ref the redirect put in the clean URL (`/nps/?i=…`), or null. */
function refOf(response: Response): string | null {
    return new URL(response.headers.get('Location') ?? '', ORIGIN).searchParams.get('i');
}

function cookieValue(response: Response, name: string): string | null {
    const cookie = response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
    return cookie ? readCookie(cookie.split(';')[0], name) : null;
}

function cookieAttributes(response: Response, name: string): string {
    return response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`)) ?? '';
}

async function redirectFor(path: string): Promise<Response> {
    const response = await handleNpsInviteRequest(new Request(`${ORIGIN}${path}`));
    assert.ok(response, `${path} must be handled`);
    return response;
}

test('a valid invite link redirects to a clean /nps/ with no token, name or e-mail in the Location', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = await redirectFor(`/nps?token=${encodeURIComponent(token)}&firstname=Maria`);

    assert.equal(response.status, 303);
    const location = response.headers.get('Location') ?? '';
    assert.match(location, /^\/nps\/\?i=[a-f0-9]{32}$/);
    assert.equal(location.includes(token.split('.')[0]), false);
    assert.equal(location.includes(decodedPayloadEmail(token)), false);
    assert.equal(location.includes('Maria'), false);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(await response.text(), '', 'a redirect body has no HTML, so no tag can run on it');
});

test('the token moves to an HttpOnly, SameSite=Strict cookie named after the tab ref, scoped to the submit endpoint', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = await redirectFor(`/nps/?token=${token}`);
    const ref = refOf(response)!;

    assert.equal(cookieValue(response, `nps_invite_${ref}`), token);
    const attrs = cookieAttributes(response, `nps_invite_${ref}`);
    assert.match(attrs, /HttpOnly/);
    assert.match(attrs, /SameSite=Strict/);
    assert.match(attrs, /Secure/);
    assert.match(attrs, /Path=\/api\/submit-nps(;|$)/);
    assert.match(attrs, /Max-Age=7200/);
});

test('the greeting name comes from the verified payload, not from the firstname param', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = await redirectFor(`/nps?token=${token}&firstname=Hacker`);
    const ref = refOf(response)!;

    assert.deepEqual(parseNpsInviteInfo(cookieValue(response, `nps_invite_info_${ref}`)), { name: 'Maria' });
    const attrs = cookieAttributes(response, `nps_invite_info_${ref}`);
    assert.doesNotMatch(attrs, /HttpOnly/, 'the page reads this one for the greeting');
    assert.match(attrs, /Path=\/nps(;|$)/);
});

test('two invites opened in the same browser get separate cookie pairs, so neither overwrites the other', async (t) => {
    withSecret(t);
    const ana = await redirectFor(`/nps?token=${await validToken({ firstname: 'Ana' })}`);
    const bia = await redirectFor(`/nps?token=${await validToken({ firstname: 'Bia' })}`);
    const anaRef = refOf(ana)!;
    const biaRef = refOf(bia)!;

    assert.notEqual(anaRef, biaRef);
    assert.equal(bia.headers.getSetCookie().some((c) => c.includes(anaRef)), false, "Bia's redirect never touches Ana's cookies");
    assert.deepEqual(parseNpsInviteInfo(cookieValue(ana, `nps_invite_info_${anaRef}`)), { name: 'Ana' });
    assert.deepEqual(parseNpsInviteInfo(cookieValue(bia, `nps_invite_info_${biaRef}`)), { name: 'Bia' });
});

test('an incoming i param is replaced, so a forwarded clean URL cannot steer a new invite', async (t) => {
    withSecret(t);
    const forwardedRef = 'a'.repeat(32);
    const response = await redirectFor(`/nps?i=${forwardedRef}&token=${await validToken()}`);

    assert.notEqual(refOf(response), forwardedRef);
    assert.equal(response.headers.getSetCookie().some((c) => c.includes(forwardedRef)), false);
});

test('cookie lifetime never outlives the invite itself', async (t) => {
    withSecret(t);
    const response = await redirectFor(`/nps?token=${await validToken({ expiresInMs: 10 * 60 * 1000 })}`);
    const maxAge = Number(/Max-Age=(\d+)/.exec(cookieAttributes(response, `nps_invite_${refOf(response)}`))?.[1]);

    assert.ok(maxAge > 0 && maxAge <= 600, `expected Max-Age ≤ 600, got ${maxAge}`);
});

test('a tampered, expired, malformed or missing token redirects clean and sets no cookies, leaving other invites alone', async (t) => {
    withSecret(t);
    const forged = await createNpsInviteToken({ email: 'x@example.com', firstname: 'X' }, 'wrong-secret');
    const expired = await validToken({ expiresInMs: -1000 });

    for (const query of [`token=${forged}`, `token=${expired}`, 'token=not-a-token', 'token=', 'firstname=Ana&email=ana@example.com']) {
        const response = await redirectFor(`/nps?${query}`);
        assert.equal(response.status, 303);
        assert.equal(response.headers.get('Location'), '/nps/', query);
        assert.deepEqual(response.headers.getSetCookie(), [], `${query} must not set or clear cookies`);
    }
});

test('non-identifying params such as UTMs survive the redirect', async (t) => {
    withSecret(t);
    const response = await redirectFor(`/nps?utm_source=email&token=${await validToken()}&utm_campaign=nps`);

    assert.match(response.headers.get('Location') ?? '', /^\/nps\/\?utm_source=email&utm_campaign=nps&i=[a-f0-9]{32}$/);
});

test('without NPS_INVITE_SECRET the token is still taken off the URL', async () => {
    delete process.env.NPS_INVITE_SECRET;
    const response = await redirectFor('/nps?token=abc.def');
    const ref = refOf(response)!;

    assert.match(response.headers.get('Location') ?? '', /^\/nps\/\?i=[a-f0-9]{32}$/);
    assert.equal(cookieValue(response, `nps_invite_${ref}`), 'abc.def');
    assert.deepEqual(parseNpsInviteInfo(cookieValue(response, `nps_invite_info_${ref}`)), { name: '' });
});

test('plain-HTTP local dev drops the Secure flag so the browser keeps the cookies', async (t) => {
    withSecret(t);
    const token = await validToken();
    const response = (await handleNpsInviteRequest(new Request(`http://127.0.0.1:3000/nps?token=${token}`)))!;

    assert.doesNotMatch(cookieAttributes(response, `nps_invite_${refOf(response)}`), /Secure/);
});

test('path casing and trailing slashes do not bypass the redirect', async (t) => {
    withSecret(t);
    const token = await validToken();
    for (const path of ['/NPS', '/Nps/', '/nps//', '/nps/index.html']) {
        const response = await redirectFor(`${path}?token=${token}`);
        assert.equal(response.status, 303, `${path} must redirect`);
        assert.match(response.headers.get('Location') ?? '', /^\/nps\/\?i=[a-f0-9]{32}$/, path);
    }
});

test('requests that are not an invite link pass through untouched', () => {
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps/`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps/?i=${'a'.repeat(32)}`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps/?utm_source=email`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/blog/?token=x`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/npsx?token=x`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps?token=x`, { method: 'POST' })), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps?token=x`, { method: 'HEAD' })), true);
});

test('the Pages catch-all answers the invite redirect before serving the static /nps/ HTML', () => {
    const source = readFileSync(new URL('../functions/[[path]].ts', import.meta.url), 'utf8');
    const redirectAt = source.indexOf('handleNpsInviteRequest(request)');
    const nextAt = source.indexOf('return next()');

    assert.ok(redirectAt > -1, 'functions/[[path]].ts must call handleNpsInviteRequest');
    assert.ok(redirectAt < nextAt, 'the redirect must run before falling through to static assets');
});

test('the invite generator no longer appends the first name to the link', () => {
    const source = readFileSync(new URL('../scripts/generate-nps-invite.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /searchParams\.set\('firstname'/);
});
