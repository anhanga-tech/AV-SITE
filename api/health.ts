import {
    buildHealthDocument,
    buildJsonHeaders,
    buildMethodNotAllowedResponse,
} from '../lib/api-catalog';
import { isEdgeRuntime } from '../lib/redis-client';
import { logger } from '../lib/logger';

const REQUIRED_RATE_LIMIT_CONFIG = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'RATE_LIMIT_KEY_SECRET',
] as const;

const ALLOWED_METHODS = ['GET', 'HEAD'] as const;

export default async function handler(req: Request): Promise<Response> {
    if (!ALLOWED_METHODS.includes(req.method as typeof ALLOWED_METHODS[number])) {
        return buildMethodNotAllowedResponse(ALLOWED_METHODS);
    }

    // Configuration readiness only: no Redis requests or rate-limit consumption.
    const missing = isEdgeRuntime()
        ? REQUIRED_RATE_LIMIT_CONFIG.filter((name) => !process.env[name]?.trim())
        : [];
    const unavailable = missing.length > 0;
    if (unavailable) {
        logger.error('HEALTH', { stage: 'rate_limit_config_missing', missing });
    }
    const document = buildHealthDocument();
    if (unavailable) document.status = 'unavailable';
    const headers = new Headers(buildJsonHeaders());
    headers.set('Cache-Control', 'no-store');

    const body = req.method === 'HEAD'
        ? null
        : JSON.stringify(document);

    return new Response(body, {
        status: unavailable ? 503 : 200,
        headers,
    });
}
