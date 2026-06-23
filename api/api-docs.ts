import {
    buildApiDocs,
    buildMarkdownHeaders,
    buildMethodNotAllowedResponse,
} from '../lib/api-catalog';

const ALLOWED_METHODS = ['GET', 'HEAD'] as const;

export default async function handler(req: Request): Promise<Response> {
    if (!ALLOWED_METHODS.includes(req.method as typeof ALLOWED_METHODS[number])) {
        return buildMethodNotAllowedResponse(ALLOWED_METHODS);
    }

    return new Response(req.method === 'HEAD' ? null : buildApiDocs(), {
        status: 200,
        headers: buildMarkdownHeaders(),
    });
}
