/**
 * Converte o conteúdo HTML dos 6 posts blogData.ts para Markdown limpo
 * e adiciona <ChatCTA /> no final de cada arquivo.
 *
 * Uso: npx tsx scripts/html-to-mdx.ts
 */

import TurndownService from 'turndown';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'content', 'blog');

// Mapeamento slug → destino do ChatCTA
const DESTINOS: Record<string, string> = {
  '5-segredos-da-disney-que-ninguem-conta': 'Orlando',
  'malas-de-mao-o-guia-definitivo': 'Viagem',
  'europa-gastronomica-roteiro-italia': 'Itália',
  'lua-de-mel-nas-maldivas': 'Maldivas',
  'nova-york-no-natal': 'Nova York',
  'guia-definitivo-sobrevivencia-festivais': 'Festivais',
};

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  strongDelimiter: '**',
  emDelimiter: '*',
});

// Remove divs de CTA que já existem no HTML (serão substituídos pelo <ChatCTA />)
td.addRule('remove-cta-div', {
  filter: (node) =>
    node.nodeName === 'DIV' &&
    (node as HTMLElement).className?.includes('bg-') &&
    (node as HTMLElement).className?.includes('p-6'),
  replacement: () => '',
});

for (const [slug, destino] of Object.entries(DESTINOS)) {
  const filePath = join(BLOG_DIR, `${slug}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.warn(`⚠️  Arquivo não encontrado: ${slug}.mdx — pulando`);
    continue;
  }

  // Separa frontmatter do corpo
  const fmMatch = raw.match(/^(---[\s\S]+?---)\n([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`⚠️  Frontmatter não encontrado em ${slug}.mdx — pulando`);
    continue;
  }

  const [, frontmatter, body] = fmMatch;

  // Verifica se o corpo já é Markdown (não tem tags HTML)
  const hasHtml = /<\s*(p|h[1-6]|ul|li|div|strong|em)\b/i.test(body);
  if (!hasHtml) {
    // Já é markdown, só garante o ChatCTA
    const hasCTA = body.includes('<ChatCTA');
    const finalBody = hasCTA ? body.trimEnd() : `${body.trimEnd()}\n\n<ChatCTA destino="${destino}" />\n`;
    writeFileSync(filePath, `${frontmatter}\n\n${finalBody}\n`, 'utf-8');
    console.log(`✓ ${slug}.mdx (já era Markdown — CTA garantido)`);
    continue;
  }

  // Converte HTML para Markdown
  const markdown = td.turndown(body.trim());

  // Remove linhas em branco excessivas (mais de 2 seguidas)
  const cleanMarkdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  const mdx = `${frontmatter}\n\n${cleanMarkdown}\n\n<ChatCTA destino="${destino}" />\n`;
  writeFileSync(filePath, mdx, 'utf-8');
  console.log(`✓ ${slug}.mdx`);
}

console.log('\nConversão concluída.');
