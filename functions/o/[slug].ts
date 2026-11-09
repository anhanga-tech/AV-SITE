import { handleOfferLinkRequest } from '../../lib/offer-link-page';

interface CFCtx {
  request: Request;
  env: Record<string, string>;
  params: { slug?: string | string[] };
  waitUntil: (promise: Promise<unknown>) => void;
}

export const onRequest = async (context: CFCtx): Promise<Response> => {
  Object.assign(process.env, context.env);
  const slug = typeof context.params.slug === 'string' ? context.params.slug : '';
  // Called through the context: a detached `waitUntil` loses its receiver
  // and throws "Illegal invocation" on Workers.
  return handleOfferLinkRequest(context.request, slug, {
    waitUntil: (promise) => context.waitUntil(promise),
  });
};
