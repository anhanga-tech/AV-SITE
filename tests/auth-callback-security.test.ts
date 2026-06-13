import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPostMessageHtml } from '../api/auth/callback.js';

test('buildPostMessageHtml includes origin validation logic', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200);
    const html = await response.text();

    // Check for origin validation variables
    assert.match(html, /var allowedOrigin = /);
    assert.match(html, /var isTrusted = /);

    // Check for specific trusted origin patterns
    assert.match(html, /origin === allowedOrigin/);
    assert.match(html, /origin === window\.location\.origin/);
    assert.match(html, /\/\^https:\\\/\\\/\(\?:\[a-zA-Z0-9-\]\+\\\.\)\*anhanga\\\.tur\\\.br\$\//);

    // Check for localhost regex
    // In the HTML string it is: /^http:\\/\\/localhost:\\d+$/.test(origin)
    assert.match(html, /localhost/);

    // Ensure it doesn't just blindly trust e.origin anymore
    assert.match(html, /if \(!isTrusted\) \{/);
});

test('buildPostMessageHtml sets a restrictive Content-Security-Policy header', async () => {
    const response = await buildPostMessageHtml('success', '{"token":"test"}', 200);
    const csp = response.headers.get('Content-Security-Policy');

    assert.ok(csp, 'Content-Security-Policy header must be present');
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /script-src 'unsafe-inline'/);
});
