/**
 * Daily retention audit for the `/proposta/<id>` keys (P12, #1902). Lists
 * every `proposta:*` key and fails if one has no TTL, a TTL past its limit
 * (lib/proposal-retention.ts) or an unknown prefix. Run by
 * .github/workflows/proposal-retention-audit.yml with plain `node`:
 *
 *   node scripts/audit-proposal-retention.ts
 *
 * Needs UPSTASH_REDIS_REST_URL and a token: UPSTASH_REDIS_REST_READONLY_TOKEN
 * (preferred; SCAN and TTL only) or UPSTASH_REDIS_REST_TOKEN.
 * Prints counts only: key names carry the proposal id, a credential.
 */
import { checkProposalKeyRetention, type RetentionCheck } from '../lib/proposal-retention.ts';

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

const counts = new Map<string, Record<RetentionCheck, number>>();
let violations = 0;
let cursor = '0';
do {
  const [next, keys] = (await redis('SCAN', cursor, 'MATCH', 'proposta:*', 'COUNT', 200)) as [string, string[]];
  for (const key of keys) {
    const outcome = checkProposalKeyRetention(key, Number(await redis('TTL', key)));
    const prefix = outcome === 'unknown_key' ? 'outras' : key.split(':', 2).join(':');
    const row = counts.get(prefix) ?? { ok: 0, gone: 0, no_ttl: 0, over_limit: 0, unknown_key: 0 };
    row[outcome] += 1;
    counts.set(prefix, row);
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
