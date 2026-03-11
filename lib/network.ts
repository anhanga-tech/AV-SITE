/**
 * Common network utilities for Edge Functions.
 */

/**
 * Normalizes and builds CORS headers for the response.
 */
export function buildCorsHeaders(allowedOrigin?: string): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': allowedOrigin || process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

/**
 * Extracts the client IP from the request headers.
 * Specialized for Vercel's environment.
 */
export function getClientIP(request: Request): string {
    // Try various headers that might contain the real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        return ips[ips.length - 1]; // Use the last one for Vercel
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Vercel-specific header
    const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
    if (vercelForwardedFor) {
        return vercelForwardedFor.split(',')[0].trim();
    }

    return 'unknown';
}
