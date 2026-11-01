import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';

import { render } from '../ssr.tsx';
import { OrlandoFooter } from '../components/landings/orlando/OrlandoFooter.tsx';
import LollapaloozaFooter from '../components/landings/lollapalooza/Footer.tsx';

/*
  Auditoria 01/11/2026 (#1969): as landings não usam o Footer do site principal e
  saíam no HTML pré-renderizado sem telefone, sem WhatsApp navegável e sem Cadastur.
  O CTA de WhatsApp era <button> (abre o modal) — sem JS não levava a lugar nenhum.
  `render()` é o mesmo que scripts/prerender.mjs usa para gerar o HTML estático.
  /orlando/ e /lollapalooza/ importam CSS no módulo da página, que o loader do node
  não resolve; nelas o contrato é verificado no próprio rodapé.
*/

const assertTrustLinks = (html: string) => {
  assert.match(html, /href="tel:\+551152833309"/, 'tel:');
  assert.match(html, /href="https:\/\/wa\.me\/5511955021519\?text=/, 'wa.me');
  assert.match(html, /href="https:\/\/cadastur\.turismo\.gov\.br\/hotsite\/"/, 'Cadastur');
};

const LANDING_ROUTES = [
  '/beto-carrero/',
  '/hopi-hari/',
  '/cruzeiros/',
  '/consultoria-de-viagem/',
  '/corporativo/',
  '/melhor-idade/pacotes-pastore/',
];

for (const route of LANDING_ROUTES) {
  test(`${route} pré-renderiza telefone, WhatsApp (wa.me) e Cadastur`, async () => {
    const { appHtml } = await render(route);
    assertTrustLinks(appHtml);
  });
}

test('rodapé de /orlando/ traz telefone, WhatsApp (wa.me) e Cadastur', () => {
  assertTrustLinks(renderToStaticMarkup(React.createElement(OrlandoFooter)));
});

test('rodapé de /lollapalooza/ traz telefone, WhatsApp (wa.me) e Cadastur', () => {
  assertTrustLinks(renderToStaticMarkup(React.createElement(LollapaloozaFooter)));
});

test('CTA da banda de WhatsApp é um link wa.me, não um botão sem destino', async () => {
  const { appHtml } = await render('/corporativo/');
  const band = appHtml.match(/<a[^>]*data-tracking="whatsapp-band-[^"]*"[^>]*>/);

  assert.ok(band, 'banda de WhatsApp deve renderizar um <a>');
  assert.match(band[0], /href="https:\/\/wa\.me\//);
});

test('links do bloco de contato têm alvo de toque de 44px', () => {
  const html = renderToStaticMarkup(React.createElement(OrlandoFooter));
  const contactLinks = [...html.matchAll(/<a[^>]*href="(tel:[^"]*|https:\/\/wa\.me[^"]*|https:\/\/cadastur[^"]*)"[^>]*>/g)];

  assert.ok(contactLinks.length >= 3);
  for (const [tag] of contactLinks) {
    // O link de WhatsApp do bloco "Siga-nos" do OrlandoFooter tem regra própria no orlando.css.
    if (tag.includes('footer-whatsapp-orlando')) continue;
    assert.match(tag, /\bmin-h-11\b/, tag);
  }
});
