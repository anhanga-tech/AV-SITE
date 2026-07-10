/**
 * Generates a signed NPS invitation link (issue #1137). Run manually/from an
 * ops workflow once a trip is completed:
 *
 *   pnpm tsx scripts/generate-nps-invite.ts --email cliente@example.com --firstname "Ana"
 *
 * Prints the token and the ready-to-send `/nps` URL. See docs/ops/nps-invite.md.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createNpsInviteToken } from '../lib/nps-invite';

for (const file of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path);
  }
}

const SITE_URL = process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br';

function parseArgs(argv: string[]): { email?: string; firstname?: string; days?: string } {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) {
        out[key] = value;
        i += 1;
      }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const { email, firstname, days } = parseArgs(process.argv.slice(2));
  const secret = process.env.NPS_INVITE_SECRET;

  if (!secret) {
    console.error('NPS_INVITE_SECRET is not set. Configure it in .env or .env.local before running this script.');
    process.exit(1);
  }
  if (!email || !firstname) {
    console.error('Usage: pnpm tsx scripts/generate-nps-invite.ts --email <email> --firstname <name> [--days <n>]');
    process.exit(1);
  }

  const expiresInMs = days ? Number(days) * 24 * 60 * 60 * 1000 : undefined;
  const token = await createNpsInviteToken({ email, firstname, expiresInMs }, secret);
  const url = new URL('/nps', SITE_URL);
  url.searchParams.set('token', token);
  url.searchParams.set('firstname', firstname);

  console.log(`Token: ${token}`);
  console.log(`Link:  ${url.toString()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
