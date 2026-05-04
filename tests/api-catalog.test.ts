import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import apiCatalogHandler from '../api/api-catalog.ts';
import apiDocsHandler from '../api/api-docs.ts';
import healthHandler from '../api/health.ts';
import openapiHandler from '../api/openapi.ts';
import { buildOpenApiPaths, type ApiEndpointDefinition } from '../lib/api-catalog.ts';

interface LinkTarget {
    href?: string;
    type?: string;
}

interface LinksetEntry {
    anchor?: string;
    'service-desc'?: LinkTarget[];
    'service-doc'?: LinkTarget[];
    status?: LinkTarget[];
}

function buildRequest(url: string, method = 'GET'): Request {
    return new Request(url, { method });
}

test('api-catalog should return application/linkset+json with required RFC 9727 relations', async () => {
    const response = await apiCatalogHandler(buildRequest('http://localhost/.well-known/api-catalog'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/linkset\+json\b/);

    const payload = await response.json() as { linkset?: LinksetEntry[] };

    assert.ok(Array.isArray(payload.linkset));
    assert.deepEqual(
        payload.linkset.map((entry) => entry.anchor),
        [
            'https://www.anhanga.tur.br/api/generate',
            'https://www.anhanga.tur.br/api/submit-lead',
            'https://www.anhanga.tur.br/api/submit-waitlist',
        ],
    );

    for (const entry of payload.linkset) {
        assert.ok(Array.isArray(entry['service-desc']));
        assert.ok(Array.isArray(entry['service-doc']));
        assert.ok(Array.isArray(entry.status));

        assert.deepEqual(entry['service-desc'], [
            {
                href: 'https://www.anhanga.tur.br/.well-known/openapi.json',
                type: 'application/json',
            },
        ]);
        assert.deepEqual(entry['service-doc'], [
            {
                href: 'https://www.anhanga.tur.br/.well-known/api-docs',
                type: 'text/markdown',
            },
        ]);
        assert.deepEqual(entry.status, [
            {
                href: 'https://www.anhanga.tur.br/api/health',
                type: 'application/json',
            },
        ]);
    }
});

test('api-catalog should answer HEAD with api-catalog discovery headers', async () => {
    const response = await apiCatalogHandler(buildRequest('http://localhost/.well-known/api-catalog', 'HEAD'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/linkset\+json\b/);
    assert.match(response.headers.get('Link') ?? '', /rel="api-catalog"/);
    assert.match(response.headers.get('Link') ?? '', /application\/linkset\+json/);
    assert.equal(await response.text(), '');
});

test('openapi handler should publish the machine-readable API description used by the catalog', async () => {
    const response = await openapiHandler(buildRequest('http://localhost/.well-known/openapi.json'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/json\b/);

    const payload = await response.json() as {
        openapi?: string;
        info?: { title?: string };
        servers?: Array<{ url?: string }>;
        paths?: Record<string, unknown>;
    };

    assert.equal(payload.openapi, '3.1.0');
    assert.equal(payload.info?.title, 'Anhangá Viagens Public API');
    assert.deepEqual(payload.servers, [{ url: 'https://www.anhanga.tur.br' }]);
    assert.ok(payload.paths?.['/api/generate']);
    assert.ok(payload.paths?.['/api/submit-lead']);
    assert.ok(payload.paths?.['/api/submit-waitlist']);
    assert.ok(payload.paths?.['/api/health']);

    const generatePath = payload.paths?.['/api/generate'] as {
        post?: {
            responses?: Record<string, { content?: Record<string, { schema?: unknown }> }>;
        };
    };
    const submitLeadPath = payload.paths?.['/api/submit-lead'] as {
        post?: {
            responses?: Record<string, { content?: Record<string, { schema?: unknown }> }>;
        };
    };

    assert.ok(generatePath.post?.responses?.['200']?.content?.['application/json']?.schema);
    assert.ok(generatePath.post?.responses?.['400']?.content?.['application/json']?.schema);
    assert.ok(submitLeadPath.post?.responses?.['201']?.content?.['application/json']?.schema);
    assert.ok(submitLeadPath.post?.responses?.['500']?.content?.['application/json']?.schema);
});

test('buildOpenApiPaths should preserve multiple HTTP methods for the same path', () => {
    const endpoints: ApiEndpointDefinition[] = [
        {
            anchor: 'https://www.anhanga.tur.br/api/example',
            method: 'get',
            summary: 'Read example',
            description: 'Reads an example resource.',
            responses: {
                '200': {
                    description: 'Read response.',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                additionalProperties: true,
                            },
                        },
                    },
                },
            },
        },
        {
            anchor: 'https://www.anhanga.tur.br/api/example',
            method: 'post',
            summary: 'Create example',
            description: 'Creates an example resource.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            additionalProperties: true,
                        },
                    },
                },
            },
            responses: {
                '201': {
                    description: 'Created response.',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                additionalProperties: true,
                            },
                        },
                    },
                },
            },
        },
    ];

    const paths = buildOpenApiPaths(endpoints);
    const examplePath = paths['/api/example'] as Record<string, unknown>;

    assert.ok(examplePath.get);
    assert.ok(examplePath.post);
});

test('api-docs handler should publish human-readable documentation for the cataloged APIs', async () => {
    const response = await apiDocsHandler(buildRequest('http://localhost/.well-known/api-docs'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^text\/markdown\b/);

    const body = await response.text();
    assert.match(body, /^# Anhangá Viagens Public API/m);
    assert.match(body, /\/api\/generate/);
    assert.match(body, /\/api\/submit-lead/);
    assert.match(body, /\/api\/submit-waitlist/);
    assert.match(body, /\/api\/health/);
});

test('health handler should return a simple JSON status document for the catalog status relation', async () => {
    const response = await healthHandler(buildRequest('http://localhost/api/health'));

    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type') ?? '', /^application\/json\b/);
    assert.deepEqual(await response.json(), {
        status: 'ok',
        service: 'anhanga-viagens-public-api',
    });
});

test('deployment config should route well-known discovery URLs to the new handlers', async () => {
    const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as {
        rewrites?: Array<{ source?: string; destination?: string }>;
        headers?: Array<{ source?: string; headers?: Array<{ key?: string; value?: string }> }>;
    };

    assert.ok(
        vercelConfig.rewrites?.some((rule) =>
            rule.source === '/.well-known/api-catalog' && rule.destination === '/api/api-catalog'),
    );
    assert.ok(
        vercelConfig.rewrites?.some((rule) =>
            rule.source === '/.well-known/openapi.json' && rule.destination === '/api/openapi'),
    );
    assert.ok(
        vercelConfig.rewrites?.some((rule) =>
            rule.source === '/.well-known/api-docs' && rule.destination === '/api/api-docs'),
    );

    const globalHeaders = vercelConfig.headers?.find((entry) => entry.source === '/(.*)');
    const apiCatalogLinkHeader = globalHeaders?.headers?.find((header) => header.key === 'Link');
    assert.match(apiCatalogLinkHeader?.value ?? '', /rel="api-catalog"/);
    assert.match(apiCatalogLinkHeader?.value ?? '', /application\/linkset\+json/);
});

test('vite dev routing should expose the same discovery endpoints locally', async () => {
    const viteConfig = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

    assert.match(viteConfig, /'\/\.well-known\/api-catalog'/);
    assert.match(viteConfig, /'\/\.well-known\/openapi\.json'/);
    assert.match(viteConfig, /'\/\.well-known\/api-docs'/);
    assert.match(viteConfig, /let pathname = '\/';/);
    assert.match(viteConfig, /if \(req\.url\) \{/);
});
