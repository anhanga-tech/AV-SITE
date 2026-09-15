import './helpers/dom-setup.ts';

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NpsPage from '../pages/NpsPage.tsx';

// Identity (firstname/email) is bound server-side to the signed invitation
// token (issue #1137) — the page never collects them as free text.
//
// Montagem real (happy-dom + testing-library) em vez de renderToStaticMarkup: desde que
// /nps passou a ser prerenderizada, o corpo que depende da query só aparece após o mount
// (ver o gate de `mounted` em pages/NpsPage.tsx e tests/nps-prerender-neutral.test.ts).
// Um renderizador de servidor nunca roda efeitos, então continuaria medindo a casca
// estática e não o que o respondente de fato vê.
function renderNpsPage(path: string): string {
  const { container } = render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(NpsPage)
    )
  );
  return container.innerHTML;
}

test.afterEach(() => {
  cleanup();
});

test('NpsPage shows an invalid-link state and no form when the token is missing', () => {
  const html = renderNpsPage('/nps?firstname=Ana');

  assert.match(html, /Link inválido/);
  assert.doesNotMatch(html, /id="nps-reason"/);
});

test('NpsPage renders the score form when a token is present, with no identity inputs', () => {
  const html = renderNpsPage('/nps?firstname=Ana&token=some-signed-token');

  assert.doesNotMatch(html, /id="nps-firstname"/);
  assert.doesNotMatch(html, /id="nps-email"/);
  assert.match(html, /id="nps-reason"/);
});

test('NpsPage greets by the display-only firstname param without trusting it as identity', () => {
  const html = renderNpsPage('/nps?firstname=Ana&token=some-signed-token');

  assert.match(html, /Olá, Ana!/);
});
