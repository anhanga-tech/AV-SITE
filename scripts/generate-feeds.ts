import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { renderRssFeed } from '../lib/rss.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const FEED_PATH = path.join(rootDir, 'public', 'feed.xml');
const LLMS_PATH = path.join(rootDir, 'public', 'llms.txt');

// RSS feed
await writeFile(FEED_PATH, renderRssFeed(BLOG_POST_MANIFEST), 'utf8');
console.log(`✓ Generated RSS feed with ${BLOG_POST_MANIFEST.length} posts at public/feed.xml`);

// llms.txt — regenera apenas a seção do blog, preservando o conteúdo editorial.
const blogSection = [
  '## Blog — todos os artigos',
  '',
  'Feed RSS: https://www.anhanga.tur.br/feed.xml',
  'Versão markdown de qualquer página: https://www.anhanga.tur.br/api/markdown?path=/blog/{slug}/',
  '',
  ...BLOG_POST_MANIFEST.map(
    (post) => `- [${post.title}](https://www.anhanga.tur.br/blog/${post.slug}/) (${post.date})`
  ),
].join('\n');

const llms = await readFile(LLMS_PATH, 'utf8');
const sectionPattern = /## Blog — (?:artigos recentes|todos os artigos)[\s\S]*?(?=\n## |$)/;

if (!sectionPattern.test(llms)) {
  throw new Error('llms.txt: seção "## Blog" não encontrada — atualize o padrão em scripts/generate-feeds.ts');
}

await writeFile(LLMS_PATH, llms.replace(sectionPattern, `${blogSection}\n\n`), 'utf8');
console.log(`✓ Updated blog section of public/llms.txt (${BLOG_POST_MANIFEST.length} posts)`);
