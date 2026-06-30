/**
 * Odoo External API client over JSON-RPC (`POST {ODOO_URL}/jsonrpc`).
 *
 * The Fase 0 contract (`marketing-docs-local/fase0-site-odoo-contrato.md`) offers
 * either XML-RPC or JSON-RPC. We use JSON-RPC because the handlers run on the
 * Cloudflare Workers runtime (edge), where the Node-only `xmlrpc` package — and
 * the raw sockets it relies on — do not run. JSON-RPC is plain `fetch` (same
 * fetch + AbortController shape used elsewhere for outbound provider calls).
 *
 * Auth flow: `common.authenticate` → uid, then `object.execute_kw` for ORM calls.
 * Module-level state does not persist across requests on Workers, so each submit
 * re-authenticates. A lead submit makes up to 4 sequential round-trips
 * (auth → partner search → partner write/create → lead create); a shared deadline
 * bounds the worst case so an upstream stall never hangs the form.
 *
 * Errors are normalized to `ODOO_ERROR:<status>:<detail>` so the submit-handler
 * factory classifies them uniformly (see lib/odoo-submit-handler.ts).
 */

const PER_CALL_TIMEOUT_MS = 3000;
const TOTAL_DEADLINE_MS = 8000;

export interface OdooConfig {
    url: string;
    db: string;
    login: string;
    apiKey: string;
}

/** Reads and validates Odoo config from the environment. Returns null when incomplete. */
export function getOdooConfig(): OdooConfig | null {
    const url = process.env.ODOO_URL?.trim();
    const db = process.env.ODOO_DB?.trim();
    const login = process.env.ODOO_LOGIN?.trim();
    const apiKey = process.env.ODOO_API_KEY?.trim();
    if (!url || !db || !login || !apiKey) return null;
    return { url, db, login, apiKey };
}

function odooError(status: number, detail: unknown): Error {
    const text = detail instanceof Error ? detail.message : typeof detail === 'string' ? detail : JSON.stringify(detail);
    return new Error(`ODOO_ERROR:${status}:${text ?? ''}`);
}

interface JsonRpcResult<T> {
    result?: T;
    error?: { message?: string; data?: { message?: string } };
}

/**
 * Single JSON-RPC `call`. `deadline` is the shared epoch-ms cutoff for the whole
 * submit; each call gets the smaller of PER_CALL_TIMEOUT_MS and the time left.
 */
async function rpcCall<T>(
    config: OdooConfig,
    service: 'common' | 'object',
    method: string,
    args: unknown[],
    deadline: number,
): Promise<T> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw odooError(504, 'Odoo request budget exhausted');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(PER_CALL_TIMEOUT_MS, remaining));

    try {
        const response = await fetch(`${config.url}/jsonrpc`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: { service, method, args },
                id: Date.now(),
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw odooError(response.status, await response.text().catch(() => response.statusText));
        }

        const body = (await response.json()) as JsonRpcResult<T>;
        if (body.error) {
            const detail = body.error.data?.message || body.error.message || 'Odoo RPC error';
            throw odooError(502, detail);
        }
        return body.result as T;
    } catch (error: unknown) {
        if (controller.signal.aborted) throw odooError(504, 'Odoo request timed out');
        if (error instanceof Error && error.message.startsWith('ODOO_ERROR:')) throw error;
        throw odooError(502, error);
    } finally {
        clearTimeout(timeout);
    }
}

/** Authenticates and returns the uid, or throws ODOO_ERROR when credentials fail. */
async function authenticate(config: OdooConfig, deadline: number): Promise<number> {
    const uid = await rpcCall<number | false>(
        config,
        'common',
        'authenticate',
        [config.db, config.login, config.apiKey, {}],
        deadline,
    );
    if (!uid) throw odooError(401, 'Odoo authentication failed');
    return uid;
}

function executeKw<T>(
    config: OdooConfig,
    uid: number,
    model: string,
    method: string,
    args: unknown[],
    deadline: number,
    kwargs: Record<string, unknown> = {},
): Promise<T> {
    return rpcCall<T>(
        config,
        'object',
        'execute_kw',
        [config.db, uid, config.apiKey, model, method, args, kwargs],
        deadline,
    );
}

export type OdooPartnerFields = Record<string, unknown>;

/**
 * Per-submit session: authenticates once, then exposes ORM helpers that share a
 * single time budget. Create one with `openOdooSession()` at the start of a submit.
 */
export interface OdooSession {
    upsertPartner: (fields: OdooPartnerFields) => Promise<number>;
    createLead: (fields: Record<string, unknown>) => Promise<number>;
}

export async function openOdooSession(config: OdooConfig): Promise<OdooSession> {
    const deadline = Date.now() + TOTAL_DEADLINE_MS;
    const uid = await authenticate(config, deadline);

    // Odoo returns `false` (not '') for empty text fields over JSON-RPC.
    async function findPartner(fields: OdooPartnerFields): Promise<{ id: number; comment: string | false } | null> {
        const email = typeof fields.email === 'string' && fields.email.trim() !== '' ? fields.email.trim() : null;
        const phone = typeof fields.phone === 'string' && fields.phone.trim() !== '' ? fields.phone.trim() : null;
        const domain = email
            ? [['email', '=', email]]
            : phone
                ? [['phone', '=', phone]]
                : null;
        if (!domain) return null;

        const rows = await executeKw<Array<{ id: number; comment: string | false }>>(
            config,
            uid,
            'res.partner',
            'search_read',
            [domain, ['id', 'comment']],
            deadline,
            { limit: 1 },
        );
        return rows[0] ?? null;
    }

    return {
        async upsertPartner(fields) {
            const existing = await findPartner(fields);
            if (existing) {
                const updateFields: OdooPartnerFields = { ...fields };
                // `comment` (Internal Notes) is append-only — a sales agent may have
                // written notes we must not overwrite. Concatenate instead.
                if (typeof fields.comment === 'string' && fields.comment) {
                    const previous = typeof existing.comment === 'string' ? existing.comment.trim() : '';
                    updateFields.comment = previous ? `${previous}\n\n${fields.comment}` : fields.comment;
                }
                await executeKw<boolean>(config, uid, 'res.partner', 'write', [[existing.id], updateFields], deadline);
                return existing.id;
            }
            return executeKw<number>(config, uid, 'res.partner', 'create', [fields], deadline);
        },
        createLead(fields) {
            return executeKw<number>(config, uid, 'crm.lead', 'create', [fields], deadline);
        },
    };
}
