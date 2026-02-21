import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_CHAT_MESSAGES, canSendMessage, getAssistantPresentation, getHandoffFromResponse } from '../hooks/useChatSession.ts';

test('canSendMessage should enforce 50-message limit', () => {
    assert.equal(canSendMessage(MAX_CHAT_MESSAGES - 1, false), true);
    assert.equal(canSendMessage(MAX_CHAT_MESSAGES, false), false);
});

test('canSendMessage should block while loading', () => {
    assert.equal(canSendMessage(1, true), false);
});

test('getAssistantPresentation should strip structured chips and expose options', () => {
    const responseText = 'Quantos adultos viajarão?\n[CHIPS: 1 adulto | 2 adultos | 3 adultos]';

    const presentation = getAssistantPresentation(responseText);

    assert.equal(presentation.cleanText, 'Quantos adultos viajarão?');
    assert.deepEqual(presentation.chips, ['1 adulto', '2 adultos', '3 adultos']);
});

test('getHandoffFromResponse should expose handoff payload when tool call is returned', () => {
    const handoff = getHandoffFromResponse({
        budgetLink: {
            origin: 'São Paulo, SP',
            destination: 'Rio de Janeiro, RJ',
            dates: 'setembro',
            baggagePreference: 'Mala de mão',
            url: 'https://wa.me/551152833309?text=teste',
            bantSummary: 'Need: lazer',
        },
    });

    assert.ok(handoff);
    assert.equal(handoff?.destination, 'Rio de Janeiro, RJ');
});
