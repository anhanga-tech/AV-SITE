import { buildJsonError, getClientIP } from '../../lib/network';
import { logger } from '../../lib/logger';
import { checkRateLimit } from '../../lib/rate-limit';
import { timingSafeEqual } from '../../lib/security';
import { AuthCallbackQuerySchema } from '../../lib/schemas/auth-callback';
import { isAllowedOAuthOrigin, resolveProductionOAuthOrigin } from '../../lib/auth-origin';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_TOKEN_TIMEOUT_MS = 8000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const PROVIDER = 'github';
const CLEAR_COOKIES = [
    'oauth_state=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
    'oauth_origin=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax; Secure',
];

/**
 * CSP for the OAuth callback HTML page: only the nonce-tagged handshake script
 * runs; no other resources, framing, or forms. A fresh nonce per request avoids
 * 'unsafe-inline', so an injected inline script without the nonce won't execute.
 */
function buildCallbackCsp(nonce: string): string {
    return `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
}

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
 * Protocol (canonical Decap CMS flow with security hardening, issue #1135):
 *  1. `allowedOrigin` is the single origin the server validated and bound to
 *     this OAuth attempt — never a regex, never `window.location.origin`.
 *  2. This page fires `window.opener.postMessage('authorizing:github', allowedOrigin)` — no sensitive payload.
 *  3. The CMS parent window echoes the same message back.
 *  4. This page verifies the echo came from `window.opener` itself (not just
 *     any window that guessed the handshake string) AND that `e.origin`
 *     equals the bound `allowedOrigin` exactly.
 *  5. Only then does this page reply to `e.source` with the auth result.
 */
export function buildPostMessageHtml(
    status: 'success' | 'error',
    content: string,
    httpStatus: number,
    allowedOrigin: string = resolveProductionOAuthOrigin(),
): Response {
    const safeProvider = safeJsonString(PROVIDER);
    const safeStatus = safeJsonString(status);
    const safeContent = safeJsonString(content);
    const nonce = crypto.randomUUID();

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex,nofollow">
  <title>Autenticação</title>
</head>
<body>
<script nonce="${nonce}">
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

    // Bind the reply to the original opener window, not merely to any
    // window that happens to know the handshake string and post from the
    // expected origin (issue #1135).
    if (e.source !== window.opener) {
      console.error('AUTH_CALLBACK: Blocked message from a non-opener source');
      return;
    }

    // Single validated origin, bound server-side to this OAuth attempt.
    if (e.origin !== allowedOrigin) {
      console.error('AUTH_CALLBACK: Blocked unauthorized origin:', e.origin);
      return;
    }

    clearTimeout(handshakeTimeout);
    window.removeEventListener('message', onMessage, false);
    e.source.postMessage(message, allowedOrigin);
    window.close();
  }

  // Guard against opener never responding — clean up listener and surface error.
  var handshakeTimeout = setTimeout(function () {
    window.removeEventListener('message', onMessage, false);
    document.body.textContent = 'Erro: o CMS não respondeu ao handshake. Feche esta janela e tente novamente.';
  }, 10000);

  window.addEventListener('message', onMessage, false);
  window.opener.postMessage(handshake, allowedOrigin);
}());
</script>
</body>
</html>`;

    const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': buildCallbackCsp(nonce),
    });
    for (const cookie of CLEAR_COOKIES) {
        headers.append('Set-Cookie', cookie);
    }

    return new Response(html, { status: httpStatus, headers });
}

/** Returns the access token string on success, or an error Response on failure. */
async function exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
    allowedOrigin: string,
): Promise<Response | string> {
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
            return buildPostMessageHtml('error', 'Token exchange failed', 502, allowedOrigin);
        }

        tokenData = (await tokenRes.json()) as Record<string, unknown>;
    } catch (err) {
        clearTimeout(timer);
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        logger.error('AUTH_CALLBACK', { stage: 'token_fetch', error: isTimeout ? 'timeout' : err instanceof Error ? err.message : 'unknown' });
        return buildPostMessageHtml('error', isTimeout ? 'Token exchange timed out' : 'Token exchange request failed', 502, allowedOrigin);
    }

    if (tokenData['error'] || typeof tokenData['access_token'] !== 'string') {
        logger.error('AUTH_CALLBACK', { stage: 'token_parse', error: tokenData['error'] ?? 'missing_token' });
        return buildPostMessageHtml('error', String(tokenData['error_description'] ?? 'Token exchange failed'), 400, allowedOrigin);
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
        logger.error('AUTH_CALLBACK: OAuth configuration missing');
        return buildJsonError(500, 'CONFIGURATION_ERROR', 'OAuth provider not configured');
    }

    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:auth-callback',
    });

    if (!rateLimit.allowed) {
        logger.warn('AUTH_CALLBACK: rate limit exceeded', { clientIP });
        return buildPostMessageHtml('error', 'Too many requests. Please try again later.', 429);
    }

    const url = new URL(req.url);
    const errorParam = url.searchParams.get('error');

    const cookies = parseCookies(req.headers.get('cookie') ?? '');
    const storedState = cookies['oauth_state'];
    const storedOrigin = cookies['oauth_origin'];

    // The origin bound at initiation must still be in the allowlist — it was
    // validated once already, but a stale/replayed cookie from a config
    // change (e.g. ALLOWED_ORIGIN rotated) should not stay trusted forever.
    const boundOrigin = isAllowedOAuthOrigin(storedOrigin) ? storedOrigin : resolveProductionOAuthOrigin();

    if (errorParam) {
        const desc = url.searchParams.get('error_description') ?? errorParam;
        logger.warn('AUTH_CALLBACK: provider returned error', { error: errorParam, description: desc });
        return buildPostMessageHtml('error', desc, 400, boundOrigin);
    }

    const queryParsed = AuthCallbackQuerySchema.safeParse({
        code:  url.searchParams.get('code'),
        state: url.searchParams.get('state'),
    });

    if (!queryParsed.success) {
        logger.warn('AUTH_CALLBACK: validation failed', { error: queryParsed.error.flatten() });
        return buildPostMessageHtml('error', 'Missing required parameters', 400, boundOrigin);
    }

    const { code, state } = queryParsed.data;

    const stateMatches = storedState ? timingSafeEqual(state, storedState) : false;
    const originMatches = isAllowedOAuthOrigin(storedOrigin);
    if (!stateMatches || !originMatches) {
        logger.warn('AUTH_CALLBACK: state mismatch or missing/unauthorized origin binding', {
            hasStoredState: Boolean(storedState),
            hasStoredOrigin: Boolean(storedOrigin),
        });
        return buildPostMessageHtml('error', 'Invalid state parameter', 400, boundOrigin);
    }

    const result = await exchangeCodeForToken(clientId, clientSecret, code, boundOrigin);
    if (result instanceof Response) return result;

    logger.info('AUTH_CALLBACK: authentication successful');

    const successContent = JSON.stringify({ token: result, provider: PROVIDER });
    return buildPostMessageHtml('success', successContent, 200, boundOrigin);
}
