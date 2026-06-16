import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mdxComponents } from '../components/blog/mdxComponents.tsx';

const Img = mdxComponents.img as React.FC<Record<string, unknown>>;

test('img do MDX reserva espaço com width/height default (evita CLS)', () => {
    const html = renderToStaticMarkup(
        React.createElement(Img, { src: 'foto.jpg', alt: 'Praia' })
    );
    assert.ok(html.includes('width="1200"'), 'deve ter width default 1200');
    assert.ok(html.includes('height="675"'), 'deve ter height default 675');
    assert.ok(html.includes('h-auto'), 'deve manter altura proporcional com h-auto');
    assert.ok(html.includes('loading="lazy"'), 'deve manter lazy loading');
});

test('img do MDX passa o src por optimizeRemoteImageUrl', () => {
    const html = renderToStaticMarkup(
        React.createElement(Img, { src: 'foto.jpg', alt: 'Praia' })
    );
    assert.ok(
        html.includes('src="https://media.anhanga.tur.br/foto.jpg"'),
        'src relativo deve ser resolvido pelo media host via optimizeRemoteImageUrl'
    );
});

test('img do MDX permite sobrescrever width/height por post', () => {
    const html = renderToStaticMarkup(
        React.createElement(Img, { src: 'retrato.jpg', alt: 'Retrato', width: 800, height: 1000 })
    );
    assert.ok(html.includes('width="800"'), 'width passado deve sobrescrever o default');
    assert.ok(html.includes('height="1000"'), 'height passado deve sobrescrever o default');
    assert.ok(!html.includes('width="1200"'), 'não deve usar o width default quando há override');
});
