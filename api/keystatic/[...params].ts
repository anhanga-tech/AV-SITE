// Keystatic API route — Node.js runtime (não Edge)
// Autentica com GitHub OAuth e gerencia leitura/escrita de arquivos MDX
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import keystatic from '../../keystatic.config';

const handler = makeGenericAPIRouteHandler({ config: keystatic });

export default async function (request: Request): Promise<Response> {
    const result = await handler(request);
    return new Response(result.body as BodyInit ?? null, result);
}
