/**
 * Shared Odoo JSON-RPC fetch mock for handler/service tests.
 *
 * Simulates `POST {ODOO_URL}/jsonrpc`: `common.authenticate` returns a uid, and
 * `object.execute_kw` returns results per ORM method (search_read → dedup lookup,
 * create → new id, write → true). Records every execute_kw call so tests can
 * inspect the res.partner / crm.lead dicts the handler sent.
 */

export interface OdooExecuteCall {
    model: string;
    method: string; // search_read | create | write | ...
    args: unknown[];
    kwargs: Record<string, unknown>;
}

export interface OdooMock {
    fetch: typeof fetch;
    /** Every execute_kw ORM call, in order. */
    calls: OdooExecuteCall[];
    /** Fields of the last res.partner create/write. */
    partnerFields: () => Record<string, unknown> | undefined;
    /** Fields of the crm.lead create, if any. */
    leadFields: () => Record<string, unknown> | undefined;
    /** Whether a crm.lead.create was issued. */
    createdLead: () => boolean;
}

export interface OdooMockOptions {
    uid?: number;
    /** search_read result: id of an existing partner, or null for none. */
    existingPartnerId?: number | null;
    /** `comment` returned for the existing partner (Odoo returns false when empty). */
    existingComment?: string | false;
    /**
     * Extra scalar fields the search_read row reports for the existing partner
     * (e.g. `{ name: 'Ana Silva', x_nps_score: 8 }`). Lets tests exercise the
     * non-destructive fill-if-blank guard. Odoo returns `false` for unset fields.
     */
    existingFields?: Record<string, unknown>;
    newPartnerId?: number;
    leadId?: number;
    /** utm.campaign search_read result: id of an existing campaign, or null/absent for none (default: none). */
    existingCampaignId?: number | null;
    /** id returned by utm.campaign.create when no existing campaign matches. */
    newCampaignId?: number;
    /** Makes utm.campaign.create return a JSON-RPC error (simulates a concurrent-create conflict). */
    campaignCreateShouldFail?: boolean;
    /** Force every RPC to fail with this HTTP status. */
    failStatus?: number;
    failDetail?: string;
    /** Never resolve (used to exercise timeouts). */
    hang?: boolean;
}

export const ODOO_TEST_ENV = {
    ODOO_URL: 'https://anhanga.test.odoo.com',
    ODOO_DB: 'anhanga',
    ODOO_LOGIN: 'bot@anhanga.tur.br',
    ODOO_API_KEY: 'test-api-key',
} as const;

export function setOdooEnv(): void {
    for (const [key, value] of Object.entries(ODOO_TEST_ENV)) {
        process.env[key] = value;
    }
}

export function clearOdooEnv(): void {
    for (const key of Object.keys(ODOO_TEST_ENV)) {
        delete process.env[key];
    }
}

function ormFields(call: OdooExecuteCall | undefined): Record<string, unknown> | undefined {
    if (!call) return undefined;
    // create → args[0] is the fields dict; write → args[1] is the fields dict.
    const fields = call.method === 'write' ? call.args[1] : call.args[0];
    return fields as Record<string, unknown> | undefined;
}

interface SearchReadDefaults {
    existingPartnerId: number | null;
    existingComment: string | false;
    existingFields: Record<string, unknown>;
    existingCampaignId: number | null;
}

/** `search_read` result per model: dedup row for res.partner, find-or-create lookup for utm.campaign. */
function searchReadResult(model: string, d: SearchReadDefaults): unknown[] {
    if (model === 'utm.campaign') {
        return d.existingCampaignId ? [{ id: d.existingCampaignId }] : [];
    }
    return d.existingPartnerId ? [{ id: d.existingPartnerId, comment: d.existingComment, ...d.existingFields }] : [];
}

interface CreateDefaults {
    leadId: number;
    newPartnerId: number;
    newCampaignId: number;
}

/** `create` result id per model. */
function createResult(model: string, d: CreateDefaults): number {
    if (model === 'crm.lead') return d.leadId;
    if (model === 'utm.campaign') return d.newCampaignId;
    return d.newPartnerId;
}

function jsonRpcResponse(result: unknown): Response {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

function jsonRpcError(message: string): Response {
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { message } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

export function createOdooMock(options: OdooMockOptions = {}): OdooMock {
    const {
        uid = 7,
        existingPartnerId = null,
        existingComment = false,
        existingFields = {},
        newPartnerId = 101,
        leadId = 555,
        existingCampaignId = null,
        newCampaignId = 900,
        campaignCreateShouldFail = false,
        failStatus,
        failDetail = 'odoo upstream failed',
        hang = false,
    } = options;

    const calls: OdooExecuteCall[] = [];
    // Stateful: once utm.campaign.create succeeds, subsequent search_read calls
    // for that model must find it (mirrors real Odoo, and resolveCampaignId now
    // always re-queries after create to converge on a canonical row).
    let campaignId = existingCampaignId;

    const fetchMock = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        if (hang) return new Promise<Response>(() => {});
        if (failStatus) return new Response(failDetail, { status: failStatus });

        const body = JSON.parse(String(init?.body ?? '{}')) as {
            params: { service: string; method: string; args: unknown[] };
        };
        const { service, method, args } = body.params;

        if (service === 'common' && method === 'authenticate') return jsonRpcResponse(uid);
        if (service !== 'object' || method !== 'execute_kw') return jsonRpcResponse(false);

        const model = args[3] as string;
        const ormMethod = args[4] as string;
        const ormArgs = (args[5] as unknown[]) ?? [];
        const kwargs = (args[6] as Record<string, unknown>) ?? {};
        calls.push({ model, method: ormMethod, args: ormArgs, kwargs });

        if (ormMethod === 'create' && model === 'utm.campaign' && campaignCreateShouldFail) {
            return jsonRpcError('duplicate key value violates unique constraint "utm_campaign_name_uniq"');
        }
        if (ormMethod === 'search_read') {
            return jsonRpcResponse(searchReadResult(model, { existingPartnerId, existingComment, existingFields, existingCampaignId: campaignId }));
        }
        if (ormMethod === 'create') {
            const result = createResult(model, { leadId, newPartnerId, newCampaignId });
            if (model === 'utm.campaign') campaignId = newCampaignId;
            return jsonRpcResponse(result);
        }
        if (ormMethod === 'write') return jsonRpcResponse(true);
        return jsonRpcResponse(false);
    }) as typeof fetch;

    return {
        fetch: fetchMock,
        calls,
        partnerFields: () =>
            ormFields([...calls].reverse().find((c) => c.model === 'res.partner' && (c.method === 'create' || c.method === 'write'))),
        leadFields: () => ormFields(calls.find((c) => c.model === 'crm.lead' && c.method === 'create')),
        createdLead: () => calls.some((c) => c.model === 'crm.lead' && c.method === 'create'),
    };
}
