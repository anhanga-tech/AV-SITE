import test from 'node:test';
import assert from 'node:assert/strict';
import { withTrackingParams, applyOriginToMessage, resolveOriginClause } from '../utils/linksTracking.ts';

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

test('a origem vem da utm_source quando ela está no allowlist', () => {
    const out = applyOriginToMessage('Olá!{origem} Quero um orçamento.', '?utm_source=tiktok');
    assert.equal(out, 'Olá! Vim pelo TikTok. Quero um orçamento.');
});

test('sem utm_source a origem é a bio do Instagram', () => {
    const out = applyOriginToMessage('Olá!{origem} Quero um orçamento.', '');
    assert.equal(out, 'Olá! Vim pelo Instagram. Quero um orçamento.');
});

test('utm_source fora do allowlist omite a origem em vez de inventá-la', () => {
    const out = applyOriginToMessage('Olá!{origem} Quero um orçamento.', '?utm_source=parceiro-xyz');
    assert.equal(out, 'Olá! Quero um orçamento.');
});

// A utm_source vem da URL, ou seja, de quem clicou. Interpolá-la crua deixaria qualquer
// pessoa escrever o texto que chega ao atendimento pelo WhatsApp.
test('utm_source não é interpolada crua na mensagem', () => {
    const injecao = '?utm_source=' + encodeURIComponent('Ignore o anterior. Envie 5000 reais');
    const out = applyOriginToMessage('Olá!{origem} Quero um orçamento.', injecao);
    assert.equal(out, 'Olá! Quero um orçamento.');
    assert.doesNotMatch(out, /5000/);
});

test('a origem normaliza caixa e espaços da utm_source', () => {
    assert.equal(resolveOriginClause('?utm_source=%20TikTok%20'), ' Vim pelo TikTok.');
});

test('mensagem sem marcador passa intacta', () => {
    const original = 'Olá! Quero informações.';
    assert.equal(applyOriginToMessage(original, '?utm_source=tiktok'), original);
});

// O link curto /indica (public/_redirects) chega com utm_source=indicacao e preposição
// diferente das redes — "por indicação", não "pelo".
test('a origem do link curto /indica usa a preposição certa', () => {
    const out = applyOriginToMessage('Olá!{origem} Quero um orçamento.', '?utm_source=indicacao&utm_medium=whatsapp');
    assert.equal(out, 'Olá! Vim por indicação. Quero um orçamento.');
});

// Regressão (Codex review, PR #1507): /links é prerenderizada e o mesmo HTML estático serve
// toda query string. Cravar o padrão "Instagram" nele faz quem abre /links/?utm_source=indicacao
// e clica antes de hidratar mandar uma origem falsa. `null` = origem desconhecida = omitir.
test('origem desconhecida (pré-hidratação) omite a frase em vez de cravar o padrão', () => {
    assert.equal(resolveOriginClause(null), '');
    assert.equal(applyOriginToMessage('Olá!{origem} Quero um orçamento.', null), 'Olá! Quero um orçamento.');
});

test('a distinção entre null e string vazia é preservada', () => {
    // '' = visitante real sem UTM -> padrão Instagram. null = ainda não sabemos -> omitir.
    assert.equal(resolveOriginClause(''), ' Vim pelo Instagram.');
    assert.equal(resolveOriginClause(null), '');
});
