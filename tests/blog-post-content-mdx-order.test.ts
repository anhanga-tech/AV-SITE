import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPostContent } from '../components/blog/BlogPostContent.tsx';
import type { PostMeta } from '../types/blog.ts';

const post: PostMeta = {
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

const relatedPosts: PostMeta[] = [];

const StubMdxContent: React.FC = () => React.createElement('h2', null, 'H2 real do artigo MDX');

test('BlogPostContent renderiza o corpo do MDX antes de "Leia Também" na ordem física do HTML', () => {
    const html = renderToStaticMarkup(
        React.createElement(BlogPostContent, {
            post,
            canonicalUrl: 'https://www.anhanga.tur.br/blog/post-de-teste/',
            MdxContent: StubMdxContent,
            relatedPosts,
        })
    );

    const mdxIndex = html.indexOf('H2 real do artigo MDX');
    const leiaTambemIndex = html.indexOf('Leia Também');

    assert.notEqual(mdxIndex, -1, 'o corpo do MDX deve estar presente no HTML');
    assert.notEqual(leiaTambemIndex, -1, 'a seção "Leia Também" deve estar presente no HTML');
    assert.ok(
        mdxIndex < leiaTambemIndex,
        'o corpo real do MDX deve vir antes de "Leia Também" na ordem física do HTML (regressão #1249)'
    );
});

test('BlogPostContent não envolve o MDX num Suspense/skeleton — MdxContent eager não suspende', () => {
    const html = renderToStaticMarkup(
        React.createElement(BlogPostContent, {
            post,
            canonicalUrl: 'https://www.anhanga.tur.br/blog/post-de-teste/',
            MdxContent: StubMdxContent,
            relatedPosts,
        })
    );

    assert.ok(!html.includes('animate-pulse'), 'não deve renderizar o skeleton de loading do antigo Suspense boundary');
});
