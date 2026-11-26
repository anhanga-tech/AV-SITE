/**
 * Signed webhook to the OpenBot lead agent (Lis · Novos leads) when a site
 * form creates a new `crm.lead` in Odoo. Lis reads the opportunity from Odoo
 * by id, prepares it and drafts the reply for Felipe.
 *
 * Fired only when `createLead` actually created the record: an idempotent
 * replay that resolves to an existing lead (lib/odoo-lead-idempotency.ts,
 * services/odoo.ts) does not fire again. The delivery id is `lead-<id>`, so
 * the receiver also drops a second delivery of the same lead as a duplicate.
 *
 * Request: POST JSON to OPENBOT_LEAD_WEBHOOK_URL with
 * - `x-openbot-timestamp`: unix seconds of the send (receiver window 300 s);
 * - `x-openbot-delivery-id`: `lead-<lead_id>`;
 * - `x-openbot-signature`: `sha256=` + hex HMAC-SHA256 of
 *   `<timestamp>.<delivery id>.<exact body>` under OPENBOT_LEAD_WEBHOOK_SECRET.
 * Body: `{"type":"crm.lead.created","occurredAt":<ISO>,"data":{"lead_id","source","form"}}`.
 * No personal data travels: no name, phone or e-mail.
 *
 * Responses: 202 accepted, 200 duplicate, 401 bad signature, 503 retry later.
 *
 * Runs after the form response (waitUntil) and never throws. Missing config
 * skips the call with a warning. Never log the URL, the secret or the body.
 */
import { logger } from './logger';

export type LeadCreatedForm = 'submit-lead' | 'submit-contact';

export interface LeadCreatedEvent {
    type: 'crm.lead.created';
    occurredAt: string;
    data: {
        lead_id: number;
        source: 'site';
        form: LeadCreatedForm;
    };
}

export interface LeadCreatedWebhookDeps {
    fetch?: typeof fetch;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
}

const LOG_SCOPE = 'LEAD_CREATED_WEBHOOK';
const USER_AGENT = 'Anhanga-Lead-Webhook/1';
// Worst case 3 × 3 s plus 1 s + 3 s of backoff, well inside the ~30 s
// Cloudflare keeps a `waitUntil` alive after the response.
const ATTEMPT_TIMEOUT_MS = 3_000;
const RETRY_DELAYS_MS = [1_000, 3_000];

interface WebhookConfig {
    url: string;
    secret: string;
}

function getWebhookConfig(): WebhookConfig | null {
    const url = process.env.OPENBOT_LEAD_WEBHOOK_URL?.trim();
    const secret = process.env.OPENBOT_LEAD_WEBHOOK_SECRET?.trim();
    if (!url || !secret) return null;
    try {
        return new URL(url).protocol === 'https:' ? { url, secret } : null;
    } catch {
        return null;
    }
}

function toHex(bytes: ArrayBuffer): string {
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** `sha256=` + hex HMAC-SHA256 of `<timestamp>.<deliveryId>.<body>`. */
export async function signLeadCreatedWebhook(
    secret: string,
    timestamp: number,
    deliveryId: string,
    body: string,
): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${deliveryId}.${body}`));
    return `sha256=${toHex(signature)}`;
}

export function leadCreatedDeliveryId(leadId: number): string {
    return `lead-${leadId}`;
}

function isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
}

function defaultSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tells the lead agent that `leadId` was created by `form`. Never throws:
 * failures only become logs (status or error name, nothing secret).
 */
export async function notifyLeadCreated(
    notice: { leadId: number; form: LeadCreatedForm },
    deps: LeadCreatedWebhookDeps = {},
): Promise<void> {
    try {
        if (!Number.isSafeInteger(notice.leadId) || notice.leadId <= 0) {
            logger.warn(LOG_SCOPE, { stage: 'skipped_invalid_lead_id', form: notice.form });
            return;
        }
        const config = getWebhookConfig();
        if (!config) {
            logger.warn(LOG_SCOPE, { stage: 'not_configured', form: notice.form });
            return;
        }

        const fetchImpl = deps.fetch ?? fetch;
        const sleep = deps.sleep ?? defaultSleep;
        const now = deps.now ?? Date.now;
        const deliveryId = leadCreatedDeliveryId(notice.leadId);
        const event: LeadCreatedEvent = {
            type: 'crm.lead.created',
            occurredAt: new Date(now()).toISOString(),
            data: { lead_id: notice.leadId, source: 'site', form: notice.form },
        };
        const body = JSON.stringify(event);

        const attempts = RETRY_DELAYS_MS.length + 1;
        let outcome: { status?: number; errorName?: string } = {};
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            try {
                // Signed per attempt so a retry after backoff stays inside the
                // receiver's 300 s window with a fresh timestamp.
                const timestamp = Math.floor(now() / 1000);
                const response = await fetchImpl(config.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': USER_AGENT,
                        'x-openbot-timestamp': String(timestamp),
                        'x-openbot-delivery-id': deliveryId,
                        'x-openbot-signature': await signLeadCreatedWebhook(config.secret, timestamp, deliveryId, body),
                    },
                    body,
                    redirect: 'manual',
                    signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
                });
                if (response.ok) {
                    logger.info(LOG_SCOPE, {
                        stage: response.status === 200 ? 'duplicate' : 'delivered',
                        status: response.status,
                        attempt,
                        form: notice.form,
                    });
                    return;
                }
                outcome = { status: response.status };
                if (!isRetryable(response.status)) break;
            } catch (error) {
                outcome = { errorName: error instanceof Error ? error.name : typeof error };
            }
            if (attempt < attempts) await sleep(RETRY_DELAYS_MS[attempt - 1]);
        }
        logger.error(LOG_SCOPE, { stage: 'failed', form: notice.form, ...outcome });
    } catch (error) {
        logger.error(LOG_SCOPE, {
            stage: 'unexpected',
            form: notice.form,
            errorName: error instanceof Error ? error.name : typeof error,
        });
    }
}
