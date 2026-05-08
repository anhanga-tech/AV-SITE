import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

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
