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
import { getDisplayReviews } from '../data/reviewsAdapter.ts';
import type { GoogleReviewsData } from '../types/reviews.ts';

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

// #1971: o mural de depoimentos e o bloco de contato ficavam atrás de uma gate de
// scroll/timeout, e o HTML do build trazia só `<section id="depoimentos" … />` vazia.
test('Home prerender ships real testimonials and the contact block in the first-response HTML', async () => {
  // Passa pelo adapter: um refresh do Google pode gravar a lista vazia, e aí o mural cai
  // nos depoimentos manuais — estado suportado, não falha.
  const displayReviews = getDisplayReviews(
    JSON.parse(await readFile(path.join(process.cwd(), 'data/googleReviews.json'), 'utf8')) as GoogleReviewsData
  );
  const { appHtml } = await render('/');

  assert.doesNotMatch(appHtml, /<section id="depoimentos"[^>]*><\/section>/);
  assert.doesNotMatch(appHtml, /<section id="contato"[^>]*><\/section>/);
  assert.match(appHtml, /itemProp="reviewBody"|itemprop="reviewBody"/);
  assert.ok(displayReviews.length > 0, 'nenhum depoimento para exibir');
  // O HTML traz o nome escapado ("Ana &amp; João"); compara com o mesmo escape do React.
  const expectedName = renderToStaticMarkup(React.createElement(React.Fragment, null, displayReviews[0].authorName));
  assert.ok(
    appHtml.includes(expectedName),
    `expected reviewer "${displayReviews[0].authorName}" in the prerendered home`
  );
  assert.match(appHtml, /Anhangá Airlines/);

  // Abaixo da dobra: os avatares não podem disputar banda com o topo da home.
  const testimonialsHtml = appHtml.slice(appHtml.indexOf('id="depoimentos"'), appHtml.indexOf('id="contato"'));
  const avatarImgs = testimonialsHtml.match(/<img\b[^>]*>/g) ?? [];
  const withPhoto = displayReviews.filter((review) => review.photoUrl).length;
  assert.ok(avatarImgs.length >= withPhoto, `expected ${withPhoto} avatar <img>, found ${avatarImgs.length}`);
  for (const img of avatarImgs) {
    assert.match(img, /loading="lazy"/, `avatar sem loading="lazy": ${img.slice(0, 120)}`);
  }
});

test('Home prerender renders review dates independently of the build clock', async () => {
  const first = withMockedNow('2026-11-03T12:00:00.000Z', () => render('/'));
  const later = withMockedNow('2027-06-15T12:00:00.000Z', () => render('/'));
  const extractDates = (html: string) =>
    Array.from(html.matchAll(/<time dateTime="[^"]*"[^>]*>([^<]*)<\/time>/gi)).map((m) => m[1]);

  const [a, b] = [(await first).appHtml, (await later).appHtml].map(extractDates);
  assert.ok(a.length > 0, 'expected <time> elements in the testimonials');
  assert.deepEqual(a, b);
  assert.ok(a.every((text) => !text.startsWith('há ') && text !== 'hoje' && text !== 'ontem'));
});

// Rotas fora da home passam por renderToPipeableStream. Sem `progressiveChunkSize: Infinity`,
// o React terceiriza todo boundary concluído maior que ~12,8 KB: fallback dentro do <main>
// e o conteúdo real num `<div hidden id="S:n">` que só um script inline revela. Crawlers
// sem JS (GPTBot, ClaudeBot, IsAgentReady) liam /sobre e /politica-privacidade vazias.
test('Lazy route prerender ships page content inside <main> without the streaming reveal', async () => {
  for (const url of ['/sobre', '/contato', '/politica-privacidade', '/termos-de-uso']) {
    const { appHtml } = await render(url);
    assert.doesNotMatch(appHtml, /hidden id="S:/, `${url} still streams hidden content`);
    assert.doesNotMatch(appHtml, /<template id="B:/, `${url} still ships a Suspense fallback`);

    const main = appHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
    assert.ok(main, `${url} has no <main>`);
    assert.match(main[1], /<h1\b/, `${url} has no heading inside <main>`);
    const text = main[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    assert.ok(text.length >= 500, `${url} <main> has only ${text.length} chars of text`);
  }
});
