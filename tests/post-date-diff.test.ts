import test from 'node:test';
import assert from 'node:assert/strict';

import { blogSourcesOutsideStage, bodyAfterFrontmatter, shouldBumpDateModified } from '../scripts/post-date-diff.mjs';

/*
  #1969 — o pre-commit atualizava `dateModified` de qualquer MDX staged, inclusive
  quando só o frontmatter mudava (crédito de imagem, tags). Isso inflou o `lastmod`
  do sitemap: 44 de 63 posts com a mesma data.
*/

const post = (frontmatter: string, body: string) => `---\n${frontmatter}\n---\n\n${body}\n`;

test('mudança só de frontmatter não bumpa dateModified', () => {
  const before = post('title: "Orlando"\ndate: "2026-01-10"', 'Corpo do post.');
  const after = post('title: "Orlando"\ndate: "2026-01-10"\nimageCredit: "Foto: X"', 'Corpo do post.');

  assert.equal(shouldBumpDateModified(before, after), false);
});

test('mudança no corpo bumpa dateModified', () => {
  const before = post('title: "Orlando"', 'Corpo do post.');
  const after = post('title: "Orlando"', 'Corpo do post revisado.');

  assert.equal(shouldBumpDateModified(before, after), true);
});

test('arquivo novo (sem versão no HEAD) segue o fluxo normal', () => {
  assert.equal(shouldBumpDateModified(null, post('title: "Novo"', 'Corpo.')), true);
});

test('troca de CRLF por LF sozinha não conta como mudança de corpo', () => {
  const lf = post('title: "Orlando"', 'Linha 1\nLinha 2');
  const crlf = lf.replace(/\n/g, '\r\n');

  assert.equal(shouldBumpDateModified(crlf, lf), false);
  assert.equal(bodyAfterFrontmatter(crlf), 'Linha 1\nLinha 2');
});

test('dashes de tabela no corpo não são confundidos com o fim do frontmatter', () => {
  const source = post('title: "T"', '| a | b |\n|---|---|\n| 1 | 2 |\n\n---\n\nRodapé');

  assert.equal(bodyAfterFrontmatter(source), '| a | b |\n|---|---|\n| 1 | 2 |\n\n---\n\nRodapé');
});

test('qualquer post fora do stage (parcial, outro post ou não rastreado) trava o hook', () => {
  // O gerador lê todos os MDX do diretório, então não basta olhar os staged.
  const unstaged = ['content/blog/b.mdx', 'components/Hero.tsx', 'content/blog/_template.mdx'];
  const untracked = ['content/blog/rascunho.mdx', 'content/blog/README.md'];

  assert.deepEqual(blogSourcesOutsideStage(unstaged, untracked), ['content/blog/b.mdx', 'content/blog/rascunho.mdx']);
  assert.deepEqual(blogSourcesOutsideStage(['components/Hero.tsx'], []), []);
});
