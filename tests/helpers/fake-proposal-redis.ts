import type { ProposalOpensRedis } from '../../lib/proposal-opens.ts';

/**
 * In-memory Redis for the proposal tests, with TTLs on an injected clock.
 * Reads go through JSON.parse like Upstash's default automatic
 * deserialization, so a JSON string comes back as an object and a numeric
 * string as a number — the shape production code actually receives.
 */
export function createFakeProposalRedis(clock: { now: number }) {
    const strings = new Map<string, { value: string; expiresAt: number }>();
    const lists = new Map<string, { values: string[]; expiresAt: number | null }>();
    const live = <T extends { expiresAt: number | null }>(entry: T | undefined): T | undefined =>
        entry && (entry.expiresAt === null || entry.expiresAt > clock.now) ? entry : undefined;

    const read = (key: string): unknown => {
        const entry = live(strings.get(key));
        if (!entry) return null;
        try {
            return JSON.parse(entry.value);
        } catch {
            return entry.value;
        }
    };

    const redis: ProposalOpensRedis = {
        async set(key: string, value: string, opts: { nx?: true; ex: number }) {
            if (opts.nx && read(key) !== null) return null;
            strings.set(key, { value, expiresAt: clock.now + opts.ex * 1000 });
            return 'OK';
        },
        async mget(...keys) {
            return keys.map(read);
        },
        multi() {
            // Queued, then applied together on exec() — like MULTI/EXEC.
            const queue: Array<() => unknown> = [];
            const transaction = {
                rpush(key: string, ...values: string[]) {
                    queue.push(() => {
                        const entry = live(lists.get(key)) ?? { values: [], expiresAt: null };
                        entry.values.push(...values);
                        lists.set(key, entry);
                        return entry.values.length;
                    });
                    return transaction;
                },
                expire(key: string, seconds: number, option?: 'NX') {
                    queue.push(() => {
                        const entry = live(lists.get(key));
                        if (!entry || (option === 'NX' && entry.expiresAt !== null)) return 0;
                        entry.expiresAt = clock.now + seconds * 1000;
                        return 1;
                    });
                    return transaction;
                },
                async exec() {
                    return queue.map((command) => command());
                },
            };
            return transaction;
        },
    };

    /** The list as stored, parsed — what a reader (P6/P8) would get back. */
    const listOf = (key: string): unknown[] =>
        (live(lists.get(key))?.values ?? []).map((value) => JSON.parse(value));
    const listTtlMs = (key: string): number | null => {
        const entry = live(lists.get(key));
        return entry?.expiresAt == null ? null : entry.expiresAt - clock.now;
    };

    return { redis, strings, listOf, listTtlMs };
}
