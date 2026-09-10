import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { render, cleanup, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

import CookieConsentBanner from '../components/CookieConsentBanner.tsx';
import { _resetBannerVisibilityStateForTests } from '../lib/cookie-banner-visibility.ts';
import { getConsent } from '../lib/consent.ts';

/*
  #1605: o banner passou a ser visível a partir do primeiro paint, muito antes de os onClick
  do React existirem (janela medida em ~2,8 s numa landing sob 4x CPU / ~1,6 Mbps). A ponte
  de index.html anota o clique dessa janela e o componente o converte em consentimento ao
  montar. Estes testes travam as duas pontas do contrato — o seletor que a ponte procura e o
  drain feito pelo componente —, que vivem em arquivos diferentes e sairiam de sincronia em
  silêncio: o sintoma seria um clique perdido, não um erro.
*/

const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

afterEach(() => {
  cleanup();
  _resetBannerVisibilityStateForTests();
  delete window.__anhangaConsentHandoff;
  try {
    localStorage.clear();
  } catch {
    // storage indisponível no ambiente de teste — nada a limpar
  }
});

test('os botões carregam o data-consent-choice que a ponte pré-hidratação procura', () => {
  const markup = renderToStaticMarkup(React.createElement(CookieConsentBanner));

  assert.match(markup, /data-consent-choice="marketing"/);
  assert.match(markup, /data-consent-choice="essential"/);
  assert.match(
    indexHtml,
    /closest\(\s*'#cookie-consent-banner \[data-consent-choice\]'\s*\)/,
    'a ponte de index.html precisa procurar exatamente esse seletor'
  );
});

test('a ponte de index.html expõe o handoff e só anota a escolha, sem persistir consentimento', () => {
  // Persistir daqui duplicaria a lógica de lib/consent.ts (schema, meta, evento de revogação)
  // no HTML — e registraria consentimento de quem sair antes da hidratação.
  assert.match(indexHtml, /window\.__anhangaConsentHandoff = function/);
  assert.doesNotMatch(indexHtml, /onPreHydrationClick[\s\S]*?localStorage\.setItem/);
});

test('a escolha clicada antes da hidratação vira consentimento na montagem', () => {
  window.__anhangaConsentHandoff = () => 'marketing';

  const { container } = render(React.createElement(CookieConsentBanner));

  assert.equal(getConsent(), 'marketing');
  assert.equal(container.querySelector('#cookie-consent-banner'), null, 'o banner não deve reabrir');
});

test('sem clique pendente o banner segue aberto e nada é persistido', () => {
  window.__anhangaConsentHandoff = () => null;

  const { container } = render(React.createElement(CookieConsentBanner));

  assert.equal(getConsent(), null);
  assert.ok(container.querySelector('#cookie-consent-banner'));
});

test('o handoff é drenado uma única vez, antes de qualquer reset bufferizado', () => {
  let calls = 0;
  window.__anhangaConsentHandoff = () => {
    calls += 1;
    return 'essential';
  };

  render(React.createElement(CookieConsentBanner));
  act(() => {
    window.dispatchEvent(new Event('anhanga:reset-consent'));
  });

  assert.equal(calls, 1);
  assert.equal(getConsent(), 'essential');
});
