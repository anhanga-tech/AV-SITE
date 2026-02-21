import test from 'node:test';
import assert from 'node:assert/strict';
import { extractStructuredChips, inferFallbackChips, stripChipsBlock } from '../utils/chatChips.ts';

test('extractStructuredChips should parse a valid structured chips block', () => {
    const text = 'Perfeito, qual escopo da viagem?\n[CHIPS: Nacional | América do Sul | Internacional]';

    const chips = extractStructuredChips(text);

    assert.deepEqual(chips, ['Nacional', 'América do Sul', 'Internacional']);
});

test('extractStructuredChips should return null for malformed block', () => {
    const text = 'Perfeito, qual escopo da viagem?\n[CHIPS Nacional | América do Sul | Internacional]';

    const chips = extractStructuredChips(text);

    assert.equal(chips, null);
});

test('stripChipsBlock should remove structured chips from rendered text', () => {
    const text = 'Qual faixa de orçamento total?\n[CHIPS: Até R$ 10 mil | R$ 10-20 mil | R$ 20-35 mil]';

    const cleanText = stripChipsBlock(text);

    assert.equal(cleanText, 'Qual faixa de orçamento total?');
});

test('inferFallbackChips should infer budget chips when structured block is missing', () => {
    const text = 'Qual seria a faixa de orçamento total para essa viagem?';

    const chips = inferFallbackChips(text);

    assert.deepEqual(chips, ['Até R$ 10 mil', 'R$ 10-20 mil', 'R$ 20-35 mil', 'R$ 35 mil+']);
});

test('inferFallbackChips should infer adult chips from common prompts', () => {
    const text = 'Quantos adultos vão viajar?';

    const chips = inferFallbackChips(text);

    assert.deepEqual(chips, ['1', '2', '3', '4+']);
});

test('inferFallbackChips should infer children chips from common prompts', () => {
    const text = 'A viagem inclui crianças?';

    const chips = inferFallbackChips(text);

    assert.deepEqual(chips, ['Sim', 'Não']);
});
