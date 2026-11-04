import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import LollapaloozaApp from '../components/landings/lollapalooza/LollapaloozaApp.tsx';
import { OrlandoHero } from '../components/landings/orlando/OrlandoHero.tsx';
import { render } from '../ssr.tsx';

// As páginas do Lolla e de Orlando importam CSS (fonte Outfit), que o tsx não carrega;
// renderiza os componentes que carregam o conteúdo sazonal.
function renderInRouter(element: React.ReactElement): string {
  return renderToStaticMarkup(React.createElement(MemoryRouter, null, element));
}

/*
  Issue #1971 (item 10, conteúdo): as landings sazonais ainda vendiam a temporada
  2026 — lineup e datas do Lolla 2026, "Orlando 2026", "Beto Carrero World 2026" —
  e duas metas passavam de 160 caracteres. Decisões aprovadas: Lolla vira só lista
  de espera 2027 (sem grade de lineup), Orlando/Beto passam a 2027, metas enxutas
  aprovadas e alts do OrlandoHero em PT-BR.
*/

function metaDescription(headHtml: string): string {
  const match = headHtml.match(/<meta name="description" content="([^"]*)"/);
  assert.ok(match, 'meta description ausente');
  return match[1];
}

test('Lollapalooza landing is a 2027 waitlist without the 2026 lineup grid', async () => {
  const appHtml = renderInRouter(React.createElement(LollapaloozaApp));

  assert.doesNotMatch(appHtml, /id="lineup"/);
  assert.doesNotMatch(appHtml, /href="#lineup"/);
  assert.doesNotMatch(appHtml, /Lineup\s*(<[^>]+>\s*)*2026/);
  assert.doesNotMatch(appHtml, /2[012],? (e )?2?2? ?de Março/);
  assert.doesNotMatch(appHtml, /Prepare-se para ver/);
  assert.match(appHtml, /Lista de espera 2027/);
  assert.match(appHtml, /id="lista-de-espera"/);
});

test('Orlando landing sells the 2027 season with PT-BR image alts', () => {
  const appHtml = renderInRouter(React.createElement(OrlandoHero));

  assert.match(appHtml, /Pacote para Orlando 2027/);
  assert.doesNotMatch(appHtml, /Orlando 2026/);
  for (const englishAlt of ['Rollercoaster', 'Magic Kingdom style', 'Palm Trees']) {
    assert.ok(!appHtml.includes(`alt="${englishAlt}"`), `alt em inglês: ${englishAlt}`);
  }
  assert.match(appHtml, /alt="Castelo da Cinderela, no Magic Kingdom"/);
});

test('Beto Carrero landing sells the 2027 season', async () => {
  const { headHtml } = await render('/beto-carrero/');

  assert.match(headHtml, /Pacote Beto Carrero World 2027/);
  assert.doesNotMatch(headHtml, /Beto Carrero( World)? 2026/);
});

test('Hopi Hari and Consultoria meta descriptions use the approved copy within 160 chars', async () => {
  const expected: Record<string, string> = {
    '/hopi-hari/':
      'Pacote Hopi Hari com ingresso oficial, hotel e transporte. Planejamento com a Anhangá, agente credenciado do parque.',
    '/consultoria-de-viagem/':
      'Consultoria de viagem: sessão de 50 min com plano por escrito. R$ 250, abatidos na consultoria completa. Anhangá Viagens.',
  };

  for (const [route, description] of Object.entries(expected)) {
    const { headHtml } = await render(route);
    const actual = metaDescription(headHtml);
    assert.equal(actual, description, route);
    assert.ok(actual.length <= 160, `${route}: ${actual.length} caracteres`);
  }
});
