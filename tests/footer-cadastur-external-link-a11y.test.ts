import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';

import Footer from '../components/Footer.tsx';

/*
  O link do Cadastur no rodapé do site principal abre em nova aba (`target="_blank"`) sem
  nenhuma interceptação por JS — diferente do padrão `sr-only "(abre em nova aba)"` já
  estabelecido em components/links/LinkButton.tsx e components/blog/BlogImageCredit.tsx.
  Quem usa leitor de tela era levado para fora do site sem aviso.
*/

afterEach(cleanup);

test('Footer avisa que o link do Cadastur abre em nova aba', () => {
    const { container } = render(React.createElement(Footer));
    const cadasturLink = container.querySelector('a[href="https://cadastur.turismo.gov.br/hotsite/"]');
    assert.ok(cadasturLink, 'link do Cadastur não encontrado');
    assert.match(cadasturLink!.textContent ?? '', /\(abre em nova aba\)/);
});
