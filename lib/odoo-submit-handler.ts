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
    type N8nErrorClassification,
    type ValidationResult,
} from './n8n-submit-handler';
import { buildLeadFields, buildPartnerFields, type OdooLeadInput } from './odoo-lead-mapping';
import { getOdooConfig, openOdooSession } from '../services/odoo';

// services/odoo.ts encodes failures as `ODOO_ERROR:<status>:<detail>`.
const ODOO_ERROR_PATTERN = /^ODOO_ERROR:(\d+):(.*)$/s;

const ODOO_CONFIG_MISSING_STATUS = 503;
const ODOO_CONFIG_MISSING_ERROR = 'Integração indisponível no momento.';

export interface CreateOdooSubmitHandlerOptions<TData> {
    logScope: string;
    rateLimit: CreateSubmitHandlerOptions<TData, OdooLeadInput>['rateLimit'];
    parse: { invalidJsonError: string };
    methodNotAllowedError: string;
    validate: (rawBody: unknown) => ValidationResult<TData>;
    /** Per-form adapter: validated data → normalized Odoo input. */
    buildInput: (data: TData) => OdooLeadInput;
    success: { status: number; message?: string };
    /** Error copy/status mapping (the ODOO_ERROR pattern is injected). */
    error: Omit<ClassifyN8nErrorOptions, 'errorPattern'>;
    /** Client-facing message + status when Odoo env config is missing. */
    config?: { missingStatus?: number; missingError?: string };
    onValidated?: (data: TData, requestId: string) => Record<string, unknown> | void;
    onError?: (params: { data: TData; requestId: string; classification: N8nErrorClassification }) => Record<string, unknown> | void;
}

/** Persists an Odoo input: upsert partner (dedup by e-mail), then optional lead. */
async function sendToOdoo(input: OdooLeadInput): Promise<void> {
    const config = getOdooConfig();
    if (!config) throw new Error('ODOO_ERROR:503:Odoo config missing');

    const session = await openOdooSession(config);
    const partnerId = await session.upsertPartner(buildPartnerFields(input), {
        preserveName: input.formType === 'nps',
    });

    if (input.createsLead) {
        await session.createLead(buildLeadFields(input, partnerId));
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
        dispatch: {
            checkConfig: () =>
                getOdooConfig()
                    ? { ok: true }
                    : {
                        ok: false,
                        status: options.config?.missingStatus ?? ODOO_CONFIG_MISSING_STATUS,
                        error: options.config?.missingError ?? ODOO_CONFIG_MISSING_ERROR,
                    },
            buildPayload: (data) => options.buildInput(data),
            send: (_requestId, input) => sendToOdoo(input),
            classifyError: (error) => classifyN8nSubmitError(error, errorOptions),
            failureStage: 'odoo_failed',
        },
    });
}
