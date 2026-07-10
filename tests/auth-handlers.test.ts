import test from 'node:test';
import assert from 'node:assert/strict';
import authHandler from '../api/auth.ts';
import callbackHandler from '../api/auth/callback.ts';

const ORIGINAL_ENV = {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    ENABLE_DEV_OAUTH_ORIGIN: process.env.ENABLE_DEV_OAUTH_ORIGIN,
};

function setOAuthEnv(): void {
    process.env.GITHUB_CLIENT_ID = 'test-client-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
}

function restoreEnv(): void {
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
}

/** Each test uses a distinct IP so the in-memory rate-limit buckets stay isolated. */
function authRequest(ip: string, opts: { referer?: string | null } = {}): Request {
    const headers: Record<string, string> = { 'cf-connecting-ip': ip };
    const referer = opts.referer === undefined ? 'https://www.anhanga.tur.br/admin/' : opts.referer;
    if (referer !== null) headers['referer'] = referer;
    return new Request('https://www.anhanga.tur.br/api/auth', {
        method: 'GET',
        headers,
    });
}

function callbackRequest(
    ip: string,
    opts: { code?: string; state?: string; state_cookie?: string; origin_cookie?: string } = {},
): Request {
    const url = new URL('https://www.anhanga.tur.br/api/auth/callback');
    if (opts.code !== undefined) url.searchParams.set('code', opts.code);
    if (opts.state !== undefined) url.searchParams.set('state', opts.state);
    const headers: Record<string, string> = { 'cf-connecting-ip': ip };
    const cookieParts: string[] = [];
    if (opts.state_cookie) cookieParts.push(`oauth_state=${opts.state_cookie}`);
    if (opts.origin_cookie) cookieParts.push(`oauth_origin=${opts.origin_cookie}`);
    if (cookieParts.length) headers['cookie'] = cookieParts.join('; ');
    return new Request(url.toString(), { method: 'GET', headers });
}

test('auth: config check runs before rate limiting (missing client id -> 500)', async () => {
    delete process.env.GITHUB_CLIENT_ID;
    try {
        const res = await authHandler(authRequest('10.0.0.1'));
        assert.equal(res.status, 500);
        const body = await res.json();
        assert.equal(body.error, 'CONFIGURATION_ERROR');
    } finally {
        restoreEnv();
    }
});

test('auth: returns 429 once the request limit is exceeded', async () => {
    setOAuthEnv();
    try {
        const ip = '10.0.0.2';
        // Limit is 5 requests per window.
        for (let i = 0; i < 5; i += 1) {
            const ok = await authHandler(authRequest(ip));
            assert.equal(ok.status, 302, `request ${i + 1} should be allowed`);
        }
        const blocked = await authHandler(authRequest(ip));
        assert.equal(blocked.status, 429);
        const body = await blocked.json();
        assert.equal(body.error, 'RATE_LIMIT_EXCEEDED');
    } finally {
        restoreEnv();
    }
});

test('auth: rejects initiation with a missing referer (fail closed)', async () => {
    setOAuthEnv();
    try {
        const res = await authHandler(authRequest('10.0.0.10', { referer: null }));
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.error, 'INVALID_ORIGIN');
    } finally {
        restoreEnv();
    }
});

test('auth: rejects initiation from an unauthorized subdomain referer', async () => {
    setOAuthEnv();
    try {
        const res = await authHandler(authRequest('10.0.0.11', { referer: 'https://evil.anhanga.tur.br/admin/' }));
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.error, 'INVALID_ORIGIN');
    } finally {
        restoreEnv();
    }
});

test('auth: accepts the declared local dev origin when explicitly enabled', async () => {
    setOAuthEnv();
    process.env.ENABLE_DEV_OAUTH_ORIGIN = 'true';
    try {
        const res = await authHandler(authRequest('10.0.0.12', { referer: 'http://localhost:3000/admin/' }));
        assert.equal(res.status, 302);
        const setCookies = res.headers.getSetCookie();
        assert.ok(setCookies.some((c) => c.startsWith('oauth_origin=http://localhost:3000;')));
    } finally {
        restoreEnv();
    }
});

test('auth: rejects the local dev origin when the opt-in flag is not set', async () => {
    setOAuthEnv();
    delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    try {
        const res = await authHandler(authRequest('10.0.0.13', { referer: 'http://localhost:3000/admin/' }));
        assert.equal(res.status, 400);
        const body = await res.json();
        assert.equal(body.error, 'INVALID_ORIGIN');
    } finally {
        restoreEnv();
    }
});

test('auth: binds the validated origin into the oauth_origin cookie', async () => {
    setOAuthEnv();
    try {
        const res = await authHandler(authRequest('10.0.0.13'));
        assert.equal(res.status, 302);
        const setCookies = res.headers.getSetCookie();
        assert.ok(setCookies.some((c) => c.startsWith('oauth_origin=https://www.anhanga.tur.br;')));
        assert.ok(setCookies.some((c) => c.startsWith('oauth_state=')));
    } finally {
        restoreEnv();
    }
});

test('callback: rejects a missing state cookie with 400', async () => {
    setOAuthEnv();
    try {
        const res = await callbackHandler(callbackRequest('10.0.1.1', { code: 'c', state: 's' }));
        assert.equal(res.status, 400);
        const html = await res.text();
        assert.match(html, /Invalid state parameter/);
    } finally {
        restoreEnv();
    }
});

test('callback: rejects a mismatched state with 400', async () => {
    setOAuthEnv();
    try {
        const res = await callbackHandler(
            callbackRequest('10.0.1.2', {
                code: 'c',
                state: 'expected',
                state_cookie: 'different',
                origin_cookie: 'https://www.anhanga.tur.br',
            }),
        );
        assert.equal(res.status, 400);
        const html = await res.text();
        assert.match(html, /Invalid state parameter/);
    } finally {
        restoreEnv();
    }
});

test('callback: rejects a matching state with a missing origin cookie', async () => {
    setOAuthEnv();
    try {
        const res = await callbackHandler(
            callbackRequest('10.0.1.5', { code: 'c', state: 'matching-state', state_cookie: 'matching-state' }),
        );
        assert.equal(res.status, 400);
        const html = await res.text();
        assert.match(html, /Invalid state parameter/);
    } finally {
        restoreEnv();
    }
});

test('callback: rejects a matching state with an unauthorized origin cookie', async () => {
    setOAuthEnv();
    try {
        const res = await callbackHandler(
            callbackRequest('10.0.1.6', {
                code: 'c',
                state: 'matching-state',
                state_cookie: 'matching-state',
                origin_cookie: 'https://evil.anhanga.tur.br',
            }),
        );
        assert.equal(res.status, 400);
        const html = await res.text();
        assert.match(html, /Invalid state parameter/);
    } finally {
        restoreEnv();
    }
});

test('callback: a matching state and bound origin pass the guard and complete', async () => {
    setOAuthEnv();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
        new Response(JSON.stringify({ access_token: 'tok-abc' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    try {
        const res = await callbackHandler(
            callbackRequest('10.0.1.3', {
                code: 'c',
                state: 'matching-state',
                state_cookie: 'matching-state',
                origin_cookie: 'https://www.anhanga.tur.br',
            }),
        );
        assert.equal(res.status, 200);
        const html = await res.text();
        assert.match(html, /tok-abc/);
        assert.match(html, /var allowedOrigin = "https:\/\/www\.anhanga\.tur\.br"/);
    } finally {
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test('callback: returns 429 once the request limit is exceeded', async () => {
    setOAuthEnv();
    try {
        const ip = '10.0.1.4';
        // Limit is 10 requests per window; these fail validation (400) but still
        // consume quota since rate limiting runs before request parsing.
        for (let i = 0; i < 10; i += 1) {
            const ok = await callbackHandler(callbackRequest(ip));
            assert.equal(ok.status, 400, `request ${i + 1} should pass the rate limiter`);
        }
        const blocked = await callbackHandler(callbackRequest(ip));
        assert.equal(blocked.status, 429);
    } finally {
        restoreEnv();
    }
});
