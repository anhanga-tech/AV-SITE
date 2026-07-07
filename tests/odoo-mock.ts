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
        failStatus,
        failDetail = 'odoo upstream failed',
        hang = false,
    } = options;

    const calls: OdooExecuteCall[] = [];

    const fetchMock = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        if (hang) return new Promise<Response>(() => {});
        if (failStatus) return new Response(failDetail, { status: failStatus });

        const body = JSON.parse(String(init?.body ?? '{}')) as {
            params: { service: string; method: string; args: unknown[] };
        };
        const { service, method, args } = body.params;

        let result: unknown = false;

        if (service === 'common' && method === 'authenticate') {
            result = uid;
        } else if (service === 'object' && method === 'execute_kw') {
            const model = args[3] as string;
            const ormMethod = args[4] as string;
            const ormArgs = (args[5] as unknown[]) ?? [];
            const kwargs = (args[6] as Record<string, unknown>) ?? {};
            calls.push({ model, method: ormMethod, args: ormArgs, kwargs });

            if (ormMethod === 'search_read') {
                if (model === 'utm.campaign') {
                    result = existingCampaignId ? [{ id: existingCampaignId }] : [];
                } else {
                    result = existingPartnerId
                        ? [{ id: existingPartnerId, comment: existingComment, ...existingFields }]
                        : [];
                }
            } else if (ormMethod === 'create') {
                result = model === 'crm.lead' ? leadId : model === 'utm.campaign' ? newCampaignId : newPartnerId;
            } else if (ormMethod === 'write') {
                result = true;
            }
        }

        return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
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
