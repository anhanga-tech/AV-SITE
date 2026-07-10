import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getAllowedOAuthOrigins,
    isAllowedOAuthOrigin,
    extractOriginFromReferer,
    validateOAuthInitiationOrigin,
} from '../lib/auth-origin.ts';

const ORIGINAL_ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const ORIGINAL_ENABLE_DEV_OAUTH_ORIGIN = process.env.ENABLE_DEV_OAUTH_ORIGIN;

test.afterEach(() => {
    if (ORIGINAL_ALLOWED_ORIGIN === undefined) {
        delete process.env.ALLOWED_ORIGIN;
    } else {
        process.env.ALLOWED_ORIGIN = ORIGINAL_ALLOWED_ORIGIN;
    }
    if (ORIGINAL_ENABLE_DEV_OAUTH_ORIGIN === undefined) {
        delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    } else {
        process.env.ENABLE_DEV_OAUTH_ORIGIN = ORIGINAL_ENABLE_DEV_OAUTH_ORIGIN;
    }
});

test('getAllowedOAuthOrigins defaults to only the production origin — dev origin is opt-in', () => {
    delete process.env.ALLOWED_ORIGIN;
    delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    assert.deepEqual(getAllowedOAuthOrigins(), ['https://www.anhanga.tur.br']);
});

test('getAllowedOAuthOrigins includes the declared local dev origin only when explicitly enabled', () => {
    delete process.env.ALLOWED_ORIGIN;
    process.env.ENABLE_DEV_OAUTH_ORIGIN = 'true';
    assert.deepEqual(getAllowedOAuthOrigins(), ['https://www.anhanga.tur.br', 'http://localhost:3000']);
});

test('getAllowedOAuthOrigins honors a configured ALLOWED_ORIGIN override', () => {
    process.env.ALLOWED_ORIGIN = 'https://staging.anhanga.tur.br';
    delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    assert.deepEqual(getAllowedOAuthOrigins(), ['https://staging.anhanga.tur.br']);
});

test('isAllowedOAuthOrigin: exact allowlist match only — no subdomain wildcard, dev origin off by default', async (t) => {
    delete process.env.ALLOWED_ORIGIN;
    delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    const cases = [
        { origin: 'https://www.anhanga.tur.br', expected: true },
        { origin: 'http://localhost:3000', expected: false }, // opt-in only, not set here
        { origin: 'https://anhanga.tur.br', expected: false },
        { origin: 'https://preview.anhanga.tur.br', expected: false },
        { origin: 'https://dev-123.anhanga.tur.br', expected: false },
        { origin: 'https://sub.sub.anhanga.tur.br', expected: false },
        { origin: 'https://evil-anhanga.tur.br', expected: false },
        { origin: 'https://anhanga.tur.br.evil.com', expected: false },
        { origin: 'http://www.anhanga.tur.br', expected: false }, // must be https
        { origin: 'http://localhost:4000', expected: false }, // wrong dev port
        { origin: null, expected: false },
        { origin: undefined, expected: false },
        { origin: '', expected: false },
    ];

    for (const { origin, expected } of cases) {
        await t.test(`should ${expected ? 'accept' : 'reject'} ${origin}`, () => {
            assert.equal(isAllowedOAuthOrigin(origin), expected);
        });
    }
});

test('extractOriginFromReferer returns the origin for a well-formed URL', () => {
    assert.equal(
        extractOriginFromReferer('https://www.anhanga.tur.br/admin/'),
        'https://www.anhanga.tur.br',
    );
});

test('extractOriginFromReferer returns null for missing or malformed referer', () => {
    assert.equal(extractOriginFromReferer(null), null);
    assert.equal(extractOriginFromReferer('not-a-url'), null);
    assert.equal(extractOriginFromReferer(''), null);
});

test('validateOAuthInitiationOrigin accepts an allowlisted referer', () => {
    delete process.env.ALLOWED_ORIGIN;
    assert.equal(
        validateOAuthInitiationOrigin('https://www.anhanga.tur.br/admin/'),
        'https://www.anhanga.tur.br',
    );
});

test('validateOAuthInitiationOrigin accepts the local dev referer only when explicitly enabled', () => {
    delete process.env.ALLOWED_ORIGIN;
    process.env.ENABLE_DEV_OAUTH_ORIGIN = 'true';
    assert.equal(
        validateOAuthInitiationOrigin('http://localhost:3000/admin/'),
        'http://localhost:3000',
    );
});

test('validateOAuthInitiationOrigin rejects the local dev referer when the flag is not set', () => {
    delete process.env.ALLOWED_ORIGIN;
    delete process.env.ENABLE_DEV_OAUTH_ORIGIN;
    assert.equal(validateOAuthInitiationOrigin('http://localhost:3000/admin/'), null);
});

test('validateOAuthInitiationOrigin rejects an unauthorized subdomain referer', () => {
    delete process.env.ALLOWED_ORIGIN;
    assert.equal(validateOAuthInitiationOrigin('https://evil.anhanga.tur.br/admin/'), null);
});

test('validateOAuthInitiationOrigin rejects a missing referer (fail closed)', () => {
    assert.equal(validateOAuthInitiationOrigin(null), null);
});

test('validateOAuthInitiationOrigin rejects a malformed referer', () => {
    assert.equal(validateOAuthInitiationOrigin('not-a-valid-url'), null);
});
