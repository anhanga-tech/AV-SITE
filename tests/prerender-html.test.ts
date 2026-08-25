import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute, isNoindexHtml, stripHomeOnlyPreloads, validateHtml } from '../lib/prerender-html.js';

const HERO_PRELOAD =
  '<link rel="preload" as="image" fetchpriority="high" data-av-preload="home-hero" imagesrcset="https://media.anhanga.tur.br/x.jpg 1200w" imagesizes="100vw" type="image/webp">';

const OUTRO_PRELOAD = '<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins">';

const TEMPLATE = `<html><head>${HERO_PRELOAD}\n${OUTRO_PRELOAD}</head><body></body></html>`;

function headHtml({ noindex = false, jsonLd = true } = {}): string {
  return [
    '<title>Página</title>',
    '<meta name="description" content="descrição">',
    noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">',
    '<link rel="canonical" href="https://www.anhanga.tur.br/algo/">',
    '<meta property="og:title" content="t">',
    '<meta property="og:description" content="d">',
    '<meta property="og:image" content="i">',
    '<meta property="og:type" content="website">',
    '<meta property="og:url" content="u">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="t">',
    '<meta name="twitter:description" content="d">',
    '<meta name="twitter:image" content="i">',
    jsonLd ? '<script type="application/ld+json">{}</script>' : '',
  ].join('\n');
}

test('o preload exclusivo da home sobrevive apenas na própria /', () => {
  assert.ok(stripHomeOnlyPreloads(TEMPLATE, '/').includes('data-av-preload="home-hero"'));
});

test('o preload exclusivo da home é removido de qualquer outra rota', () => {
  for (const rota of ['/links', '/links/', '/blog/post', '/orlando']) {
    const saida = stripHomeOnlyPreloads(TEMPLATE, rota);
    assert.equal(saida.includes('data-av-preload="home-hero"'), false, `${rota} manteve o preload`);
    // O strip é cirúrgico: nenhum outro preload pode sair junto.
    assert.ok(saida.includes(OUTRO_PRELOAD), `${rota} perdeu um preload que não era da home`);
  }
});

test('a barra final não faz a home perder o próprio preload', () => {
  assert.equal(normalizeRoute('/'), '/');
  assert.ok(stripHomeOnlyPreloads(TEMPLATE, '/').includes('home-hero'));
});

test('validateHtml exige JSON-LD numa rota indexável', () => {
  assert.throws(
    () => validateHtml('/orlando', headHtml({ noindex: false, jsonLd: false })),
    /Missing JSON-LD schema/,
  );
});

// Dado estruturado numa página noindex não tem consumidor: exigi-lo forçaria schema
// decorativo só para o validador passar. É o que destrava o prerender de /links.
test('validateHtml isenta rota noindex de JSON-LD', () => {
  assert.doesNotThrow(() => validateHtml('/links', headHtml({ noindex: true, jsonLd: false })));
});

test('a isenção do noindex não afrouxa o resto do contrato de head', () => {
  const semCanonical = headHtml({ noindex: true, jsonLd: false }).replace(/<link rel="canonical"[^>]*>/, '');
  assert.throws(() => validateHtml('/links', semCanonical), /Missing canonical/);

  const titleDuplicado = headHtml({ noindex: true, jsonLd: false }) + '<title>Outro</title>';
  assert.throws(() => validateHtml('/links', titleDuplicado), /Expected exactly 1 title/);
});

test('isNoindexHtml reconhece noindex em qualquer combinação de diretivas', () => {
  assert.equal(isNoindexHtml('<meta name="robots" content="noindex, follow">'), true);
  assert.equal(isNoindexHtml('<meta name="robots" content="follow, noindex">'), true);
  assert.equal(isNoindexHtml('<meta name="robots" content="index, follow">'), false);
  assert.equal(isNoindexHtml('<meta name="description" content="noindex aparece no texto">'), false);
});
