import test from 'node:test';
import assert from 'node:assert/strict';
import { linksPageConfig, type LinkItem } from '../data/linksPage.ts';
import { isSupportedIcon } from '../components/links/linkIcons.ts';
import { getWhatsAppLink, getTrackingDataObject } from '../utils/whatsapp.ts';

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

test('mensagens de whatsapp não terminam em espaço', () => {
    // `buildWhatsAppLink` aplica `.trim()`, então um espaço à direita some antes de chegar ao
    // WhatsApp. Escrever a mensagem contando com ele daria "Meu destino:Noronha" na prática.
    for (const link of linksPageConfig.links.filter((l) => l.type === 'whatsapp')) {
        const message = link.whatsappMessage ?? '';
        assert.equal(message, message.trimEnd(), `${link.id} tem espaço à direita`);
    }
});

test('todo icon declarado existe no ICON_MAP do LinkButton', () => {
    for (const link of linksPageConfig.links.filter((l) => l.icon)) {
        assert.ok(isSupportedIcon(link.icon as string), `${link.id} usa icon inexistente: ${link.icon}`);
    }
});

// Regressão (codex, PR #1488): o prompt editável tem que ser a última coisa da mensagem, senão
// o cursor do WhatsApp cai depois do que vier anexado e a pessoa digita no lugar errado —
// "Meu destino: || Dados: utm_source=instagramNoronha".
test('a mensagem termina no prompt editável mesmo com tracking na sessão', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
    const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            dataLayer: [],
            location: {
                search: '?utm_source=instagram&gclid=Cj0KTEST',
                hash: '',
                href: 'https://example.com/links?utm_source=instagram&gclid=Cj0KTEST',
            },
        },
    });
    Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { cookie: '_ga=GA1.1.1234567890.1699887766' },
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: { getItem: () => null, setItem: () => {} },
    });

    try {
        assert.equal(getTrackingDataObject()?.gclid, 'Cj0KTEST', 'fixture precisa ter tracking real');

        for (const link of linksPageConfig.links.filter((l) => l.type === 'whatsapp')) {
            const decoded = decodeURIComponent(getWhatsAppLink(link.whatsappMessage ?? '').split('?text=')[1] ?? '');
            assert.equal(decoded, link.whatsappMessage, `${link.id}: algo foi anexado depois do prompt`);
        }
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else Reflect.deleteProperty(globalThis, 'window');
        if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
        else Reflect.deleteProperty(globalThis, 'document');
        if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
        else Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
});
