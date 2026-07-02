import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression coverage for issue #1018: the scheduled/manual refresh-reviews
// workflow runs with contents/pull-requests write scopes and exposes Outscraper,
// Cloudflare, and GitHub tokens to job steps. A compromised mutable action ref or
// dependency lifecycle script executed earlier could tamper with the workspace and
// exfiltrate those secrets or abuse the write-scoped token. Guards:
//   1. every GitHub Action pinned by full 40-char commit SHA;
//   2. checkout keeps persist-credentials:false;
//   3. least privilege — the secret-bearing fetch job (which runs pnpm install and
//      third-party API secrets) never holds write scope, and the PR job (which holds
//      the write token) never installs dependencies nor sees the third-party secrets.
//      The two capabilities live in separate jobs.
//
// Parsed via plain text (no YAML dependency) to stay deterministic in CI.

const SHA_PIN = /@[0-9a-f]{40}$/;

async function readWorkflow(): Promise<string> {
  return readFile(new URL('../.github/workflows/refresh-reviews.yml', import.meta.url), 'utf8');
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
    // Stop at the next top-level key (e.g. a `concurrency:` block after `jobs:`)
    // so unindented content never leaks into the last job's buffer. Comments and
    // blank lines are ignored.
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

test('refresh-reviews workflow pins every GitHub Action to a full commit SHA', async () => {
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

test('refresh-reviews checkout does not persist git credentials', async () => {
  const workflow = await readWorkflow();

  assert.match(
    workflow,
    /persist-credentials:\s*false/,
    'checkout must set persist-credentials:false so the write-scoped token is not left as a git credential',
  );
});

test('refresh-reviews confines secrets and write scope to separate jobs', async () => {
  const workflow = await readWorkflow();

  // Workflow-level default grants no scope; each job opts in explicitly.
  assert.match(workflow, /^permissions:\s*\{\}\s*$/m, 'workflow-level permissions must default to no scope');

  // Strip comments up front so prose mentions (e.g. explaining why a scope or
  // secret is absent) never cause a false-positive job match or trip the
  // scope/install checks below.
  const stripComments = (block: string) =>
    block
      .split(/\r?\n/)
      .map((line) => line.split('#')[0])
      .join('\n');

  const jobs = new Map(
    [...splitJobs(workflow).entries()].map(([id, block]) => [id, stripComments(block)]),
  );
  const fetchEntry = [...jobs.entries()].find(([, block]) => block.includes('OUTSCRAPER_API_KEY'));
  const prEntry = [...jobs.entries()].find(([, block]) => block.includes('GH_TOKEN'));

  assert.ok(fetchEntry, 'expected a job that reads the third-party API secrets');
  assert.ok(prEntry, 'expected a job that opens the PR with the GITHUB_TOKEN');
  assert.notEqual(fetchEntry![0], prEntry![0], 'secret-bearing fetch and PR-opening work must be separate jobs');

  const fetchBlock = fetchEntry![1];
  const prBlock = prEntry![1];

  // The fetch job runs untrusted dependency lifecycle scripts, so it must not hold
  // any write scope that a compromised install could abuse.
  assert.doesNotMatch(fetchBlock, /pull-requests:\s*write/, 'fetch job must not have pull-requests:write');
  assert.doesNotMatch(fetchBlock, /contents:\s*write/, 'fetch job must not have contents:write');

  // The PR job holds the write token, so it must not install dependencies (no
  // third-party lifecycle code) nor receive the third-party API secrets.
  assert.doesNotMatch(prBlock, /pnpm\s+install/, 'PR job must not run pnpm install');
  assert.doesNotMatch(prBlock, /OUTSCRAPER_API_KEY/, 'PR job must not receive third-party API secrets');
});
