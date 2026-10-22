import { handleProposalRequest } from '../../lib/proposal-page';

interface CFCtx {
  request: Request;
  env: Record<string, string>;
  params: { id?: string | string[] };
  waitUntil: (promise: Promise<unknown>) => void;
}

export const onRequest = async (context: CFCtx): Promise<Response> => {
  Object.assign(process.env, context.env);
  const id = typeof context.params.id === 'string' ? context.params.id : '';
  // Called through the context: a detached `waitUntil` loses its receiver
  // and throws "Illegal invocation" on Workers.
  return handleProposalRequest(context.request, id, {
    waitUntil: (promise) => context.waitUntil(promise),
  });
};
