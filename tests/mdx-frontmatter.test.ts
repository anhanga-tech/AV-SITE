import test from 'node:test';
import assert from 'node:assert/strict';
import { stripYamlFrontmatter } from '../lib/mdx-frontmatter.ts';

test('stripYamlFrontmatter removes only the leading YAML block from MDX content', () => {
  const input = `---
title: "Post de Teste"
excerpt: "Resumo"
date: "2026-04-01"
---

# Olá mundo

Texto normal.

---

Separador do conteúdo.
`;

  const output = stripYamlFrontmatter(input);

  assert.equal(output.includes('title: "Post de Teste"'), false);
  assert.equal(output.startsWith('# Olá mundo'), true);
  assert.equal(output.includes('\n---\n\nSeparador do conteúdo.'), true);
});
