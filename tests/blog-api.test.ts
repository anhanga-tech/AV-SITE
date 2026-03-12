import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/blog-posts.ts';
import {
    BLOG_RSS_URL,
    parseRecentPostsFromRss,
} from '../lib/blog-api.ts';

const originalFetch = global.fetch;

const RSS_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
  <channel>
    <item>
      <title><![CDATA[Post Mais Novo]]></title>
      <description><![CDATA[<p>Resumo mais novo com <strong>HTML</strong> suficiente para validar limpeza de markup.</p>]]></description>
      <link>https://blog.anhanga.tur.br/post-mais-novo/</link>
      <dc:creator><![CDATA[Equipe Anhangá]]></dc:creator>
      <category><![CDATA[Cruzeiros]]></category>
      <pubDate>Tue, 11 Mar 2026 10:00:00 GMT</pubDate>
      <media:content url="https://blog.anhanga.tur.br/content/images/2026/03/post-1.png" medium="image"/>
    </item>
    <item>
      <title><![CDATA[Post Sem Categoria]]></title>
      <description><![CDATA[<p>Resumo sem categoria explícita.</p>]]></description>
      <link>https://blog.anhanga.tur.br/post-sem-categoria/</link>
      <dc:creator><![CDATA[Redação]]></dc:creator>
      <pubDate>Mon, 10 Mar 2026 09:00:00 GMT</pubDate>
      <media:content url="https://blog.anhanga.tur.br/content/images/2026/03/post-2.png" medium="image"/>
    </item>
    <item>
      <title><![CDATA[Post Com Imagem No Conteúdo]]></title>
      <description><![CDATA[<p>Resumo com imagem extraída do content:encoded.</p>]]></description>
      <link>https://blog.anhanga.tur.br/post-imagem-conteudo/</link>
      <pubDate>Sun, 09 Mar 2026 08:00:00 GMT</pubDate>
      <content:encoded><![CDATA[
        <p>Conteúdo</p>
        <img src="https://blog.anhanga.tur.br/content/images/2026/03/post-3.png" />
      ]]></content:encoded>
    </item>
    <item>
      <title><![CDATA[Post Com Imagem Inválida]]></title>
      <description><![CDATA[<p>Resumo com imagem inválida.</p>]]></description>
      <link>https://blog.anhanga.tur.br/post-imagem-invalida/</link>
      <pubDate>Sat, 08 Mar 2026 07:00:00 GMT</pubDate>
      <enclosure url="data:image/png;base64,abc123" />
    </item>
    <item>
      <title><![CDATA[Post Antigo]]></title>
      <description><![CDATA[<p>Resumo antigo.</p>]]></description>
      <link>https://blog.anhanga.tur.br/post-antigo/</link>
      <pubDate>Fri, 07 Mar 2026 06:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

test('parseRecentPostsFromRss should keep the first four items and normalize fields', () => {
    const posts = parseRecentPostsFromRss(RSS_FIXTURE, 4);

    assert.equal(posts.length, 4);
    assert.equal(posts[0].slug, 'post-mais-novo');
    assert.equal(posts[0].title, 'Post Mais Novo');
    assert.equal(posts[0].category, 'Cruzeiros');
    assert.equal(posts[0].author, 'Equipe Anhangá');
    assert.equal(posts[0].image, 'https://blog.anhanga.tur.br/content/images/2026/03/post-1.png');
    assert.equal(posts[0].isFeatured, true);
    assert.equal(posts[1].category, 'Dicas');
    assert.equal(posts[2].author, 'Equipe Anhangá');
    assert.equal(posts[2].image, 'https://blog.anhanga.tur.br/content/images/2026/03/post-3.png');
    assert.equal(posts[3].image, '');
    assert.match(posts[0].excerpt, /Resumo mais novo com HTML suficiente/i);
    assert.equal(posts[0].excerpt.includes('&amp;#'), false);
    assert.equal(posts.some((post) => post.slug === 'post-antigo'), false);
});

test('blog-posts API should return four posts with cache headers', async (t) => {
    global.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        assert.equal(url, BLOG_RSS_URL);
        return new Response(RSS_FIXTURE, {
            status: 200,
            headers: {
                'Content-Type': 'application/rss+xml',
            },
        });
    }) as typeof fetch;

    t.after(() => {
        global.fetch = originalFetch;
    });

    const response = await handler(new Request('http://localhost/api/blog-posts?limit=invalid'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 's-maxage=300, stale-while-revalidate=3600');

    const body = await response.json() as Array<{ slug: string }>;
    assert.equal(body.length, 4);
    assert.equal(body[0].slug, 'post-mais-novo');
});

test('blog-posts API should return controlled error when RSS fetch fails', async (t) => {
    global.fetch = (async () => new Response('upstream error', { status: 503 })) as typeof fetch;

    t.after(() => {
        global.fetch = originalFetch;
    });

    const response = await handler(new Request('http://localhost/api/blog-posts?limit=4'));
    assert.equal(response.status, 500);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Failed to fetch blog posts' });
});
