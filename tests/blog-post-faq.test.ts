import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogPostContent } from '../components/blog/BlogPostContent.tsx';
import { BlogPostSchemas } from '../components/blog/BlogPostSchemas.tsx';
import { BLOG_POST_MANIFEST } from '../data/blogManifest.ts';
import { HeadContext, createHeadManager } from '../lib/head.tsx';
import { hasVisibleFaqHeading } from '../lib/blog-faq.ts';
import type { PostMeta } from '../types/blog.ts';

// O FAQPage de cada post (frontmatter `faq`) precisa reproduzir texto visível. 46 posts já
// têm a seção "Perguntas Frequentes" no MDX; quando o MDX não tem, o template
// (components/blog/BlogPostFaq.tsx) renderiza o bloco. Em nenhum caso a seção aparece 2x.

const BLOG_DIR = path.join(import.meta.dirname, '..', 'content', 'blog');
const CANONICAL = 'https://www.anhanga.tur.br/blog/post-de-teste/';
const TEMPLATE_FAQ_SLUGS = [
  'como-planejar-viagem-orlando-sob-medida',
  'melhor-epoca-viajar-orlando-guia-perfil-viajante',
];
const CONTROL_SLUG = 'quanto-custa-viagem-disney-2026';

const decode = (text: string) =>
  text.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const postsWithFaq = BLOG_POST_MANIFEST.filter((post) => post.faq?.length);

const readBody = async (slug: string) => matter(await readFile(path.join(BLOG_DIR, `${slug}.mdx`), 'utf8')).content;

// Simula o MDX do post: o corpo real não monta em node:test (import.meta.glob), então o stub
// reproduz só os headings H2 do markdown bruto, na mesma ordem.
function mdxStubFor(body: string): React.FC {
  const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  const Stub: React.FC = () =>
    React.createElement(
      React.Fragment,
      null,
      headings.map((text) => React.createElement('h2', { key: text }, text)),
    );
  return Stub;
}

async function renderPost(post: PostMeta): Promise<string> {
  return renderToStaticMarkup(
    React.createElement(BlogPostContent, {
      post,
      canonicalUrl: CANONICAL,
      MdxContent: mdxStubFor(await readBody(post.slug)),
      relatedPosts: [],
    }),
  );
}

const visibleFaqHeadings = (html: string) =>
  [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].filter((match) => hasVisibleFaqHeading(`## ${decode(match[1])}`));

function jsonLdOf(post: PostMeta): Array<Record<string, any>> {
  const headManager = createHeadManager();
  renderToStaticMarkup(
    React.createElement(
      HeadContext.Provider,
      { value: headManager },
      React.createElement(BlogPostSchemas, { post, author: null, canonicalUrl: CANONICAL }),
    ),
  );
  return headManager.getTags().flatMap((tag) => (tag.innerHTML ? [JSON.parse(tag.innerHTML)] : []));
}

test('hasVisibleFaqHeading detects FAQ headings regardless of case, accent and suffix', () => {
  assert.equal(hasVisibleFaqHeading('texto\n\n## Perguntas Frequentes\n\nR'), true);
  assert.equal(hasVisibleFaqHeading('## Perguntas frequentes (FAQ)'), true);
  assert.equal(hasVisibleFaqHeading('## Perguntas frequentes sobre viagem corporativa'), true);
  assert.equal(hasVisibleFaqHeading('### PERGUNTAS FREQUENTES'), true);
  assert.equal(hasVisibleFaqHeading('## FAQ'), true);
  assert.equal(hasVisibleFaqHeading('<h2 id="x">Perguntas Frequentes</h2>'), true);
});

test('hasVisibleFaqHeading ignores text that is not a rendered FAQ heading', () => {
  assert.equal(hasVisibleFaqHeading('## 1. Documentação: o primeiro gargalo'), false);
  assert.equal(hasVisibleFaqHeading('Veja as perguntas frequentes abaixo.'), false);
  assert.equal(hasVisibleFaqHeading('# Perguntas Frequentes'), false, 'H1 não conta');
  assert.equal(hasVisibleFaqHeading('#### Perguntas Frequentes'), false, 'H4 não conta');
  assert.equal(hasVisibleFaqHeading('## FAQs e outras siglas'), false);
  assert.equal(hasVisibleFaqHeading('```md\n## Perguntas Frequentes\n```\n\ntexto'), false, 'bloco de código não renderiza heading');
  assert.equal(hasVisibleFaqHeading('~~~\n## Perguntas Frequentes\n\ntexto sem fechar'), false);
  assert.equal(hasVisibleFaqHeading('```\ncódigo\n```\n\n## Perguntas Frequentes'), true, 'heading depois do bloco conta');
});

test('every post with faq in the manifest has its template flag derived from the MDX body', async () => {
  assert.ok(postsWithFaq.length >= 48, `expected the blog posts with faq, found ${postsWithFaq.length}`);
  const flagged: string[] = [];
  for (const post of postsWithFaq) {
    const expected = !hasVisibleFaqHeading(await readBody(post.slug));
    assert.equal(post.faqMissingFromBody === true, expected, `stale or wrong faqMissingFromBody for ${post.slug} — run pnpm generate:blog-manifest`);
    if (post.faqMissingFromBody) flagged.push(post.slug);
  }
  assert.deepEqual(flagged.sort(), [...TEMPLATE_FAQ_SLUGS].sort());
});

test('every post with faq renders exactly one visible FAQ section', async () => {
  for (const post of postsWithFaq) {
    const html = await renderPost(post);
    assert.equal(visibleFaqHeadings(html).length, 1, `${post.slug} should have exactly one visible FAQ heading`);
  }
});

for (const slug of TEMPLATE_FAQ_SLUGS) {
  test(`${slug} renders its frontmatter FAQ as static h2/h3/p after the MDX body and before the CTA and share`, async () => {
    const post = BLOG_POST_MANIFEST.find((candidate) => candidate.slug === slug);
    assert.ok(post?.faq?.length, `${slug} should have faq in the frontmatter`);
    assert.equal(post.showChatCTA, true);
    const html = await renderPost(post);

    const section = html.match(/<section[^>]*data-blog-post-faq[^>]*>([\s\S]*?)<\/section>/);
    assert.ok(section, 'FAQ section is missing from the HTML');
    assert.match(section[1], /^<h2[^>]*>Perguntas Frequentes<\/h2>/);

    const items = [...section[1].matchAll(/<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p>/g)].map((match) => ({
      question: decode(match[1]),
      answer: decode(match[2]),
    }));
    assert.deepEqual(items, post.faq, 'visible questions and answers must match the frontmatter exactly');

    assert.ok(html.indexOf('data-blog-post-body') < html.indexOf('data-blog-post-faq'), 'FAQ comes after the MDX body');
    assert.ok(html.indexOf('data-blog-post-faq') < html.indexOf('data-tracking="blog-chat-cta"'), 'FAQ comes before the ChatCTA');
    assert.ok(html.indexOf('data-blog-post-faq') < html.indexOf('Gostou? Espalhe a palavra'), 'FAQ comes before the share block');
    assert.ok(!section[0].includes('<details') && !section[0].includes('<button') && !section[0].includes('hidden'), 'answers must not be hidden behind an accordion');
  });
}

test(`${CONTROL_SLUG} (control) keeps its own MDX FAQ and gets no template FAQ`, async () => {
  const post = BLOG_POST_MANIFEST.find((candidate) => candidate.slug === CONTROL_SLUG);
  assert.ok(post?.faq?.length);
  const html = await renderPost(post);
  assert.ok(!html.includes('data-blog-post-faq'));
  assert.equal(html.split('Perguntas Frequentes').length - 1, 1);
});

test('FAQPage JSON-LD stays on the three posts with the frontmatter questions', () => {
  for (const slug of [...TEMPLATE_FAQ_SLUGS, CONTROL_SLUG]) {
    const post = BLOG_POST_MANIFEST.find((candidate) => candidate.slug === slug);
    assert.ok(post?.faq?.length);
    const faqPage = jsonLdOf(post).find((node) => node['@type'] === 'FAQPage');
    assert.ok(faqPage, `${slug} lost its FAQPage JSON-LD`);
    assert.deepEqual(
      faqPage.mainEntity.map((q: any) => [q.name, q.acceptedAnswer.text]),
      post.faq.map((item) => [item.question, item.answer]),
    );
  }
});

test('the two template-FAQ posts expose the questions listed in the acceptance criteria', () => {
  const questions = (slug: string) => BLOG_POST_MANIFEST.find((post) => post.slug === slug)?.faq?.map((item) => item.question);
  assert.deepEqual(questions(TEMPLATE_FAQ_SLUGS[0]), [
    'Por onde começar o planejamento de uma viagem para Orlando?',
    'A escolha dos parques muda a decisão de hospedagem?',
    'Vale mais a pena ficar hospedado dentro dos parques ou fora?',
    'Dá para conhecer Disney e Universal na mesma viagem?',
    'Uma agência de viagens faz diferença para uma viagem a Orlando?',
  ]);
  assert.deepEqual(questions(TEMPLATE_FAQ_SLUGS[1]), [
    'Qual a época mais barata para viajar para Orlando?',
    'Orlando tem estação chuvosa?',
    'Vale a pena evitar a época de furacões na Flórida?',
    'Dezembro em Orlando vale o preço mais alto?',
  ]);
});
