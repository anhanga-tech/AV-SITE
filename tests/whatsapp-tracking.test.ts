import test from 'node:test';
import assert from 'node:assert/strict';
import { getWhatsAppLink, getTrackingDataObject } from '../utils/whatsapp.ts';

const WHATSAPP_BASE = 'https://wa.me/551152833309';

function decodeMessageFrom(url: string): string {
    const part = url.split('?text=')[1];
    return decodeURIComponent(part ?? '');
}

test('getWhatsAppLink returns URL with correct WhatsApp number', () => {
    const url = getWhatsAppLink('Olá');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink URL-encodes the message', () => {
    const url = getWhatsAppLink('Olá, quero saber mais!');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá, quero saber mais!');
});

test('getWhatsAppLink strips || Dados: suffix from message', () => {
    const url = getWhatsAppLink('Olá || Dados: utm_source=google, utm_medium=cpc');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Olá');
});

test('getWhatsAppLink strips [ref: suffix from message', () => {
    const url = getWhatsAppLink('Mensagem [ref: abc123]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink strips both suffixes when both are present (priority to || Dados:)', () => {
    const url = getWhatsAppLink('Texto || Dados: x=1 [ref: abc]');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Texto');
});

test('getWhatsAppLink trims trailing whitespace after stripping suffix', () => {
    const url = getWhatsAppLink('Mensagem   ');
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
});

test('getWhatsAppLink with appendTrackingRef=false (default) does not append tracking data', () => {
    const url = getWhatsAppLink('Mensagem simples');
    const decoded = decodeMessageFrom(url);
    assert.ok(!decoded.includes('|| Dados:'));
});

test('getWhatsAppLink with appendTrackingRef=true but no tracking available omits Dados suffix', () => {
    // In Node.js, window is undefined — no tracking data can be captured
    const url = getWhatsAppLink('Mensagem', { appendTrackingRef: true });
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, 'Mensagem');
    assert.ok(!decoded.includes('|| Dados:'));
});

test('getWhatsAppLink with empty message returns URL with empty text', () => {
    const url = getWhatsAppLink('');
    assert.ok(url.startsWith(WHATSAPP_BASE + '?text='));
});

test('getWhatsAppLink handles message with special characters', () => {
    const msg = 'Viagem: São Paulo → Orlando (2 adultos)';
    const url = getWhatsAppLink(msg);
    const decoded = decodeMessageFrom(url);
    assert.equal(decoded, msg);
});

test('getTrackingDataObject returns null in Node.js environment (no window)', () => {
    const result = getTrackingDataObject();
    assert.equal(result, null);
});
