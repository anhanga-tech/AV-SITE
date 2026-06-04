import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGenerateHandoff } from '../lib/ai/handoff.ts';
import type { BudgetToolArgs } from '../lib/ai/types.ts';

const BASE_ARGS: BudgetToolArgs = {
    origin_city: 'São Paulo',
    origin_region: 'SP',
    destination_city: 'Orlando',
    destination_region: 'Flórida',
    dates: 'junho de 2026',
    budget_range: 'R$ 10.000',
    need_summary: 'Família com 2 filhos',
    decision_role: 'Decisor',
    timeline_window: '3 meses',
    baggage_preference: 'bagagem despachada',
    iata_code: 'mco',
};

test('buildGenerateHandoff formats origin with city and region', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'tool');
    assert.equal(result.origin, 'São Paulo, SP');
});

test('buildGenerateHandoff formats destination with city and region', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'tool');
    assert.equal(result.destination, 'Orlando, Flórida');
});

test('buildGenerateHandoff uses only city when region is absent', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, origin_region: undefined }, 'tool');
    assert.equal(result.origin, 'São Paulo');
});

test('buildGenerateHandoff uses only region when city is absent', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, origin_city: undefined }, 'tool');
    assert.equal(result.origin, 'SP');
});

test('buildGenerateHandoff falls back to Origem a definir when city and region are both absent', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, origin_city: undefined, origin_region: undefined }, 'tool');
    assert.equal(result.origin, 'Origem a definir');
});

test('buildGenerateHandoff uses destination field as fallback when city and region are absent', () => {
    const result = buildGenerateHandoff({
        ...BASE_ARGS,
        destination_city: undefined,
        destination_region: undefined,
        destination: 'Caribe',
    }, 'tool');
    assert.equal(result.destination, 'Caribe');
});

test('buildGenerateHandoff falls back to Destino a definir when all destination fields are absent', () => {
    const result = buildGenerateHandoff({
        ...BASE_ARGS,
        destination_city: undefined,
        destination_region: undefined,
        destination: undefined,
    }, 'tool');
    assert.equal(result.destination, 'Destino a definir');
});

test('buildGenerateHandoff uppercases and truncates IATA code to 3 chars', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, iata_code: 'mcoXXX' }, 'tool');
    assert.equal(result.iataCode, 'MCO');
});

test('buildGenerateHandoff sets iataCode to undefined when iata_code is empty string', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, iata_code: '' }, 'tool');
    assert.equal(result.iataCode, undefined);
});

test('buildGenerateHandoff sets iataCode to undefined when iata_code is absent', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, iata_code: undefined }, 'tool');
    assert.equal(result.iataCode, undefined);
});

test('buildGenerateHandoff preserves baggagePreference when set', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'tool');
    assert.equal(result.baggagePreference, 'bagagem despachada');
});

test('buildGenerateHandoff sets baggagePreference to undefined when empty string', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, baggage_preference: '' }, 'tool');
    assert.equal(result.baggagePreference, undefined);
});

test('buildGenerateHandoff preserves source=tool', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'tool');
    assert.equal(result.source, 'tool');
});

test('buildGenerateHandoff preserves source=repair', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'repair');
    assert.equal(result.source, 'repair');
});

test('buildGenerateHandoff uses A definir for dates when absent', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, dates: undefined }, 'tool');
    assert.equal(result.dates, 'A definir');
});

test('buildGenerateHandoff uses A definir for dates when empty string', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, dates: '   ' }, 'tool');
    assert.equal(result.dates, 'A definir');
});

test('buildGenerateHandoff bantSummary includes all BANT fields', () => {
    const result = buildGenerateHandoff(BASE_ARGS, 'tool');
    assert.ok(result.bantSummary.includes('Need: Família com 2 filhos'));
    assert.ok(result.bantSummary.includes('Authority: Decisor'));
    assert.ok(result.bantSummary.includes('Budget: R$ 10.000'));
    assert.ok(result.bantSummary.includes('Timeline: 3 meses'));
});

test('buildGenerateHandoff bantSummary appends Visto EUA note when visa_status is pendente', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, visa_status: 'pendente' }, 'tool');
    assert.ok(result.bantSummary.includes('Visto EUA: Pendente'));
});

test('buildGenerateHandoff bantSummary does not append Visto EUA for other visa statuses', () => {
    const result = buildGenerateHandoff({ ...BASE_ARGS, visa_status: 'ok' }, 'tool');
    assert.ok(!result.bantSummary.includes('Visto EUA'));
});

test('buildGenerateHandoff bantSummary uses defaults when BANT fields are absent', () => {
    const result = buildGenerateHandoff({ origin_city: 'São Paulo', destination_city: 'Orlando' }, 'tool');
    assert.ok(result.bantSummary.includes('Budget: A definir'));
    assert.ok(result.bantSummary.includes('Need: Não informado'));
    assert.ok(result.bantSummary.includes('Authority: Não informado'));
    assert.ok(result.bantSummary.includes('Timeline: Não informado'));
});
