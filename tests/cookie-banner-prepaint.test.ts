import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CookieConsentBanner from '../components/CookieConsentBanner';
import { render } from '../ssr.tsx';

const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');

function getHeadHtml(html: string): string {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  assert.ok(match, 'index.html should include a head section');
  return match[1];
}

function withStoredConsent<T>(value: string | null, callback: () => T): T {
  const original = Reflect.get(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem: () => value, setItem: () => {}, removeItem: () => {} },
    configurable: true,
    writable: true,
  });
  try {
    return callback();
  } finally {
    if (original === undefined) {
      Reflect.deleteProperty(globalThis, 'localStorage');
    } else {
      Object.defineProperty(globalThis, 'localStorage', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  }
}

// #1605: o banner só aparecia depois de entry chunk -> hidratação -> chunk lazy próprio,
// o que o punha na disputa do LCP muito depois do hero. Renderizá-lo no HTML estático é o
// que remove esse atraso; estes testes travam as duas metades do arranjo (markup estático
// determinístico + esconder antes do paint para quem já escolheu).

test('o primeiro render do banner não depende da escolha persistida (sem mismatch de hidratação)', () => {
  const withoutChoice = withStoredConsent(null, () =>
    renderToStaticMarkup(React.createElement(CookieConsentBanner))
  );
  const withChoice = withStoredConsent('marketing', () =>
    renderToStaticMarkup(React.createElement(CookieConsentBanner))
  );

  assert.equal(withChoice, withoutChoice);
  assert.match(withoutChoice, /id="cookie-consent-banner"/);
});

// As landings (/orlando etc.) importam CSS direto e não carregam sob o tsx do node:test —
// ficam cobertas pelo prerender real do build. `/` prova o contrato: o banner é global
// (AppLayout), fora de ClientOnly, então vale para toda rota pré-renderizada.
test('o HTML pré-renderizado já traz o banner de cookies', async () => {
  const { appHtml } = await render('/');
  assert.match(appHtml, /id="cookie-consent-banner"/);
  assert.match(appHtml, /Usamos cookies de marketing/);
});

test('o banner precede o conteúdo da rota na ordem do DOM pré-renderizado', async () => {
  const { appHtml } = await render('/');
  const bannerIndex = appHtml.indexOf('id="cookie-consent-banner"');
  const mainIndex = appHtml.indexOf('id="main-content"');

  assert.notEqual(bannerIndex, -1);
  assert.notEqual(mainIndex, -1);
  assert.ok(bannerIndex < mainIndex, 'o banner deve vir antes do conteúdo principal');
});

test('index.html marca a escolha persistida no <html> antes do primeiro paint', () => {
  const headHtml = getHeadHtml(indexHtml);

  assert.match(headHtml, /localStorage\.getItem\('anhanga_cookie_consent'\)/);
  assert.match(headHtml, /setAttribute\(\s*'data-cookie-consent'/);
  assert.match(headHtml, /'set'\s*:\s*'unset'/);
});

test('index.html esconde o banner antes do paint só para quem já escolheu', () => {
  const headHtml = getHeadHtml(indexHtml);

  assert.match(
    headHtml,
    /html\[data-cookie-consent="set"\]\s*#cookie-consent-banner\s*\{\s*display:\s*none;\s*\}/,
    'a regra inline precisa estar no <head> — o CSS do bundle chega depois do paint em dev'
  );
});

test('index.html reserva --cookie-banner-h antes da hidratação', () => {
  // O banner aparece ~1 s antes de o efeito que mede a altura rodar. Sem reservar nesse
  // intervalo, quem consome a variável (o padding inferior de pages/LinksPage.tsx, os FABs)
  // fica coberto pelo banner fixo e ganha o espaço — deslocando — só depois da hidratação.
  const reservationIndex = indexHtml.search(
    /getElementById\('cookie-consent-banner'\)[\s\S]{0,400}?setProperty\(\s*'--cookie-banner-h'/
  );
  const rootIndex = indexHtml.indexOf('<div id="root">');
  const entrypointIndex = indexHtml.indexOf('<script type="module" src="/index.tsx"></script>');

  assert.notEqual(reservationIndex, -1, 'a medição pré-hidratação deveria existir');
  assert.ok(rootIndex < reservationIndex, 'precisa rodar depois do markup do banner');
  assert.ok(
    reservationIndex < entrypointIndex,
    'precisa rodar antes do entrypoint React, senão não cobre a janela pré-hidratação'
  );
});

test('o gate de pré-paint roda antes do entrypoint React', () => {
  // Regex em vez de string literal: casar a indentação exata do bloco faria uma
  // reformatação inofensiva de index.html derrubar este teste sem mudança de comportamento.
  const gateIndex = indexHtml.search(/setAttribute\(\s*'data-cookie-consent'/);
  const entrypointIndex = indexHtml.indexOf('<script type="module" src="/index.tsx"></script>');

  assert.notEqual(gateIndex, -1, 'gate de consentimento deveria existir');
  assert.notEqual(entrypointIndex, -1, 'entrypoint React deveria existir');
  assert.ok(gateIndex < entrypointIndex, 'o gate precisa rodar antes do React montar o banner');
});
