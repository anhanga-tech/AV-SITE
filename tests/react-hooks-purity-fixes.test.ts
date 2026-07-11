/* eslint-disable @typescript-eslint/no-floating-promises -- node:test's `test()` returns a promise the runner awaits internally; top-level calls are meant to float, matching every other file under tests/. */
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Confetti } from '../components/landings/quiz/Confetti.tsx';
import { useAntiBot } from '../hooks/useAntiBot.ts';
import { useWhatsAppLink } from '../utils/whatsapp.ts';
import { HONEYPOT_FIELD, ELAPSED_TIME_FIELD } from '../lib/bot-detection.ts';

// Regression coverage for issue #1173: the react-hooks/purity and
// set-state-in-effect fixes must preserve the observable output of the three
// modules whose logic (not just comments) changed:
//   - Confetti: useMemo(Math.random) → lazy useState init
//   - useAntiBot: useRef(Date.now()) → lazy useState init
//   - useWhatsAppLink: effect-synced state → derived useMemo

test('Confetti (active) still renders 70 randomized pieces on first render', () => {
    const html = renderToStaticMarkup(React.createElement(Confetti, { active: true }));

    const spans = html.match(/quiz-conf /g) ?? [];
    assert.equal(spans.length, 70, 'deve renderizar exatamente 70 peças de confete');

    // Prove Math.random() actually ran (lazy init), not a single frozen value:
    // collect the `left: N%` values and assert they are not all identical.
    const lefts = [...html.matchAll(/left:\s*([\d.]+)%/g)].map((m) => Number(m[1]));
    assert.equal(lefts.length, 70, 'cada peça deve ter uma posição horizontal');
    for (const l of lefts) {
        assert.ok(l >= 0 && l <= 100, `left deve estar em [0,100], veio ${l}`);
    }
    assert.ok(new Set(lefts).size > 1, 'as posições devem ser aleatórias, não todas iguais');
});

test('Confetti (inactive) renders nothing', () => {
    const html = renderToStaticMarkup(React.createElement(Confetti, { active: false }));
    assert.equal(html, '', 'com active=false não deve renderizar nada');
});

test('useAntiBot exposes a finite non-negative elapsed time and empty honeypot', () => {
    const captured: Array<{ honeypot: string; elapsed: number }> = [];

    const Harness: React.FC = () => {
        const { getAntiBotFields } = useAntiBot();
        const fields = getAntiBotFields();
        captured.push({
            honeypot: fields[HONEYPOT_FIELD],
            elapsed: fields[ELAPSED_TIME_FIELD],
        });
        return null;
    };

    renderToStaticMarkup(React.createElement(Harness));

    assert.equal(captured.length, 1, 'o harness deve ter chamado getAntiBotFields');
    assert.equal(captured[0].honeypot, '', 'honeypot deve ser string vazia sem input preenchido');
    assert.ok(Number.isFinite(captured[0].elapsed), 'elapsedMs deve ser um número finito');
    assert.ok(captured[0].elapsed >= 0, 'elapsedMs não pode ser negativo');
});

test('useWhatsAppLink derives a wa.me URL with the encoded message', () => {
    let url = '';

    const Harness: React.FC = () => {
        url = useWhatsAppLink('Olá, quero um orçamento!');
        return null;
    };

    renderToStaticMarkup(React.createElement(Harness));

    assert.ok(url.startsWith('https://wa.me/'), `deve começar com wa.me, veio: ${url}`);
    assert.ok(
        url.includes(encodeURIComponent('Olá, quero um orçamento!')),
        'a mensagem deve estar codificada na URL',
    );
});
