import { buildJsonHeaders } from '../lib/api-catalog';

// Resposta das rotas inexistentes sob /api/ (functions/api/[[path]].ts). Sem ela, o Pages
// devolvia o 404.html do site, e agentes que chamam a API recebiam HTML onde esperam JSON.
export default function handler(req: Request): Response {
    const headers = new Headers(buildJsonHeaders());
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex');

    const body = req.method === 'HEAD'
        ? null
        : JSON.stringify({
            ok: false,
            code: 'NOT_FOUND',
            error: 'API route not found. See /openapi.json for the available operations.',
        });

    return new Response(body, { status: 404, headers });
}
