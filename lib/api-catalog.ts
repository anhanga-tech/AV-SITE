const SITE_ORIGIN = 'https://www.anhanga.tur.br';
const API_CATALOG_PATH = '/.well-known/api-catalog';
const API_DOCS_PATH = '/.well-known/api-docs';
const OPENAPI_PATH = '/.well-known/openapi.json';
const HEALTH_PATH = '/api/health';
const RFC_9727_PROFILE = 'https://www.rfc-editor.org/info/rfc9727';

type JsonSchema = Record<string, unknown>;
type OpenApiJsonContent = {
    'application/json': {
        schema: JsonSchema;
    };
};

interface OpenApiRequestBody {
    required?: boolean;
    content: {
        'application/json': {
            schema: JsonSchema;
        };
    };
}

interface OpenApiResponseDefinition {
    description: string;
    content?: OpenApiJsonContent;
}

export interface ApiEndpointDefinition {
    anchor: string;
    method: string;
    summary: string;
    description: string;
    requestBody?: OpenApiRequestBody;
    responses: Record<string, OpenApiResponseDefinition>;
}

const GENERIC_JSON_OBJECT_SCHEMA: JsonSchema = {
    type: 'object',
    additionalProperties: true,
};

const GENERATE_SUCCESS_SCHEMA: JsonSchema = {
    type: 'object',
    required: ['text'],
    properties: {
        text: { type: 'string' },
        chips: {
            type: 'array',
            items: { type: 'string' },
        },
        functionCall: {
            type: 'object',
            additionalProperties: true,
        },
        handoff: {
            type: 'object',
            additionalProperties: true,
        },
    },
    additionalProperties: false,
};

const SUBMIT_SUCCESS_SCHEMA: JsonSchema = {
    type: 'object',
    required: ['ok', 'requestId', 'message'],
    properties: {
        ok: { type: 'boolean' },
        requestId: { type: 'string' },
        message: { type: 'string' },
    },
    additionalProperties: true,
};

const ERROR_RESPONSE_SCHEMA: JsonSchema = {
    type: 'object',
    required: ['error'],
    properties: {
        ok: { type: 'boolean' },
        requestId: { type: 'string' },
        code: { type: 'string' },
        error: { type: 'string' },
        retryAfter: { type: 'number' },
    },
    additionalProperties: true,
};

function buildJsonContent(schema: JsonSchema = GENERIC_JSON_OBJECT_SCHEMA): OpenApiJsonContent {
    return {
        'application/json': {
            schema,
        },
    };
}

function buildJsonResponse(description: string, schema: JsonSchema = GENERIC_JSON_OBJECT_SCHEMA): OpenApiResponseDefinition {
    return {
        description,
        content: buildJsonContent(schema),
    };
}

const API_ENDPOINTS: readonly ApiEndpointDefinition[] = [
    {
        anchor: `${SITE_ORIGIN}/api/generate`,
        method: 'post',
        summary: 'Generate travel assistant responses',
        description: 'Accepts the website chat history and returns the next assistant response plus optional chips and handoff data.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['contents'],
                        properties: {
                            contents: {
                                type: 'array',
                                minItems: 1,
                                items: {
                                    type: 'object',
                                    additionalProperties: true,
                                },
                                description: 'Conversation history forwarded from the first-party travel assistant UI.',
                            },
                        },
                        additionalProperties: false,
                    },
                },
            },
        },
        responses: {
            '200': buildJsonResponse('Generated assistant response payload.', GENERATE_SUCCESS_SCHEMA),
            '400': buildJsonResponse('Invalid request body.', ERROR_RESPONSE_SCHEMA),
            '429': buildJsonResponse('Rate limit exceeded.', ERROR_RESPONSE_SCHEMA),
            '500': buildJsonResponse('Server or upstream model failure.', ERROR_RESPONSE_SCHEMA),
        },
    },
    {
        anchor: `${SITE_ORIGIN}/api/submit-lead`,
        method: 'post',
        summary: 'Submit a qualified travel lead',
        description: 'Receives normalized lead data from the first-party chatbot flow and forwards it to configured downstream systems.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['firstName', 'lastName', 'email', 'whatsapp', 'bantSummary', 'destination'],
                        properties: {
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            whatsapp: { type: 'string' },
                            bantSummary: { type: 'string' },
                            destination: { type: 'string' },
                            utms: {
                                type: 'object',
                                additionalProperties: true,
                            },
                            tracking: {
                                type: 'object',
                                additionalProperties: true,
                            },
                        },
                        additionalProperties: true,
                    },
                },
            },
        },
        responses: {
            '201': buildJsonResponse('Lead accepted.', SUBMIT_SUCCESS_SCHEMA),
            '400': buildJsonResponse('Invalid lead payload.', ERROR_RESPONSE_SCHEMA),
            '429': buildJsonResponse('Rate limit exceeded.', ERROR_RESPONSE_SCHEMA),
            '500': buildJsonResponse('Server or upstream integration failure.', ERROR_RESPONSE_SCHEMA),
        },
    },
    {
        anchor: `${SITE_ORIGIN}/api/submit-waitlist`,
        method: 'post',
        summary: 'Submit a waitlist registration',
        description: 'Accepts first-party waitlist registrations and forwards the sanitized payload to the configured automation endpoint.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['name', 'email'],
                        properties: {
                            name: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            sourcePage: { type: 'string' },
                            utms: {
                                type: 'object',
                                additionalProperties: true,
                            },
                            tracking: {
                                type: 'object',
                                additionalProperties: true,
                            },
                        },
                        additionalProperties: true,
                    },
                },
            },
        },
        responses: {
            '201': buildJsonResponse('Waitlist registration accepted.', SUBMIT_SUCCESS_SCHEMA),
            '400': buildJsonResponse('Invalid waitlist payload.', ERROR_RESPONSE_SCHEMA),
            '429': buildJsonResponse('Rate limit exceeded.', ERROR_RESPONSE_SCHEMA),
            '500': buildJsonResponse('Server or upstream integration failure.', ERROR_RESPONSE_SCHEMA),
        },
    },
    {
        anchor: `${SITE_ORIGIN}/api/submit-nps`,
        method: 'post',
        summary: 'Submit a post-trip NPS rating',
        description: 'Accepts a Net Promoter Score submission from a returning traveller and forwards the sanitized payload to the configured downstream webhook.',
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['firstname', 'email', 'score', 'reason'],
                        properties: {
                            firstname: { type: 'string' },
                            email: { type: 'string', format: 'email' },
                            score: { type: 'integer', minimum: 0, maximum: 10 },
                            reason: { type: 'string', maxLength: 2000 },
                            highlight: { type: 'string', maxLength: 2000 },
                        },
                        additionalProperties: false,
                    },
                },
            },
        },
        responses: {
            '201': buildJsonResponse('NPS submission accepted.', SUBMIT_SUCCESS_SCHEMA),
            '400': buildJsonResponse('Invalid NPS payload.', ERROR_RESPONSE_SCHEMA),
            '429': buildJsonResponse('Rate limit exceeded.', ERROR_RESPONSE_SCHEMA),
            '502': buildJsonResponse('Downstream webhook failure.', ERROR_RESPONSE_SCHEMA),
            '500': buildJsonResponse('Server or upstream integration failure.', ERROR_RESPONSE_SCHEMA),
        },
    },
];

function buildLinkHeader(): string {
    return `</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"; profile="${RFC_9727_PROFILE}"`;
}

function buildBaseHeaders(contentType: string): HeadersInit {
    return {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Link': buildLinkHeader(),
    };
}

export function buildMethodNotAllowedResponse(allowedMethods: readonly string[]): Response {
    return new Response(JSON.stringify({
        error: 'Method not allowed',
        allowed: allowedMethods,
    }), {
        status: 405,
        headers: {
            ...buildBaseHeaders('application/json; charset=utf-8'),
            'Allow': allowedMethods.join(', '),
        },
    });
}

export function buildCatalogHeaders(): HeadersInit {
    return buildBaseHeaders(`application/linkset+json; profile="${RFC_9727_PROFILE}"`);
}

export function buildJsonHeaders(): HeadersInit {
    return buildBaseHeaders('application/json; charset=utf-8');
}

export function buildMarkdownHeaders(): HeadersInit {
    return buildBaseHeaders('text/markdown; charset=utf-8');
}

export function buildApiCatalogDocument(): {
    linkset: Array<{
        anchor: string;
        'service-desc': Array<{ href: string; type: string }>;
        'service-doc': Array<{ href: string; type: string }>;
        status: Array<{ href: string; type: string }>;
    }>;
} {
    return {
        linkset: API_ENDPOINTS.map(({ anchor }) => ({
            anchor,
            'service-desc': [
                {
                    href: `${SITE_ORIGIN}${OPENAPI_PATH}`,
                    type: 'application/json',
                },
            ],
            'service-doc': [
                {
                    href: `${SITE_ORIGIN}${API_DOCS_PATH}`,
                    type: 'text/markdown',
                },
            ],
            status: [
                {
                    href: `${SITE_ORIGIN}${HEALTH_PATH}`,
                    type: 'application/json',
                },
            ],
        })),
    };
}

export function buildOpenApiPaths(endpoints: readonly ApiEndpointDefinition[]): Record<string, Record<string, unknown>> {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const endpoint of endpoints) {
        const path = new URL(endpoint.anchor).pathname;
        paths[path] = {
            ...paths[path],
            [endpoint.method]: {
                summary: endpoint.summary,
                description: endpoint.description,
                requestBody: endpoint.requestBody,
                responses: endpoint.responses,
            },
        };
    }

    return paths;
}

export function buildOpenApiDocument(): Record<string, unknown> {
    const paths = buildOpenApiPaths(API_ENDPOINTS);

    paths[HEALTH_PATH] = {
        get: {
            summary: 'Read service health',
            description: 'Returns a simple status document used by the RFC 9727 status relation in the API catalog.',
            responses: {
                '200': {
                    description: 'Healthy status payload.',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status', 'service'],
                                properties: {
                                    status: {
                                        type: 'string',
                                        const: 'ok',
                                    },
                                    service: {
                                        type: 'string',
                                    },
                                },
                                additionalProperties: false,
                            },
                        },
                    },
                },
            },
        },
    };

    return {
        openapi: '3.1.0',
        info: {
            title: 'Anhangá Viagens Public API',
            version: '1.0.0',
            description: 'Public discovery document for the website APIs published via RFC 9727.',
        },
        servers: [
            {
                url: SITE_ORIGIN,
            },
        ],
        paths,
    };
}

export function buildApiDocs(): string {
    return `# Anhangá Viagens Public API

Automated discovery surface for the public website APIs, published via RFC 9727.

## Discovery

- API catalog: ${SITE_ORIGIN}${API_CATALOG_PATH}
- OpenAPI description: ${SITE_ORIGIN}${OPENAPI_PATH}
- Health status: ${SITE_ORIGIN}${HEALTH_PATH}

## Endpoints

### POST /api/generate

Powers the first-party travel assistant chat experience and returns the next assistant message plus optional structured handoff data.

### POST /api/submit-lead

Accepts qualified travel lead data captured by the first-party chatbot experience.

### POST /api/submit-waitlist

Accepts first-party waitlist registrations for campaign-specific landing pages.

### POST /api/submit-nps

Accepts post-trip Net Promoter Score submissions from returning travellers.

### GET /api/health

Returns a simple JSON status document used by the API catalog \`status\` relation.
`;
}

export function buildHealthDocument(): { status: string; service: string } {
    return {
        status: 'ok',
        service: 'anhanga-viagens-public-api',
    };
}
