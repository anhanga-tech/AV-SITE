/**
 * One-off cleanup for the open-log minimization of 23/10/2026: reduces every
 * stored open in `proposta:abr:*` to `{ at }` (dropping country, city, device
 * and ipHash) and deletes the `proposta:sal:*` daily salts. `LSET` keeps each
 * list's TTL, so the 90-day clock is unchanged.
 *
 * Run once, after the deploy that stopped collecting those fields:
 *
 *   pnpm tsx scripts/minimize-proposal-opens.ts           # dry run: counts only
 *   pnpm tsx scripts/minimize-proposal-opens.ts --apply   # rewrites and deletes
 *
 * Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (env or .env).
 * Prints counts only: key names carry the proposal id, a credential.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path);
  }
}

const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const apply = process.argv.includes('--apply');

if (!url || !token) {
  console.error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.');
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

async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, batch] = (await redis('SCAN', cursor, 'MATCH', pattern, 'COUNT', 200)) as [string, string[]];
    keys.push(...batch);
    cursor = next;
  } while (cursor !== '0');
  return keys;
}

function minimized(raw: string): string | null {
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!event || typeof event !== 'object') return null;
  const { at } = event as { at?: unknown };
  if (typeof at !== 'string') return null;
  const next = JSON.stringify({ at });
  return next === raw ? null : next;
}

const openKeys = await scanKeys('proposta:abr:*');
let events = 0;
let rewritten = 0;
let unreadable = 0;
for (const key of openKeys) {
  const items = (await redis('LRANGE', key, 0, -1)) as string[];
  events += items.length;
  for (const [index, raw] of items.entries()) {
    const next = minimized(raw);
    if (next === null) {
      if (!/^\{"at":"[^"]*"\}$/.test(raw)) unreadable += 1;
      continue;
    }
    rewritten += 1;
    if (apply) await redis('LSET', key, index, next);
  }
}

const saltKeys = await scanKeys('proposta:sal:*');
if (apply && saltKeys.length > 0) await redis('DEL', ...saltKeys);

const verb = apply ? 'done' : 'dry run';
console.log(`${verb}: ${openKeys.length} open lists, ${events} opens, ${rewritten} reduced to {at}, ${unreadable} unreadable; ${saltKeys.length} salts ${apply ? 'deleted' : 'to delete'}`);
