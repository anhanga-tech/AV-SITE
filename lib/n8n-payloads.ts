import type { SubmitLeadRequest } from '../types/leadCapture';
import type { SubmitWaitlistRequest } from '../types/waitlist';

export interface N8nLeadTracking {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    cid?: string | null;
    sid?: string | null;
    gclid?: string | null;
    fbclid?: string | null;
    msclkid?: string | null;
    ttclid?: string | null;
    wbraid?: string | null;
    gbraid?: string | null;
    fbc?: string | null;
    fbp?: string | null;
    extras: Record<string, string>;
}

export interface N8nLeadPayload {
    requestId: string;
    source: 'submit-lead';
    lead: {
        firstName: string;
        lastName: string;
        email: string;
        eventId: string | null;
        bantSummary: string;
        destination: string;
    };
    utms: SubmitLeadRequest['utms'];
    tracking: N8nLeadTracking;
    meta: {
        receivedAt: string;
    };
}

export interface N8nWaitlistPayload {
    requestId: string;
    source: 'submit-waitlist';
    waitlist: {
        name: string;
        email: string;
        sourcePage: string;
    };
    utms: SubmitWaitlistRequest['utms'];
    tracking: SubmitWaitlistRequest['tracking'];
    meta: {
        receivedAt: string;
    };
}

function buildLeadTracking(payload: SubmitLeadRequest): N8nLeadTracking {
    const tracking = payload.tracking;
    const leadTracking: N8nLeadTracking = {
        utm_source: tracking?.utm_source ?? payload.utms.utm_source,
        utm_medium: tracking?.utm_medium ?? payload.utms.utm_medium,
        utm_campaign: tracking?.utm_campaign ?? payload.utms.utm_campaign,
        utm_term: tracking?.utm_term ?? payload.utms.utm_term,
        utm_content: tracking?.utm_content ?? payload.utms.utm_content,
        cid: tracking?.cid ?? null,
        sid: tracking?.sid ?? null,
        gclid: tracking?.gclid ?? null,
        fbclid: tracking?.fbclid ?? null,
        msclkid: tracking?.msclkid ?? null,
        ttclid: tracking?.ttclid ?? null,
        wbraid: tracking?.wbraid ?? null,
        gbraid: tracking?.gbraid ?? null,
        fbc: tracking?.fbc ?? null,
        fbp: tracking?.fbp ?? null,
        extras: tracking?.extras ?? {},
    };

    return leadTracking;
}

export function buildN8nLeadPayload(payload: SubmitLeadRequest, requestId: string): N8nLeadPayload {
    return {
        requestId,
        source: 'submit-lead',
        lead: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            eventId: payload.event_id ?? null,
            bantSummary: payload.bantSummary,
            destination: payload.destination,
        },
        utms: payload.utms,
        tracking: buildLeadTracking(payload),
        meta: {
            receivedAt: new Date().toISOString(),
        },
    };
}

export function buildN8nWaitlistPayload(payload: SubmitWaitlistRequest, requestId: string): N8nWaitlistPayload {
    return {
        requestId,
        source: 'submit-waitlist',
        waitlist: {
            name: payload.name,
            email: payload.email,
            sourcePage: payload.sourcePage,
        },
        utms: payload.utms,
        tracking: payload.tracking,
        meta: {
            receivedAt: new Date().toISOString(),
        },
    };
}
