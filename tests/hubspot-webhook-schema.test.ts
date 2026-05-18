import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HubSpotWebhookEventSchema,
    HubSpotWebhookPayloadSchema,
} from '../lib/schemas/hubspot-webhook.ts';

test('aceita array válido com evento completo', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse([
        {
            subscriptionType: 'deal.propertyChange',
            propertyName: 'dealstage',
            propertyValue: 'closedwon',
            objectId: 123,
        },
    ]);
    assert.equal(result.success, true);
});

test('aceita array vazio', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse([]);
    assert.equal(result.success, true);
});

test('aceita evento com todos os campos opcionais ausentes', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse([{}]);
    assert.equal(result.success, true);
});

test('aceita objectId como string', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse([{ objectId: '456' }]);
    assert.equal(result.success, true);
});

test('aceita objectId como number', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse([{ objectId: 456 }]);
    assert.equal(result.success, true);
});

test('rejeita payload que não é array', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse({ subscriptionType: 'deal.propertyChange' });
    assert.equal(result.success, false);
});

test('rejeita payload null', () => {
    const result = HubSpotWebhookPayloadSchema.safeParse(null);
    assert.equal(result.success, false);
});

test('passthrough preserva campos extras no evento', () => {
    const result = HubSpotWebhookEventSchema.safeParse({
        subscriptionType: 'contact.creation',
        extraField: 'valor-extra',
    });
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal((result.data as Record<string, unknown>)['extraField'], 'valor-extra');
    }
});

test('rejeita subscriptionType não-string', () => {
    const result = HubSpotWebhookEventSchema.safeParse({ subscriptionType: 42 });
    assert.equal(result.success, false);
});
