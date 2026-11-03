import test from 'node:test';
import assert from 'node:assert/strict';
import { ConsentLedgerUnavailable, getConsentStore } from '../lib/consent-store.ts';
import { effectiveAction } from '../lib/consent-ledger.ts';

const ENV_KEYS = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'] as const;

interface MockRequest {
    path: string;
    /** Commands carried by the request: one for a plain call, many for /pipeline. */
    commands: string[][];
}

/**
 * Fake Upstash REST endpoint. `respond` answers one command at a time, in the
 * order the server would run them; a /pipeline request is answered as the
 * array of per-command `{ result }` objects, like the real API.
 */
async function withUpstashMock<T>(
    respond: (command: string[]) => unknown,
    run: (requests: MockRequest[]) => Promise<T>,
    options: { failPipeline?: boolean } = {},
): Promise<T> {
    const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    const savedFetch = globalThis.fetch;
    const requests: MockRequest[] = [];
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
        const path = new URL(String(url)).pathname;
        const body = JSON.parse(String(init?.body)) as string[] | string[][];
        const isPipeline = path === '/pipeline';
        const commands = isPipeline ? (body as string[][]) : [body as string[]];
        requests.push({ path, commands });
        if (isPipeline && options.failPipeline) return new Response('{}', { status: 500 });
        const results = commands.map((command) => ({ result: respond(command) }));
        return new Response(JSON.stringify(isPipeline ? results : results[0]), { status: 200 });
    }) as typeof fetch;
    try {
        return await run(requests);
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

test('upstash append reads the replay check and the subject list in one ordered request', async () => {
    await withUpstashMock(
        (command) => (command[0] === 'SET' ? 'OK' : command[0] === 'LRANGE' ? [] : null),
        async (requests) => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'appended');
            // One round trip carries both reads, GET first: the server runs a
            // pipeline in order, so the LRANGE snapshot is taken after the
            // replay check (a serial-await version would use two requests).
            assert.equal(requests[0]?.path, '/pipeline');
            assert.deepEqual(requests[0]?.commands.map((c) => c[0]), ['GET', 'LRANGE']);
            assert.deepEqual(requests.slice(1).map((r) => r.commands[0]?.[0]), ['SET', 'RPUSH', 'EXPIRE']);
        },
    );
});

test('upstash append still reports a replay when the event already exists, with no writes', async () => {
    const stored = JSON.stringify({ ...draft, recordedAt: '2026-10-13T12:00:01.000Z' });
    await withUpstashMock(
        (command) => (command[0] === 'GET' ? stored : command[0] === 'LRANGE' ? [stored] : null),
        async (requests) => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'replay');
            assert.equal(outcome.events.length, 1);
            assert.equal(requests.length, 1);
        },
    );
});

test('upstash append replay reflects a revocation that is already in the list', async () => {
    const stored = JSON.stringify({ ...draft, recordedAt: '2026-10-13T12:00:01.000Z' });
    const revoke = JSON.stringify({
        ...draft,
        id: 'evt-upstash-revoke',
        action: 'revoke',
        occurredAt: '2026-10-13T12:05:00.000Z',
        recordedAt: '2026-10-13T12:05:01.000Z',
    });
    await withUpstashMock(
        (command) => (command[0] === 'GET' ? stored : command[0] === 'LRANGE' ? [stored, revoke] : null),
        async () => {
            const outcome = await getConsentStore().append(draft);
            assert.equal(outcome.status, 'replay');
            assert.equal(effectiveAction(outcome.events, 'email_marketing'), 'revoke');
        },
    );
});

test('upstash append fails closed when the pipeline request fails', async () => {
    await withUpstashMock(
        () => null,
        async () => {
            await assert.rejects(() => getConsentStore().append(draft), ConsentLedgerUnavailable);
        },
        { failPipeline: true },
    );
});
