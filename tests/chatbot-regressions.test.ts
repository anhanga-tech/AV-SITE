import test from 'node:test';
import assert from 'node:assert/strict';
import { detectBlockedDestination, SYSTEM_INSTRUCTION } from '../api/generate.ts';

test('safety check should not confuse "Emirados" with "Irã"', () => {
    const result = detectBlockedDestination('Dubai, Emirados Árabes Unidos');
    assert.equal(result, null);
});

test('safety check should still block explicit Iran destinations', () => {
    const result = detectBlockedDestination('Teerã, Irã');
    assert.ok(result, 'Iran must be blocked');
    assert.equal(result?.country, 'Irã');
    assert.equal(result?.category, 'sanctions');
});

test('system prompt should avoid budget pressure before handoff', () => {
    assert.match(
        SYSTEM_INSTRUCTION,
        /Nunca confronte o cliente sobre "orçamento insuficiente"/,
    );
    assert.match(
        SYSTEM_INSTRUCTION,
        /Evite perguntas de confirmação sobre escopo e taxonomia de orçamento/,
    );
});
