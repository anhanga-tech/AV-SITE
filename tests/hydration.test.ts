import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientOnly } from '../components/ClientOnly';
import Footer from '../components/Footer';
import { shouldHydratePrerenderedRoute } from '../lib/hydration.ts';
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
