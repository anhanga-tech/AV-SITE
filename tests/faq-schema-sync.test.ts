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

// Padrão de accordion do WAI-ARIA: o heading envolve o botão e a resposta vem logo depois do
// heading. Com o <h3> dentro do <button>, scanners não ligavam a pergunta à resposta e o
// FAQPage reprovava mesmo com o texto idêntico.
test('each visible FAQ question is a heading wrapping its toggle, followed by the answer panel', () => {
  const html = renderToStaticMarkup(React.createElement(Faq));
  assert.doesNotMatch(html, /<button\b(?:(?!<\/button>)[\s\S])*<h[1-6]\b/, 'a heading must not sit inside a button');

  const items = [...html.matchAll(/<h3>(<button[^>]*aria-expanded="false"[^>]*aria-controls="([^"]+)"[\s\S]*?<\/button>)<\/h3><div id="([^"]+)"/g)];
  assert.equal(items.length, FAQ_SCHEMA_ITEMS.length, 'every FAQ item should follow the heading > button > panel pattern');
  for (const [, , controls, panelId] of items) assert.equal(controls, panelId);
});

test('collapsed FAQ answers are inert, so assistive tech and focus skip them', () => {
  const html = renderToStaticMarkup(React.createElement(Faq));
  const panels = [...html.matchAll(/<div id="[^"]+" class="overflow-hidden[^"]*"([^>]*)>/g)];
  assert.equal(panels.length, FAQ_SCHEMA_ITEMS.length);
  for (const [, attrs] of panels) assert.match(attrs, /\binert=""/);
});
