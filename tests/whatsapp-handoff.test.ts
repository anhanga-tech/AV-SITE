import './helpers/dom-setup.ts';

import test from 'node:test';
import assert from 'node:assert/strict';

import { reserveWhatsAppWindow } from '../utils/whatsappHandoff.ts';

function withWindowOpen(mock: () => unknown, run: () => void) {
    const previous = window.open;
    Object.defineProperty(window, 'open', {
        configurable: true,
        value: mock,
    });
    try {
        run();
    } finally {
        Object.defineProperty(window, 'open', {
            configurable: true,
            value: previous,
        });
    }
}

test('reserveWhatsAppWindow navega a aba reservada quando window.open retorna um handle utilizável', () => {
    let navigatedTo: string | null = null;
    let closedCount = 0;
    withWindowOpen(
        () => ({
            closed: false,
            close() { closedCount += 1; },
            location: { set href(v: string) { navigatedTo = v; } },
            opener: 'writable',
        }),
        () => {
            const handoff = reserveWhatsAppWindow();
            const opened = handoff.open('https://wa.me/5511955021519?text=test');

            assert.equal(opened, true);
            assert.equal(navigatedTo, 'https://wa.me/5511955021519?text=test');
            assert.equal(closedCount, 0);
        },
    );
});

test('reserveWhatsAppWindow injeta <meta name="referrer" content="no-referrer"> na aba reservada, replicando o `noreferrer` do window.open direto anterior', () => {
    // `handle.opener = null` só bloqueia o vetor de reverse-tabnabbing — não
    // impede o header `Referer` de ser enviado ao WhatsApp na navegação
    // posterior, o que o `window.open(url, '_blank', 'noopener,noreferrer')'
    // anterior evitava. A aba reservada começa em about:blank (mesma
    // origem), então seu document é gravável aqui.
    const appended: Array<{ name: string; content: string }> = [];
    withWindowOpen(
        () => ({
            closed: false,
            close() {},
            location: { set href(_v: string) {} },
            opener: 'writable',
            document: {
                createElement(tag: string) {
                    assert.equal(tag, 'meta');
                    return { name: '', content: '' } as { name: string; content: string };
                },
                head: {
                    appendChild(meta: { name: string; content: string }) {
                        appended.push(meta);
                    },
                },
            },
        }),
        () => {
            reserveWhatsAppWindow();

            assert.equal(appended.length, 1, 'deve injetar exatamente uma meta tag de referrer');
            assert.equal(appended[0].name, 'referrer');
            assert.equal(appended[0].content, 'no-referrer');
        },
    );
});

test('reserveWhatsAppWindow retorna um handoff inerte quando o popup é bloqueado (window.open retorna null)', () => {
    withWindowOpen(
        () => null,
        () => {
            const handoff = reserveWhatsAppWindow();
            const opened = handoff.open('https://wa.me/5511955021519?text=test');

            assert.equal(opened, false, 'open() deve retornar false sem lançar quando não há aba para navegar');
            assert.doesNotThrow(() => handoff.cancel(), 'cancel() deve ser um no-op seguro');
        },
    );
});

test('reserveWhatsAppWindow retorna um objeto distinto a cada chamada mesmo quando o popup é bloqueado', () => {
    // Chamadores comparam handoffs por identidade (ex.:
    // `activeHandoffRef.current !== whatsappHandoff`) para saber se uma
    // reserva específica já foi cancelada por outra coisa. Um singleton
    // compartilhado faria duas reservas bloqueadas não relacionadas
    // compararem como iguais, deixando a limpeza de uma submissão cancelar
    // o handoff ainda ativo de outra (ex.: reset() + reenvio do modal de
    // contato antes da primeira resposta chegar).
    withWindowOpen(
        () => null,
        () => {
            const first = reserveWhatsAppWindow();
            const second = reserveWhatsAppWindow();

            assert.notStrictEqual(first, second, 'cada reserva deve retornar um objeto próprio, não um singleton');
        },
    );
});

test('reserveWhatsAppWindow fecha a aba e não navega quando o navegador rejeita zerar `opener`', () => {
    // Alguns navegadores tornam `opener` somente-leitura. Sem conseguir
    // confirmar o isolamento que `noopener` garantiria, o handoff não pode
    // navegar essa aba — senão a página do WhatsApp (ou um redirect na
    // cadeia dela) manteria uma referência de volta a este site.
    let closedCount = 0;
    let navigatedTo: string | null = null;
    withWindowOpen(
        () => ({
            closed: false,
            close() { closedCount += 1; },
            location: { set href(v: string) { navigatedTo = v; } },
            set opener(_value: unknown) {
                throw new Error('opener é somente-leitura neste navegador');
            },
        }),
        () => {
            const handoff = reserveWhatsAppWindow();

            assert.equal(closedCount, 1, 'a aba deve ser fechada imediatamente ao falhar o isolamento do opener');

            const opened = handoff.open('https://wa.me/5511955021519?text=test');

            assert.equal(opened, false, 'não deve navegar uma aba cujo isolamento não pôde ser confirmado');
            assert.equal(navigatedTo, null);
            assert.doesNotThrow(() => handoff.cancel());
        },
    );
});

test('reserveWhatsAppWindow fecha a aba quando a navegação em si lança (não deixa uma aba órfã em branco)', () => {
    let closedCount = 0;
    withWindowOpen(
        () => ({
            closed: false,
            close() { closedCount += 1; },
            get location() {
                return {
                    set href(_v: string) {
                        throw new Error('não foi possível navegar esta aba');
                    },
                };
            },
            opener: 'writable',
        }),
        () => {
            const handoff = reserveWhatsAppWindow();
            const opened = handoff.open('https://wa.me/5511955021519?text=test');

            assert.equal(opened, false, 'open() deve retornar false quando a navegação lança');
            assert.equal(closedCount, 1, 'a aba deve ser fechada em vez de deixada em branco quando não pode navegar');
        },
    );
});
