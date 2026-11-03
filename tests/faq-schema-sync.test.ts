import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Faq from '../components/Faq';
import { FAQ_SCHEMA_ITEMS } from '../data/faqData';

// O FAQPage da home (data/faqData.ts) e o FAQ visível (components/Faq.tsx) são duas
// fontes. Scanners (IsAgentReady) e o Google exigem que o schema reproduza o texto
// visível; quando divergem, o FAQPage reprova. Uma comparação só por palavras, sem
// caixa e pontuação, passava aqui e reprovava no IsAgentReady: a comparação é exata,
// só normalizando espaços (itens de lista e cartões viram um espaço).
const normalize = (text: string) => text.replace(/\s+/g, ' ').replace(/ ([.,!?:;])/g, '$1').trim();

const textOf = (html: string) =>
  normalize(html.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&'));

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

test('FAQPage schema answers reproduce the visible answers exactly', () => {
  const visible = renderVisibleFaq();
  for (const [index, item] of FAQ_SCHEMA_ITEMS.entries()) {
    assert.equal(normalize(item.answer), visible[index].answer, `answer drifted: "${item.question}"`);
  }
});

test('the FAQ comparison is case and punctuation sensitive', () => {
  assert.notEqual(normalize('Passagens aéreas'), normalize('passagens aéreas'));
  assert.notEqual(normalize('R$ 50.000+'), normalize('R$ 50.000'));
  assert.equal(normalize('Hopi Hari .  Isso'), 'Hopi Hari. Isso');
});
