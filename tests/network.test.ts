import test from 'node:test';
import assert from 'node:assert/strict';
import { getClientIP } from '../lib/network.ts';

test('getClientIP uses Cloudflare connecting IP before spoofable headers', () => {
    const request = new Request('https://example.com/api/generate', {
        headers: {
            'cf-connecting-ip': '203.0.113.10',
            'x-real-ip': '10.0.0.99',
            'x-vercel-forwarded-for': '10.0.0.98',
            'x-forwarded-for': '10.0.0.97, 198.51.100.20',
        },
    });

    assert.equal(getClientIP(request), '203.0.113.10');
});

test('getClientIP uses the proxy-appended X-Forwarded-For value as generic fallback', () => {
    const request = new Request('https://example.com/api/generate', {
        headers: {
            'x-forwarded-for': '10.0.0.42, 198.51.100.30',
        },
    });

    assert.equal(getClientIP(request), '198.51.100.30');
});
