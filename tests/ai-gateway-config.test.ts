import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildGeminiClientOptions,
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
    assert.equal(clientOptions.apiKey, 'google-key');
    assert.equal(
        clientOptions.httpOptions?.baseUrl,
        'https://gateway.ai.cloudflare.com/v1/account-123/travel-gateway/google-ai-studio',
    );
    assert.equal(clientOptions.httpOptions?.headers?.['cf-aig-authorization'], 'Bearer cf-token');

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
