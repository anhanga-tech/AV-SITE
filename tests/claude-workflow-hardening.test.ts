import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression coverage for issue #1142: `.github/workflows/claude.yml` runs two
// write-capable jobs off untrusted-adjacent triggers (issue/PR comments, PR
// events) — `claude` (interactive automation, contents/pull-requests/issues
// write) and `claude-review` (automatic reviewer, pull-requests write only).
// Guards:
//   1. every GitHub Action pinned by full 40-char commit SHA;
//   2. every supported invocation event requires both a trusted-actor check
//      AND an explicit trigger (an `@claude` mention for the interactive job;
//      a non-draft PR from a trusted author for the auto-review job);
//   3. least privilege — `claude-review` never holds `contents: write`, so a
//      write scope meant for the interactive job can't silently spread to
//      review-only work;
//   4. the review job keeps the settings required for it to actually post
//      (`track_progress`, `use_sticky_comment`, `classify_inline_comments`) —
//      without these, reviews can run "successfully" while posting nothing
//      visible (see issue #1087).
//
// This file is the one place to update when intentionally changing trust,
// trigger, or permission logic in the workflow — if a change here fails,
// either the workflow regressed or the test needs a matching, deliberate update.
//
// Parsed via plain text (no YAML dependency) to stay deterministic in CI.

const SHA_PIN = /@[0-9a-f]{40}$/;
const TRUST_CHECK = /contains\(fromJson\(\s*'\["OWNER","MEMBER","COLLABORATOR"\]'\s*\),/;

async function readWorkflow(): Promise<string> {
  return readFile(new URL('../.github/workflows/claude.yml', import.meta.url), 'utf8');
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

// Extracts the text of the top-level `if:` block for a job (a YAML block scalar
// starting with `if: |`, indented deeper than the key itself).
function extractIfBlock(jobBlock: string): string {
  const lines = jobBlock.split(/\r?\n/);
  const ifStart = lines.findIndex((line) => /^\s*if:\s*\|\s*$/.test(line));
  assert.ok(ifStart !== -1, 'job must declare a block-scalar if: condition');
  const ifIndent = lines[ifStart].match(/^(\s*)/)![1].length;

  const body: string[] = [];
  for (const line of lines.slice(ifStart + 1)) {
    if (line.trim() === '') { body.push(line); continue; }
    const indent = line.match(/^(\s*)/)![1].length;
    if (indent <= ifIndent) break;
    body.push(line);
  }
  return body.join('\n');
}

test('claude workflow pins every GitHub Action to a full commit SHA', async () => {
  const workflow = await readWorkflow();

  const usesLines = workflow.split(/\r?\n/).filter((line) => /^\s*(-\s*)?uses:/.test(line));
  assert.ok(usesLines.length >= 4, 'expected at least the checkout + claude-code-action steps for both jobs');

  for (const line of usesLines) {
    const ref = line.split('#')[0].replace(/^\s*(-\s*)?uses:\s*/, '').trim();
    if (ref.startsWith('./')) continue; // local composite actions have no SHA to pin
    assert.match(ref, SHA_PIN, `action must be pinned by SHA, not a mutable tag: ${ref}`);
  }
});

test('claude job requires a trusted actor AND an explicit @claude mention for every supported event', async () => {
  const workflow = await readWorkflow();
  const jobs = splitJobs(workflow);
  const ifBlock = extractIfBlock(jobs.get('claude')!);

  // Every event this job reacts to must pair a trust check with an @claude mention
  // check for that same event — otherwise an untrusted comment/issue could invoke
  // write-capable automation just by mentioning @claude, or a trusted user's
  // unrelated activity could invoke it without ever asking.
  const supportedEvents: Array<{ event: string; trustSource: RegExp }> = [
    { event: 'issue_comment', trustSource: /github\.event\.comment\.author_association/ },
    { event: 'pull_request_review_comment', trustSource: /github\.event\.comment\.author_association/ },
    { event: 'pull_request_review', trustSource: /github\.event\.review\.author_association/ },
    { event: 'issues', trustSource: /github\.event\.issue\.author_association/ },
  ];

  for (const { event, trustSource } of supportedEvents) {
    assert.match(ifBlock, new RegExp(`github\\.event_name == '${event}'`), `if-block must gate on event: ${event}`);
    assert.match(ifBlock, trustSource, `if-block must check author_association for event: ${event}`);
  }

  assert.match(ifBlock, TRUST_CHECK, 'if-block must restrict to OWNER/MEMBER/COLLABORATOR');
  assert.match(ifBlock, /github\.repository_owner/, 'if-block must also allow the repository owner directly');

  // Explicit trigger: at least one @claude mention check per supported comment/issue event.
  const mentionMatches = ifBlock.match(/contains\(github\.event\.(comment|review|issue)\.(body|title), '@claude'\)/g) ?? [];
  assert.ok(mentionMatches.length >= 4, `expected an @claude mention check per event, got: ${mentionMatches.length}`);

  // `pull_request` (opened/synchronize/ready_for_review) must never satisfy this
  // job's trigger — it belongs solely to claude-review's auto-trigger.
  assert.doesNotMatch(ifBlock, /github\.event_name == 'pull_request'\s*&&/, 'claude job must not auto-trigger on raw pull_request events');
});

test('claude-review job restricts to a trusted, non-draft pull_request without requiring a mention', async () => {
  const workflow = await readWorkflow();
  const jobs = splitJobs(workflow);
  const ifBlock = extractIfBlock(jobs.get('claude-review')!);

  assert.match(ifBlock, /github\.event_name == 'pull_request'/, 'auto-review must be scoped to pull_request events');
  assert.match(ifBlock, /github\.event\.pull_request\.draft == false/, 'auto-review must skip draft PRs to avoid spending credits on WIP');
  assert.match(ifBlock, /github\.event\.pull_request\.user\.login == github\.repository_owner/, 'auto-review must allow the repository owner');
  assert.match(ifBlock, /github\.event\.pull_request\.author_association/, 'auto-review must check the PR author\'s association');
  assert.match(ifBlock, TRUST_CHECK, 'auto-review must restrict to OWNER/MEMBER/COLLABORATOR');
});

test('claude-review never holds contents: write, so its scope cannot silently spread beyond posting reviews', async () => {
  const workflow = await readWorkflow();
  const jobs = splitJobs(workflow);
  const reviewBlock = jobs.get('claude-review')!;
  const claudeBlock = jobs.get('claude')!;

  const permissionsBlock = (jobBlock: string) => {
    const lines = jobBlock.split(/\r?\n/);
    const start = lines.findIndex((line) => /^\s*permissions:\s*$/.test(line));
    assert.ok(start !== -1, 'job must declare its own permissions: block (no inherited default)');
    const indent = lines[start].match(/^(\s*)/)![1].length;
    const body: string[] = [];
    for (const line of lines.slice(start + 1)) {
      if (line.trim() === '') continue;
      const lineIndent = line.match(/^(\s*)/)![1].length;
      if (lineIndent <= indent) break;
      body.push(line.trim());
    }
    return body;
  };

  const reviewPermissions = permissionsBlock(reviewBlock);
  assert.ok(reviewPermissions.includes('contents: read'), 'claude-review must have read-only contents access');
  assert.ok(!reviewPermissions.some((line) => line.startsWith('contents: write')), 'claude-review must never hold contents: write');
  assert.ok(reviewPermissions.includes('pull-requests: write'), 'claude-review needs pull-requests: write to post its review');

  // Sanity check the interactive job still legitimately needs the broader scope —
  // this test exists to stop that scope from spreading, not to remove it.
  const claudePermissions = permissionsBlock(claudeBlock);
  assert.ok(claudePermissions.includes('contents: write'), 'claude (interactive) job is expected to hold contents: write');
});

test('claude-review keeps the settings required to actually publish its findings', async () => {
  const workflow = await readWorkflow();
  const jobs = splitJobs(workflow);
  const reviewBlock = jobs.get('claude-review')!;

  // Without track_progress the action can run in "agent" mode and post nothing
  // visible on the PR at all (regression: issue #1087).
  assert.match(reviewBlock, /track_progress:\s*true/, 'claude-review must keep track_progress: true (tag mode with comment tracking)');
  assert.match(reviewBlock, /use_sticky_comment:\s*true/, 'claude-review must post one consolidated comment per push, not one per commit');
  assert.match(reviewBlock, /classify_inline_comments:\s*true/, 'claude-review must filter test/probe comments before posting inline');
});
