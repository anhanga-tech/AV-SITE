import test from 'node:test';
import assert from 'node:assert/strict';
import { linksPageConfig, type LinkItem } from '../data/linksPage.ts';
import { isSupportedIcon } from '../components/links/linkIcons.ts';
import { ORIGIN_TOKEN, applyOriginToMessage } from '../utils/linksTracking.ts';
import {
    FEATURED_DESTINATION_IDS,
    MORE_DESTINATION_IDS,
    PRODUCT_LINK_IDS,
    getLinksPageVisibility,
    getUnassignedVisibleLinks,
    getVisibleLinksForIds,
    getSoleIntentCardSpanClass,
    resolveSelectedIntent,
} from '../utils/linksPageLayout.ts';
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

// O destino de um link cal-modal é fixo (CONSULTORIA_BOOKING_URL, lib/cal-embed.ts), não vem da
// config — declarar href/whatsappMessage aqui seria campo morto que ninguém lê.
test('todo link cal-modal não declara href nem whatsappMessage', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'cal-modal')) {
        assert.equal(link.href, undefined, `${link.id} não deveria ter href`);
        assert.equal(link.whatsappMessage, undefined, `${link.id} não deveria ter whatsappMessage`);
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

test('link visível fora das seções categorizadas entra no fallback', () => {
    const links: LinkItem[] = [
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            type: 'whatsapp',
            whatsappMessage: 'Olá!',
            visible: true,
        },
        {
            id: 'campanha-nova',
            label: 'Campanha nova',
            type: 'internal',
            href: '/campanha-nova',
            visible: true,
        },
    ];

    assert.deepEqual(getUnassignedVisibleLinks(links).map((link) => link.id), ['campanha-nova']);
});

test('atalho de produtos não encontra links ocultos', () => {
    const hiddenProducts: LinkItem[] = PRODUCT_LINK_IDS.map((id) => ({
        id,
        label: id,
        type: 'internal',
        href: `/${id}`,
        visible: false,
    }));

    assert.deepEqual(getVisibleLinksForIds(hiddenProducts, PRODUCT_LINK_IDS), []);
});

test('seções sem links visíveis ficam desativadas', () => {
    const hiddenSectionLinks: LinkItem[] = ['agendar-consultoria', 'quiz', 'site', ...FEATURED_DESTINATION_IDS, ...MORE_DESTINATION_IDS].map((id) => ({
        id,
        label: id,
        type: 'internal',
        href: `/${id}`,
        visible: false,
    }));

    assert.deepEqual(getLinksPageVisibility(hiddenSectionLinks), {
        hasPrimaryDestinations: false,
        hasVisibleDestinations: false,
        hasVisibleContact: false,
        hasVisibleOtherLinks: false,
    });
});

// Regressão (claude[bot] review, PR #1515): esse branch só roda quando um dos dois ramos de
// intenção não existe — a config atual de data/linksPage.ts sempre deixa os dois visíveis, então
// sem este teste direto na função pura ele nunca é exercido.
test('card de intenção único ocupa a linha inteira do grid', () => {
    assert.equal(getSoleIntentCardSpanClass(true, true), '');
    assert.equal(getSoleIntentCardSpanClass(true, false), ' sm:col-span-2');
    assert.equal(getSoleIntentCardSpanClass(false, true), ' sm:col-span-2');
    assert.equal(getSoleIntentCardSpanClass(false, false), ' sm:col-span-2');
});

// Regressão (Codex review, PR #1515): uma hash apontando para um ramo indisponível na config
// atual (ex.: link antigo para #preparar depois que todos os produtos ficaram ocultos) não pode
// virar uma "escolha" — não existe seção "não escolhida" para rebaixar quando só uma existe.
test('hash de um ramo de intenção indisponível não conta como escolha', () => {
    assert.equal(resolveSelectedIntent('#destinos', true, true), 'destinos');
    assert.equal(resolveSelectedIntent('#preparar', true, true), 'preparar');
    assert.equal(resolveSelectedIntent('#preparar', true, false), null, 'ramo de produtos indisponível');
    assert.equal(resolveSelectedIntent('#destinos', false, true), null, 'ramo de destinos indisponível');
    assert.equal(resolveSelectedIntent('', true, true), null);
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
            const resolved = applyOriginToMessage(link.whatsappMessage ?? '', '?utm_source=instagram');
            const decoded = decodeURIComponent(getWhatsAppLink(resolved).split('?text=')[1] ?? '');
            assert.equal(decoded, resolved, `${link.id}: algo foi anexado depois do prompt`);
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

// A "Regra do Âmbar" do DESIGN.md reserva o Âmbar Vivo a 1 elemento por tela, e o amarelo
// da página é justamente o CTA dominante. `data/linksPage.ts` é marcado ⚙️ EDITÁVEL para
// quem não é engenheiro, então o invariante precisa falhar no CI e não no olho de alguém.
test('no máximo um link amarelo visível (Regra do Âmbar)', () => {
    const destacados = linksPageConfig.links.filter((l) => l.visible && l.highlight);
    assert.ok(destacados.length <= 1, `${destacados.length} links com highlight: ${destacados.map((l) => l.id).join(', ')}`);
});

// LinkButton reserva o tier hard-shadow (`highlight`/`primary`) à ação de maior intenção —
// PRODUCT.md: "peso físico só onde se age... reservados aos pontos de ação". Espalhar esse tier
// pela pilha inteira (o que `isPrimaryLink` fazia antes, usando ícone/sublabel como proxy) apaga
// o sinal de qual ação é dominante. Ver crítica de /links de 2026-08-26.
test('poucos links usam o tier de peso físico (highlight + primary)', () => {
    const pesados = linksPageConfig.links.filter((l) => l.visible && (l.highlight || l.primary));
    assert.ok(pesados.length <= 2, `${pesados.length} links com peso físico: ${pesados.map((l) => l.id).join(', ')}`);
});

test('banner e link destacado não coexistem (Regra do Âmbar)', () => {
    const temLinkDestacado = linksPageConfig.links.some((l) => l.visible && l.highlight);
    assert.ok(
        !(linksPageConfig.banner.visible && temLinkDestacado),
        'banner e link com highlight ligados ao mesmo tempo colocam dois amarelos na 1ª dobra',
    );
});

// /links é alcançável de qualquer bio, não só do Instagram. Fixar a origem na mensagem faz
// a copy afirmar algo falso e descarta a origem real antes do atendimento e do CRM.
test('mensagens de whatsapp usam o marcador de origem em vez de fixá-la', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'whatsapp')) {
        const message = link.whatsappMessage ?? '';
        assert.ok(message.includes(ORIGIN_TOKEN), `${link.id} não usa ${ORIGIN_TOKEN}`);
        assert.doesNotMatch(message, /Vim pel[oa]\s/i, `${link.id} fixa a origem no texto`);
    }
});
