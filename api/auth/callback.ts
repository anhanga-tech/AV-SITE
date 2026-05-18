export const config = {
    runtime: 'edge',
};

import { buildJsonError } from '../../lib/network';
import { logger } from '../../lib/logger';
import { AuthCallbackQuerySchema } from '../../lib/schemas/auth-callback';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_TOKEN_TIMEOUT_MS = 8000;
const PROVIDER = 'github';

function parseCookies(header: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const part of header.split(';')) {
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        const key = part.slice(0, eq).trim();
        const val = part.slice(eq + 1).trim();
        if (key) cookies[key] = val;
    }
    return cookies;
}

/** Serializes a string as a JSON literal safe for embedding inside a <script> block. */
function safeJsonString(value: string): string {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}

/**
 * Returns an HTML page that completes the Decap CMS OAuth handshake via postMessage.
 *
 * Protocol (canonical Decap CMS flow with security hardening):
 *  1. This page determines allowed origins for communication (the site itself).
 *  2. This page fires `window.opener.postMessage('authorizing:github', '*')` — no sensitive payload.
 *  3. The CMS parent window echoes the same message back.
 *  4. This page verifies the echo's `e.origin` against the allowlist.
 *  5. This page replies to `e.source` at the VERIFIED `e.origin` with the auth result.
 */
export function buildPostMessageHtml(status: 'success' | 'error', content: string, httpStatus: number): Response {
    const safeProvider = safeJsonString(PROVIDER);
    const safeStatus = safeJsonString(status);
    const safeContent = safeJsonString(content);
    const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br';

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex,nofollow">
  <title>Autenticação</title>
</head>
<body>
<script>
(function () {
  var provider = ${safeProvider};
  var status = ${safeStatus};
  var content = ${safeContent};
  var allowedOrigin = ${safeJsonString(allowedOrigin)};
  var handshake = 'authorizing:' + provider;
  var message = 'authorization:' + provider + ':' + status + ':' + content;

  if (!window.opener) {
    document.body.textContent = status === 'error'
      ? 'Erro de autenticação: ' + content
      : 'Autenticação concluída. Feche esta janela.';
    return;
  }

  function onMessage(e) {
    if (e.data !== handshake) return;

    // Hardened origin check: only respond to the site's own origin or localhost (for dev).
    // The CMS must be hosted on the same domain or a trusted subdomain.
    var origin = e.origin || '';
    var isTrusted = origin === allowedOrigin ||
                    origin === window.location.origin ||
                    /^https:\\/\\/.*\\.anhanga\\.tur\\.br$/.test(origin) ||
                    /^http:\\/\\/localhost:\\d+$/.test(origin);

    if (!isTrusted) {
      console.error('AUTH_CALLBACK: Blocked unauthorized origin:', origin);
      return;
    }

    clearTimeout(handshakeTimeout);
    window.removeEventListener('message', onMessage, false);
    e.source.postMessage(message, e.origin);
    window.close();
  }

  // Guard against opener never responding — clean up listener and surface error.
  var handshakeTimeout = setTimeout(function () {
    window.removeEventListener('message', onMessage, false);
    document.body.textContent = 'Erro: o CMS não respondeu ao handshake. Feche esta janela e tente novamente.';
  }, 10000);

  window.addEventListener('message', onMessage, false);
  window.opener.postMessage(handshake, '*');
}());
</script>
</body>
</html>`;

    return new Response(html, {
        status: httpStatus,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Set-Cookie': 'oauth_state=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
        },
    });
}

/** Returns the access token string on success, or an error Response on failure. */
async function exchangeCodeForToken(clientId: string, clientSecret: string, code: string): Promise<Response | string> {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), GITHUB_TOKEN_TIMEOUT_MS);

    let tokenData: Record<string, unknown>;
    try {
        const tokenRes = await fetch(GITHUB_TOKEN_URL, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
            signal: ac.signal,
        });
        clearTimeout(timer);

        if (!tokenRes.ok) {
            logger.error('AUTH_CALLBACK', { stage: 'token_exchange', httpStatus: tokenRes.status });
            return buildPostMessageHtml('error', 'Token exchange failed', 502);
        }

        tokenData = (await tokenRes.json()) as Record<string, unknown>;
    } catch (err) {
        clearTimeout(timer);
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        logger.error('AUTH_CALLBACK', { stage: 'token_fetch', error: isTimeout ? 'timeout' : err instanceof Error ? err.message : 'unknown' });
        return buildPostMessageHtml('error', isTimeout ? 'Token exchange timed out' : 'Token exchange request failed', 502);
    }

    if (tokenData['error'] || typeof tokenData['access_token'] !== 'string') {
        logger.error('AUTH_CALLBACK', { stage: 'token_parse', error: tokenData['error'] ?? 'missing_token' });
        return buildPostMessageHtml('error', String(tokenData['error_description'] ?? 'Token exchange failed'), 400);
    }

    return tokenData['access_token'];
}

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'GET') {
        return buildJsonError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return buildJsonError(500, 'CONFIGURATION_ERROR', 'OAuth provider not configured');
    }

    const url = new URL(req.url);
    const errorParam = url.searchParams.get('error');

    const cookies = parseCookies(req.headers.get('cookie') ?? '');
    const storedState = cookies['oauth_state'];

    if (errorParam) {
        const desc = url.searchParams.get('error_description') ?? errorParam;
        return buildPostMessageHtml('error', desc, 400);
    }

    const queryParsed = AuthCallbackQuerySchema.safeParse({
        code:  url.searchParams.get('code'),
        state: url.searchParams.get('state'),
    });

    if (!queryParsed.success) {
        return buildPostMessageHtml('error', 'Missing required parameters', 400);
    }

    const { code, state } = queryParsed.data;

    if (!storedState || state !== storedState) {
        return buildPostMessageHtml('error', 'Invalid state parameter', 400);
    }

    const result = await exchangeCodeForToken(clientId, clientSecret, code);
    if (result instanceof Response) return result;

    const successContent = JSON.stringify({ token: result, provider: PROVIDER });
    return buildPostMessageHtml('success', successContent, 200);
}
