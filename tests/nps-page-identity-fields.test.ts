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

test('NpsPage renders email field when URL email is present but invalid', () => {
  const html = renderNpsPage('/nps?firstname=Ana&email=cliente@');

  assert.match(html, /id="nps-email"/);
  assert.match(html, /value="cliente@"/);
});

test('NpsPage keeps identity fields hidden when URL name and email are valid', () => {
  const html = renderNpsPage('/nps?firstname=Ana&email=ana%40example.com');

  assert.doesNotMatch(html, /id="nps-firstname"/);
  assert.doesNotMatch(html, /id="nps-email"/);
});
