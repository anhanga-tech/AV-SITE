import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression coverage for issue #1019: the manual update-snapshots workflow checks
// out a caller-selected branch and runs pnpm install + Playwright before a
// write-scoped git push. If snapshot generation and the token-bearing push share
// one job, branch code can persist state (git hooks, background processes) in the
// runner workspace before the token step and abuse the later push. Guards:
//   1. every GitHub Action pinned by full 40-char commit SHA;
//   2. checkout keeps persist-credentials:false;
//   3. least privilege — the job that runs branch code (pnpm install / Playwright)
//      never holds write scope, and the job that holds the GITHUB_TOKEN never
//      installs dependencies. The two capabilities live in separate jobs.
//
// Parsed via plain text (no YAML dependency) to stay deterministic in CI.

const SHA_PIN = /@[0-9a-f]{40}$/;

// Matches any spelling of the write-scoped token so the guard stays correct if the
// workflow is refactored from `GH_TOKEN`/`secrets.GITHUB_TOKEN` to the
// `${{ github.token }}` form. Word boundaries keep `GH_TOKEN` from being conflated
// with unrelated identifiers.
const WRITE_TOKEN = /\bGH_TOKEN\b|\bGITHUB_TOKEN\b|github\.token/;

async function readWorkflow(): Promise<string> {
  return readFile(new URL('../.github/workflows/update-snapshots.yml', import.meta.url), 'utf8');
}

// Split the `jobs:` mapping into per-job text blocks keyed by job id. Job ids are
// the 2-space-indented keys under `jobs:`; a block runs until the next such key.
function splitJobs(workflow: string): Map<string, string> {
  const lines = workflow.split(/\r?\n/);
  const jobsStart = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  assert.ok(jobsStart !== -1, 'workflow must declare a jobs: section');

  const blocks = new Map<string, string>();
  let currentId: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (currentId) blocks.set(currentId, buffer.join('\n'));
    buffer = [];
  };

  for (const line of lines.slice(jobsStart + 1)) {
    // Stop at the next top-level key so unindented content never leaks into the
    // last job's buffer. Comments and blank lines are ignored.
    if (line.trim() !== '' && !line.trim().startsWith('#') && /^\S/.test(line)) break;
    const jobHeader = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (jobHeader) {
      flush();
      currentId = jobHeader[1];
      continue;
    }
    if (currentId) buffer.push(line);
  }
  flush();
  return blocks;
}

test('update-snapshots workflow pins every GitHub Action to a full commit SHA', async () => {
  const workflow = await readWorkflow();

  const usesLines = workflow.split(/\r?\n/).filter((line) => /^\s*(-\s*)?uses:/.test(line));
  assert.ok(usesLines.length >= 3, 'expected at least the checkout/pnpm/node action steps');

  for (const line of usesLines) {
    // Strip inline `# tag` comments before validating so the SHA is anchored to
    // the action ref itself, not to a version tag mentioned in the comment.
    const ref = line.split('#')[0].replace(/^\s*(-\s*)?uses:\s*/, '').trim();
    if (ref.startsWith('./')) continue; // local composite actions have no SHA to pin
    assert.match(ref, SHA_PIN, `action must be pinned by SHA, not a mutable tag: ${ref}`);
  }
});

test('update-snapshots checkout does not persist git credentials', async () => {
  const workflow = await readWorkflow();

  assert.match(
    workflow,
    /persist-credentials:\s*false/,
    'checkout must set persist-credentials:false so the write-scoped token is not left as a git credential',
  );
});

test('update-snapshots confines branch code and write scope to separate jobs', async () => {
  const workflow = await readWorkflow();

  // Workflow-level default grants no scope; each job opts in explicitly.
  assert.match(workflow, /^permissions:\s*\{\}\s*$/m, 'workflow-level permissions must default to no scope');

  // Strip comments up front so prose mentions (e.g. explaining why a scope or
  // install is absent) never cause a false-positive job match or trip the checks.
  const stripComments = (block: string) =>
    block
      .split(/\r?\n/)
      .map((line) => line.split('#')[0])
      .join('\n');

  const jobs = new Map(
    [...splitJobs(workflow).entries()].map(([id, block]) => [id, stripComments(block)]),
  );
  const generateEntry = [...jobs.entries()].find(([, block]) => block.includes('pnpm install'));
  const commitEntry = [...jobs.entries()].find(([, block]) => WRITE_TOKEN.test(block));

  assert.ok(generateEntry, 'expected a job that installs dependencies and runs branch code');
  assert.ok(commitEntry, 'expected a job that pushes with the GITHUB_TOKEN');
  assert.notEqual(
    generateEntry![0],
    commitEntry![0],
    'branch-code generation and token-bearing push must be separate jobs',
  );

  const generateBlock = generateEntry![1];
  const commitBlock = commitEntry![1];

  // The generation job runs untrusted branch code (pnpm lifecycle scripts,
  // Playwright), so it must not hold any write scope that code could abuse.
  assert.doesNotMatch(generateBlock, /contents:\s*write/, 'generation job must not have contents:write');
  assert.doesNotMatch(generateBlock, WRITE_TOKEN, 'generation job must not receive the write-scoped token');

  // The commit job holds the write token, so it must not install dependencies
  // (no third-party lifecycle code runs in the same runner as the token).
  assert.doesNotMatch(commitBlock, /pnpm\s+install/, 'commit job must not run pnpm install');
});
