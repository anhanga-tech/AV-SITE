import handler from '../../api/api-docs';

interface CFCtx { request: Request; env: Record<string, string> }

export const onRequest = async ({ request, env }: CFCtx): Promise<Response> => {
  Object.assign(process.env, env);
  return handler(request);
};
