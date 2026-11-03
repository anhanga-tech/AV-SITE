import handler from '../api/openapi';

interface CFCtx { request: Request; env: Record<string, string> }

// /openapi.json com 200 direto, fora de /api/ (bloqueado no robots.txt): o checkpoint de
// OpenAPI dos scanners de agent readiness não segue redirect. /.well-known/openapi.json
// redireciona para cá (public/_redirects).
export const onRequest = async ({ request, env }: CFCtx): Promise<Response> => {
  Object.assign(process.env, env);
  return handler(request);
};
