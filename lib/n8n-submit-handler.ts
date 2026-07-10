/**
 * Shared factory for the `submit-*` Cloudflare Pages Functions.
 *
 * Every `submit-*` handler runs the same machine — method gate → CORS → config
 * check → rate limit → JSON parse → validation → payload build → dispatch →
 * error classification → structured response. The only things that genuinely
 * differ per endpoint are the validator, the payload builder, the provider
 * dispatch (Odoo today), the rate-limit numbers and a handful of copy strings.
 * This module owns the machine; each handler supplies the differences as
 * config (see `lib/odoo-submit-handler.ts` for the Odoo adapter).
 *
 * `truncateDetail` and the error classifier also live here so they have a
 * single source of truth (they used to be copy-pasted across handlers, and one
 * copy had already diverged). The error pattern/codes are named after n8n for
 * historical reasons (pre cut-over, every form posted to n8n); `ODOO_ERROR:...`
 * is matched the same way via the `errorPattern` option each handler supplies.
 */
import { buildCorsHeaders, buildJsonResponse, createRequestId, getClientIP } from './network';
import { checkRateLimit } from './rate-limit';
import { detectBot } from './bot-detection';
import { logger } from './logger';

// Default error pattern, overridable per handler via `errorPattern` (e.g. Odoo
// handlers supply `ODOO_ERROR:<status>:<detail>`).
const N8N_WEBHOOK_ERROR_PATTERN = /^N8N_WEBHOOK_ERROR:(\d+):(.*)$/s;

const DEFAULT_DETAIL_MAX_LENGTH = 600;

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
    /**
     * Pattern matching the normalized upstream error string, capturing
     * `(status)(detail)`. Defaults to the n8n `N8N_WEBHOOK_ERROR:` format; the
     * Odoo dispatch passes its own `ODOO_ERROR:` pattern.
     */
    errorPattern?: RegExp;
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
    const match = message.match(options.errorPattern ?? N8N_WEBHOOK_ERROR_PATTERN);

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

/** Per-form validators may be async (e.g. NPS signed-invitation verification). */
export type MaybeAsyncValidationResult<TData> = ValidationResult<TData> | Promise<ValidationResult<TData>>;

/** Result of a per-request provider config check. */
export type DispatchConfigCheck =
    | { ok: true }
    | { ok: false; status: number; error: string };

/**
 * Provider-specific behavior plugged into the generic submit machine. n8n and
 * Odoo each supply one of these; everything else (method gate, CORS, rate limit,
 * parse, validate, response) is shared.
 */
export interface SubmitDispatch<TData, TPayload> {
    /** Verifies provider config (env presence) at request time. */
    checkConfig: () => DispatchConfigCheck;
    /** Builds the outbound payload from validated data. */
    buildPayload: (data: TData, requestId: string, ctx: N8nSubmitRequestContext) => TPayload;
    /** Sends the payload to the provider; throws a normalized error on failure. */
    send: (requestId: string, payload: TPayload) => Promise<unknown>;
    /** Classifies a thrown send error into the structured response shape. */
    classifyError: (error: unknown) => N8nErrorClassification;
    /** Log `stage` used for non-internal send failures. */
    failureStage?: string;
}

/** Provider-agnostic options for the shared submit machine. */
export interface CreateSubmitHandlerOptions<TData, TPayload = unknown> {
    /** Logger scope, e.g. 'SUBMIT_LEAD'. */
    logScope: string;
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
    validate: (rawBody: unknown) => MaybeAsyncValidationResult<TData>;
    /** Provider plug-in (n8n or Odoo). */
    dispatch: SubmitDispatch<TData, TPayload>;
    success: {
        status: number;
        /** Optional success message; omitted from the body when absent. */
        message?: string;
    };
    /** Optional extra fields for the `payload_validated` info log. */
    onValidated?: (data: TData, requestId: string) => Record<string, unknown> | void;
    /** Optional extra fields (e.g. masked recovery data) for the error log. */
    onError?: (params: { data: TData; requestId: string; classification: N8nErrorClassification }) => Record<string, unknown> | void;
}

/** Internal per-request state shared between the handler and its helpers. */
interface RequestEnv<TData, TPayload> {
    options: CreateSubmitHandlerOptions<TData, TPayload>;
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
    const classification = options.dispatch.classifyError(error);
    const errorLogFields = options.onError?.({ data, requestId, classification }) ?? {};

    logger.error(options.logScope, {
        requestId,
        stage: classification.code === 'INTERNAL_ERROR' ? 'unexpected' : (options.dispatch.failureStage ?? 'dispatch_failed'),
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
 * Builds a `submit-*` request handler from provider-agnostic configuration. The
 * returned function is the default export each `api/submit-*.ts` exposes. The
 * `dispatch` plug-in supplies the provider (n8n or Odoo).
 */
export function createSubmitHandler<TData, TPayload = unknown>(
    options: CreateSubmitHandlerOptions<TData, TPayload>,
): (request: Request) => Promise<Response> {
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

        const configCheck = options.dispatch.checkConfig();
        if (!configCheck.ok) {
            logger.error(options.logScope, { requestId, stage: 'config', code: 'SERVER_CONFIG_ERROR' });
            return buildJsonResponse(
                { ok: false, requestId, code: 'SERVER_CONFIG_ERROR', error: configCheck.error },
                configCheck.status,
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

        // Bot heuristics (honeypot + timing) run before validation so their extra
        // fields never reach the per-form schema. On a hit we mirror the success
        // envelope but skip the provider entirely: an automated client cannot tell
        // the drop from a real submit, and a genuine lead is never lost (both
        // signals fail open — see lib/bot-detection).
        const botCheck = detectBot(rawBody);
        if (botCheck.bot) {
            logger.warn(options.logScope, { requestId, stage: 'bot_rejected', reason: botCheck.reason });
            return buildJsonResponse(
                {
                    ok: true,
                    requestId,
                    ...(options.success.message ? { message: options.success.message } : {}),
                },
                options.success.status,
                corsHeaders,
            );
        }

        const validation = await options.validate(rawBody);
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
            const payload = options.dispatch.buildPayload(data, requestId, ctx);
            await options.dispatch.send(requestId, payload);
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

