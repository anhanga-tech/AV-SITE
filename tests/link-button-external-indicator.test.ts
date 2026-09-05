import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup, fireEvent } from '@testing-library/react';
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

/*
  P: "O botão de whatsapp precisaria abrir um modal para preencher os dados do lead. Como é
  nas demais páginas" — o clique agora abre o ContactModal (mesmo padrão de Header/CorpHero/
  Lollapalooza) em vez de navegar direto para o WhatsApp. Não é mais "abre em nova aba": o
  comportamento normal (com JS) é abrir um modal na própria página.
*/
test('link whatsapp não anuncia "abre em nova aba" (o comportamento normal agora é abrir um modal)', () => {
    const item: LinkItem = { id: 'wa', label: 'Falar no WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-wa"]');
    assert.ok(link, 'link não encontrado');
    assert.doesNotMatch(link!.textContent ?? '', /abre em nova aba/);
});

test('link whatsapp mantém href real de wa.me (progressive enhancement) mas dispara openContactModal no clique', () => {
    const item: LinkItem = { id: 'wa', label: 'Falar no WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá!{origem} Quero planejar uma viagem.', visible: true };
    const { container } = renderLinkButton(item);
    const link = container.querySelector('a[data-testid="link-wa"]') as HTMLAnchorElement | null;
    assert.ok(link, 'link não encontrado');
    assert.match(link!.getAttribute('href') ?? '', /^https:\/\/wa\.me\//, 'sem JS/prerender o link ainda precisa funcionar como WhatsApp direto');

    let detail: unknown = null;
    const handler = (e: Event) => { detail = (e as CustomEvent).detail; };
    window.addEventListener('open-contact-modal', handler);

    try {
        fireEvent.click(link!);
    } finally {
        window.removeEventListener('open-contact-modal', handler);
    }

    assert.deepEqual(detail, {
        source: 'links-wa',
        message: 'Olá! Quero planejar uma viagem.',
    });
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
