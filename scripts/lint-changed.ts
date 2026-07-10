/**
 * Progressive lint ratchet (issue #1144): lints only files changed relative
 * to a base ref, instead of the whole repo. The existing codebase predates
 * eslint.config.js and is not expected to pass it — scoping to changed files
 * means new/touched code meets the bar without unrelated PRs being blocked
 * by pre-existing debt. See docs/standards/linting.md for the adoption path.
 *
 * Base ref resolution (first match wins):
 *   1. LINT_BASE_REF env var, if set (CI sets this explicitly — see
 *      .github/workflows/ci.yml)
 *   2. `origin/main` if it resolves locally
 *   3. `HEAD~1` as a last-resort local fallback
 */
import { execFileSync } from 'node:child_process';

const LINTABLE_EXTENSIONS = /\.(ts|tsx)$/;

function refExists(ref: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--verify', ref], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resolveBaseRef(): string {
  const fromEnv = process.env.LINT_BASE_REF?.trim();
  if (fromEnv && refExists(fromEnv)) return fromEnv;
  if (refExists('origin/main')) return 'origin/main';
  return 'HEAD~1';
}

function getChangedFiles(baseRef: string): string[] {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...HEAD`],
    { encoding: 'utf8' },
  );

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => LINTABLE_EXTENSIONS.test(file));
}

function main(): void {
  const baseRef = resolveBaseRef();
  const files = getChangedFiles(baseRef);

  if (files.length === 0) {
    console.log(`No changed .ts/.tsx files vs ${baseRef} — nothing to lint.`);
    return;
  }

  console.log(`Linting ${files.length} changed file(s) vs ${baseRef}:`);
  for (const file of files) console.log(`  ${file}`);

  // No --max-warnings: warnings are surfaced but never fail the ratchet —
  // only errors (rules-of-hooks, floating promises, etc.) block CI.
  execFileSync('pnpm', ['exec', 'eslint', ...files], { stdio: 'inherit' });
}

main();
