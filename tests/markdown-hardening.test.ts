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
