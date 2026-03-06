import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBudgetToolCallFromText } from '../lib/ai/utils.ts';

test('extractBudgetToolCallFromText should parse JSON tool_call payload from plain text', () => {
    const text = `{ "tool_call": "generate_budget_link", "arguments": { "destination_city": "Cusco", "origin_city": "São Paulo", "dates": "Setembro", "adults": 3 } }`;
    const result = extractBudgetToolCallFromText(text);

    assert.ok(result);
    assert.equal(result?.name, 'generate_budget_link');
    assert.equal(result?.args.destination_city, 'Cusco');
});

test('extractBudgetToolCallFromText should parse fenced JSON payload', () => {
    const text = [
        'Basta clicar no link abaixo:',
        '```json',
        '{ "tool_call": "generate_budget_link", "arguments": { "destination_city": "Cusco", "origin_city": "São Paulo", "dates": "Setembro", "adults": 3 } }',
        '```',
    ].join('\n');

    const result = extractBudgetToolCallFromText(text);
    assert.ok(result);
    assert.equal(result?.name, 'generate_budget_link');
    assert.equal(result?.args.adults, 3);
});

test('extractBudgetToolCallFromText should return undefined for unrelated text', () => {
    const text = 'Machu Picchu é uma ótima escolha para setembro.';
    const result = extractBudgetToolCallFromText(text);
    assert.equal(result, undefined);
});
