export const config = {
    runtime: 'edge',
};

import { buildJsonError } from '../lib/network';

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const OAUTH_SCOPE = 'repo,user';
const STATE_COOKIE_MAX_AGE_SECONDS = 300;

export default function handler(req: Request): Response {
    if (req.method !== 'GET') {
        return buildJsonError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
        return buildJsonError(500, 'CONFIGURATION_ERROR', 'OAuth provider not configured');
    }

    const state = crypto.randomUUID();

    const params = new URLSearchParams({
        client_id: clientId,
        scope: OAUTH_SCOPE,
        state,
    });

    const cookieAttrs = `HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${STATE_COOKIE_MAX_AGE_SECONDS}; Secure`;
    const headers = new Headers({
        Location: `${GITHUB_OAUTH_URL}?${params}`,
        'Set-Cookie': `oauth_state=${state}; ${cookieAttrs}`,
    });

    return new Response(null, { status: 302, headers });
}
