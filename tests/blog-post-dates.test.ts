import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { BlogPostHero } from '../components/blog/BlogPostHero.tsx';
import { PostDates } from '../components/blog/PostDates.tsx';
import type { PostMeta } from '../types/blog.ts';

/*
  O hero mostra "Publicado em X · Atualizado em Y", cada data num <time datetime>.
  "Atualizado em" só aparece quando dateModified existe e difere de date.
*/

const POST: PostMeta = {
    title: 'Beto Carrero: como chegar',
    excerpt: 'Resumo.',
    date: '2026-07-05',
    author: 'queila',
    category: 'Destinos',
    image: 'images/blog/beto-carrero.jpg',
    tags: [],
    slug: 'beto-carrero-como-chegar',
    readingTime: '6 min de leitura',
};

const timeTags = (html: string) => [...html.matchAll(/<time datetime="([^"]+)">([^<]*)<\/time>/gi)].map(([, iso, text]) => [iso, text]);

function renderHero(post: PostMeta) {
    return renderToStaticMarkup(
        React.createElement(MemoryRouter, null, React.createElement(BlogPostHero, { post, authorName: 'Queila' })),
    );
}

test('datas distintas: dois <time datetime> e "Atualizado em"', () => {
    const html = renderHero({ ...POST, dateModified: '2026-07-26' });

    assert.deepEqual(timeTags(html), [
        ['2026-07-05', '05/07/2026'],
        ['2026-07-26', '26/07/2026'],
    ]);
    assert.match(html, /Publicado em <time/);
    assert.match(html, /Atualizado em <time datetime="2026-07-26">26\/07\/2026<\/time>/i);
});

test('só date: um <time> e sem "Atualizado em"', () => {
    const html = renderHero(POST);

    assert.deepEqual(timeTags(html), [['2026-07-05', '05/07/2026']]);
    assert.doesNotMatch(html, /Atualizado em/);
});

test('dateModified igual a date: sem "Atualizado em"', () => {
    const html = renderHero({ ...POST, dateModified: POST.date });

    assert.deepEqual(timeTags(html), [['2026-07-05', '05/07/2026']]);
    assert.doesNotMatch(html, /Atualizado em/);
});

test('a data não recua um dia por fuso (virada de mês e de ano)', () => {
    const html = renderToStaticMarkup(
        React.createElement(PostDates, { date: '2026-01-01', dateModified: '2026-03-01' }),
    );

    assert.deepEqual(timeTags(html), [
        ['2026-01-01', '01/01/2026'],
        ['2026-03-01', '01/03/2026'],
    ]);
});
