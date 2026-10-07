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
function renderNpsPage(path = '/nps/'): string {
  const { container } = render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(NpsPage)
    )
  );
  return container.innerHTML;
}

// O convite chega como cookie, não na URL (issue #1666): a borda guarda o token num
// cookie HttpOnly e deixa para a página só `nps_invite_info` (primeiro nome + ref).
function setInviteInfoCookie(name: string, ref = 'invite-ref-1') {
  document.cookie = `nps_invite_info=${encodeURIComponent(JSON.stringify({ ref, name }))}`;
}

test.afterEach(() => {
  cleanup();
  document.cookie = 'nps_invite_info=; Max-Age=0';
});

test('NpsPage shows an invalid-link state and no form when there is no invite cookie', () => {
  const html = renderNpsPage();

  assert.match(html, /Link inválido/);
  assert.doesNotMatch(html, /id="nps-reason"/);
});

test('NpsPage ignores token/firstname in the URL — the edge strips them before the page loads', () => {
  const html = renderNpsPage('/nps?firstname=Ana&token=some-signed-token');

  assert.match(html, /Link inválido/);
  assert.doesNotMatch(html, /Ana/);
});

test('NpsPage renders the score form when an invite cookie is present, with no identity inputs', () => {
  setInviteInfoCookie('Ana');
  const html = renderNpsPage();

  assert.doesNotMatch(html, /id="nps-firstname"/);
  assert.doesNotMatch(html, /id="nps-email"/);
  assert.match(html, /id="nps-reason"/);
});

test('NpsPage greets by the verified first name from the invite cookie', () => {
  setInviteInfoCookie('Ana');
  const html = renderNpsPage();

  assert.match(html, /Olá, Ana!/);
});

test('NpsPage still renders the form for an invite without a name', () => {
  setInviteInfoCookie('');
  const html = renderNpsPage();

  assert.match(html, /Olá!/);
  assert.match(html, /id="nps-reason"/);
});
