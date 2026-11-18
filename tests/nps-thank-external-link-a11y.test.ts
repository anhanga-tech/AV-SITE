import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';

import { NpsThankPromoter } from '../components/nps/NpsThankPromoter.tsx';
import { NpsThankOther } from '../components/nps/NpsThankOther.tsx';

/*
  Os CTAs das telas de agradecimento do NPS abrem em nova aba (`target="_blank"`) sem
  interceptação por JS. Mesmo padrão `sr-only "(abre em nova aba)"` de LinkButton,
  BlogImageCredit e Footer: sem o aviso, leitor de tela era levado para fora do site.
*/

afterEach(cleanup);

test('NpsThankPromoter avisa que o link da review no Google abre em nova aba', () => {
    const { container } = render(React.createElement(NpsThankPromoter, { firstname: 'Ana' }));
    const link = container.querySelector('a[target="_blank"]');
    assert.ok(link, 'link da review não encontrado');
    assert.match(link!.textContent ?? '', /Deixar minha review no Google\s*\(abre em nova aba\)/);
});

test('NpsThankOther avisa que o link do WhatsApp abre em nova aba', () => {
    const { container } = render(React.createElement(NpsThankOther, { firstname: 'Ana' }));
    const link = container.querySelector('a[target="_blank"]');
    assert.ok(link, 'link do WhatsApp não encontrado');
    assert.match(link!.textContent ?? '', /Falar no WhatsApp\s*\(abre em nova aba\)/);
});
