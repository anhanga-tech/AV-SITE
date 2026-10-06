import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleNpsInviteRequest, isNpsInviteRequest } from '../lib/nps-invite-redirect.ts';
import { createNpsInviteToken } from '../lib/nps-invite.ts';
import { readCookie } from '../lib/nps-invite-cookie.ts';

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

async function validToken(overrides?: { expiresInMs?: number }) {
    return createNpsInviteToken({ email: 'maria@example.com', firstname: 'Maria', ...overrides }, SECRET);
}

function decodedPayloadEmail(token: string): string {
    const [payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).email;
}

function cookieValue(response: Response, name: string): string | null {
    const cookie = response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
    return cookie ? readCookie(cookie.split(';')[0], name) : null;
}

function cookieAttributes(response: Response, name: string): string {
    return response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`)) ?? '';
}

test('a valid invite link redirects to a clean /nps/ with no token, name or e-mail in the Location', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = await handleNpsInviteRequest(
        new Request(`${ORIGIN}/nps?token=${encodeURIComponent(token)}&firstname=Maria`),
    );

    assert.ok(response);
    assert.equal(response.status, 303);
    const location = response.headers.get('Location') ?? '';
    assert.equal(location, '/nps/');
    assert.equal(location.includes(token.split('.')[0]), false);
    assert.equal(location.includes(decodedPayloadEmail(token)), false);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    assert.equal(await response.text(), '', 'a redirect body has no HTML, so no tag can run on it');
});

test('the token moves to an HttpOnly, SameSite=Strict cookie scoped to the submit endpoint', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps/?token=${token}`)))!;

    assert.equal(cookieValue(response, 'nps_invite'), token);
    const attrs = cookieAttributes(response, 'nps_invite');
    assert.match(attrs, /HttpOnly/);
    assert.match(attrs, /SameSite=Strict/);
    assert.match(attrs, /Secure/);
    assert.match(attrs, /Path=\/api\/submit-nps(;|$)/);
    assert.match(attrs, /Max-Age=7200/);
});

test('the greeting name comes from the verified payload, not from the firstname param', async (t) => {
    withSecret(t);
    const token = await validToken();

    const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps?token=${token}&firstname=Hacker`)))!;

    assert.equal(cookieValue(response, 'nps_invite_name'), 'Maria');
    const attrs = cookieAttributes(response, 'nps_invite_name');
    assert.doesNotMatch(attrs, /HttpOnly/, 'the page reads this one for the greeting');
    assert.match(attrs, /Path=\/nps(;|$)/);
});

test('cookie lifetime never outlives the invite itself', async (t) => {
    withSecret(t);
    const token = await validToken({ expiresInMs: 10 * 60 * 1000 });

    const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps?token=${token}`)))!;
    const maxAge = Number(/Max-Age=(\d+)/.exec(cookieAttributes(response, 'nps_invite'))?.[1]);

    assert.ok(maxAge > 0 && maxAge <= 600, `expected Max-Age ≤ 600, got ${maxAge}`);
});

test('a tampered, expired or malformed invite still redirects clean but clears the cookies', async (t) => {
    withSecret(t);
    const forged = await createNpsInviteToken({ email: 'x@example.com', firstname: 'X' }, 'wrong-secret');
    const expired = await validToken({ expiresInMs: -1000 });

    for (const token of [forged, expired, 'not-a-token', '']) {
        const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps?token=${encodeURIComponent(token)}`)))!;
        assert.equal(response.status, 303);
        assert.equal(response.headers.get('Location'), '/nps/');
        assert.match(cookieAttributes(response, 'nps_invite'), /Max-Age=0/);
        assert.match(cookieAttributes(response, 'nps_invite_name'), /Max-Age=0/);
    }
});

test('legacy identity params without a token are stripped too', async (t) => {
    withSecret(t);
    const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps?firstname=Ana&email=ana@example.com`)))!;

    assert.equal(response.headers.get('Location'), '/nps/');
});

test('non-identifying params such as UTMs survive the redirect', async (t) => {
    withSecret(t);
    const token = await validToken();
    const response = (await handleNpsInviteRequest(
        new Request(`${ORIGIN}/nps?utm_source=email&token=${token}&utm_campaign=nps`),
    ))!;

    assert.equal(response.headers.get('Location'), '/nps/?utm_source=email&utm_campaign=nps');
});

test('without NPS_INVITE_SECRET the token is still taken off the URL', async () => {
    delete process.env.NPS_INVITE_SECRET;
    const response = (await handleNpsInviteRequest(new Request(`${ORIGIN}/nps?token=abc.def`)))!;

    assert.equal(response.headers.get('Location'), '/nps/');
    assert.equal(cookieValue(response, 'nps_invite'), 'abc.def');
    assert.equal(cookieValue(response, 'nps_invite_name'), '');
});

test('plain-HTTP local dev drops the Secure flag so the browser keeps the cookies', async (t) => {
    withSecret(t);
    const token = await validToken();
    const response = (await handleNpsInviteRequest(new Request(`http://127.0.0.1:3000/nps?token=${token}`)))!;

    assert.doesNotMatch(cookieAttributes(response, 'nps_invite'), /Secure/);
});

test('requests that are not an invite link pass through untouched', () => {
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps/`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/nps/?utm_source=email`)), false);
    assert.equal(isNpsInviteRequest(new Request(`${ORIGIN}/blog/?token=x`)), false);
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
