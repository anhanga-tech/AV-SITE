import { handleProposalRequest } from '../../lib/proposal-page';

interface CFCtx {
  request: Request;
  env: Record<string, string>;
  params: { id?: string | string[] };
}

export const onRequest = async ({ request, env, params }: CFCtx): Promise<Response> => {
  Object.assign(process.env, env);
  const id = typeof params.id === 'string' ? params.id : '';
  return handleProposalRequest(request, id);
};
