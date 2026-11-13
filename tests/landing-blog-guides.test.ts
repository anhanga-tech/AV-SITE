import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';

import { render } from '../ssr.tsx';
import { LandingBlogGuides, type LandingBlogGuide } from '../components/landings/shared/LandingBlogGuides.tsx';
import { ORLANDO_BLOG_GUIDES } from '../components/landings/orlando/orlandoBlogGuides.ts';
import { BETO_BLOG_GUIDES } from '../components/landings/beto-carrero/betoBlogGuides.ts';
import { MELHOR_IDADE_BLOG_GUIDES } from '../components/landings/melhor-idade/melhorIdadeBlogGuides.ts';
import { CRUZEIROS_BLOG_GUIDES } from '../components/landings/cruzeiros/cruzeirosBlogGuides.ts';

/*
  Bloco "Guias para planejar" das landings de destino: links <a href> comuns para
  os posts do cluster, presentes no HTML pré-renderizado (sem depender de JS).
  `render()` é o mesmo que scripts/prerender.mjs usa. /orlando/ importa CSS no
  módulo da página, que o loader do node não resolve — nela o contrato é
  verificado no componente + dados (o grep no dist/ cobre a página inteira).
*/

const LANDINGS: Array<{ route: string; guides: readonly LandingBlogGuide[] }> = [
  { route: '/orlando/', guides: ORLANDO_BLOG_GUIDES },
  { route: '/beto-carrero/', guides: BETO_BLOG_GUIDES },
  { route: '/melhor-idade/', guides: MELHOR_IDADE_BLOG_GUIDES },
  { route: '/cruzeiros/', guides: CRUZEIROS_BLOG_GUIDES },
];

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renderBlock = (guides: readonly LandingBlogGuide[], title?: string) =>
  renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(LandingBlogGuides, { guides, title }),
    ),
  );

const assertGuidesInHtml = (html: string, guides: readonly LandingBlogGuide[]) => {
  for (const { href, title } of guides) {
    const anchor = new RegExp(
      `<a [^>]*href="${escapeRegExp(escapeHtml(href))}"[^>]*>(?:(?!</a>).)*${escapeRegExp(escapeHtml(title))}`,
    );
    assert.match(html, anchor, `link ${href} com âncora "${title}"`);
  }
};

test('o bloco renderiza heading, lista e <a href> comuns para cada guia', () => {
  const html = renderBlock(ORLANDO_BLOG_GUIDES);
  assert.match(html, /<section[^>]*aria-labelledby="guias-para-planejar"/);
  assert.match(html, /<h2 id="guias-para-planejar"[^>]*>Guias para planejar<\/h2>/);
  assert.match(html, /<ul[^>]*>/);
  assert.equal((html.match(/<li>/g) ?? []).length, ORLANDO_BLOG_GUIDES.length);
  assertGuidesInHtml(html, ORLANDO_BLOG_GUIDES);
  assert.doesNotMatch(html, /href="#"|<button|utm_/);
});

test('o título do bloco pode ser customizado', () => {
  assert.match(renderBlock(BETO_BLOG_GUIDES, 'Outro título'), /<h2[^>]*>Outro título<\/h2>/);
});

test('sem guias o bloco não renderiza uma seção vazia', () => {
  assert.equal(renderBlock([]), '');
});

for (const { route, guides } of LANDINGS) {
  test(`${route}: todo guia tem barra final, âncora descritiva e MDX existente em content/blog/`, () => {
    assert.ok(guides.length > 0);
    const hrefs = new Set<string>();
    for (const { href, title } of guides) {
      const match = /^\/blog\/([a-z0-9-]+)\/$/.exec(href);
      assert.ok(match, `${href} deve ser /blog/<slug>/ com barra final`);
      assert.ok(!hrefs.has(href), `${href} duplicado em ${route}`);
      hrefs.add(href);
      assert.ok(title.trim().length > 0, `${href} sem âncora`);
      assert.ok(
        existsSync(resolve(process.cwd(), 'content/blog', `${match[1]}.mdx`)),
        `content/blog/${match[1]}.mdx não existe`,
      );
    }
  });
}

for (const { route, guides } of LANDINGS.filter(({ route }) => route !== '/orlando/')) {
  test(`${route} pré-renderiza o bloco "Guias para planejar" com os links do cluster`, async () => {
    const { appHtml } = await render(route);
    assert.match(appHtml, /<h2 id="guias-para-planejar"[^>]*>Guias para planejar<\/h2>/);
    assertGuidesInHtml(appHtml, guides);
  });
}
