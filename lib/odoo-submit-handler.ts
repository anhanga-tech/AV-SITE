/**
 * Odoo adapter over {@link createSubmitHandler}. The 4 lead forms post directly
 * to Odoo (cut-over from n8n): every form upserts a `res.partner`; lead/contato
 * additionally create a linked `crm.lead` opportunity (see lib/odoo-lead-mapping).
 *
 * Errors surface to the client (502/504) — the cut-over makes Odoo the only
 * destination, so a silent fail-open would lose the lead; a visible error lets the
 * client's WhatsApp handoff fallback take over.
 */
import {
    classifyN8nSubmitError,
    createSubmitHandler,
    type ClassifyN8nErrorOptions,
    type CreateSubmitHandlerOptions,
    type DispatchConfigCheck,
    type N8nErrorClassification,
    type MaybeAsyncValidationResult,
} from './n8n-submit-handler';
import { buildLeadFields, buildPartnerFields, type OdooLeadInput } from './odoo-lead-mapping';
import { getOdooConfig, openOdooSession } from '../services/odoo';
import { logger } from './logger';

// services/odoo.ts encodes failures as `ODOO_ERROR:<status>:<detail>`.
const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

const ODOO_CONFIG_MISSING_STATUS = 503;
const ODOO_CONFIG_MISSING_ERROR = 'Integração indisponível no momento.';

export interface CreateOdooSubmitHandlerOptions<TData> {
    logScope: string;
    rateLimit: CreateSubmitHandlerOptions<TData, OdooLeadInput>['rateLimit'];
    parse: { invalidJsonError: string };
    methodNotAllowedError: string;
    validate: (rawBody: unknown) => MaybeAsyncValidationResult<TData>;
    /** Per-form adapter: validated data → normalized Odoo input. */
    buildInput: (data: TData) => OdooLeadInput;
    success: { status: number; message?: string };
    /** Error copy/status mapping (the ODOO_ERROR pattern is injected). */
    error: Omit<ClassifyN8nErrorOptions, 'errorPattern'>;
    /** Client-facing message + status when Odoo env config is missing. */
    config?: { missingStatus?: number; missingError?: string };
    /**
     * Extra provider-agnostic config check run after the Odoo config check
     * (e.g. a form-specific signing secret like NPS_INVITE_SECRET). Reuses
     * the same SERVER_CONFIG_ERROR response shape instead of a parallel path.
     */
    checkExtraConfig?: () => DispatchConfigCheck;
    onValidated?: (data: TData, requestId: string) => Record<string, unknown> | void;
    onError?: (params: { data: TData; requestId: string; classification: N8nErrorClassification }) => Record<string, unknown> | void;
    /** Runs only when the Odoo write throws — see CreateSubmitHandlerOptions.onSendFailure. */
    onSendFailure?: (data: TData, requestId: string) => void | Promise<void>;
}

/**
 * Resolves the stable idempotency key a lead-producing submission carries
 * through the server boundary (issue #1136). Prefers the client-supplied
 * `event_id` (already generated once per submit attempt for Meta CAPI dedup —
 * see hooks/useLeadCapture.ts's `createLeadEventId()`); older/other callers
 * that omit it still get a stable key derived from the submission's own
 * identifying content, so a byte-identical retry still converges on the same
 * key without merging two genuinely distinct submissions from the same
 * customer (different destination/BANT text hashes differently).
 */
async function resolveIdempotencyKey(input: OdooLeadInput): Promise<string> {
    const eventId = input.eventId?.trim();
    if (eventId) return eventId;

    const material = [input.email, input.phone, input.destination, input.bantSummary, input.firstName, input.lastName]
        .map((value) => (value ?? '').trim().toLowerCase())
        .join('|');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
    const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `hash_${hex}`;
}

/** Persists an Odoo input: upsert partner (dedup by e-mail), then optional lead. */
async function sendToOdoo(input: OdooLeadInput): Promise<void> {
    const config = getOdooConfig();
    if (!config) throw new Error('ODOO_ERROR:503:Odoo config missing');

    const session = await openOdooSession(config);

    // utm_campaign is highly variable (one per ad campaign), unlike the fixed
    // source/medium table, so it's resolved against Odoo's native utm.campaign
    // model (find-or-create) instead of a hardcoded id.
    const campaignName = input.createsLead ? input.utms.utm_campaign?.trim() : undefined;
    // PERFORMANCE: resolveCampaignId only needs the session uid — it never reads
    // partnerId — so it rides alongside the partner upsert instead of queueing
    // behind it. Each Odoo Cloud JSON-RPC costs a full round trip from the Worker,
    // and the critical path drops from (partner RPCs + campaign RPCs) to the max
    // of the two. Measured against the test mock at 200ms/RPC: 1270ms → 1069ms
    // for a known campaign (1 round trip saved), 1615ms → 1213ms when the
    // campaign is new and needs search + create + re-search (2 saved). Same
    // number of RPCs either way — they just overlap.
    //
    // The `.catch()` is attached here at creation, not at the await below, for two
    // reasons: an in-flight rejection is never an unhandled rejection (the await
    // is skipped entirely if upsertPartner throws first), and it preserves the
    // existing contract that campaign resolution is enrichment — a hiccup here
    // must not cost the lead itself.
    //
    // Trade-off: the resolve now also runs when the partner upsert goes on to
    // fail, so a failed submit can leave behind a utm.campaign row the serial
    // version wouldn't have created. That row is exactly the one the next
    // successful submit for the same campaign would create anyway. In practice
    // it often won't even be written: on that path the promise is never awaited
    // and is tied neither to ctx.waitUntil nor to the response, so the Workers
    // isolate may be torn down before the RPC lands. That is fine precisely
    // because this call is enrichment — never put work you depend on here.
    const campaignIdPromise = campaignName
        ? session.resolveCampaignId(campaignName).catch((error: unknown) => {
            logger.warn('ODOO_CAMPAIGN_RESOLVE', {
                stage: 'campaign_resolve_failed',
                campaignName,
                detail: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        })
        : undefined;

    const partnerId = await session.upsertPartner(buildPartnerFields(input), {
        preserveName: input.preserveName,
    });

    if (input.createsLead) {
        const idempotencyKey = await resolveIdempotencyKey(input);
        const includeConversionFields = process.env.ODOO_CONVERSION_FIELDS_ENABLED === 'true';
        const leadFields = buildLeadFields(input, partnerId, idempotencyKey, { includeConversionFields });
        const campaignId = await campaignIdPromise;
        if (campaignId !== undefined) leadFields.campaign_id = campaignId;
        await session.createLead(leadFields, idempotencyKey);
    }
}

export function createOdooSubmitHandler<TData>(
    options: CreateOdooSubmitHandlerOptions<TData>,
): (request: Request) => Promise<Response> {
    const errorOptions: ClassifyN8nErrorOptions = { ...options.error, errorPattern: ODOO_ERROR_PATTERN };

    return createSubmitHandler<TData, OdooLeadInput>({
        logScope: options.logScope,
        rateLimit: options.rateLimit,
        parse: options.parse,
        methodNotAllowedError: options.methodNotAllowedError,
        validate: options.validate,
        success: options.success,
        onValidated: options.onValidated,
        onError: options.onError,
        onSendFailure: options.onSendFailure,
        dispatch: {
            checkConfig: () => {
                if (!getOdooConfig()) {
                    return {
                        ok: false,
                        status: options.config?.missingStatus ?? ODOO_CONFIG_MISSING_STATUS,
                        error: options.config?.missingError ?? ODOO_CONFIG_MISSING_ERROR,
                    };
                }
                return options.checkExtraConfig?.() ?? { ok: true };
            },
            buildPayload: (data) => options.buildInput(data),
            send: (_requestId, input) => sendToOdoo(input),
            classifyError: (error) => classifyN8nSubmitError(error, errorOptions),
            failureStage: 'odoo_failed',
        },
    });
}
