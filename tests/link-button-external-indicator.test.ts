import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LinkButton } from '../components/links/LinkButton.tsx';
import type { LinkItem } from '../data/linksPage.ts';

/*
  P2 da crítica de /links de 2026-08-27: whatsapp/external abriam em nova aba sem nenhum
  sinal visual ou de acessibilidade que os distinguisse de uma navegação interna — quem
  tocava caía sem aviso num domínio de terceiro. Cobre que o sinal (ícone decorativo +
  sufixo `sr-only` no nome acessível) aparece só onde o link de fato sai do site.
*/

afterEach(cleanup);

function renderLinkButton(item: LinkItem) {
    return render(
        React.createElement(MemoryRouter, null, React.createElement(LinkButton, { item, search: null }))
    );
}

test('link whatsapp anuncia "abre em nova aba" e mostra o ícone de saída', () => {
    const item: LinkItem = { id: 'wa', label: 'Falar no WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-wa"]');
    assert.ok(link, 'link não encontrado');
    assert.match(link!.textContent ?? '', /abre em nova aba/);
    assert.ok(container.querySelector('svg'), 'ícone de saída não renderizado');
});

test('link external anuncia "abre em nova aba"', () => {
    const item: LinkItem = { id: 'ext', label: 'Parceiro', type: 'external', href: 'https://example.com', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-ext"]');
    assert.ok(link, 'link não encontrado');
    assert.match(link!.textContent ?? '', /abre em nova aba/);
});

test('link internal não anuncia "abre em nova aba"', () => {
    const item: LinkItem = { id: 'int', label: 'Página interna', type: 'internal', href: '/quiz', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-int"]');
    assert.ok(link, 'link não encontrado');
    assert.doesNotMatch(link!.textContent ?? '', /abre em nova aba/);
});

test('link cal-modal aponta para o Cal.com, opta fora do specialist_cta_click e não anuncia "abre em nova aba"', () => {
    const item: LinkItem = { id: 'agendar-consultoria', label: 'Agendar consultoria de viagem', type: 'cal-modal', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-agendar-consultoria"]');
    assert.ok(link, 'link não encontrado');
    assert.equal(link!.getAttribute('href'), 'https://cal.com/anhanga-viagens/consultoria');
    assert.ok(link!.hasAttribute('data-no-specialist-cta'), 'falta data-no-specialist-cta (o texto casaria no heurístico "consultoria" de public/utm-tracking.js)');
    assert.equal(link!.getAttribute('target'), null, 'não deve abrir em nova aba — o modal abre por cima da própria página');
    assert.doesNotMatch(link!.textContent ?? '', /abre em nova aba/);
});
