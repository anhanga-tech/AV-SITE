/**
 * Daily retention audit for the `/proposta/<id>` keys (P12, #1902). Lists
 * every `proposta:*` key and fails if one has no TTL, a TTL past its limit
 * (lib/proposal-retention.ts: the global ceiling and the proposal's own
 * expiry or first open) or an unknown prefix. Run by
 * .github/workflows/proposal-retention-audit.yml with plain `node`:
 *
 *   node scripts/audit-proposal-retention.ts
 *
 * Needs UPSTASH_REDIS_REST_URL and a token: UPSTASH_REDIS_REST_READONLY_TOKEN
 * (preferred; it runs SCAN and TTL here and is refused writes, checked
 * 23/10/2026 although Upstash's docs say read-only tokens can't SCAN) or
 * UPSTASH_REDIS_REST_TOKEN.
 * Prints counts only: key names carry the proposal id, a credential.
 */
import {
  checkProposalKeyRetention,
  proposalKeyDeadline,
  proposalKeyPrefix,
  type RetentionCheck,
} from '../lib/proposal-retention.ts';

const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
const token = (process.env.UPSTASH_REDIS_REST_READONLY_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)?.trim();

if (!url || !token) {
  console.error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_READONLY_TOKEN (or UPSTASH_REDIS_REST_TOKEN) are required.');
  process.exit(1);
}

async function redis(...command: Array<string | number>): Promise<unknown> {
  const response = await fetch(url!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const body = (await response.json()) as { result?: unknown; error?: string };
  // Command name only: the arguments carry the key, i.e. the proposal id.
  if (!response.ok || body.error) throw new Error(`Redis ${command[0]} failed (HTTP ${response.status})`);
  return body.result;
}

function epochMs(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function firstOpenMs(value: unknown): number | undefined {
  try {
    const event = typeof value === 'string' ? JSON.parse(value) : value;
    const at = Date.parse(String((event as { at?: unknown } | null)?.at));
    return Number.isNaN(at) ? undefined : at;
  } catch {
    return undefined;
  }
}

// The proposal's own deadline: the tombstone holds its expiry (epoch ms),
// the open log's first event its first open. Read only those, never the record.
async function deadlineOf(key: string, prefix: string): Promise<number | undefined> {
  const id = key.slice(prefix.length + 1);
  if (prefix === 'proposta:abr') return proposalKeyDeadline(prefix, { firstOpenAt: firstOpenMs(await redis('LINDEX', key, 0)) });
  return proposalKeyDeadline(prefix, { expiresAt: epochMs(await redis('GET', `proposta:exp:${id}`)) });
}

const counts = new Map<string, Record<RetentionCheck, number>>();
let violations = 0;
let cursor = '0';
do {
  const [next, keys] = (await redis('SCAN', cursor, 'MATCH', 'proposta:*', 'COUNT', 200)) as [string, string[]];
  for (const key of keys) {
    const ttl = Number(await redis('TTL', key));
    const prefix = proposalKeyPrefix(key);
    const deadline = prefix && ttl >= 0 ? await deadlineOf(key, prefix) : undefined;
    const outcome = checkProposalKeyRetention(key, ttl, { now: Date.now(), deadline });
    // Only a known prefix is printed: any other key name may carry an id.
    const label = prefix ?? 'outras';
    const row = counts.get(label) ?? { ok: 0, gone: 0, no_ttl: 0, over_limit: 0, unknown_key: 0 };
    row[outcome] += 1;
    counts.set(label, row);
    if (outcome === 'no_ttl' || outcome === 'over_limit' || outcome === 'unknown_key') violations += 1;
  }
  cursor = next;
} while (cursor !== '0');

for (const [prefix, row] of [...counts.entries()].sort()) {
  console.log(`${prefix}: ${row.ok} ok, ${row.no_ttl} sem TTL, ${row.over_limit} acima do limite, ${row.unknown_key} desconhecidas`);
}
if (counts.size === 0) console.log('Nenhuma chave proposta:*.');

if (violations > 0) {
  console.error(`${violations} chave(s) fora da retenção de D5. Ver docs/ops/proposta-link.md (Retenção, P12).`);
  process.exit(1);
}
console.log('Retenção conforme D5.');
