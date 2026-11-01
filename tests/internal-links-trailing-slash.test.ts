import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { linksPageConfig } from '../data/linksPage.ts';

/*
  Auditoria 01/11/2026 (#1969): links internos sem barra final geravam 308 no
  crawl (home → landings), e 18 posts do blog apontavam para páginas do próprio
  site com `?utm_medium=internal_link` — URL canônica com query string.
  UTM é para tráfego de fora; atribuição interna vai por evento/`data-tracking`.
*/

const root = process.cwd();
const blogDir = path.join(root, 'content/blog');

test('posts do blog não usam UTM em links internos', () => {
  for (const file of fs.readdirSync(blogDir).filter((name) => name.endsWith('.mdx'))) {
    const source = fs.readFileSync(path.join(blogDir, file), 'utf8');
    assert.doesNotMatch(source, /(\]\(|href=")(\/|https:\/\/www\.anhanga\.tur\.br)[^)"\s]*[?&]utm_/, file);
  }
});

test('cards de destinos da home apontam para a URL canônica com barra', () => {
  const source = fs.readFileSync(path.join(root, 'components/Categories.tsx'), 'utf8');
  const links = [...source.matchAll(/link:\s*"([^"]+)"/g)].map((match) => match[1]);

  assert.ok(links.length > 0);
  for (const link of links) assert.match(link, /\/$/, link);
});

test('links internos da página /links terminam em barra', () => {
  const internal = linksPageConfig.links.filter((link) => link.type === 'internal' && link.href);

  assert.ok(internal.length > 0);
  for (const link of internal) assert.match(link.href as string, /\/$/, link.id);
});
