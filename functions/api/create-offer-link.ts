import handler from '../../api/create-offer-link';

interface CFCtx { request: Request; env: Record<string, string> }

export const onRequest = async ({ request, env }: CFCtx): Promise<Response> => {
  Object.assign(process.env, env);
  return handler(request);
};
