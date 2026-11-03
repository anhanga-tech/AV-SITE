import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Faq from '../components/Faq';
import { FAQ_SCHEMA_ITEMS } from '../data/faqData';

// O FAQPage da home (data/faqData.ts) e o FAQ visível (components/Faq.tsx) são duas
// fontes. Scanners (IsAgentReady) e o Google exigem que o schema reproduza o texto
// visível; quando divergem, o FAQPage reprova. Compara palavra a palavra, ignorando
// pontuação, que o schema precisa para ler bem sem a marcação de lista.
const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

const textOf = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');

function renderVisibleFaq(): Array<{ question: string; answer: string }> {
  const html = renderToStaticMarkup(React.createElement(Faq));
  const items = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?px-6 pb-8 pt-4[^>]*>([\s\S]*?)<\/div><\/div><\/div>/g)];
  return items.map((match) => ({ question: textOf(match[1]).trim(), answer: textOf(match[2]) }));
}

test('FAQPage schema lists the same questions as the visible FAQ, in order', () => {
  const visible = renderVisibleFaq();
  assert.ok(visible.length >= 5, `expected the visible FAQ to render, found ${visible.length} items`);
  assert.deepEqual(FAQ_SCHEMA_ITEMS.map((item) => item.question), visible.map((item) => item.question));
});

test('FAQPage schema answers use the same words as the visible answers', () => {
  const visible = renderVisibleFaq();
  for (const [index, item] of FAQ_SCHEMA_ITEMS.entries()) {
    assert.deepEqual(words(item.answer), words(visible[index].answer), `answer drifted: "${item.question}"`);
  }
});
