/**
 * Common network utilities for Edge Functions.
 */

export function createRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Normalizes and builds CORS headers for the response.
 */
export function buildCorsHeaders(allowedOrigin?: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': allowedOrigin || process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Expose-Headers': 'X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-Id',
    };
}

/**
 * Builds a structured JSON error response.
 */
export function buildJsonError(status: number, code: string, message: string): Response {
    return new Response(JSON.stringify({ error: code, message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Extracts the client IP from the request headers.
 * Prioritizes Cloudflare's edge-provided header before legacy fallbacks.
 */
export function getClientIP(request: Request): string {
    const cfConnectingIP = getTrimmedHeader(request, 'cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    const realIP = getTrimmedHeader(request, 'x-real-ip');
    if (realIP) {
        return realIP;
    }

    const vercelForwardedFor = getTrimmedHeader(request, 'x-vercel-forwarded-for');
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim();
    }

    const forwardedFor = getTrimmedHeader(request, 'x-forwarded-for');
    if (forwardedFor) {
        const ips: string[] = [];
        for (const ip of forwardedFor.split(',')) {
            const trimmed = ip.trim();
            if (trimmed) {
                ips.push(trimmed);
            }
        }
        // XFF is only reached in local dev or on platforms that don't set
        // cf-connecting-ip / x-vercel-forwarded-for. In those contexts,
        // the leftmost IP is the original client (RFC 7239). Spoofing via a
        // client-controlled XFF value is irrelevant in local dev and not a
        // concern on Cloudflare/Vercel because those headers take priority above.
        return ips[0] || 'unknown';
    }

    return 'unknown';
}

function getTrimmedHeader(request: Request, headerName: string): string | undefined {
    const value = request.headers.get(headerName)?.trim();
    return value || undefined;
}
