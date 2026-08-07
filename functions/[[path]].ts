import markdownHandler from '../api/markdown';
import {
  isUnsupportedDiscoveryPath,
  normalizeAgentPath,
  requestsMarkdown,
} from '../lib/agent-readiness';

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

function notFoundResponse(): Response {
  return new Response('Not Found\n', {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex',
    },
  });
}

async function markdownResponseFor(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const markdownUrl = new URL('/api/markdown', url.origin);
  markdownUrl.searchParams.set('path', normalizeAgentPath(url.pathname));

  return markdownHandler(new Request(markdownUrl, {
    method: 'GET',
    headers: request.headers,
  }));
}

export const onRequest = async ({ request, next }: PagesContext): Promise<Response> => {
  const pathname = new URL(request.url).pathname;

  if (isUnsupportedDiscoveryPath(pathname)) {
    return notFoundResponse();
  }

  if (request.method !== 'GET' || !requestsMarkdown(request.headers.get('Accept'))) {
    return next();
  }

  return markdownResponseFor(request);
};
