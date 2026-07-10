import test from 'node:test';
import assert from 'node:assert/strict';
import { withLeadIdempotencyLock } from '../lib/odoo-lead-idempotency.ts';

function useInMemoryFallback(t: { after: (fn: () => void) => void }): void {
    const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
    const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    t.after(() => {
        if (savedUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
        else process.env.UPSTASH_REDIS_REST_URL = savedUrl;
        if (savedToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
        else process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
    });
}

function uid(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test('withLeadIdempotencyLock runs fn and returns its result when uncontended', async (t) => {
    useInMemoryFallback(t);
    const result = await withLeadIdempotencyLock(`key-${uid()}`, async () => 42);
    assert.equal(result, 42);
});

test('withLeadIdempotencyLock releases the lock after fn resolves, allowing a later sequential call to acquire it immediately', async (t) => {
    useInMemoryFallback(t);
    const key = `key-${uid()}`;

    await withLeadIdempotencyLock(key, async () => 'first');
    const start = Date.now();
    const second = await withLeadIdempotencyLock(key, async () => 'second');
    const elapsed = Date.now() - start;

    assert.equal(second, 'second');
    assert.ok(elapsed < 250, `expected the second sequential call to acquire the lock immediately, took ${elapsed}ms`);
});

test('withLeadIdempotencyLock serializes two concurrent calls for the same key', async (t) => {
    useInMemoryFallback(t);
    const key = `key-${uid()}`;
    const order: string[] = [];

    const first = withLeadIdempotencyLock(key, async () => {
        order.push('first-start');
        await new Promise((resolve) => setTimeout(resolve, 50));
        order.push('first-end');
        return 'first';
    });
    const second = withLeadIdempotencyLock(key, async () => {
        order.push('second-start');
        return 'second';
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    assert.equal(firstResult, 'first');
    assert.equal(secondResult, 'second');
    // The second call must not start its critical section before the first's
    // finishes — it waited out the lock instead of racing in immediately.
    assert.ok(order.indexOf('first-end') < order.indexOf('second-start'));
});

test('withLeadIdempotencyLock releases the lock even when fn throws', async (t) => {
    useInMemoryFallback(t);
    const key = `key-${uid()}`;

    await assert.rejects(
        withLeadIdempotencyLock(key, async () => {
            throw new Error('boom');
        }),
        /boom/,
    );

    const start = Date.now();
    const result = await withLeadIdempotencyLock(key, async () => 'recovered');
    const elapsed = Date.now() - start;

    assert.equal(result, 'recovered');
    assert.ok(elapsed < 250, `expected the lock to be released after a throw, took ${elapsed}ms`);
});

test('withLeadIdempotencyLock keeps independent keys fully concurrent', async (t) => {
    useInMemoryFallback(t);
    const start = Date.now();

    await Promise.all([
        withLeadIdempotencyLock(`key-a-${uid()}`, async () => new Promise((resolve) => setTimeout(resolve, 50))),
        withLeadIdempotencyLock(`key-b-${uid()}`, async () => new Promise((resolve) => setTimeout(resolve, 50))),
    ]);

    const elapsed = Date.now() - start;
    assert.ok(elapsed < 150, `expected unrelated keys to run concurrently, took ${elapsed}ms`);
});
