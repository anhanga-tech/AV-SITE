import './helpers/dom-setup.ts';

import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent, cleanup } from '@testing-library/react';

import { WhatsAppUpgrade } from '../components/landings/quiz/WhatsAppUpgrade.tsx';

/*
  O botão "Enviar" nasce desabilitado até o telefone ter DDD + número; sem
  texto de apoio, quem usa leitor de tela (ou teclado) não sabia por quê.
  Mesmo padrão do hint de /nps (.Jules/palette.md, 2026-10-21).
*/

function renderUpgrade() {
    return render(
        React.createElement(WhatsAppUpgrade, {
            profileName: 'Escapista',
            mainDestName: 'Lisboa',
            firstName: 'Ana',
            baseWaUrl: 'https://wa.me/5511999999999',
            onPhoneSubmit: () => {},
        }),
    );
}

test('instrução fica ligada ao input e ao botão desabilitado', () => {
    const { container, getByText } = renderUpgrade();
    const hint = container.querySelector('#quiz-wa-hint');
    assert.ok(hint, 'hint deve existir');
    assert.equal(hint!.textContent, 'Opcional: digite o DDD e o número para enviar');
    assert.equal(container.querySelector('input')!.getAttribute('aria-describedby'), 'quiz-wa-hint');
    const button = getByText('Enviar') as HTMLButtonElement;
    assert.equal(button.disabled, true);
    assert.equal(button.getAttribute('aria-describedby'), 'quiz-wa-hint');
    cleanup();
});

test('telefone válido habilita o botão e mantém a instrução como descrição do campo', () => {
    const { container, getByText } = renderUpgrade();
    fireEvent.change(container.querySelector('input')!, { target: { value: '11999998888' } });
    assert.ok(container.querySelector('#quiz-wa-hint')!.textContent!.length > 0);
    assert.equal(container.querySelector('input')!.getAttribute('aria-describedby'), 'quiz-wa-hint');
    assert.equal((getByText('Enviar') as HTMLButtonElement).disabled, false);
    cleanup();
});

test('input de telefone usa teclado numérico e autocomplete nacional', () => {
    const { container } = renderUpgrade();
    const input = container.querySelector('input')!;
    assert.equal(input.getAttribute('inputmode'), 'tel');
    assert.equal(input.getAttribute('autocomplete'), 'tel-national');
    cleanup();
});
