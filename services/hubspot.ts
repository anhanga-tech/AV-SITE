const DEFAULT_HUBSPOT_REQUEST_TIMEOUT_MS = 1500;

interface HubSpotAssociationResponse {
    results?: Array<{ toObjectId: string }>;
}

export interface HubSpotObjectWithProperties {
    id: string;
    properties: Record<string, string | null>;
}

function getHubSpotRequestTimeoutMs(): number {
    const configured = Number.parseInt(String(process.env.HUBSPOT_REQUEST_TIMEOUT_MS ?? ''), 10);
    if (!Number.isFinite(configured) || configured < 50) {
        return DEFAULT_HUBSPOT_REQUEST_TIMEOUT_MS;
    }

    return configured;
}

function createHubSpotTimeoutError(path: string, timeoutMs: number): Error {
    return new Error(`HUBSPOT_TIMEOUT:504:HubSpot request timed out after ${timeoutMs}ms for ${path}`);
}

async function assertHubSpotResponseOk(response: Response, errorCode: string): Promise<void> {
    if (response.status === 401 || response.status === 403) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`${errorCode}:${response.status}:${detail}`);
    }
}

async function parseHubSpotJsonResponse<T>(response: Response, errorCode: string, fallback?: T): Promise<T> {
    if (!response.ok) {
        await assertHubSpotResponseOk(response, errorCode);
    }

    if (fallback !== undefined) {
        return (await response.json().catch(() => fallback)) as T;
    }

    return await response.json() as T;
}

/**
 * Generic HubSpot API request wrapper.
 */
async function hubspotRequest(
    token: string,
    path: string,
    init: RequestInit,
): Promise<Response> {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const timeoutMs = getHubSpotRequestTimeoutMs();
    const controller = new AbortController();
    const timeoutError = createHubSpotTimeoutError(path, timeoutMs);
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            fetch(`https://api.hubapi.com${path}`, {
                ...init,
                headers,
                signal: controller.signal,
            }),
            new Promise<Response>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    controller.abort();
                    reject(timeoutError);
                }, timeoutMs);
            }),
        ]);
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw timeoutError;
        }

        throw error;
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
    }
}

/**
 * Fetches deal details.
 */
export async function getDeal(token: string, dealId: string, properties: string[] = ['amount', 'dealname', 'dealstage']): Promise<HubSpotObjectWithProperties> {
    const response = await hubspotRequest(token, `/crm/v3/objects/deals/${dealId}?properties=${properties.join(',')}`, {
        method: 'GET',
    });

    return await parseHubSpotJsonResponse<HubSpotObjectWithProperties>(response, 'DEAL_FETCH_FAILED');
}

/**
 * Fetches the first associated contact ID for a deal.
 */
export async function getAssociatedContactId(token: string, dealId: string): Promise<string | null> {
    const response = await hubspotRequest(token, `/crm/v4/objects/deals/${dealId}/associations/contacts`, {
        method: 'GET',
    });

    const data = await parseHubSpotJsonResponse<HubSpotAssociationResponse>(
        response,
        'ASSOCIATION_FETCH_FAILED',
        {} as HubSpotAssociationResponse,
    );
    return data.results?.[0]?.toObjectId || null;
}

/**
 * Fetches contact details.
 */
export async function getContact(token: string, contactId: string, properties: string[] = ['email', 'firstname', 'lastname', 'phone']): Promise<HubSpotObjectWithProperties> {
    const response = await hubspotRequest(token, `/crm/v3/objects/contacts/${contactId}?properties=${properties.join(',')}`, {
        method: 'GET',
    });

    return await parseHubSpotJsonResponse<HubSpotObjectWithProperties>(response, 'CONTACT_FETCH_FAILED');
}
