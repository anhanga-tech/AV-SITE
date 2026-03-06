import type { LeadTracking, SubmitLeadRequest } from '../types/leadCapture';
import { cleanString } from '../lib/lead-logic.ts';

const TRACKING_PROPERTY_MAP: Record<string, string> = {
    cid: 'ga_client_id',
    sid: 'ga_session_id',
    gclid: 'hs_google_click_id',
    fbclid: 'hs_facebook_click_id',
    msclkid: 'hs_microsoft_click_id',
    ttclid: 'tiktok_id',
    gbraid: 'gbraid',
    wbraid: 'wbraid',
};

export interface HubSpotObjectResponse {
    id?: string;
}

export interface HubSpotSearchResponse {
    results?: Array<{ id?: string }>;
}

/**
 * Generic HubSpot API request wrapper.
 */
export async function hubspotRequest(
    token: string,
    path: string,
    init: RequestInit,
): Promise<Response> {
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    return fetch(`https://api.hubapi.com${path}`, {
        ...init,
        headers,
    });
}

/**
 * Normalizes tracking entries for processing.
 */
function getTrackingEntries(tracking?: LeadTracking): Record<string, string> {
    if (!tracking) return {};

    const baseEntries: Record<string, string | null | undefined> = {
        cid: tracking.cid,
        sid: tracking.sid,
        gclid: tracking.gclid,
        fbclid: tracking.fbclid,
        msclkid: tracking.msclkid,
        ttclid: tracking.ttclid,
        gbraid: tracking.gbraid,
        wbraid: tracking.wbraid,
        fbc: tracking.fbc,
    };

    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(baseEntries)) {
        if (!value) continue;
        const trimmed = value.trim();
        if (!trimmed) continue;
        normalized[key] = trimmed;
    }

    if (tracking.extras) {
        for (const [key, value] of Object.entries(tracking.extras)) {
            const trimmed = value.trim();
            if (!trimmed) continue;
            normalized[key] = trimmed;
        }
    }

    return normalized;
}

/**
 * Maps tracking data to HubSpot contact properties.
 */
export function mapTrackingToContactProperties(tracking?: LeadTracking): {
    properties: Record<string, string>;
    unmapped: Record<string, string>;
} {
    const values = getTrackingEntries(tracking);
    const properties: Record<string, string> = {};
    const unmapped: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
        const mappedProperty = TRACKING_PROPERTY_MAP[key];
        if (mappedProperty) {
            properties[mappedProperty] = value;
        } else {
            unmapped[key] = value;
        }
    }

    return { properties, unmapped };
}

/**
 * Builds the full set of contact properties for HubSpot.
 */
export function buildContactProperties(payload: SubmitLeadRequest): Record<string, string> {
    const properties: Record<string, string> = {
        firstname: payload.firstName,
        lastname: payload.lastName,
        email: payload.email,
    };

    if (payload.utms.utm_source) properties.ultimo_utm_source = payload.utms.utm_source;
    if (payload.utms.utm_medium) properties.ultimo_utm_medium = payload.utms.utm_medium;
    if (payload.utms.utm_campaign) properties.ultimo_utm_campaign = payload.utms.utm_campaign;
    if (payload.utms.utm_term) properties.utm_term = payload.utms.utm_term;
    if (payload.utms.utm_content) properties.ultimo_utm_content = payload.utms.utm_content;

    const trackingMapping = mapTrackingToContactProperties(payload.tracking);
    Object.assign(properties, trackingMapping.properties);

    const fallbackProperty = cleanString(process.env.HUBSPOT_CONTACT_TRACKING_FALLBACK_PROPERTY);
    if (fallbackProperty && Object.keys(trackingMapping.unmapped).length > 0) {
        properties[fallbackProperty] = JSON.stringify(trackingMapping.unmapped);
    }

    return properties;
}

/**
 * Search for a contact by email.
 */
export async function getContactIdByEmail(token: string, email: string): Promise<string | null> {
    const response = await hubspotRequest(token, '/crm/v3/objects/contacts/search', {
        method: 'POST',
        body: JSON.stringify({
            filterGroups: [
                {
                    filters: [
                        {
                            propertyName: 'email',
                            operator: 'EQ',
                            value: email,
                        },
                    ],
                },
            ],
            properties: ['email'],
            limit: 1,
        }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`CONTACT_SEARCH_FAILED:${response.status}:${detail}`);
    }

    const data = (await response.json().catch(() => ({}))) as HubSpotSearchResponse;
    const contactId = cleanString(data.results?.[0]?.id);

    return contactId || null;
}

/**
 * Updates existing contact properties.
 */
export async function updateContactProperties(token: string, contactId: string, properties: Record<string, string>): Promise<void> {
    const response = await hubspotRequest(token, `/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`CONTACT_UPDATE_FAILED:${response.status}:${detail}`);
    }
}

/**
 * Creates a new deal in HubSpot.
 */
export async function createDeal(token: string, properties: Record<string, string>): Promise<string> {
    const response = await hubspotRequest(token, '/crm/v3/objects/deals', {
        method: 'POST',
        body: JSON.stringify({ properties }),
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`DEAL_CREATE_FAILED:${response.status}:${detail}`);
    }

    const data = (await response.json().catch(() => ({}))) as HubSpotObjectResponse;
    const dealId = cleanString(data.id);
    if (!dealId) {
        throw new Error('DEAL_CREATE_FAILED:missing_id');
    }

    return dealId;
}

/**
 * Associates a deal to a contact.
 */
export async function associateDealToContact(token: string, dealId: string, contactId: string): Promise<void> {
    const response = await hubspotRequest(
        token,
        `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
        {
            method: 'PUT',
            body: JSON.stringify({}),
        },
    );

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`DEAL_ASSOCIATION_FAILED:${response.status}:${detail}`);
    }
}

/**
 * Creates a note and associates it to a contact as a fallback when deal creation fails.
 */
export async function createFallbackNote(token: string, contactId: string, body: string): Promise<void> {
    const noteResponse = await hubspotRequest(token, '/crm/v3/objects/notes', {
        method: 'POST',
        body: JSON.stringify({
            properties: {
                hs_timestamp: new Date().toISOString(),
                hs_note_body: body,
            },
        }),
    });

    if (noteResponse.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!noteResponse.ok) {
        const detail = await noteResponse.text().catch(() => '');
        throw new Error(`NOTE_CREATE_FAILED:${noteResponse.status}:${detail}`);
    }

    const noteData = (await noteResponse.json().catch(() => ({}))) as HubSpotObjectResponse;
    const noteId = cleanString(noteData.id);
    if (!noteId) {
        throw new Error('NOTE_CREATE_FAILED:missing_id');
    }

    const associationResponse = await hubspotRequest(
        token,
        `/crm/v4/objects/notes/${noteId}/associations/default/contacts/${contactId}`,
        {
            method: 'PUT',
            body: JSON.stringify({}),
        },
    );

    if (associationResponse.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!associationResponse.ok) {
        const detail = await associationResponse.text().catch(() => '');
        throw new Error(`NOTE_ASSOCIATION_FAILED:${associationResponse.status}:${detail}`);
    }
}
