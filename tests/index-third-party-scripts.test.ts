import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const designSystemCssPath = path.resolve(process.cwd(), 'docs/design/brand-system', 'colors_and_type.css');
assert.ok(fs.existsSync(designSystemCssPath), 'design system colors_and_type.css should exist at docs/design/brand-system');

const designSystemCss = fs.readFileSync(designSystemCssPath, 'utf8');

function getHeadHtml(html: string): string {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  assert.ok(match, 'index.html should include a head section');
  return match[1];
}

test('index.html keeps GTM out of the render-critical head path', () => {
  const headHtml = getHeadHtml(indexHtml);

  assert.doesNotMatch(headHtml, /googletagmanager\.com\/gtm\.js/i);
  assert.doesNotMatch(headHtml, /GTM-T2KGS86G/i);
});

test('index.html não tem iframe noscript do GTM (furava o Consent Mode)', () => {
  // O <noscript> do GTM carregava tags sem os defaults do Consent Mode (setados
  // via JS) — único caminho que disparava rastreamento sem sinal de consentimento.
  // Removido na auditoria LGPD de jul/2026; a SPA não renderiza sem JS, então o
  // iframe não tinha valor de mensuração.
  assert.doesNotMatch(indexHtml, /ns\.html\?id=GTM/i, 'iframe noscript do GTM não deve existir');
  assert.doesNotMatch(indexHtml, /<noscript>\s*<iframe/i, 'nenhum iframe deve ser injetado via noscript');
});

test('index.html initializes dataLayer before the React entrypoint runs', () => {
  const dataLayerIndex = indexHtml.indexOf('window.dataLayer = window.dataLayer || []');
  const entrypointIndex = indexHtml.indexOf('<script type="module" src="/index.tsx"></script>');

  assert.notEqual(dataLayerIndex, -1, 'dataLayer bootstrap should be present');
  assert.notEqual(entrypointIndex, -1, 'React entrypoint script should be present');
  assert.ok(dataLayerIndex < entrypointIndex, 'dataLayer should exist before app code can push conversion events');
});

test('index.html lazy-loads GTM through the deferred analytics loader', () => {
  const loadGtmIndex = indexHtml.indexOf('loadGtm();');
  const utmInjectIndex = indexHtml.indexOf("injectScript('/utm-tracking.js'");

  assert.match(indexHtml, /var\s+gtmLoaded\s*=\s*false/i);
  assert.match(indexHtml, /'gtm\.start'\s*:\s*new Date\(\)\.getTime\(\)/i);
  assert.match(indexHtml, /https:\/\/load\.sst\.anhanga\.tur\.br\//i);
  assert.ok(loadGtmIndex > -1, 'GTM loader should be called from the analytics trigger');
  assert.ok(utmInjectIndex > -1, 'UTM tracking loader should still be present');
  assert.ok(loadGtmIndex < utmInjectIndex, 'GTM should be queued before UTM reads GA client data');
});

test('index.html loads only the required Poppins font weights', () => {
  const fontUrls = [...indexHtml.matchAll(/href="([^"]*fonts\.googleapis\.com\/css2[^"]*)"/g)]
    .map((match) => match[1])
    .filter((url) => url.includes('family=Poppins'));

  assert.equal(fontUrls.length, 3, 'preload, stylesheet, and noscript font URLs should stay aligned');

  for (const url of fontUrls) {
    assert.match(url, /family=Poppins:wght@400;600;700;900(?:&|$)/);
    assert.doesNotMatch(url, /Poppins:wght@[^"]*800/);
  }
});

test('design system documents the production Poppins font weights', () => {
  const importUrl = designSystemCss.match(/@import url\('([^']*fonts\.googleapis\.com\/css2[^']*)'\);/)?.[1];

  assert.ok(importUrl, 'design system should import its Google Fonts stylesheet');
  assert.match(importUrl, /family=Poppins:wght@400;600;700;900(?:&|$)/);
  assert.doesNotMatch(importUrl, /Poppins:wght@[^']*800/);
  assert.match(designSystemCss, /Poppins is loaded with 400\/600\/700\/900 only/);
});

test('index.html configura gtag consent defaults antes da IIFE de scripts lazy', () => {
  const consentBlockIndex = indexHtml.indexOf("gtag('consent', 'default'");
  const iifeIndex = indexHtml.indexOf('var analyticsLoaded');

  assert.ok(consentBlockIndex > -1, 'bloco gtag consent default deve existir');
  assert.ok(iifeIndex > -1, 'IIFE de scripts lazy deve existir');
  assert.ok(consentBlockIndex < iifeIndex, 'consent default deve vir antes da IIFE');

  assert.match(indexHtml, /analytics_storage:\s*'granted'/, 'analytics_storage deve ser granted por padrão (legítimo interesse)');
  assert.match(indexHtml, /ad_storage:.*'denied'/, 'ad_storage deve ser denied por padrão');
  assert.match(indexHtml, /wait_for_update:\s*2000/, 'wait_for_update deve ser 2000ms');
});

test('loadGtm tem gate de host para não poluir o GA4 de produção em dev/CI', () => {
  const loadGtmMatch = indexHtml.match(/var loadGtm\s*=\s*function\s*\(\)\s*\{([\s\S]*?)};/);
  assert.ok(loadGtmMatch, 'loadGtm deve estar definida');
  const body = loadGtmMatch[1];

  // O gate de host deve bloquear localhost/127.0.0.1/.local/.test, onde o Playwright/CI roda.
  // Sem isto, generate_lead de testes vaza para o GA4 de produção (gatilho G0 do plano 360).
  assert.match(body, /location\.hostname/, 'loadGtm deve checar location.hostname');
  assert.match(body, /'localhost'/, 'gate deve cobrir localhost');
  assert.match(body, /'127\.0\.0\.1'/, 'gate deve cobrir 127.0.0.1');
  assert.match(body, /'\[::1\]'/, 'gate deve cobrir o loopback IPv6 [::1]');
  assert.match(body, /'::1'/, 'gate deve cobrir o loopback IPv6 ::1');
  assert.match(body, /'0\.0\.0\.0'/, 'gate deve cobrir 0.0.0.0 (Docker/CI)');
  assert.match(body, /\.endsWith\('\.local'\)/, 'gate deve cobrir hosts .local');
  assert.match(body, /\.endsWith\('\.test'\)/, 'gate deve cobrir hosts .test');

  // O return do gate precisa vir ANTES da injeção do loader do GTM/sGTM.
  const gateIndex = body.indexOf('location.hostname');
  const injectIndex = body.indexOf('load.sst.anhanga.tur.br');
  assert.ok(gateIndex > -1 && injectIndex > -1, 'gate e injeção devem existir em loadGtm');
  assert.ok(gateIndex < injectIndex, 'o gate de host deve preceder a injeção do GTM');
});

test('loadMautic tem gate de consentimento LGPD', () => {
  const loadMauticMatch = indexHtml.match(/var loadMautic\s*=\s*function\s*\(\)\s*\{([\s\S]*?)};/);
  assert.ok(loadMauticMatch, 'loadMautic deve estar definida');
  const body = loadMauticMatch[1];
  assert.match(body, /_consentChoice\s*!==\s*'marketing'/, 'loadMautic deve ter gate de consentimento');
});

test('index.html não carrega scripts do HubSpot (ferramenta descontinuada)', () => {
  assert.doesNotMatch(indexHtml, /hs-scripts\.com/i, 'script do HubSpot não deve ser injetado');
  assert.doesNotMatch(indexHtml, /loadHubspot/i, 'loader do HubSpot não deve existir');
});

test('index.html tem listener anhanga:marketing-consent', () => {
  assert.match(indexHtml, /anhanga:marketing-consent/, 'listener de aceite deve estar presente');
});

test('index.html tem listener anhanga:revoke-consent com reload', () => {
  assert.match(indexHtml, /anhanga:revoke-consent/, 'listener de revogação deve estar presente');
  const revokeIdx = indexHtml.indexOf('anhanga:revoke-consent');
  const reloadIdx = indexHtml.indexOf('window.location.reload()', revokeIdx);
  assert.ok(reloadIdx > revokeIdx, 'reload deve ocorrer após revoke-consent');
});
