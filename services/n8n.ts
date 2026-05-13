import type { N8nContactPayload, N8nLeadPayload, N8nQuizPayload, N8nWaitlistPayload } from '../lib/n8n-payloads';

// 5 seconds gives self-hosted n8n enough headroom for cold-start workflows
// without hanging the edge function indefinitely. Override with N8N_WEBHOOK_TIMEOUT_MS.
const DEFAULT_N8N_REQUEST_TIMEOUT_MS = 5000;

export function getN8nTimeoutMs(): number {
    const configured = Number.parseInt(String(process.env.N8N_WEBHOOK_TIMEOUT_MS ?? ''), 10);
    if (!Number.isFinite(configured) || configured < 50) {
        return DEFAULT_N8N_REQUEST_TIMEOUT_MS;
    }

    return configured;
}

function sanitizeErrorDetail(value: string): string {
    return value
        .replace(/[\r\n]+/g, ' ')
        .trim()
        .slice(0, 200);
}

function createTimeoutError(timeoutMs: number): Error {
    return new Error(`N8N_WEBHOOK_ERROR:504:Webhook request timed out after ${timeoutMs}ms`);
}

async function assertN8nResponseOk(response: Response): Promise<void> {
    if (response.ok) return;

    const detail = sanitizeErrorDetail(await response.text().catch(() => ''));
    const message = detail || 'Webhook request failed';
    throw new Error(`N8N_WEBHOOK_ERROR:${response.status}:${message}`);
}

function normalizeNetworkError(): Error {
    return new Error('N8N_WEBHOOK_ERROR:502:Webhook request failed');
}

export async function n8nRequest(
    url: string,
    secret: string,
    requestId: string,
    payload: unknown,
): Promise<Response> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-Webhook-Secret', secret);
    headers.set('X-Request-Id', requestId);

    const timeoutMs = getN8nTimeoutMs();
    const controller = new AbortController();
    const timeoutError = createTimeoutError(timeoutMs);
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
        const response = await Promise.race([
            fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal,
            }),
            new Promise<Response>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    controller.abort();
                    reject(timeoutError);
                }, timeoutMs);
            }),
        ]);

        await assertN8nResponseOk(response);
        return response;
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw timeoutError;
        }

        if (error instanceof Error && error.message.startsWith('N8N_WEBHOOK_ERROR:')) {
            throw error;
        }

        throw normalizeNetworkError();
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}

export function sendLeadToN8n(
    url: string,
    secret: string,
    requestId: string,
    payload: N8nLeadPayload,
): Promise<Response> {
    return n8nRequest(url, secret, requestId, payload);
}

export function sendContactToN8n(
    url: string,
    secret: string,
    requestId: string,
    payload: N8nContactPayload,
): Promise<Response> {
    return n8nRequest(url, secret, requestId, payload);
}

export function sendWaitlistToN8n(
    url: string,
    secret: string,
    requestId: string,
    payload: N8nWaitlistPayload,
): Promise<Response> {
    return n8nRequest(url, secret, requestId, payload);
}

export function sendQuizToN8n(
    url: string,
    secret: string,
    requestId: string,
    payload: N8nQuizPayload,
): Promise<Response> {
    return n8nRequest(url, secret, requestId, payload);
}
