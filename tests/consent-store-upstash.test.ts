import test from 'node:test';
import assert from 'node:assert/strict';
import { getConsentStore } from '../lib/consent-store.ts';
import { effectiveAction } from '../lib/consent-ledger.ts';

const ENV_KEYS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const;

async function withUpstashMock<T>(
    respond: (command: string[]) => unknown,
    run: (commands: string[][], stats: { maxInFlight: number }) => Promise<T>,
): Promise<T> {
    const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    const savedFetch = globalThis.fetch;
    const commands: string[][] = [];
    const stats = { maxInFlight: 0 };
    let inFlight = 0;
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
        const command = JSON.parse(String(init?.body)) as string[];
        commands.push(command);
        inFlight += 1;
        stats.maxInFlight = Math.max(stats.maxInFlight, inFlight);
        // Yield so a serial caller and a concurrent caller are distinguishable.
        await new Promise((resolve) => setTimeout(resolve, 5));
        inFlight -= 1;
        return new Response(JSON.stringify({ result: respond(command) }), { status: 200 });
    }) as typeof fetch;
    try {
        return await run(commands, stats);
    } finally {
        globalThis.fetch = savedFetch;
        for (const key of ENV_KEYS) {
            if (savedEnv[key] === undefined) delete process.env[key];
            else process.env[key] = savedEnv[key];
        }
    }
}

const draft = {
    id: 'evt-upstash-0001',
    subjectKey: 'email:abc',
    purpose: 'email_marketing' as const,
    action: 'grant' as const,
    noticeVersion: '2026-10-13',
    origin: 'quiz',
    occurredAt: '2026-10-13T12:00:00.000Z',
};

test('upstash append issues the replay GET and the subject LRANGE together', async () => {
    await withUpstashMock(
        (command) => (command[0] === 'SET' ? 'OK' : command[0] === 'LRANGE' ? [] : null),
        async (commands, stats) => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'appended');
            // Both reads must be in flight at once; a serial await chain peaks at 1.
            assert.equal(stats.maxInFlight, 2);
            assert.deepEqual(commands.slice(0, 2).map((c) => c[0]).sort(), ['GET', 'LRANGE']);
            assert.deepEqual(commands.slice(2).map((c) => c[0]), ['SET', 'RPUSH', 'EXPIRE']);
        },
    );
});

test('upstash append still reports a replay when the event already exists', async () => {
    const stored = JSON.stringify({ ...draft, recordedAt: '2026-10-13T12:00:01.000Z' });
    await withUpstashMock(
        (command) => (command[0] === 'GET' ? stored : command[0] === 'LRANGE' ? [stored] : null),
        async (commands) => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'replay');
            assert.equal(outcome.events.length, 1);
            // The subject list is read again after the replay check, so a
            // revocation landing in between is still seen (no re-grant).
            assert.deepEqual(commands.map((c) => c[0]), ['GET', 'LRANGE', 'LRANGE']);
        },
    );
});

test('upstash append replay sees a revocation that lands after the replay check', async () => {
    const stored = JSON.stringify({ ...draft, recordedAt: '2026-10-13T12:00:01.000Z' });
    const revoke = JSON.stringify({
        ...draft,
        id: 'evt-upstash-revoke',
        action: 'revoke',
        occurredAt: '2026-10-13T12:05:00.000Z',
        recordedAt: '2026-10-13T12:05:01.000Z',
    });
    let lranges = 0;
    await withUpstashMock(
        (command) => {
            if (command[0] === 'GET') return stored;
            // First (speculative) read predates the revocation; the re-read sees it.
            if (command[0] === 'LRANGE') return ++lranges === 1 ? [stored] : [stored, revoke];
            return null;
        },
        async () => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'replay');
            assert.equal(effectiveAction(outcome.events, 'email_marketing'), 'revoke');
        },
    );
});
