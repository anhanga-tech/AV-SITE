import test from 'node:test';
import assert from 'node:assert/strict';
import {
    REGION_TAG,
    resolveQuizDestinoTags,
    resolveRegionTagsFromText,
} from '../lib/destination-region.ts';

test('resolveQuizDestinoTags — mapeia ids estruturados do quiz para tags', () => {
    assert.deepEqual(resolveQuizDestinoTags(['europa']), [REGION_TAG.europa]);
    assert.deepEqual(resolveQuizDestinoTags(['america-norte']), [REGION_TAG.americaNorte]);
    assert.deepEqual(resolveQuizDestinoTags(['latam']), [REGION_TAG.americaLatina]);
    assert.deepEqual(resolveQuizDestinoTags(['caribe']), [REGION_TAG.caribe]);
    assert.deepEqual(resolveQuizDestinoTags(['asia']), [REGION_TAG.asia]);
    assert.deepEqual(resolveQuizDestinoTags(['africa-oriente']), [REGION_TAG.africaOriente]);
    assert.deepEqual(resolveQuizDestinoTags(['surpresa']), [REGION_TAG.abertoSurpresa]);
});

test('resolveQuizDestinoTags — múltiplos destinos, deduplicados, ignora desconhecido', () => {
    assert.deepEqual(
        resolveQuizDestinoTags(['europa', 'asia', 'europa', 'inexistente']).sort((a, b) => a - b),
        [REGION_TAG.europa, REGION_TAG.asia].sort((a, b) => a - b),
    );
});

test('resolveQuizDestinoTags — vazio/nulo retorna []', () => {
    assert.deepEqual(resolveQuizDestinoTags([]), []);
    assert.deepEqual(resolveQuizDestinoTags(undefined), []);
    assert.deepEqual(resolveQuizDestinoTags(null), []);
});

test('resolveRegionTagsFromText — destino livre do chatbot vira tag de região', () => {
    assert.deepEqual(resolveRegionTagsFromText('Orlando'), [REGION_TAG.americaNorte]);
    assert.deepEqual(resolveRegionTagsFromText('Orlando, Estados Unidos'), [REGION_TAG.americaNorte]);
    assert.deepEqual(resolveRegionTagsFromText('Lisboa'), [REGION_TAG.europa]);
    assert.deepEqual(resolveRegionTagsFromText('Tóquio'), [REGION_TAG.asia]);
    assert.deepEqual(resolveRegionTagsFromText('Sydney'), [REGION_TAG.oceania]);
    assert.deepEqual(resolveRegionTagsFromText('Rio de Janeiro'), [REGION_TAG.brasil]);
    assert.deepEqual(resolveRegionTagsFromText('Dubai'), [REGION_TAG.africaOriente]);
});

test('resolveRegionTagsFromText — insensível a acento e caixa', () => {
    assert.deepEqual(resolveRegionTagsFromText('MÉXICO'), [REGION_TAG.americaLatina]);
    assert.deepEqual(resolveRegionTagsFromText('cancun'), [REGION_TAG.caribe]);
    assert.deepEqual(resolveRegionTagsFromText('Cancún'), [REGION_TAG.caribe]);
});

test('resolveRegionTagsFromText — cruzeiro e surpresa', () => {
    assert.deepEqual(resolveRegionTagsFromText('Cruzeiro pelo Mediterrâneo'), [REGION_TAG.cruzeiros]);
    assert.deepEqual(resolveRegionTagsFromText('Me surpreenda'), [REGION_TAG.abertoSurpresa]);
});

test('resolveRegionTagsFromText — fallback: destino não reconhecido retorna []', () => {
    assert.deepEqual(resolveRegionTagsFromText('Marte'), []);
    assert.deepEqual(resolveRegionTagsFromText(''), []);
    assert.deepEqual(resolveRegionTagsFromText(null), []);
    assert.deepEqual(resolveRegionTagsFromText('   '), []);
});

test('resolveRegionTagsFromText — token curto não casa dentro de palavra maior', () => {
    // "jerusalem" contém o substring "usa": sem boundary casaria América do Norte.
    // Deve casar só África/Oriente (keyword "jerusalem"), não América do Norte.
    assert.deepEqual(resolveRegionTagsFromText('Jerusalém'), [REGION_TAG.africaOriente]);
    assert.deepEqual(resolveRegionTagsFromText('EUA'), [REGION_TAG.americaNorte]);
});
