import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';
import { formatReviewCountLabel } from '../components/links/reviewFormatting.ts';
import { TrustSeals } from '../components/links/TrustSeals.tsx';

test('formatReviewCountLabel omite a contagem quando totalReviews é 0', () => {
    assert.equal(formatReviewCountLabel(0), null);
});

test('formatReviewCountLabel usa singular "avaliação" para 1 review', () => {
    assert.equal(formatReviewCountLabel(1), '1 avaliação');
});

test('formatReviewCountLabel usa plural "avaliações" para 2+ reviews', () => {
    assert.equal(formatReviewCountLabel(3), '3 avaliações');
});

/*
  P2 e P3 da crítica de /links de 2026-08-27: o rodapé terminava em nota administrativa
  (Cadastur + razão social, sem nenhuma linha calorosa) e o hover do link do Cadastur usava
  `text-anhanga-yellow` — um segundo elemento âmbar na tela ao lado do WhatsApp já em
  destaque, violando a Regra do Âmbar do DESIGN.md.
*/
afterEach(cleanup);

test('TrustSeals abre com uma linha calorosa antes do bloco de compliance', () => {
    const { container } = render(React.createElement(TrustSeals));
    assert.match(container.textContent ?? '', /Um WhatsApp de distância, sempre que precisar\./);
    assert.match(container.textContent ?? '', /Cadastur/);
    assert.match(container.textContent ?? '', /ANHANGA TURISMO LTDA/);
});

test('TrustSeals não usa mais o hover âmbar no link do Cadastur', () => {
    const { container } = render(React.createElement(TrustSeals));
    const cadasturLink = container.querySelector('a[href="https://cadastur.turismo.gov.br/hotsite/"]');
    assert.ok(cadasturLink, 'link do Cadastur não encontrado');
    assert.doesNotMatch(cadasturLink!.className, /anhanga-yellow/);
});
