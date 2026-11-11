import { handleNpsLinkHook } from '../../api/nps-link-hook';

interface CFCtx {
  request: Request;
  env: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
}

export const onRequest = async (context: CFCtx): Promise<Response> => {
  Object.assign(process.env, context.env);
  // Called through the context: a detached `waitUntil` loses its receiver
  // and throws "Illegal invocation" on Workers.
  return handleNpsLinkHook(context.request, {
    waitUntil: (promise) => context.waitUntil(promise),
  });
};
