import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientOnly } from '../components/ClientOnly';
import Footer from '../components/Footer';
import { isNotFoundPrerenderMarker, shouldHydratePrerenderedRoute } from '../lib/hydration.ts';
import { render } from '../ssr.tsx';

function withMockedNow<T>(iso: string, callback: () => T): T {
  const RealDate = Date;
  const fixedDate = new RealDate(iso);

  class MockDate extends RealDate {
    constructor(value?: string | number | Date) {
      if (arguments.length === 0) {
        super(fixedDate.valueOf());
        return;
      }

      super(value as string | number | Date);
    }

    static now(): number {
      return fixedDate.valueOf();
    }
  }

  globalThis.Date = MockDate as DateConstructor;

  try {
    return callback();
  } finally {
    globalThis.Date = RealDate;
  }
}

function renderClientOnly(): string {
  return renderToStaticMarkup(
    React.createElement(
      ClientOnly,
      null,
      React.createElement('div', null, 'client-only feature')
    )
  );
}

test('shouldHydratePrerenderedRoute only hydrates when the prerendered route matches the current path', () => {
  assert.equal(shouldHydratePrerenderedRoute('/', '/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog'), true);
  assert.equal(shouldHydratePrerenderedRoute('/blog', '/blog/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute('/blog/teste', '/blog'), false);
  assert.equal(shouldHydratePrerenderedRoute(null, '/blog'), false);
});

/*
  O 404 custom é o único artefato servido para um path que não é o dele: o Cloudflare Pages
  entrega `dist/404.html` em QUALQUER URL sem asset, então o marcador `/404` nunca casa com
  o pathname. Sem a exceção, `index.tsx` trata o markup como "de outra rota" e chama
  `replaceChildren()` — medido em Chromium: o conteúdo do 404 aparecia aos 177ms, sumia por
  ~300ms e voltava aos 576ms. Com a exceção, não some mais.
*/
test('shouldHydratePrerenderedRoute hidrata o 404 custom em qualquer path desconhecido', () => {
  assert.equal(shouldHydratePrerenderedRoute('/404', '/rota-que-nao-existe'), true);
  assert.equal(shouldHydratePrerenderedRoute('/404', '/blog/post-inexistente/'), true);
  assert.equal(shouldHydratePrerenderedRoute('/404', '/'), true);
  // Barra final não muda a decisão, igual às demais rotas.
  assert.equal(shouldHydratePrerenderedRoute('/404/', '/qualquer-coisa'), true);
});

/*
  Divergência de hidratação no 404 custom é esperada: a página é servida para qualquer path
  sem asset, e uma URL que só difere de uma rota real na caixa (/Sobre) recebe esse HTML
  enquanto o React Router renderiza a página real. Medido em Chromium: /Sobre produz React
  error #418; /rota-que-nao-existe não produz nada. Sem tratar, o onRecoverableError default
  faz console.error, que lib/sentry-client.ts encaminha ao Sentry — ruído a cada visita
  dessas. index.tsx usa este predicado para suprimir SÓ nesse caso.
*/
test('isNotFoundPrerenderMarker identifica só o marcador do 404 custom', () => {
  assert.equal(isNotFoundPrerenderMarker('/404'), true);
  assert.equal(isNotFoundPrerenderMarker('/404/'), true);
  assert.equal(isNotFoundPrerenderMarker('/'), false);
  assert.equal(isNotFoundPrerenderMarker('/sobre'), false);
  assert.equal(isNotFoundPrerenderMarker('/blog/404'), false);
  assert.equal(isNotFoundPrerenderMarker('/404-pagina'), false);
  assert.equal(isNotFoundPrerenderMarker(null), false);
  assert.equal(isNotFoundPrerenderMarker(undefined), false);
});

// A supressão não pode virar "engolir todo erro recuperável do site": ela é condicional ao
// marcador. Sem esta guarda, alguém poderia passar `onRecoverableError` incondicionalmente
// em index.tsx e calar divergência de hidratação em QUALQUER rota — perda real de sinal.
test('index.tsx só suprime erro recuperável sob o marcador do 404', async () => {
  const fonte = await readFile(path.join(process.cwd(), 'index.tsx'), 'utf8');

  assert.match(fonte, /onRecoverableError/, 'index.tsx deve tratar onRecoverableError');
  assert.match(
    fonte,
    /isNotFoundPrerenderMarker\(prerenderedRoute\)\s*\?\s*\{\s*onRecoverableError/,
    'a supressão precisa ficar atrás de isNotFoundPrerenderMarker, nunca incondicional'
  );
});

test('a exceção do 404 não afrouxa a checagem das demais rotas', () => {
  // Guarda contra um "contém /404" ou prefixo frouxo: só o marcador exato abre exceção.
  assert.equal(shouldHydratePrerenderedRoute('/blog/404', '/outra-rota'), false);
  assert.equal(shouldHydratePrerenderedRoute('/404-pagina', '/outra-rota'), false);
  assert.equal(shouldHydratePrerenderedRoute('/', '/rota-que-nao-existe'), false);
});

test('ClientOnly omits children during the initial render', () => {
  assert.equal(renderClientOnly(), '');
});

test('Footer prerender should be deterministic across different runtime dates', () => {
  const renderFooter = (iso: string): string => withMockedNow(iso, () =>
    renderToStaticMarkup(React.createElement(Footer))
  );

  const marchMarkup = renderFooter('2026-03-31T15:00:00.000Z');
  const januaryMarkup = renderFooter('2027-01-01T01:00:00.000Z');

  assert.equal(marchMarkup, januaryMarkup);
  assert.match(marchMarkup, /https:\/\/media\.anhanga\.tur\.br\/images\/brand\/LOGO%20ANHANGA%20VIAGENS%20-%20BRANCO\.svg/);
});

test('Home prerender renders primary content before the footer without streaming reveal shifts', async () => {
  const { appHtml } = await render('/');

  assert.doesNotMatch(appHtml, /hidden id="S:/);
  assert.doesNotMatch(appHtml, /min-h-\[40vh\] bg-white/);

  const heroIndex = appHtml.indexOf('Sua Próxima');
  const footerIndex = appHtml.indexOf('<footer');

  assert.notEqual(heroIndex, -1);
  assert.notEqual(footerIndex, -1);
  assert.ok(heroIndex < footerIndex);
});

test('Home prerender keeps the CLS-safe path when URL contains tracking query or hash', async () => {
  const urls = ['/?utm_source=review', '/#contato'];

  const results = await Promise.all(urls.map((url) => render(url)));
  for (const { appHtml } of results) {
    assert.doesNotMatch(appHtml, /hidden id="S:/);
    assert.doesNotMatch(appHtml, /min-h-\[40vh\] bg-white/);
    assert.match(appHtml, /Sua Próxima/);
  }
});

test('Home prerender includes the below-the-fold H2 sections in the first-response HTML', async () => {
  const { appHtml } = await render('/');

  const h2Matches = Array.from(appHtml.matchAll(/<h2[^>]*>([^<]*)/g))
    .map((match) => match[1].trim())
    .filter(Boolean);

  // Highlights, Categories, HowItWorks, Faq and Blog each render one real H2.
  // Regressing to the old client-only reveal gate would collapse this to 0,
  // since renderToString never waits on the lazy imports those sections used to be behind.
  assert.ok(
    h2Matches.length >= 5,
    `expected at least 5 non-empty H2 headings in the first-response HTML, found ${h2Matches.length}`
  );
});
