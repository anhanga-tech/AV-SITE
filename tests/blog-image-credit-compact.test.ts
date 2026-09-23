import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogImageCredit } from '../components/blog/BlogImageCredit.tsx';

const CONFIRMED_WITH_LINKS = {
    imageCreditStatus: 'confirmed' as const,
    imageCredit: 'Autor Exemplo / Wikimedia Commons',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Exemplo.jpg',
    imageLicense: 'CC BY-SA 4.0',
    imageLicenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    imageAdaptation: 'recortada',
};

// O crédito compacto é renderizado dentro de cards que já são <a> (teaser da home,
// relacionados, sidebar, lista do blog). <a> aninhado é HTML inválido: o parser do
// navegador fecha o link externo e o DOM prerenderizado diverge da árvore do React
// (erro de hidratação #418).
test('crédito compacto não renderiza links (vive dentro de cards que já são <a>)', () => {
    const html = renderToStaticMarkup(
        React.createElement(BlogImageCredit, { post: CONFIRMED_WITH_LINKS, compact: true })
    );
    assert.ok(!html.includes('<a'), `não deve conter <a>: ${html}`);
    assert.ok(html.includes('Autor Exemplo / Wikimedia Commons'), 'mantém o autor');
    assert.ok(html.includes('CC BY-SA 4.0'), 'mantém a licença');
    assert.ok(html.includes('recortada'), 'mantém a adaptação');
});

test('crédito completo do post mantém links para fonte e licença', () => {
    const html = renderToStaticMarkup(
        React.createElement(BlogImageCredit, { post: CONFIRMED_WITH_LINKS })
    );
    assert.ok(html.includes(`href="${CONFIRMED_WITH_LINKS.imageSource}"`));
    assert.ok(html.includes(`href="${CONFIRMED_WITH_LINKS.imageLicenseUrl}"`));
});
