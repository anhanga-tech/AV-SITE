import './helpers/dom-setup.ts';

import React from 'react';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { BlogPostHero } from '../components/blog/BlogPostHero.tsx';
import { selectImagePreset } from '../lib/media-url.ts';
import type { PostMeta } from '../types/blog.ts';

/*
  Guards da issue #1602 — peso e nitidez da capa do artigo.

  A capa era o recurso mais pesado do post (218.912 bytes de AVIF na auditoria
  de 07/09/2026) e, no celular, também o mais borrado: a caixa do hero é mais
  alta que larga (412x560 no `min-h` padrão), então o recorte 16:9 precisava ser
  ampliado para cobri-la. A correção é art direction — um recorte 3:4 só para
  telas pequenas — e não apenas uma variante menor.

  Com `VITE_MEDIA_ENABLE_TRANSFORMS` desligado (o padrão neste processo de
  teste) as duas URLs saem idênticas, então o que o DOM prova aqui é a
  ESTRUTURA (existe um <source> com `media` de celular antes do <img>); o
  preset por trás dela é travado direto em `selectImagePreset`, junto de
  tests/media-url.test.ts.
*/

const POST: PostMeta = {
    title: 'Rock in Rio 2026: guia de viagem',
    excerpt: 'Tudo o que importa antes de comprar o ingresso.',
    date: '2026-09-01',
    author: 'queila',
    category: 'Eventos',
    image: 'images/blog/rock-in-rio-2026.jpg',
    tags: [],
    slug: 'rock-in-rio-2026-guia-viagem-rio',
    readingTime: '6 min de leitura',
};

afterEach(cleanup);

function renderHero() {
    return render(
        React.createElement(
            MemoryRouter,
            null,
            React.createElement(BlogPostHero, { post: POST, authorName: 'Queila' }),
        ),
    );
}

test('a capa serve um recorte dedicado a telas pequenas, e não a mesma variante para todo mundo', () => {
    const { container } = renderHero();

    const source = container.querySelector('picture > source');
    assert.ok(source, 'a capa precisa de um <source> art-directed dentro de <picture>');

    // O `media` é o que impede o desktop de baixar o recorte de celular (e
    // vice-versa) — sem ele o <source> vira apenas mais uma variante.
    const media = source.getAttribute('media');
    assert.ok(media && /max-width/.test(media), `o <source> precisa de um media query de celular, veio: ${media}`);

    // A ordem importa: o browser usa o primeiro <source> que casa, e o <img>
    // é o fallback. Um <source> depois do <img> nunca seria consultado.
    const picture = source.parentElement;
    assert.ok(picture);
    const children = [...picture.children];
    assert.ok(
        children.indexOf(source) < children.findIndex((el) => el.tagName === 'IMG'),
        'o <source> precisa vir antes do <img>',
    );
});

test('o recorte de celular é mais alto que largo e o de desktop continua 16:9', () => {
    // A caixa do hero no celular é ~412x560 (mais alta que larga): pedir 16:9
    // ali obriga o browser a ampliar a imagem para cobrir, o que gasta bytes e
    // entrega menos nitidez. Estes são os argumentos que o componente passa.
    const celular = selectImagePreset(720, 960);
    assert.equal(celular.id, 'portrait');
    assert.ok(celular.height && celular.height > celular.width, 'o recorte de celular precisa ser retrato');

    const desktop = selectImagePreset(1200, 675);
    assert.equal(desktop.id, 'content');
    assert.equal(desktop.width / desktop.height!, 16 / 9);
});

test('a capa mantém prioridade de carregamento e dimensões reservadas', () => {
    const { container } = renderHero();

    const img = container.querySelector('picture img');
    assert.ok(img, 'o <img> precisa continuar existindo como fallback do <picture>');

    // Envolver o <img> num <picture> não pode custar o hint de LCP nem as
    // dimensões intrínsecas — é o que segura CLS e prioridade de rede.
    assert.equal(img.getAttribute('fetchpriority'), 'high');
    assert.equal(img.getAttribute('width'), '1200');
    assert.equal(img.getAttribute('height'), '675');
    assert.equal(img.getAttribute('alt'), POST.title);
});

/*
  O `quality` é argumento de chamada, não propriedade do preset: os degraus 16:9
  são compartilhados com o pôster da home, então baixar a qualidade no preset
  moveria os dois. Com `VITE_MEDIA_ENABLE_TRANSFORMS` desligado (o padrão neste
  processo) as URLs saem idênticas com ou sem o argumento — só o texto-fonte
  prova que ele está sendo passado, mesmo caso já documentado em
  docs/standards/dom-testing-tier-decision.md.
*/
test('a capa pede a qualidade reduzida nas duas variantes, sem mexer no preset', async () => {
    const source = await readFile(new URL('../components/blog/BlogPostHero.tsx', import.meta.url), 'utf8');

    const constante = source.match(/const HERO_QUALITY = (\d+);/);
    assert.ok(constante, 'a capa precisa declarar sua própria qualidade');
    assert.ok(
        Number(constante[1]) < 85,
        `HERO_QUALITY=${constante?.[1]} não reduz nada: 85 já é o padrão compartilhado`,
    );

    const chamadas = [...source.matchAll(/optimizeRemoteImageUrl\(post\.image[^)]*\)/g)];
    assert.equal(chamadas.length, 2, 'a capa tem duas variantes: o recorte de celular e o de desktop');
    for (const [chamada] of chamadas) {
        assert.match(
            chamada,
            /HERO_QUALITY/,
            `variante sem a qualidade reduzida — ela pagaria o padrão de 85: ${chamada}`,
        );
    }
});
