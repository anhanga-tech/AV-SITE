import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/markdown.ts';

test('api/markdown should return 400 for path too long', async () => {
    const longPath = 'a'.repeat(513);
    const req = new Request(`http://localhost/api/markdown?path=${longPath}`);
    const res = await handler(req);
    assert.equal(res.status, 400);
    const body = await res.text();
    assert.ok(body.includes('Caminho muito longo'));
});

test('api/markdown should return 200 for valid home path', async () => {
    const req = new Request('http://localhost/api/markdown?path=/');
    const res = await handler(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
});

test('api/markdown serves the blog index with links to every post', async () => {
    const req = new Request('http://localhost/api/markdown?path=/blog/');
    const res = await handler(req);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.ok(body.includes('# Blog Anhangá Viagens'));
    assert.match(body, /\]\(https:\/\/www\.anhanga\.tur\.br\/blog\/disney-ou-beto-carrero\/\)/);
});

test('api/markdown serves a blog post as markdown', async () => {
    const req = new Request('http://localhost/api/markdown?path=/blog/disney-ou-beto-carrero/');
    const res = await handler(req);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    const body = await res.text();
    assert.ok(body.startsWith('# '));
    assert.match(body, /^\*\*URL:\*\* https:\/\/www\.anhanga\.tur\.br\/blog\/disney-ou-beto-carrero\/$/m);
});

test('api/markdown returns 404 for unknown blog slug', async () => {
    const req = new Request('http://localhost/api/markdown?path=/blog/post-que-nao-existe');
    const res = await handler(req);
    assert.equal(res.status, 404);
});

test('api/markdown returns 404 for slugs matching object prototype properties', async () => {
    for (const slug of ['constructor', 'tostring', 'hasownproperty']) {
        const req = new Request(`http://localhost/api/markdown?path=/blog/${slug}`);
        const res = await handler(req);
        assert.equal(res.status, 404, `expected 404 for prototype-like slug "${slug}"`);
    }
});

test('api/markdown should enforce rate limiting', async () => {
    const sharedIP = '1.2.3.4';
    const req = () => new Request('http://localhost/api/markdown?path=/', {
        headers: { 'x-real-ip': sharedIP }
    });

    // Limit is 20
    for (let i = 0; i < 20; i++) {
        const res = await handler(req());
        assert.equal(res.status, 200);
    }

    const res = await handler(req());
    assert.equal(res.status, 429);
    assert.ok(res.headers.get('Retry-After'));
});
