/**
 * Shared factory for the `submit-*` Cloudflare Pages Functions.
 *
 * Every `submit-*` handler runs the same machine — method gate → CORS → config
 * check → rate limit → JSON parse → validation → payload build → `postToN8n` →
 * error classification → structured response. The only things that genuinely
 * differ per endpoint are the validator, the payload builder, the webhook env
 * var, the rate-limit numbers and a handful of copy strings. This module owns
 * the machine; each handler supplies the differences as config.
 *
 * `truncateDetail` and the n8n webhook-error classifier also live here so they
 * have a single source of truth (they used to be copy-pasted across handlers,
 * and one copy had already diverged).
 */
import { buildCorsHeaders, buildJsonResponse, createRequestId, getClientIP } from './network';
import { checkRateLimit } from './rate-limit';
import { logger } from './logger';

// Upstream errors are encoded by services/n8n.ts as
// `N8N_WEBHOOK_ERROR:<status>:<detail>`. The `s` flag lets the detail span the
// newlines that providers sometimes return.
const N8N_WEBHOOK_ERROR_PATTERN = /^N8N_WEBHOOK_ERROR:(\d+):(.*)$/s;

const DEFAULT_DETAIL_MAX_LENGTH = 600;
const DEFAULT_WEBHOOK_SECRET_ENV_VAR = 'N8N_WEBHOOK_SECRET';

/**
 * Collapses provider error detail into a single, length-bounded line safe for
 * internal logs. Returns `undefined` for empty input so callers can omit the
 * field entirely.
 */
export function truncateDetail(detail: string, maxLength = DEFAULT_DETAIL_MAX_LENGTH): string | undefined {
    const normalized = detail.replace(/[\r\n]+/g, ' ').trim();
    return normalized ? normalized.substring(0, maxLength) : undefined;
}

export interface N8nErrorClassification {
    code: string;
    status: number;
    error: string;
    detail?: string;
}

export interface ClassifyN8nErrorOptions {
    /** Response code when the failure is an upstream webhook error. */
    webhookCode: string;
    /** Client-facing message when the failure is an upstream webhook error. */
    webhookError: string;
    /** Client-facing message for unexpected (non-webhook) failures. */
    internalError: string;
    /** Maps the upstream HTTP status to the status returned to the client. */
    mapStatus: (upstreamStatus: number) => number;
    /** Optional override for the truncation length of the logged detail. */
    detailMaxLength?: number;
}

/**
 * Turns a thrown error into the structured `{ code, status, error, detail }`
 * shape every `submit-*` handler returns. Non-webhook failures collapse to a
 * neutral `INTERNAL_ERROR` 500.
 */
export function classifyN8nSubmitError(
    error: unknown,
    options: ClassifyN8nErrorOptions,
): N8nErrorClassification {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(N8N_WEBHOOK_ERROR_PATTERN);

    if (!match) {
        return {
            code: 'INTERNAL_ERROR',
            status: 500,
            error: options.internalError,
        };
    }

    const upstreamStatus = Number(match[1]);
    const detail = truncateDetail(match[2] || '', options.detailMaxLength ?? DEFAULT_DETAIL_MAX_LENGTH);

    return {
        code: options.webhookCode,
        status: options.mapStatus(upstreamStatus),
        error: options.webhookError,
        detail,
    };
}

/** Normalized request context handed to the payload builder. */
export interface N8nSubmitRequestContext {
    // getClientIP falls back to 'unknown' when no edge header is present. Meta
    // CAPI expects a real address or nothing, so the sentinel is collapsed to null.
    clientIpAddress: string | null;
    clientUserAgent: string | null;
}

export type ValidationResult<TData> =
    | { ok: true; data: TData }
    | { ok: false; error: string };

export interface CreateN8nSubmitHandlerOptions<TData, TPayload = unknown> {
    /** Logger scope, e.g. 'SUBMIT_LEAD'. */
    logScope: string;
    /** Env var holding the destination webhook URL. */
    webhookEnvVar: string;
    /** Env var holding the shared webhook secret (defaults to N8N_WEBHOOK_SECRET). */
    webhookSecretEnvVar?: string;
    config: {
        /** Status returned when the webhook URL or secret is missing. */
        missingStatus: number;
        /** Client-facing message when config is missing. */
        missingError: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
        keyPrefix: string;
        /** Client-facing message when the bucket is exhausted. */
        exceededError: string;
        /** When true, mirrors the retry window into the JSON body as `retryAfter`. */
        includeRetryAfterInBody?: boolean;
    };
    parse: {
        /** Client-facing message for malformed JSON bodies. */
        invalidJsonError: string;
    };
    /** Client-facing message for the 405 method gate. */
    methodNotAllowedError: string;
    /** Validates and normalizes the raw body into the typed payload data. */
    validate: (rawBody: unknown) => ValidationResult<TData>;
    /** Builds the outbound n8n payload from validated data. */
    buildPayload: (data: TData, requestId: string, ctx: N8nSubmitRequestContext) => TPayload;
    /** Sends the payload to n8n (a `services/n8n.ts` function). */
    send: (url: string, secret: string, requestId: string, payload: TPayload) => Promise<unknown>;
    success: {
        status: number;
        /** Optional success message; omitted from the body when absent. */
        message?: string;
    };
    /** Webhook-error classification config (also reused by exported classifiers). */
    error: ClassifyN8nErrorOptions;
    /** Optional extra fields for the `payload_validated` info log. */
    onValidated?: (data: TData, requestId: string) => Record<string, unknown> | void;
    /** Optional extra fields (e.g. masked recovery data) for the error log. */
    onError?: (params: { data: TData; requestId: string; classification: N8nErrorClassification }) => Record<string, unknown> | void;
}

/** Internal per-request state shared between the handler and its helpers. */
interface RequestEnv<TData, TPayload> {
    options: CreateN8nSubmitHandlerOptions<TData, TPayload>;
    requestId: string;
    corsHeaders: Record<string, string>;
}

/** Builds the 503/429 denial response (with logging) for an exhausted bucket. */
function buildRateLimitDenial<TData, TPayload>(
    env: RequestEnv<TData, TPayload>,
    clientIp: string,
    rateLimit: Awaited<ReturnType<typeof checkRateLimit>>,
): Response {
    const { options, requestId, corsHeaders } = env;

    if (rateLimit.serviceUnavailable) {
        logger.error(options.logScope, { requestId, stage: 'service_unavailable', clientIp });
        return buildJsonResponse(
            { ok: false, requestId, code: 'SERVICE_UNAVAILABLE', error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' },
            503,
            corsHeaders,
        );
    }

    const retryAfterSeconds = Math.ceil(rateLimit.resetIn / 1000);
    logger.warn(options.logScope, {
        requestId,
        stage: 'rate_limited',
        clientIp,
        remaining: rateLimit.remaining,
        retryAfterSeconds,
    });

    return buildJsonResponse(
        {
            ok: false,
            requestId,
            code: 'RATE_LIMIT_EXCEEDED',
            error: options.rateLimit.exceededError,
            ...(options.rateLimit.includeRetryAfterInBody ? { retryAfter: retryAfterSeconds } : {}),
        },
        429,
        {
            ...corsHeaders,
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.resetIn) / 1000)),
        },
    );
}

/** Classifies a thrown webhook/internal error, logs it, and builds the response. */
function buildWebhookErrorResponse<TData, TPayload>(
    env: RequestEnv<TData, TPayload>,
    data: TData,
    error: unknown,
): Response {
    const { options, requestId, corsHeaders } = env;
    const classification = classifyN8nSubmitError(error, options.error);
    const errorLogFields = options.onError?.({ data, requestId, classification }) ?? {};

    logger.error(options.logScope, {
        requestId,
        stage: classification.code === 'INTERNAL_ERROR' ? 'unexpected' : 'n8n_webhook_failed',
        code: classification.code,
        status: classification.status,
        detail: classification.detail,
        ...errorLogFields,
    });

    return buildJsonResponse(
        { ok: false, requestId, code: classification.code, error: classification.error },
        classification.status,
        corsHeaders,
    );
}

/**
 * Builds a `submit-*` request handler from per-endpoint configuration. The
 * returned function is the default export each `api/submit-*.ts` exposes.
 */
export function createN8nSubmitHandler<TData, TPayload = unknown>(
    options: CreateN8nSubmitHandlerOptions<TData, TPayload>,
): (request: Request) => Promise<Response> {
    const secretEnvVar = options.webhookSecretEnvVar ?? DEFAULT_WEBHOOK_SECRET_ENV_VAR;

    return async function handler(request: Request): Promise<Response> {
        const requestId = createRequestId();
        const corsHeaders = buildCorsHeaders();
        const env: RequestEnv<TData, TPayload> = { options, requestId, corsHeaders };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return buildJsonResponse(
                { ok: false, requestId, code: 'METHOD_NOT_ALLOWED', error: options.methodNotAllowedError },
                405,
                corsHeaders,
            );
        }

        const webhookUrl = process.env[options.webhookEnvVar]?.trim();
        const webhookSecret = process.env[secretEnvVar]?.trim();
        if (!webhookUrl || !webhookSecret) {
            logger.error(options.logScope, { requestId, stage: 'config', code: 'SERVER_CONFIG_ERROR' });
            return buildJsonResponse(
                { ok: false, requestId, code: 'SERVER_CONFIG_ERROR', error: options.config.missingError },
                options.config.missingStatus,
                corsHeaders,
            );
        }

        const clientIp = getClientIP(request);
        const rateLimit = await checkRateLimit(clientIp, {
            limit: options.rateLimit.max,
            windowMs: options.rateLimit.windowMs,
            prefix: options.rateLimit.keyPrefix,
        });

        if (!rateLimit.allowed) {
            return buildRateLimitDenial(env, clientIp, rateLimit);
        }

        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return buildJsonResponse(
                { ok: false, requestId, code: 'VALIDATION_ERROR', error: options.parse.invalidJsonError },
                400,
                corsHeaders,
            );
        }

        const validation = options.validate(rawBody);
        if (!validation.ok) {
            return buildJsonResponse(
                { ok: false, requestId, code: 'VALIDATION_ERROR', error: validation.error },
                400,
                corsHeaders,
            );
        }

        const data = validation.data;

        const validatedLogFields = options.onValidated?.(data, requestId);
        if (validatedLogFields) {
            logger.info(options.logScope, { requestId, stage: 'payload_validated', ...validatedLogFields });
        }

        const ctx: N8nSubmitRequestContext = {
            clientIpAddress: clientIp && clientIp !== 'unknown' ? clientIp : null,
            clientUserAgent: request.headers.get('user-agent'),
        };

        try {
            const payload = options.buildPayload(data, requestId, ctx);
            await options.send(webhookUrl, webhookSecret, requestId, payload);
        } catch (error: unknown) {
            return buildWebhookErrorResponse(env, data, error);
        }

        logger.info(options.logScope, { requestId, stage: 'done' });

        return buildJsonResponse(
            {
                ok: true,
                requestId,
                ...(options.success.message ? { message: options.success.message } : {}),
            },
            options.success.status,
            corsHeaders,
        );
    };
}
