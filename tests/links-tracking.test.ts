import test from 'node:test';
import assert from 'node:assert/strict';
import { withTrackingParams } from '../utils/linksTracking.ts';

test('anexa UTMs da query atual a um path sem query', () => {
    const out = withTrackingParams('/quiz', '?utm_source=instagram&utm_medium=bio');
    assert.match(out, /^\/quiz\?/);
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('utm_source'), 'instagram');
    assert.equal(params.get('utm_medium'), 'bio');
});

test('preserva params existentes no destino e não os sobrescreve', () => {
    const out = withTrackingParams('/quiz?utm_source=site', '?utm_source=instagram');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('utm_source'), 'site');
});

test('ignora params que não são de rastreio', () => {
    const out = withTrackingParams('/quiz', '?random=1&utm_campaign=verao');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('random'), null);
    assert.equal(params.get('utm_campaign'), 'verao');
});

test('retorna o path inalterado quando não há query atual', () => {
    assert.equal(withTrackingParams('/quiz', ''), '/quiz');
});

test('captura click IDs (gclid, fbclid)', () => {
    const out = withTrackingParams('/', '?gclid=abc&fbclid=def');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('gclid'), 'abc');
    assert.equal(params.get('fbclid'), 'def');
});
