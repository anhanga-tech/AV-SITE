import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, within } from '@testing-library/react';

import { NpsThankPromoter } from '../components/nps/NpsThankPromoter.tsx';
import { NpsThankOther } from '../components/nps/NpsThankOther.tsx';

/*
  Os CTAs das telas de agradecimento do NPS abrem em nova aba (`target="_blank"`) sem
  interceptação por JS. Mesmo padrão `sr-only "(abre em nova aba)"` de LinkButton,
  BlogImageCredit e Footer: sem o aviso, leitor de tela era levado para fora do site.
*/

afterEach(cleanup);

function assertNewTabNotice(container: HTMLElement, label: string) {
    // O nome acessível (via papel) precisa incluir o aviso: `aria-hidden` no span o removeria.
    const link = within(container).getByRole('link', {
        name: new RegExp(`^${label}\\s*\\(abre em nova aba\\)$`),
    });
    assert.equal(link.getAttribute('target'), '_blank');
    // O aviso é só para leitor de tela: sem `sr-only` o rótulo visual mudaria.
    const notice = Array.from(link.querySelectorAll('span')).find((el) =>
        /abre em nova aba/.test(el.textContent ?? ''),
    );
    assert.ok(notice, 'aviso "(abre em nova aba)" não encontrado');
    assert.ok(notice!.classList.contains('sr-only'), 'aviso deve manter a classe sr-only');
}

test('NpsThankPromoter avisa que o link da review no Google abre em nova aba', () => {
    const { container } = render(React.createElement(NpsThankPromoter, { firstname: 'Ana' }));
    assertNewTabNotice(container, 'Deixar minha review no Google');
});

test('NpsThankOther avisa que o link do WhatsApp abre em nova aba', () => {
    const { container } = render(React.createElement(NpsThankOther, { firstname: 'Ana' }));
    assertNewTabNotice(container, 'Falar no WhatsApp');
});
