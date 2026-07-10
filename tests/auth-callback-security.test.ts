import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPostMessageHtml } from '../api/auth/callback.js';

test('buildPostMessageHtml binds the handshake to a single explicit origin, not a pattern', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200, 'https://www.anhanga.tur.br');
    const html = await response.text();

    assert.match(html, /var allowedOrigin = "https:\/\/www\.anhanga\.tur\.br"/);

    // The old wildcard-subdomain and window.location.origin fallbacks must be gone.
    assert.doesNotMatch(html, /anhanga\\\.tur\\\.br\$/);
    assert.doesNotMatch(html, /window\.location\.origin/);
    assert.doesNotMatch(html, /localhost:\\\\d\+/);
});

test('buildPostMessageHtml requires the postMessage source to be window.opener', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200, 'https://www.anhanga.tur.br');
    const html = await response.text();

    assert.match(html, /e\.source !== window\.opener/);
    assert.match(html, /e\.origin !== allowedOrigin/);
});

test('buildPostMessageHtml defaults the bound origin to the production origin when none is passed', async () => {
    const response = await buildPostMessageHtml('error', 'no origin bound', 400);
    const html = await response.text();
    assert.match(html, /var allowedOrigin = "https:\/\/www\.anhanga\.tur\.br"/);
});

test('buildPostMessageHtml clears both the state and origin cookies', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200, 'https://www.anhanga.tur.br');
    const setCookies = response.headers.getSetCookie
        ? response.headers.getSetCookie()
        : [response.headers.get('Set-Cookie') ?? ''];

    assert.ok(setCookies.some((c) => c.startsWith('oauth_state=;')));
    assert.ok(setCookies.some((c) => c.startsWith('oauth_origin=;')));
});

test('buildPostMessageHtml sets a nonce-based Content-Security-Policy without unsafe-inline', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200, 'https://www.anhanga.tur.br');
    const csp = response.headers.get('Content-Security-Policy');
    const html = await response.text();

    assert.ok(csp, 'Content-Security-Policy header must be present');
    assert.match(csp, /default-src 'none'/);
    assert.doesNotMatch(csp, /unsafe-inline/, 'CSP must not fall back to unsafe-inline');

    // The script-src nonce must match the nonce on the <script> tag.
    const cspNonce = csp.match(/script-src 'nonce-([^']+)'/);
    assert.ok(cspNonce, "CSP script-src must use a nonce");
    assert.match(html, new RegExp(`<script nonce="${cspNonce[1]}">`));
});

test('buildPostMessageHtml uses a fresh nonce per request', async () => {
    const csp1 = (await buildPostMessageHtml('success', '{}', 200, 'https://www.anhanga.tur.br')).headers.get('Content-Security-Policy');
    const csp2 = (await buildPostMessageHtml('success', '{}', 200, 'https://www.anhanga.tur.br')).headers.get('Content-Security-Policy');

    assert.notEqual(csp1, csp2, 'each response must carry a distinct nonce');
});
