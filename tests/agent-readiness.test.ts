import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isUnsupportedDiscoveryPath,
    normalizeAgentPath,
    requestsMarkdown,
} from '../lib/agent-readiness.ts';
import { onRequest as agentReadinessMiddleware } from '../functions/[[path]].ts';

test('requestsMarkdown recognizes explicit Markdown negotiation without hijacking normal browsers', () => {
    assert.equal(requestsMarkdown('text/markdown'), true);
    assert.equal(requestsMarkdown('text/html,application/xhtml+xml'), false);
    assert.equal(requestsMarkdown('text/markdown;q=0'), false);
    assert.equal(requestsMarkdown('*/*'), false);
    assert.equal(requestsMarkdown(null), false);
});

test('normalizeAgentPath canonicalizes the route shape used by Markdown handlers', () => {
    assert.equal(normalizeAgentPath('/'), '/');
    assert.equal(normalizeAgentPath('/orlando/'), '/orlando');
    assert.equal(normalizeAgentPath('blog/'), '/blog');
    assert.equal(normalizeAgentPath(''), '/');
});

test('isUnsupportedDiscoveryPath keeps supported well-known resources available and rejects SPA fallbacks', () => {
    assert.equal(isUnsupportedDiscoveryPath('/.well-known/api-catalog'), false);
    assert.equal(isUnsupportedDiscoveryPath('/.well-known/security.txt'), false);
    assert.equal(isUnsupportedDiscoveryPath('/.well-known/agent-card.json'), true);
    assert.equal(isUnsupportedDiscoveryPath('/.well-known/mcp/server-card.json'), true);
    assert.equal(isUnsupportedDiscoveryPath('/auth.md'), true);
    assert.equal(isUnsupportedDiscoveryPath('/consultoria-de-viagem/'), false);
});

test('agent-readiness middleware serves the home page as Markdown when requested explicitly', async () => {
    const response = await agentReadinessMiddleware({
        request: new Request('https://www.anhanga.tur.br/', {
            headers: { Accept: 'text/markdown' },
        }),
        next: async () => new Response('<html>fallback</html>', { status: 200 }),
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^text\/markdown\b/);
    assert.match(await response.text(), /^# Anhangá Viagens/);
});

test('agent-readiness middleware returns 404 for unsupported discovery documents instead of the SPA shell', async () => {
    const response = await agentReadinessMiddleware({
        request: new Request('https://www.anhanga.tur.br/.well-known/agent-card.json'),
        next: async () => new Response('<html>fallback</html>', { status: 200 }),
    });

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
    assert.equal(await response.text(), 'Not Found\n');
});

test('agent-readiness middleware preserves normal HTML requests', async () => {
    const response = await agentReadinessMiddleware({
        request: new Request('https://www.anhanga.tur.br/', {
            headers: { Accept: 'text/html' },
        }),
        next: async () => new Response('<html>fallback</html>', { status: 200 }),
    });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<html>fallback</html>');
});
