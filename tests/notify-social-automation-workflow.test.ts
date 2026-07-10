import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Regression coverage for issue #1143: the "Find newly added blog posts" step
// in `.github/workflows/notify-social-automation.yml` is inline bash with no
// prior test coverage — it decides whether the rest of the job (install,
// notify) runs at all. Rather than duplicate the script by hand (which could
// silently drift from the real workflow), these tests extract the actual
// `run:` block text from the YAML and execute it against a real temporary git
// repo, covering: one/multiple added posts, edits-only pushes, non-.mdx
// additions, and the initial-push (empty-tree parent) case. A second test is
// a lightweight text contract on step gating and env passing.

const WORKFLOW_PATH = path.resolve(process.cwd(), '.github/workflows/notify-social-automation.yml');
const STEP_NAME = 'Find newly added blog posts';
const EMPTY_TREE_PARENT = '0000000000000000000000000000000000000000';

async function readWorkflow(): Promise<string> {
  return readFile(WORKFLOW_PATH, 'utf8');
}

// Extracts the `run: |` block body belonging to the named step, dedenting it
// to the shell's own indentation so it can be written out and executed as-is.
function extractStepRunBlock(workflow: string, stepName: string): string {
  const lines = workflow.split(/\r?\n/);
  const nameIdx = lines.findIndex((line) => line.includes(`name: ${stepName}`));
  assert.ok(nameIdx !== -1, `expected to find a step named "${stepName}"`);

  const runIdx = lines.findIndex((line, i) => i > nameIdx && /^\s*run:\s*\|\s*$/.test(line));
  assert.ok(runIdx !== -1, `expected a run: | block after step "${stepName}"`);
  const runIndent = lines[runIdx].match(/^(\s*)/)![1].length;

  const body: string[] = [];
  for (const line of lines.slice(runIdx + 1)) {
    if (line.trim() === '') { body.push(''); continue; }
    const indent = line.match(/^(\s*)/)![1].length;
    if (indent <= runIndent) break;
    body.push(line.slice(runIndent + 2));
  }
  return body.join('\n');
}

async function writePost(repoDir: string, relativePath: string, content = '---\ntitle: x\n---\n'): Promise<void> {
  const fullPath = path.join(repoDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
}

async function commit(repoDir: string, message: string): Promise<string> {
  execFileSync('git', ['add', '-A'], { cwd: repoDir });
  execFileSync('git', ['commit', '-q', '-m', message], { cwd: repoDir });
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
}

// Runs the real "Find newly added blog posts" step body against a scratch git
// repo built by `setupRepo` (which must return the before/after SHAs to diff),
// and returns the list of files it reported via $GITHUB_OUTPUT.
async function runStepInTempRepo(
  setupRepo: (repoDir: string) => Promise<{ before: string; after: string }>,
): Promise<string[]> {
  const script = extractStepRunBlock(await readWorkflow(), STEP_NAME);
  const repoDir = await mkdtemp(path.join(tmpdir(), 'notify-social-automation-'));

  try {
    execFileSync('git', ['init', '-q'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.email', 'ci@example.com'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.name', 'CI'], { cwd: repoDir });

    const { before, after } = await setupRepo(repoDir);

    const githubOutputPath = path.join(repoDir, 'github_output');
    await writeFile(githubOutputPath, '', 'utf8');

    execFileSync('bash', ['-c', script], {
      cwd: repoDir,
      env: { ...process.env, BEFORE_SHA: before, AFTER_SHA: after, GITHUB_OUTPUT: githubOutputPath },
    });

    const output = await readFile(githubOutputPath, 'utf8');
    const match = output.match(/^files<<EOF\n([\s\S]*?)\nEOF$/m);
    return (match ? match[1] : '').split('\n').map((line) => line.trim()).filter(Boolean);
  } finally {
    await rm(repoDir, { recursive: true, force: true });
  }
}

test('initial push (empty-tree parent): detects the post added in the very first commit', async () => {
  const files = await runStepInTempRepo(async (repoDir) => {
    await writePost(repoDir, 'content/blog/first-post.mdx');
    const after = await commit(repoDir, 'first post');
    return { before: EMPTY_TREE_PARENT, after };
  });

  assert.deepEqual(files, ['content/blog/first-post.mdx']);
});

test('detects multiple newly added posts in the same push, ignores non-.mdx additions', async () => {
  const files = await runStepInTempRepo(async (repoDir) => {
    await writePost(repoDir, 'content/blog/base-post.mdx');
    const before = await commit(repoDir, 'base');

    await writePost(repoDir, 'content/blog/post-a.mdx');
    await writePost(repoDir, 'content/blog/post-b.mdx');
    await writePost(repoDir, 'content/blog/cover.png', 'not-actually-a-post');
    const after = await commit(repoDir, 'two new posts + an image');

    return { before, after };
  });

  assert.deepEqual(files.sort(), ['content/blog/post-a.mdx', 'content/blog/post-b.mdx']);
});

test('an edits-only push (no new files) reports no added posts', async () => {
  const files = await runStepInTempRepo(async (repoDir) => {
    await writePost(repoDir, 'content/blog/existing-post.mdx', '---\ntitle: v1\n---\n');
    const before = await commit(repoDir, 'base');

    await writePost(repoDir, 'content/blog/existing-post.mdx', '---\ntitle: v2 (fixed typo)\n---\n');
    const after = await commit(repoDir, 'edit only');

    return { before, after };
  });

  assert.deepEqual(files, []);
});

test('a mixed push (one new post + one edited post) only reports the new one', async () => {
  const files = await runStepInTempRepo(async (repoDir) => {
    await writePost(repoDir, 'content/blog/existing-post.mdx', '---\ntitle: v1\n---\n');
    const before = await commit(repoDir, 'base');

    await writePost(repoDir, 'content/blog/existing-post.mdx', '---\ntitle: v2\n---\n');
    await writePost(repoDir, 'content/blog/new-post.mdx');
    const after = await commit(repoDir, 'edit + new post');

    return { before, after };
  });

  assert.deepEqual(files, ['content/blog/new-post.mdx']);
});

test('workflow gates install/notify steps on the added-posts output and passes secrets via env, not the shell line', async () => {
  const workflow = await readWorkflow();
  const lines = workflow.split(/\r?\n/);

  const gatedSteps = ['Install pnpm', 'Use Node.js 24', 'Install dependencies', 'Notify n8n of new blog posts'];
  for (const stepName of gatedSteps) {
    const nameIdx = lines.findIndex((line) => line.includes(`name: ${stepName}`));
    assert.ok(nameIdx !== -1, `expected a step named "${stepName}"`);
    // The `if:` guard is expected on the line immediately following `name:`.
    const ifLine = lines[nameIdx + 1] ?? '';
    assert.match(
      ifLine,
      /if:\s*steps\.added-posts\.outputs\.files\s*!=\s*''/,
      `step "${stepName}" must be gated on steps.added-posts.outputs.files != ''`,
    );
  }

  const notifyIdx = lines.findIndex((line) => line.includes('name: Notify n8n of new blog posts'));
  assert.ok(notifyIdx !== -1);
  const notifyBlock = lines.slice(notifyIdx, notifyIdx + 15).join('\n');

  for (const envVar of ['ADDED_BLOG_FILES', 'N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL', 'N8N_WEBHOOK_SECRET']) {
    assert.match(notifyBlock, new RegExp(`^\\s*${envVar}:\\s*\\$\\{\\{`, 'm'), `${envVar} must be passed via the step's env: block`);
  }
  assert.doesNotMatch(
    notifyBlock,
    /run:\s*.*(N8N_WEBHOOK_SECRET|N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL)/,
    'secrets must flow through env:, never be inlined into the run: line',
  );
});
