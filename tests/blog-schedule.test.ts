import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

import { isFuturePost, shouldHideFuturePosts, todayInSaoPaulo } from '../lib/blog-schedule.js';
import { collectBlogPostMeta, writeBlogMarkdown } from '../lib/blog-manifest.ts';
import { buildPrerenderRoutes } from '../lib/prerender-routes.js';

function makePost(slug: string, date: string): string {
  return `---
title: "Post ${slug}"
excerpt: "Excerpt de ${slug}"
date: "${date}"
author: "felipe-william"
category: "Destinos"
image: "images/blog/${slug}.jpg"
---

Conteúdo de ${slug}.
`;
}

async function makeBlogDir(dates: { passado: string; hoje: string; futuro: string }): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'blog-schedule-'));
  await writeFile(path.join(dir, 'post-passado.mdx'), makePost('post-passado', dates.passado));
  await writeFile(path.join(dir, 'post-hoje.mdx'), makePost('post-hoje', dates.hoje));
  await writeFile(path.join(dir, 'post-futuro.mdx'), makePost('post-futuro', dates.futuro));
  return dir;
}

const FIXED_DATES = { passado: '2026-07-01', hoje: '2026-07-14', futuro: '2026-07-21' };
const FIXED_TODAY = '2026-07-14';

test('todayInSaoPaulo converte UTC para o dia civil de São Paulo (UTC-3)', () => {
  assert.equal(todayInSaoPaulo(new Date('2026-07-14T02:59:00Z')), '2026-07-13');
  assert.equal(todayInSaoPaulo(new Date('2026-07-14T03:00:00Z')), '2026-07-14');
  assert.equal(todayInSaoPaulo(new Date('2026-07-14T12:00:00Z')), '2026-07-14');
});

test('isFuturePost compara datas ISO em relação a hoje', () => {
  assert.equal(isFuturePost('2026-07-21', '2026-07-14'), true);
  assert.equal(isFuturePost('2026-07-14', '2026-07-14'), false);
  assert.equal(isFuturePost('2026-07-01', '2026-07-14'), false);
  assert.equal(isFuturePost(undefined, '2026-07-14'), false);
  assert.equal(isFuturePost('', '2026-07-14'), false);
});

test('shouldHideFuturePosts liga só em produção do Pages ou por override', () => {
  assert.equal(shouldHideFuturePosts({}), false);
  assert.equal(shouldHideFuturePosts({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }), true);
  assert.equal(shouldHideFuturePosts({ CF_PAGES: '1', CF_PAGES_BRANCH: 'feature/preview' }), false);
  assert.equal(shouldHideFuturePosts({ BLOG_HIDE_FUTURE_POSTS: 'true' }), true);
  assert.equal(
    shouldHideFuturePosts({ BLOG_HIDE_FUTURE_POSTS: 'false', CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }),
    false
  );
});

test('collectBlogPostMeta oculta posts futuros quando hideFuture está ativo', async () => {
  const dir = await makeBlogDir(FIXED_DATES);
  try {
    const hidden = await collectBlogPostMeta(dir, { hideFuture: true, today: FIXED_TODAY });
    assert.deepEqual(
      hidden.map((post) => post.slug).sort(),
      ['post-hoje', 'post-passado']
    );

    const all = await collectBlogPostMeta(dir, { hideFuture: false, today: FIXED_TODAY });
    assert.equal(all.length, 3);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('writeBlogMarkdown aplica o mesmo filtro de agendamento do manifest', async () => {
  const dir = await makeBlogDir(FIXED_DATES);
  const outputFile = path.join(dir, 'out', 'blogMarkdown.ts');
  try {
    const count = await writeBlogMarkdown(dir, outputFile, { hideFuture: true, today: FIXED_TODAY });
    assert.equal(count, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('buildPrerenderRoutes não prerenderiza rota de post futuro em produção', async () => {
  const dir = await makeBlogDir(FIXED_DATES);
  try {
    const routes = await buildPrerenderRoutes(dir, { hideFuture: true, today: FIXED_TODAY });
    assert.ok(routes.includes('/blog/post-passado'));
    assert.ok(routes.includes('/blog/post-hoje'));
    assert.ok(!routes.includes('/blog/post-futuro'));

    const allRoutes = await buildPrerenderRoutes(dir, { hideFuture: false, today: FIXED_TODAY });
    assert.ok(allRoutes.includes('/blog/post-futuro'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
