import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';

import { SocialShare } from '../components/SocialShare.tsx';
import { ConsultoresSection } from '../components/about/ConsultoresSection.tsx';
import AIResearchBar from '../components/AIResearchBar.tsx';
import { AUTHORS } from '../data/blogData.ts';

/*
  Links só-ícone com `target="_blank"` (compartilhar, redes dos consultores, assistentes de IA)
  tinham `aria-label` sem aviso de nova aba — o nome acessível substitui o conteúdo do link,
  então o padrão `sr-only` não se aplica: o aviso entra no próprio `aria-label`.
  Mesma convenção de LinkButton, BlogImageCredit, Footer e telas do NPS.
*/

afterEach(cleanup);

function assertNewTabLinks(container: HTMLElement) {
    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]'));
    assert.ok(links.length > 0, 'nenhum link target="_blank" renderizado');
    for (const link of links) {
        assert.match(
            link.getAttribute('aria-label') ?? '',
            /\(abre em nova aba\)$/,
            `link "${link.getAttribute('href')}" deve avisar que abre em nova aba`,
        );
    }
}

test('SocialShare avisa que WhatsApp, Facebook e LinkedIn abrem em nova aba', () => {
    const { container } = render(
        React.createElement(SocialShare, { url: 'https://www.anhanga.tur.br/blog/x/', title: 'Post' }),
    );
    assertNewTabLinks(container);
});

test('ConsultoresSection avisa que as redes dos consultores abrem em nova aba', () => {
    const team = Object.values(AUTHORS).filter((a) => a.social?.instagram || a.social?.linkedin);
    const { container } = render(React.createElement(ConsultoresSection, { team }));
    assertNewTabLinks(container);
});

test('AIResearchBar avisa que os assistentes de IA abrem em nova aba', () => {
    const { container } = render(React.createElement(AIResearchBar));
    assertNewTabLinks(container);
});
