import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPostContent } from '../components/blog/BlogPostContent.tsx';
import type { PostMeta } from '../types/blog.ts';

const basePost: PostMeta = {
    title: 'Post de teste',
    excerpt: 'Excerpt de teste',
    date: '2026-01-01',
    author: 'felipe-william',
    category: 'Dicas',
    image: 'https://media.anhanga.tur.br/images/blog/teste.jpg',
    tags: [],
    slug: 'post-de-teste',
    readingTime: '4 min de leitura',
};

function renderNotice(historicalNotice: string): string {
    const html = renderToStaticMarkup(
        React.createElement(BlogPostContent, {
            post: { ...basePost, historicalNotice },
            canonicalUrl: 'https://www.anhanga.tur.br/blog/post-de-teste/',
            MdxContent: null,
            relatedPosts: [],
        })
    );
    const match = html.match(/<p[^>]*role="status"[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(match, 'o aviso histórico deve ser renderizado');
    return match[1];
}

test('historicalNotice transforma link markdown interno em âncora clicável', () => {
    const notice = renderNotice(
        'Publicado em 2026. Veja o [guia do Carnaval 2027](/blog/carnaval-2027-data/).'
    );
    assert.match(notice, /<a [^>]*href="\/blog\/carnaval-2027-data\/"[^>]*>guia do Carnaval 2027<\/a>\./);
    assert.ok(notice.startsWith('Publicado em 2026. Veja o '));
});

test('historicalNotice sem link continua texto puro', () => {
    const notice = renderNotice('Este artigo foi publicado para o Carnaval 2026.');
    assert.equal(notice, 'Este artigo foi publicado para o Carnaval 2026.');
});

test('historicalNotice não cria âncora para URLs externas, protocol-relative ou javascript:', () => {
    for (const text of [
        'Veja [site](https://example.com/x)',
        'Veja [site](//example.com/x)',
        'Veja [site](/\\example.com/x)',
        'Veja [site](javascript:alert(1))',
    ]) {
        const notice = renderNotice(text);
        assert.ok(!notice.includes('<a '), `não deve haver âncora para: ${text}`);
    }
});

test('historicalNotice escapa HTML em vez de injetá-lo', () => {
    const notice = renderNotice('<img src=x onerror=alert(1)> [x](/ok/) <script>1</script>');
    assert.ok(!notice.includes('<img'));
    assert.ok(!notice.includes('<script'));
    assert.match(notice, /&lt;img/);
    assert.match(notice, /href="\/ok\/"/);
});
