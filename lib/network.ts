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
 * Specialized for Vercel's environment.
 */
export function getClientIP(request: Request): string {
    // Prioritize X-Real-IP as it is more reliable on Vercel
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }

    // Vercel-specific header
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim();
    }

    // Fallback to X-Forwarded-For
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        // Standard practice: use the first one (original client)
        return ips[0];
    }

    return 'unknown';
}
