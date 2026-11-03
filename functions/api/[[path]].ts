import handler from '../../api/not-found';

interface CFCtx { request: Request }

// Catch-all de /api/*: as rotas nomeadas ao lado (generate.ts, health.ts, auth/…) são mais
// específicas e têm precedência no roteamento do Pages; só o que não casa nenhuma chega aqui.
export const onRequest = ({ request }: CFCtx): Response => handler(request);
