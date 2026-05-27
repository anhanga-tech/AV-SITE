import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const designSystemDir = fs.readdirSync(process.cwd()).find((entry) => entry.endsWith('Design System'));

assert.ok(designSystemDir, 'design system directory should exist');

const designSystemCssPath = path.resolve(process.cwd(), designSystemDir, 'colors_and_type.css');
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
  assert.match(indexHtml, /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-T2KGS86G/i);
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
