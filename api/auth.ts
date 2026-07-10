import { buildJsonError, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { logger } from '../lib/logger';
import { validateOAuthInitiationOrigin } from '../lib/auth-origin';

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const OAUTH_SCOPE = 'repo,user';
const STATE_COOKIE_MAX_AGE_SECONDS = 300;

export default async function handler(req: Request): Promise<Response> {
    if (req.method !== 'GET') {
        return buildJsonError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        logger.error('AUTH: GITHUB_CLIENT_ID missing');
        return buildJsonError(500, 'CONFIGURATION_ERROR', 'OAuth provider not configured');
    }

    // The OAuth popup is opened via a top-level navigation from the CMS admin
    // page, so its Referer identifies the opener. Bind the callback's
    // postMessage target to this validated origin instead of trusting an
    // env-only default or an open subdomain pattern (issue #1135).
    const validatedOrigin = validateOAuthInitiationOrigin(req.headers.get('referer'));
    if (!validatedOrigin) {
        logger.warn('AUTH: rejected OAuth initiation from unauthorized or missing origin');
        return buildJsonError(400, 'INVALID_ORIGIN', 'OAuth initiation must come from an authorized origin');
    }

    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(clientIP, {
        limit: RATE_LIMIT_MAX_REQUESTS,
        windowMs: RATE_LIMIT_WINDOW_MS,
        prefix: 'ratelimit:auth',
    });

    if (!rateLimit.allowed) {
        logger.warn('AUTH: rate limit exceeded', { clientIP });
        return buildJsonError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
    }

    logger.info('AUTH: initiating OAuth flow', { clientIP });

    const state = crypto.randomUUID();

    const params = new URLSearchParams({
        client_id: clientId,
        scope: OAUTH_SCOPE,
        state,
    });

    const cookieAttrs = `HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${STATE_COOKIE_MAX_AGE_SECONDS}; Secure`;
    const headers = new Headers({
        Location: `${GITHUB_OAUTH_URL}?${params}`,
    });
    headers.append('Set-Cookie', `oauth_state=${state}; ${cookieAttrs}`);
    headers.append('Set-Cookie', `oauth_origin=${validatedOrigin}; ${cookieAttrs}`);

    return new Response(null, { status: 302, headers });
}
