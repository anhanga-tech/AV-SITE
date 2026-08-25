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
