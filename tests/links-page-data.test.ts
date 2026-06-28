import test from 'node:test';
import assert from 'node:assert/strict';
import { linksPageConfig, type LinkItem } from '../data/linksPage.ts';

test('ids dos links são únicos', () => {
    const ids = linksPageConfig.links.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length);
});

test('todo link whatsapp tem whatsappMessage não vazio', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'whatsapp')) {
        assert.ok(link.whatsappMessage && link.whatsappMessage.trim().length > 0, `${link.id} sem mensagem`);
    }
});

test('todo link external tem href absoluto https', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'external')) {
        assert.match(link.href ?? '', /^https:\/\//, `${link.id} href inválido`);
    }
});

test('todo link internal tem href relativo (começa com /)', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'internal')) {
        assert.match(link.href ?? '', /^\//, `${link.id} href inválido`);
    }
});

test('banner visível está bem-formado', () => {
    const { banner } = linksPageConfig;
    if (banner.visible) {
        assert.ok(banner.title.trim().length > 0);
        assert.ok(banner.ctaLabel.trim().length > 0);
        assert.match(banner.href, /^\//);
    }
});

test('todo link tem label e visible booleano', () => {
    for (const link of linksPageConfig.links as LinkItem[]) {
        assert.ok(link.label.trim().length > 0, `${link.id} sem label`);
        assert.equal(typeof link.visible, 'boolean');
    }
});
