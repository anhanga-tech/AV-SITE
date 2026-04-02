import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClientOnly } from '../components/ClientOnly';
import Footer from '../components/Footer';
import { shouldHydratePrerenderedRoute } from '../lib/hydration.ts';

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
