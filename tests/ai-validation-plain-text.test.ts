import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBudgetToolArgs } from '../lib/ai/validation.ts';
import type { BudgetToolArgs } from '../lib/ai/types.ts';

function buildValidArgs(overrides: Partial<BudgetToolArgs>): BudgetToolArgs {
    return {
        destination: 'Orlando',
        destination_city: 'Orlando',
        destination_region: 'Flórida',
        origin_city: 'São Paulo',
        origin_region: 'SP',
        dates: 'junho de 2026',
        adults: 2,
        need_summary: 'Viagem em família',
        decision_role: 'casal',
        budget_range: 'R$ 20 mil+',
        timeline_window: 'junho de 2026',
        baggage_preference: 'bagagem despachada',
        trip_scope: 'international',
        ...overrides,
    };
}

test('validateBudgetToolArgs rejects markdown links in destination', () => {
    const result = validateBudgetToolArgs(
        buildValidArgs({
            destination: 'Paris [clique aqui](https://attacker.example)',
            destination_city: 'Paris [clique aqui](https://attacker.example)',
            destination_region: '',
        }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.missing.includes('destination_city'));
});

test('validateBudgetToolArgs rejects raw URLs in destination', () => {
    const result = validateBudgetToolArgs(
        buildValidArgs({
            destination: 'Paris http://attacker.example',
            destination_city: 'Paris http://attacker.example',
            destination_region: '',
        }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.missing.includes('destination_city'));
});

test('validateBudgetToolArgs rejects wa.me links in destination', () => {
    const result = validateBudgetToolArgs(
        buildValidArgs({
            destination: 'Confira wa.me/5511999999999',
            destination_city: 'Confira wa.me/5511999999999',
            destination_region: '',
        }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.missing.includes('destination_city'));
});

test('validateBudgetToolArgs accepts a legitimate destination', () => {
    const result = validateBudgetToolArgs(buildValidArgs({}));

    assert.equal(result.valid, true);
    assert.ok(!result.missing.includes('destination_city'));
});

test('validateBudgetToolArgs accepts accented and hyphenated city names', () => {
    const result = validateBudgetToolArgs(
        buildValidArgs({
            destination: 'São João del-Rei',
            destination_city: 'São João del-Rei',
            destination_region: '',
            trip_scope: 'national',
            origin_region: 'Brasil',
            baggage_preference: '',
        }),
    );

    assert.equal(result.valid, true);
    assert.ok(!result.missing.includes('destination_city'));
});

test('validateBudgetToolArgs rejects markdown in origin_city', () => {
    const result = validateBudgetToolArgs(
        buildValidArgs({
            origin_city: '[São Paulo](https://attacker.example)',
        }),
    );

    assert.equal(result.valid, false);
    assert.ok(result.missing.includes('origin_city'));
});
