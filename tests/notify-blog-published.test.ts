import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { dispatchAnnouncement, main, readFileList } from '../scripts/notify-blog-published.ts';

// Regression coverage for issue #1143: `scripts/notify-blog-published.ts`
// orchestrates the "novo post no blog" social announcement without ever being
// unit tested — only the pure payload shaping in `lib/social-announcement.ts`
// had coverage. These tests stub `fetch` (no network call ever reaches n8n or
// Postiz) and use real temp files on disk (gray-matter needs a real file to
// parse), covering: single/multiple dispatch, malformed frontmatter failing
// predictably, missing configuration skipping safely, and mixed
// success/failure results producing the documented non-zero exit code
// without swallowing the successful announcements.

const VALID_FRONTMATTER = `---
title: "Post de Teste"
excerpt: "Um resumo qualquer."
date: "2026-01-01"
author: "queila-oliveira"
category: "Dicas de Expert"
image: "https://media.anhanga.tur.br/images/blog/teste.jpg"
tags: ["teste"]
---

Conteúdo do post.
`;

// Unterminated flow sequence — gray-matter's YAML parser throws on this rather
// than silently returning a partial object, which is exactly the "malformed
// frontmatter fails predictably" case this suite must prove doesn't crash the
// whole batch.
const MALFORMED_FRONTMATTER = `---
title: "Post quebrado
tags: [teste, outro
---

Conteúdo.
`;

async function withTempMdx(content: string, fn: (filepath: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'notify-blog-published-'));
  const filepath = path.join(dir, 'post-de-teste.mdx');
  try {
    await writeFile(filepath, content, 'utf8');
    await fn(filepath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function stubFetch(impl: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => { globalThis.fetch = original; };
}

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const originalValues = new Map<string, string | undefined>();
  for (const key of Object.keys(vars)) originalValues.set(key, process.env[key]);
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of originalValues) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('readFileList prefers argv over the ADDED_BLOG_FILES env var', () => {
  process.argv = [...process.argv.slice(0, 2), 'content/blog/a.mdx', 'content/blog/b.mdx'];
  process.env.ADDED_BLOG_FILES = 'content/blog/ignored.mdx';
  try {
    assert.deepEqual(readFileList(), ['content/blog/a.mdx', 'content/blog/b.mdx']);
  } finally {
    process.argv = process.argv.slice(0, 2);
    delete process.env.ADDED_BLOG_FILES;
  }
});

test('readFileList parses newline-separated files from env and drops blank lines', () => {
  process.env.ADDED_BLOG_FILES = 'content/blog/a.mdx\n\ncontent/blog/b.mdx\n';
  try {
    assert.deepEqual(readFileList(), ['content/blog/a.mdx', 'content/blog/b.mdx']);
  } finally {
    delete process.env.ADDED_BLOG_FILES;
  }
});

test('readFileList returns an empty array when nothing is provided', () => {
  delete process.env.ADDED_BLOG_FILES;
  assert.deepEqual(readFileList(), []);
});

test('dispatchAnnouncement posts the built payload and returns true on a 2xx response', async () => {
  await withTempMdx(VALID_FRONTMATTER, async (filepath) => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const restore = stubFetch(async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(null, { status: 200 });
    });

    try {
      const ok = await dispatchAnnouncement(filepath, 'https://n8n.example.com/webhook/x', 'shh-secret');
      assert.equal(ok, true);
      assert.equal(capturedUrl, 'https://n8n.example.com/webhook/x');
      assert.equal(capturedInit?.method, 'POST');
      assert.equal((capturedInit?.headers as Record<string, string>)['X-Webhook-Secret'], 'shh-secret');

      const body = JSON.parse(capturedInit?.body as string);
      assert.equal(body.event, 'blog_post_published');
      assert.equal(body.slug, 'post-de-teste');
      assert.equal(body.title, 'Post de Teste');
    } finally {
      restore();
    }
  });
});

test('dispatchAnnouncement returns false (without throwing) when frontmatter is malformed YAML', async () => {
  await withTempMdx(MALFORMED_FRONTMATTER, async (filepath) => {
    let fetchCalled = false;
    const restore = stubFetch(async () => { fetchCalled = true; return new Response(null, { status: 200 }); });

    try {
      const ok = await dispatchAnnouncement(filepath, 'https://n8n.example.com/webhook/x', 'secret');
      assert.equal(ok, false);
      assert.equal(fetchCalled, false, 'a post whose frontmatter fails to parse must never reach the webhook');
    } finally {
      restore();
    }
  });
});

test('dispatchAnnouncement returns false when the webhook responds with a non-2xx status', async () => {
  await withTempMdx(VALID_FRONTMATTER, async (filepath) => {
    const restore = stubFetch(async () => new Response(null, { status: 500 }));
    try {
      const ok = await dispatchAnnouncement(filepath, 'https://n8n.example.com/webhook/x', 'secret');
      assert.equal(ok, false);
    } finally {
      restore();
    }
  });
});

test('main() skips safely (no fetch call) when there are no newly added files', async () => {
  let fetchCalled = false;
  const restore = stubFetch(async () => { fetchCalled = true; return new Response(null, { status: 200 }); });
  const originalExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    await withEnv({ ADDED_BLOG_FILES: '', N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL: 'https://n8n.example.com/x', N8N_WEBHOOK_SECRET: 'secret' }, async () => {
      await main();
    });
    assert.equal(fetchCalled, false);
    assert.equal(process.exitCode, undefined);
  } finally {
    restore();
    process.exitCode = originalExitCode;
  }
});

test('main() skips safely (no fetch call) when the n8n webhook is not configured', async () => {
  await withTempMdx(VALID_FRONTMATTER, async (filepath) => {
    let fetchCalled = false;
    const restore = stubFetch(async () => { fetchCalled = true; return new Response(null, { status: 200 }); });
    const originalExitCode = process.exitCode;
    process.exitCode = undefined;

    try {
      await withEnv(
        { ADDED_BLOG_FILES: filepath, N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL: undefined, N8N_WEBHOOK_SECRET: undefined },
        async () => { await main(); },
      );
      assert.equal(fetchCalled, false, 'missing config must skip dispatch entirely, not fail open');
      assert.equal(process.exitCode, undefined, 'a skip is not a failure');
    } finally {
      restore();
      process.exitCode = originalExitCode;
    }
  });
});

test('main() sets a non-zero exit code on mixed results without hiding the successful announcement', async () => {
  await withTempMdx(VALID_FRONTMATTER, async (okFilepath) => {
    const failDir = path.dirname(okFilepath);
    const failFilepath = path.join(failDir, 'post-que-falha.mdx');
    await writeFile(failFilepath, VALID_FRONTMATTER, 'utf8');

    const requestedSlugs: string[] = [];
    const restore = stubFetch(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      requestedSlugs.push(body.slug);
      // Fail only post-que-falha (identified by payload slug, not arrival order —
      // Promise.all doesn't guarantee dispatch order) to prove one bad response
      // doesn't block or hide the other successful announcement.
      const shouldFail = body.slug === 'post-que-falha';
      return new Response(null, { status: shouldFail ? 500 : 200 });
    });

    const originalExitCode = process.exitCode;
    process.exitCode = undefined;
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: unknown[]) => { logs.push(args.join(' ')); };

    try {
      await withEnv(
        {
          ADDED_BLOG_FILES: `${okFilepath}\n${failFilepath}`,
          N8N_SOCIAL_ANNOUNCE_WEBHOOK_URL: 'https://n8n.example.com/x',
          N8N_WEBHOOK_SECRET: 'secret',
        },
        async () => { await main(); },
      );

      assert.equal(process.exitCode, 1, 'a mixed batch must exit non-zero so CI surfaces the partial failure');
      assert.equal(requestedSlugs.length, 2, 'both files must be dispatched even though one will fail');
      assert.ok(
        logs.some((line) => line.includes('✓') && line.includes('post-de-teste')),
        'the successful announcement must still be logged, not swallowed by the later failure',
      );
    } finally {
      console.log = originalLog;
      restore();
      process.exitCode = originalExitCode;
    }
  });
});
