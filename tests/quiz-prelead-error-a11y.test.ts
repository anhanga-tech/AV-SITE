import './helpers/dom-setup.ts';

import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PreLeadScreen } from '../components/landings/quiz/PreLeadScreen.tsx';
import { TRAVELER_PROFILES } from '../data/quiz.ts';

/*
  Regressão para o gap de acessibilidade registrado em .Jules/palette.md
  (2026-10-07): os campos nome/e-mail do quiz marcavam erro só via classe
  CSS (`has-error`), sem `aria-invalid`/`aria-describedby`/`role="alert"` —
  o padrão já seguido por TextField/FormField/CorpFormFields. Usuário de
  leitor de tela clicava em "Revelar meu perfil" sem nenhuma pista de que
  os campos ficaram inválidos.
*/

const profile = TRAVELER_PROFILES.escapista;

function renderScreen() {
    return render(
        React.createElement(
            MemoryRouter,
            null,
            React.createElement(PreLeadScreen, {
                profile,
                onSubmit: () => {},
                onBack: () => {},
                isSubmitting: false,
            }),
        ),
    );
}

test('submit vazio associa os erros de nome/e-mail aos inputs via aria-describedby', () => {
    const { getByText, container } = renderScreen();

    fireEvent.click(getByText('Revelar meu perfil'));

    const nomeInput = container.querySelector('#quiz-nome');
    const emailInput = container.querySelector('#quiz-email');
    assert.ok(nomeInput, 'input de nome deve existir');
    assert.ok(emailInput, 'input de e-mail deve existir');

    assert.equal(nomeInput!.getAttribute('aria-invalid'), 'true');
    assert.equal(emailInput!.getAttribute('aria-invalid'), 'true');

    const nomeErrorId = nomeInput!.getAttribute('aria-describedby');
    const emailErrorId = emailInput!.getAttribute('aria-describedby');
    assert.ok(nomeErrorId, 'input de nome deve referenciar o erro via aria-describedby');
    assert.ok(emailErrorId, 'input de e-mail deve referenciar o erro via aria-describedby');

    const nomeErrorEl = container.querySelector(`#${nomeErrorId}`);
    const emailErrorEl = container.querySelector(`#${emailErrorId}`);
    assert.ok(nomeErrorEl, 'elemento de erro do nome deve existir no DOM');
    assert.ok(emailErrorEl, 'elemento de erro do e-mail deve existir no DOM');
    assert.equal(nomeErrorEl!.getAttribute('role'), 'alert');
    assert.equal(emailErrorEl!.getAttribute('role'), 'alert');

    cleanup();
});

test('sem erro, os inputs não têm aria-invalid nem aria-describedby', () => {
    const { container } = renderScreen();

    const nomeInput = container.querySelector('#quiz-nome');
    const emailInput = container.querySelector('#quiz-email');

    assert.equal(nomeInput!.getAttribute('aria-invalid'), null);
    assert.equal(nomeInput!.getAttribute('aria-describedby'), null);
    assert.equal(emailInput!.getAttribute('aria-invalid'), null);
    assert.equal(emailInput!.getAttribute('aria-describedby'), null);

    cleanup();
});
