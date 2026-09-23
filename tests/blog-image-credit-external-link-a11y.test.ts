import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from '@testing-library/react';

import { BlogImageCredit } from '../components/blog/BlogImageCredit.tsx';

/*
  Os links de crédito (`imageSource`, `imageLicenseUrl`) abrem em nova aba
  (`target="_blank"`) mas, diferente do resto do repo (ver LinkButton.tsx),
  não avisavam disso no nome acessível — quem usa leitor de tela era levado
  para fora do site sem aviso. Cobre o padrão `sr-only "(abre em nova aba)"`
  já estabelecido em components/links/LinkButton.tsx.

  Só o crédito completo (não-compact) tem links: o compacto vive dentro de
  cards que já são <a> e não pode aninhar outro <a> (ver
  tests/blog-image-credit-compact.test.ts) — por isso só ele é coberto aqui.
*/

afterEach(cleanup);

const CONFIRMED_POST = {
    imageCreditStatus: 'confirmed' as const,
    imageCredit: 'Jane Doe',
    imageSource: 'https://unsplash.com/photos/example',
    imageLicense: 'Unsplash License',
    imageLicenseUrl: 'https://unsplash.com/license',
};

function assertLinksWarnAboutNewTab(container: HTMLElement) {
    const links = container.querySelectorAll('a[target="_blank"]');
    assert.equal(links.length, 2, 'esperava um link de crédito e um de licença');
    for (const link of links) {
        assert.match(
            link.textContent ?? '',
            /\(abre em nova aba\)/,
            `link "${link.getAttribute('href')}" deve avisar que abre em nova aba no nome acessível`,
        );
    }
}

test('BlogImageCredit (full) avisa que os links de crédito abrem em nova aba', () => {
    const { container } = render(React.createElement(BlogImageCredit, { post: CONFIRMED_POST }));
    assertLinksWarnAboutNewTab(container);
});
