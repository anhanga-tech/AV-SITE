import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, fireEvent } from '@testing-library/react';

import AIResearchBar from '../components/AIResearchBar.tsx';

/*
  Issue #1405 — a barra AIResearchBar não disparava evento próprio no
  dataLayer. Estes testes provam o contrato do evento `ai_research_click`
  sem depender do GTM carregar (ele não carrega em ambiente de teste local
  nem em CI): montam o componente de verdade (happy-dom + testing-library,
  ver docs/standards/dom-testing-tier-decision.md) e disparam `click` em
  cada link, que é o mesmo evento que o navegador despacha tanto para clique
  de mouse quanto para ativação por teclado (Enter) num <a>.

  O último teste cobre a reutilização de `currentPageLocation()`
  (utils/formAnalytics.ts) para redigir e-mail/telefone/nome que estejam na
  própria query string da home — a home é acessível com esses parâmetros,
  e `page_location` não pode vazar PII para o GA4.
*/

type DataLayerEvent = Record<string, unknown>;

beforeEach(() => {
  window.dataLayer = [];
});

afterEach(() => {
  cleanup();
});

test('cada um dos cinco links dispara exatamente um ai_research_click com o assistant correto', () => {
  const { getByRole } = render(React.createElement(AIResearchBar));

  const expected = ['chatgpt', 'gemini', 'claude', 'perplexity', 'grok'];

  for (const assistant of expected) {
    const link = getByRole('link', { name: new RegExp(assistant, 'i') });
    fireEvent.click(link);
  }

  const events = (window.dataLayer as DataLayerEvent[]).filter(
    (e) => e.event === 'ai_research_click',
  );

  assert.equal(events.length, expected.length);
  assert.deepEqual(
    events.map((e) => e.assistant).sort(),
    [...expected].sort(),
  );
});

test('o payload identifica placement=hero e page_location, sem prompt nem query final', () => {
  const { getByRole } = render(React.createElement(AIResearchBar));

  fireEvent.click(getByRole('link', { name: /claude/i }));

  const [event] = (window.dataLayer as DataLayerEvent[]).filter(
    (e) => e.event === 'ai_research_click',
  );

  assert.equal(event.assistant, 'claude');
  assert.equal(event.placement, 'hero');
  assert.equal(typeof event.page_location, 'string');

  const serialized = JSON.stringify(event);
  assert.doesNotMatch(serialized, /Anhang[aá] Viagens\?/);
  assert.doesNotMatch(serialized, /planejar uma viagem/i);
  assert.doesNotMatch(serialized, /[?&]q=/);
});

test('redige e-mail/telefone/nome presentes na query da página atual em page_location', () => {
  const originalHref = window.location.href;
  window.location.href = 'https://www.anhanga.tur.br/?email=ana@example.com&utm_source=ig';

  try {
    const { getByRole } = render(React.createElement(AIResearchBar));
    fireEvent.click(getByRole('link', { name: /gemini/i }));

    const [event] = (window.dataLayer as DataLayerEvent[]).filter(
      (e) => e.event === 'ai_research_click',
    );

    assert.equal(event.page_location, 'https://www.anhanga.tur.br/?email=redacted&utm_source=ig');
  } finally {
    window.location.href = originalHref;
  }
});
