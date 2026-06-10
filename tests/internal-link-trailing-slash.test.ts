import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { getBlogPostUrl, getBlogHomeUrl } from '../utils/blog';

// O Cloudflare Pages responde 308 para URLs de página sem trailing slash.
// Links internos sem a barra final desperdiçam link equity (auditoria Ahrefs jun/2026).

test('getBlogPostUrl returns canonical URL with trailing slash', () => {
  assert.equal(
    getBlogPostUrl('disney-ou-beto-carrero'),
    'https://www.anhanga.tur.br/blog/disney-ou-beto-carrero/'
  );
});

test('getBlogHomeUrl returns canonical URL with trailing slash', () => {
  assert.equal(getBlogHomeUrl(), 'https://www.anhanga.tur.br/blog/');
});

test('MDX content has no internal links without trailing slash', async () => {
  const blogDir = new URL('../content/blog/', import.meta.url);
  const files = (await readdir(blogDir)).filter((f) => f.endsWith('.mdx'));
  assert.ok(files.length > 0, 'expected blog MDX files');

  const offenders: string[] = [];
  // Captura [texto](/caminho) interno sem "/" final, ignorando arquivos com extensão e âncoras/queries.
  const internalLink = /\]\((\/[a-z0-9/-]*[a-z0-9])(?:[)#?])/g;

  for (const file of files) {
    const content = await readFile(new URL(file, blogDir), 'utf8');
    for (const match of content.matchAll(internalLink)) {
      const path = match[1];
      if (!path.includes('.')) {
        offenders.push(`${file}: ${path}`);
      }
    }
  }

  assert.deepEqual(offenders, [], `internal links missing trailing slash:\n${offenders.join('\n')}`);
});
