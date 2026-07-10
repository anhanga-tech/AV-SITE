import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import NpsPage from '../pages/NpsPage.tsx';

function renderNpsPage(path: string): string {
  return renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(NpsPage)
    )
  );
}

// Identity (firstname/email) is bound server-side to the signed invitation
// token (issue #1137) — the page never collects them as free text.

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
