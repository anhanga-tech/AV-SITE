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

// O convite chega como cookie, não na URL (issue #1666): a borda redireciona para
// /nps/?i=<ref> e deixa para a página só `nps_invite_info_<ref>` (o primeiro nome).
// O componente lê `window.location`, então o teste posiciona a URL do happy-dom.
const REF_A = 'a'.repeat(32);
const REF_B = 'b'.repeat(32);

function setInviteInfoCookie(name: string, ref = REF_A) {
  document.cookie = `nps_invite_info_${ref}=${encodeURIComponent(JSON.stringify({ name }))}`;
}

function openAt(path: string) {
  window.history.replaceState(null, '', path);
  return renderNpsPage(path);
}

test.afterEach(() => {
  cleanup();
  for (const ref of [REF_A, REF_B]) document.cookie = `nps_invite_info_${ref}=; Max-Age=0`;
  window.history.replaceState(null, '', '/');
});

test('NpsPage shows an invalid-link state and no form when there is no invite', () => {
  const html = openAt('/nps/');

  assert.match(html, /Link inválido/);
  assert.doesNotMatch(html, /id="nps-reason"/);
});

test('NpsPage ignores token/firstname in the URL — the edge strips them before the page loads', () => {
  const html = openAt('/nps?firstname=Ana&token=some-signed-token');

  assert.match(html, /Link inválido/);
  assert.doesNotMatch(html, /Ana/);
});

test('NpsPage shows the invalid-link state when the URL has no tab ref, even with an invite cookie around', () => {
  setInviteInfoCookie('Ana');
  const html = openAt('/nps/');

  assert.match(html, /Link inválido/);
});

test('NpsPage renders the score form for its tab ref, with no identity inputs', () => {
  setInviteInfoCookie('Ana');
  const html = openAt(`/nps/?i=${REF_A}`);

  assert.doesNotMatch(html, /id="nps-firstname"/);
  assert.doesNotMatch(html, /id="nps-email"/);
  assert.match(html, /id="nps-reason"/);
  assert.match(html, /Olá, Ana!/);
});

test('NpsPage greets with the invite of its own tab when several are open in the browser', () => {
  setInviteInfoCookie('Ana', REF_A);
  setInviteInfoCookie('Bia', REF_B);

  assert.match(openAt(`/nps/?i=${REF_B}`), /Olá, Bia!/);
});

test('NpsPage still renders the form for an invite without a name', () => {
  setInviteInfoCookie('');
  const html = openAt(`/nps/?i=${REF_A}`);

  assert.match(html, /Olá!/);
  assert.match(html, /id="nps-reason"/);
});
