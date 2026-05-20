import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../lib/rate-limit.ts';

function uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Deletes UPSTASH env vars for the duration of a test and restores them in after(). */
function useInMemoryFallback(t: { after: (fn: () => void) => void }): void {
    const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    t.after(() => {
        if (savedUrl === undefined) {
            delete process.env.UPSTASH_REDIS_REST_URL;
        } else {
            process.env.UPSTASH_REDIS_REST_URL = savedUrl;
        }
        if (savedToken === undefined) {
            delete process.env.UPSTASH_REDIS_REST_TOKEN;
        } else {
            process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
        }
    });
}

test('rate limit allows first request in window', async (t) => {
    useInMemoryFallback(t);

    const result = await checkRateLimit(`10.0.0.${uid()}`, {
        limit: 5,
        windowMs: 60_000,
        prefix: `test-rl-first-${uid()}`,
    });

    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4);
    assert.ok(result.resetIn > 0);
});

test('rate limit allows all requests within limit', async (t) => {
    useInMemoryFallback(t);

    const ip = `10.1.0.${uid()}`;
    const prefix = `test-rl-within-${uid()}`;
    const limit = 3;

    for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(ip, { limit, windowMs: 60_000, prefix });
        assert.equal(result.allowed, true, `request ${i + 1} should be allowed`);
    }
});

test('rate limit blocks request that exceeds limit and returns retryAfter', async (t) => {
    useInMemoryFallback(t);

    const ip = `10.2.0.${uid()}`;
    const prefix = `test-rl-exceed-${uid()}`;

    for (let i = 0; i < 3; i++) {
        await checkRateLimit(ip, { limit: 3, windowMs: 60_000, prefix });
    }

    const exceeded = await checkRateLimit(ip, { limit: 3, windowMs: 60_000, prefix });

    assert.equal(exceeded.allowed, false);
    assert.equal(exceeded.remaining, 0);
    assert.ok(exceeded.resetIn > 0, 'resetIn should indicate when to retry');
});

test('rate limit correctly decrements remaining count on each request', async (t) => {
    useInMemoryFallback(t);

    const ip = `10.3.0.${uid()}`;
    const prefix = `test-rl-decrement-${uid()}`;
    const limit = 5;

    for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(ip, { limit, windowMs: 60_000, prefix });
        assert.equal(result.remaining, limit - (i + 1));
    }
});

test('rate limit resets counter after window expires', async (t) => {
    useInMemoryFallback(t);

    const ip = `10.4.0.${uid()}`;
    const prefix = `test-rl-reset-${uid()}`;

    // Exhaust limit with a short window
    for (let i = 0; i < 2; i++) {
        await checkRateLimit(ip, { limit: 2, windowMs: 10, prefix });
    }

    const blocked = await checkRateLimit(ip, { limit: 2, windowMs: 10, prefix });
    assert.equal(blocked.allowed, false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 30));

    const fresh = await checkRateLimit(ip, { limit: 2, windowMs: 10, prefix });
    assert.equal(fresh.allowed, true, 'should be allowed in new window');
    assert.equal(fresh.remaining, 1);
});

test('in-memory fallback works correctly without Redis configured', async (t) => {
    useInMemoryFallback(t);

    const ip = `10.5.0.${uid()}`;
    const prefix = `test-rl-fallback-${uid()}`;

    const r1 = await checkRateLimit(ip, { limit: 2, windowMs: 60_000, prefix });
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 1);

    const r2 = await checkRateLimit(ip, { limit: 2, windowMs: 60_000, prefix });
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 0);

    const r3 = await checkRateLimit(ip, { limit: 2, windowMs: 60_000, prefix });
    assert.equal(r3.allowed, false);
});

test('in-memory store GC runs when size exceeds 2000 and cleans expired entries', async (t) => {
    useInMemoryFallback(t);

    // Create 2100 entries with a 1ms window so they expire almost immediately.
    // The store accumulates entries from all tests in this process, so total
    // size will exceed the GC threshold (2000) once these are added.
    const gcPrefix = `test-rl-gc-${uid()}`;

    for (let i = 0; i < 2100; i++) {
        await checkRateLimit(`gc-ip-${i}-${uid()}`, {
            limit: 1,
            windowMs: 1,
            prefix: gcPrefix,
        });
    }

    // Wait for entries to expire
    await new Promise((resolve) => setTimeout(resolve, 15));

    // This call triggers GC (store.size > 2000). After cleanup, the new
    // request should go through normally since it's a fresh key.
    const result = await checkRateLimit(`gc-trigger-${uid()}`, {
        limit: 5,
        windowMs: 60_000,
        prefix: `test-rl-post-gc-${uid()}`,
    });

    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4);
});
