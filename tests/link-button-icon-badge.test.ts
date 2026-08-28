import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { LinkButton } from '../components/links/LinkButton.tsx';
import type { LinkItem } from '../data/linksPage.ts';

/*
  Review claude[bot] na PR #1541: o prop `iconBadge` (emblema circular Safira Profunda
  reservado aos 4 destinos em destaque de LinksPage.tsx) não tinha teste — uma mudança de
  comportamento sem cobertura, contra docs/standards/testing.md REQUIRED. Cobre os dois lados
  do contrato: o emblema aparece só quando `iconBadge` é passado, e o resto da pilha (o
  próprio objetivo da prop) continua com o ícone plano por padrão.
*/

afterEach(cleanup);

function renderLinkButton(item: LinkItem, iconBadge?: boolean) {
    return render(
        React.createElement(MemoryRouter, null, React.createElement(LinkButton, { item, search: null, iconBadge }))
    );
}

const destination: LinkItem = {
    id: 'orlando',
    label: 'Orlando',
    sublabel: 'Parques, magia e roteiro sob medida',
    type: 'internal',
    href: '/orlando',
    icon: 'Sparkle',
    visible: true,
};

test('iconBadge=true envolve o ícone num emblema circular Safira Profunda', () => {
    const { container } = renderLinkButton(destination, true);
    const iconWrapper = container.querySelector('a[data-testid="link-orlando"] > span[aria-hidden="true"]');
    assert.ok(iconWrapper, 'wrapper do ícone não encontrado');
    assert.ok(iconWrapper!.classList.contains('rounded-full'), 'emblema deveria ser circular');
    assert.ok(iconWrapper!.classList.contains('bg-anhanga-blue/10'), 'emblema deveria usar o tint de Safira Profunda');
});

test('sem iconBadge (padrão), o ícone continua no slot plano sem emblema', () => {
    const { container } = renderLinkButton(destination);
    const iconWrapper = container.querySelector('a[data-testid="link-orlando"] > span[aria-hidden="true"]');
    assert.ok(iconWrapper, 'wrapper do ícone não encontrado');
    assert.ok(!iconWrapper!.classList.contains('rounded-full'), 'ícone fora dos destaques não deve ganhar o emblema circular');
    assert.ok(!iconWrapper!.classList.contains('bg-anhanga-blue/10'), 'ícone fora dos destaques não deve ganhar o tint de Safira Profunda');
    assert.ok(iconWrapper!.classList.contains('w-[24px]'), 'slot plano deveria manter a largura fixa original');
});
