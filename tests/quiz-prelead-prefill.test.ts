import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PreLeadScreen } from '../components/landings/quiz/PreLeadScreen';
import { TRAVELER_PROFILES, type LeadForm } from '../data/quiz';

const profile = TRAVELER_PROFILES.escapista;
const noop = () => {};

function renderScreen(initialValues?: Partial<LeadForm>): string {
    return renderToStaticMarkup(
        React.createElement(
            MemoryRouter,
            null,
            React.createElement(PreLeadScreen, {
                profile,
                onSubmit: noop,
                onBack: noop,
                isSubmitting: false,
                initialValues,
            }),
        ),
    );
}

test('pré-preenche os campos com os valores da URL', () => {
    const html = renderScreen({ nome: 'João', sobrenome: 'Silva', email: 'joao@example.com' });

    assert.match(html, /id="quiz-nome"[^>]*value="João"/);
    assert.doesNotMatch(html, /id="quiz-sobrenome"/);
    assert.match(html, /id="quiz-email"[^>]*value="joao@example.com"/);
});

test('sem initialValues, o formulário inicia vazio (sem regressão)', () => {
    const html = renderScreen();

    assert.match(html, /id="quiz-nome"[^>]*value=""/);
    assert.doesNotMatch(html, /id="quiz-sobrenome"/);
    assert.match(html, /id="quiz-email"[^>]*value=""/);
});

test('campos parciais: só o que veio na URL é preenchido', () => {
    const html = renderScreen({ email: 'so-email@example.com' });

    assert.match(html, /id="quiz-nome"[^>]*value=""/);
    assert.match(html, /id="quiz-email"[^>]*value="so-email@example.com"/);
});

test('o aceite de newsletter nunca é pré-marcado a partir do link', () => {
    // `aceite` fica de fora de initialValues de propósito: opt-in explícito (LGPD).
    const html = renderScreen({ nome: 'João', email: 'joao@example.com' });

    assert.doesNotMatch(html, /type="checkbox"[^>]*checked/);
});
