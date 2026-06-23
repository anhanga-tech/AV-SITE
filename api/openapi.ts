import {
    buildJsonHeaders,
    buildMethodNotAllowedResponse,
    buildOpenApiDocument,
} from '../lib/api-catalog';

const ALLOWED_METHODS = ['GET', 'HEAD'] as const;

export default async function handler(req: Request): Promise<Response> {
    if (!ALLOWED_METHODS.includes(req.method as typeof ALLOWED_METHODS[number])) {
        return buildMethodNotAllowedResponse(ALLOWED_METHODS);
    }

    const body = req.method === 'HEAD'
        ? null
        : JSON.stringify(buildOpenApiDocument());

    return new Response(body, {
        status: 200,
        headers: buildJsonHeaders(),
    });
}
