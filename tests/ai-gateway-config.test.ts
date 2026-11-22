import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildGeminiClientOptions,
    createGatewayFetch,
    resolveGeminiProviderConfig,
} from '../lib/ai/gemini-config.ts';
import handler from '../api/generate.ts';

test('resolveGeminiProviderConfig should keep direct Gemini as the default path', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        GEMINI_MODEL: 'gemini-custom',
    });

    assert.equal(config.ok, true);
    assert.equal(config.apiKey, 'google-key');
    assert.equal(config.modelName, 'gemini-custom');
    assert.equal(config.useGateway, false);
    assert.deepEqual(buildGeminiClientOptions(config), { apiKey: 'google-key' });
});

test('resolveGeminiProviderConfig should normalize configured Gemini model casing', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        GEMINI_MODEL: 'Gemini-3.1-Flash-Lite',
    });

    assert.equal(config.ok, true);
    assert.equal(config.modelName, 'gemini-3.1-flash-lite');
});

test('resolveGeminiProviderConfig should normalize Gemini 3.1 Flash Lite preview aliases to GA', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        GEMINI_MODEL: 'gemini-3.1-flash-lite-preview-05-25',
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'cf-token',
    });

    assert.equal(config.ok, true);
    assert.equal(config.modelName, 'gemini-3.1-flash-lite');

    if (!config.ok || !config.useGateway) {
        throw new Error('expected gateway config');
    }

    const metadataHeader = buildGeminiClientOptions(config).httpOptions?.headers?.['cf-aig-metadata'];
    assert.equal(JSON.parse(metadataHeader || '{}').model, 'gemini-3.1-flash-lite');
});

test('resolveGeminiProviderConfig should require gateway credentials when AI Gateway is enabled', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        AI_GATEWAY_ENABLED: 'true',
    });

    assert.equal(config.ok, false);
    assert.equal(config.code, 'SERVER_CONFIG_ERROR');
    assert.deepEqual(config.missing, [
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_AI_GATEWAY_TOKEN',
    ]);
});

test('resolveGeminiProviderConfig should build authenticated Cloudflare AI Gateway options', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        GEMINI_MODEL: 'gemini-2.5-flash',
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_ID: 'travel-gateway',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'cf-token',
        VERCEL_ENV: 'preview',
    });

    assert.equal(config.ok, true);
    assert.equal(config.useGateway, true);
    assert.equal(
        config.gatewayBaseUrl,
        'https://gateway.ai.cloudflare.com/v1/account-123/travel-gateway/google-ai-studio',
    );

    const clientOptions = buildGeminiClientOptions(config);
    assert.notEqual(clientOptions.apiKey, 'google-key');
    assert.equal(
        clientOptions.httpOptions?.baseUrl,
        'https://gateway.ai.cloudflare.com/v1/account-123/travel-gateway/google-ai-studio',
    );
    assert.equal(clientOptions.httpOptions?.headers?.['cf-aig-authorization'], 'Bearer cf-token');
    assert.equal(clientOptions.httpOptions?.headers?.['cf-aig-collect-log-payload'], 'false');
    assert.equal(clientOptions.httpOptions?.headers?.['cf-aig-skip-cache'], 'true');

    const metadataHeader = clientOptions.httpOptions?.headers?.['cf-aig-metadata'];
    assert.equal(typeof metadataHeader, 'string');
    assert.deepEqual(JSON.parse(metadataHeader || '{}'), {
        endpoint: 'api-generate',
        feature: 'travel-chat',
        model: 'gemini-2.5-flash',
        environment: 'preview',
        requestType: 'chat',
    });
});

test('resolveGeminiProviderConfig should default the gateway id without adding extra metadata keys', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'google-key',
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'cf-token',
    });

    if (!config.ok || !config.useGateway) {
        throw new Error('expected gateway config');
    }

    assert.equal(
        config.gatewayBaseUrl,
        'https://gateway.ai.cloudflare.com/v1/account-123/default/google-ai-studio',
    );

    const metadataHeader = buildGeminiClientOptions(config).httpOptions?.headers?.['cf-aig-metadata'];
    assert.equal(Object.keys(JSON.parse(metadataHeader || '{}')).length, 5);
});

test('gateway mode should use the stored default BYOK key without alias and without GEMINI_API_KEY', () => {
    const config = resolveGeminiProviderConfig({
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'test-gateway-token',
    });

    if (!config.ok || !config.useGateway) {
        throw new Error('expected gateway config');
    }

    assert.equal(config.byokAlias, 'default');
    assert.deepEqual(config.ignoredEnv, []);

    const clientOptions = buildGeminiClientOptions(config);
    const headers = clientOptions.httpOptions?.headers || {};
    assert.equal('x-goog-api-key' in headers, false);
    assert.equal(headers['cf-aig-byok-alias'], 'default');
    assert.equal(headers['cf-aig-authorization'], 'Bearer test-gateway-token');
    // O SDK exige um apiKey não vazio, mas ele nunca chega ao Google (createGatewayFetch remove o header).
    assert.equal(typeof clientOptions.apiKey, 'string');
    assert.notEqual(clientOptions.apiKey, '');
});

test('gateway mode should honor a custom BYOK alias', () => {
    const config = resolveGeminiProviderConfig({
        AI_GATEWAY_ENABLED: 'true',
        AI_GATEWAY_BYOK_ALIAS: 'chatbot',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'test-gateway-token',
    });

    if (!config.ok || !config.useGateway) {
        throw new Error('expected gateway config');
    }

    const headers = buildGeminiClientOptions(config).httpOptions?.headers || {};
    assert.equal(config.byokAlias, 'chatbot');
    assert.equal(headers['cf-aig-byok-alias'], 'chatbot');
    assert.equal('x-goog-api-key' in headers, false);
});

test('gateway mode should never send a configured GEMINI_API_KEY upstream', () => {
    const staleKey = 'test-stale-gemini-key';
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: staleKey,
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'test-gateway-token',
    });

    if (!config.ok || !config.useGateway) {
        throw new Error('expected gateway config');
    }

    // O aviso do handler usa só o nome da variável.
    assert.deepEqual(config.ignoredEnv, ['GEMINI_API_KEY']);

    const clientOptions = buildGeminiClientOptions(config);
    assert.notEqual(clientOptions.apiKey, staleKey);
    assert.equal('x-goog-api-key' in (clientOptions.httpOptions?.headers || {}), false);
    assert.equal(JSON.stringify(clientOptions).includes(staleKey), false);
    assert.equal(JSON.stringify(config).includes(staleKey), false);
});

test('gateway mode should fail closed without the gateway token, listing only variable names', () => {
    const config = resolveGeminiProviderConfig({
        GEMINI_API_KEY: 'test-stale-gemini-key',
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
    });

    assert.equal(config.ok, false);
    assert.equal(config.code, 'SERVER_CONFIG_ERROR');
    assert.deepEqual(config.missing, ['CLOUDFLARE_AI_GATEWAY_TOKEN']);
});

test('direct mode should still require GEMINI_API_KEY and ignore the BYOK alias', () => {
    const config = resolveGeminiProviderConfig({
        AI_GATEWAY_BYOK_ALIAS: 'chatbot',
    });

    assert.equal(config.ok, false);
    assert.equal(config.code, 'SERVER_CONFIG_ERROR');
    assert.deepEqual(config.missing, ['GEMINI_API_KEY']);
});

test('generate handler should return configuration error before provider calls when gateway credentials are missing', async () => {
    const previousEnv = {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        AI_GATEWAY_ENABLED: process.env.AI_GATEWAY_ENABLED,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
    };

    process.env.GEMINI_API_KEY = 'google-key';
    process.env.AI_GATEWAY_ENABLED = 'true';
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_AI_GATEWAY_TOKEN;

    try {
        const response = await handler(new Request('http://localhost/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '203.0.113.81',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Quero viajar para Orlando.' }] }],
            }),
        }));

        const body = await response.json() as { code?: string; error?: string };
        assert.equal(response.status, 500);
        assert.equal(body.code, 'SERVER_CONFIG_ERROR');
        assert.equal(body.error, 'Erro interno de configuração');
    } finally {
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    }
});

// ─── Requisição real (SDK + fetch mockado) ──────────────────────────────────

interface CapturedRequest {
    url: string;
    headers: Headers;
    body: string;
}

const MODEL_RESPONSE = {
    candidates: [{ content: { role: 'model', parts: [{ text: 'Olá!' }] }, finishReason: 'STOP' }],
};

// Substitui globalThis.fetch só durante o teste; o SDK o usa como em produção.
async function captureOutboundRequests(run: () => Promise<unknown>): Promise<CapturedRequest[]> {
    const originalFetch = globalThis.fetch;
    const captured: CapturedRequest[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        captured.push({
            url: String(input),
            headers: new Headers(init?.headers),
            body: typeof init?.body === 'string' ? init.body : '',
        });
        return new Response(JSON.stringify(MODEL_RESPONSE), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }) as typeof fetch;

    try {
        await run();
    } finally {
        globalThis.fetch = originalFetch;
    }

    return captured;
}

async function callGeminiThroughSdk(env: Record<string, string>): Promise<CapturedRequest[]> {
    const config = resolveGeminiProviderConfig(env);
    if (!config.ok) {
        throw new Error('expected valid provider config');
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI(buildGeminiClientOptions(config));

    return captureOutboundRequests(() => ai.models.generateContent({
        model: config.modelName,
        contents: [{ role: 'user', parts: [{ text: 'Oi' }] }],
    }));
}

function flattenRequest(request: CapturedRequest): string {
    return [request.url, request.body, ...[...request.headers].flat()].join('\n');
}

test('gateway request should leave without x-goog-api-key or key= and carry the gateway headers', async () => {
    const staleKey = 'test-stale-gemini-key';
    const captured = await callGeminiThroughSdk({
        GEMINI_API_KEY: staleKey,
        AI_GATEWAY_ENABLED: 'true',
        AI_GATEWAY_BYOK_ALIAS: 'chatbot',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_ID: 'travel-gateway',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'test-gateway-token',
    });

    assert.equal(captured.length, 1);
    const [request] = captured;
    const url = new URL(request.url);

    // A versão da API (v1/v1beta) é escolha do SDK; só o prefixo do gateway e o método são contrato.
    assert.match(
        `${url.origin}${url.pathname}`,
        /^https:\/\/gateway\.ai\.cloudflare\.com\/v1\/account-123\/travel-gateway\/google-ai-studio\/[^/]+\/models\/gemini-3\.1-flash-lite:generateContent$/,
    );
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(request.headers.has('x-goog-api-key'), false);
    assert.equal(request.headers.has('authorization'), false);
    assert.equal(request.headers.get('cf-aig-authorization'), 'Bearer test-gateway-token');
    assert.equal(request.headers.get('cf-aig-byok-alias'), 'chatbot');

    // A chave do ambiente (e o placeholder do SDK) não aparece em URL, headers nem corpo.
    const everything = flattenRequest(request);
    assert.equal(everything.includes(staleKey), false);
    assert.equal(everything.includes('managed-by-ai-gateway-byok'), false);
});

test('gateway request should use the default BYOK alias when none is configured', async () => {
    const [request] = await callGeminiThroughSdk({
        AI_GATEWAY_ENABLED: 'true',
        CLOUDFLARE_ACCOUNT_ID: 'account-123',
        CLOUDFLARE_AI_GATEWAY_TOKEN: 'test-gateway-token',
    });

    assert.equal(request.headers.has('x-goog-api-key'), false);
    assert.equal(request.headers.get('cf-aig-byok-alias'), 'default');
});

test('direct request should still send GEMINI_API_KEY in x-goog-api-key and no gateway headers', async () => {
    const [request] = await callGeminiThroughSdk({ GEMINI_API_KEY: 'test-direct-gemini-key' });
    const url = new URL(request.url);

    assert.equal(url.origin, 'https://generativelanguage.googleapis.com');
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(request.headers.get('x-goog-api-key'), 'test-direct-gemini-key');
    assert.equal(request.headers.has('cf-aig-authorization'), false);
    assert.equal(request.headers.has('cf-aig-byok-alias'), false);
});

test('createGatewayFetch should strip x-goog-api-key without touching other headers or globalThis.fetch', async () => {
    const globalFetchBefore = globalThis.fetch;
    let seen: Headers | undefined;
    const gatewayFetch = createGatewayFetch(async (_input, init) => {
        seen = new Headers(init?.headers);
        return new Response('{}');
    });

    await gatewayFetch('https://example.test/path', {
        method: 'POST',
        headers: { 'x-goog-api-key': 'test-placeholder', 'x-other': 'kept' },
    });

    assert.equal(seen?.has('x-goog-api-key'), false);
    assert.equal(seen?.get('x-other'), 'kept');
    assert.equal(globalThis.fetch, globalFetchBefore);
});

test('generate handler should call Gemini through the gateway without the env GEMINI_API_KEY', async () => {
    const previousEnv = {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        AI_GATEWAY_ENABLED: process.env.AI_GATEWAY_ENABLED,
        AI_GATEWAY_BYOK_ALIAS: process.env.AI_GATEWAY_BYOK_ALIAS,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_AI_GATEWAY_TOKEN: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN,
    };
    const staleKey = 'test-stale-gemini-key';

    process.env.GEMINI_API_KEY = staleKey;
    process.env.AI_GATEWAY_ENABLED = 'true';
    process.env.AI_GATEWAY_BYOK_ALIAS = 'chatbot';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'account-123';
    process.env.CLOUDFLARE_AI_GATEWAY_TOKEN = 'test-gateway-token';

    try {
        let status = 0;
        const captured = await captureOutboundRequests(async () => {
            const response = await handler(new Request('http://localhost/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': '203.0.113.82',
                },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'Quero viajar para Orlando.' }] }],
                }),
            }));
            status = response.status;
        });

        assert.equal(status, 200);
        assert.ok(captured.length >= 1);
        for (const request of captured) {
            assert.ok(request.url.startsWith('https://gateway.ai.cloudflare.com/v1/account-123/'));
            assert.equal(new URL(request.url).searchParams.has('key'), false);
            assert.equal(request.headers.has('x-goog-api-key'), false);
            assert.equal(request.headers.get('cf-aig-byok-alias'), 'chatbot');
            assert.equal(flattenRequest(request).includes(staleKey), false);
        }
    } finally {
        for (const [key, value] of Object.entries(previousEnv)) {
            if (value === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = value;
            }
        }
    }
});
