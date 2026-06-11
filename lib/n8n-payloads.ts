import type { SubmitLeadRequest } from '../types/leadCapture';
import type { SubmitContactRequest } from '../types/contactCapture';
import type { SubmitWaitlistRequest } from '../types/waitlist';
import type { SubmitQuizRequest } from '../types/quiz';

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

export interface N8nLeadRequestContext {
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
}

export interface N8nLeadPayload {
    requestId: string;
    source: 'submit-lead';
    lead: {
        firstName: string;
        lastName: string;
        email: string;
        whatsapp: string;
        eventId: string | null;
        bantSummary: string;
        destination: string;
    };
    utms: SubmitLeadRequest['utms'];
    tracking: N8nLeadTracking;
    meta: {
        receivedAt: string;
        // Propagated to the server-side Meta CAPI Lead (action_source: "website")
        // for event-match quality. Raw IP/UA are PII — keep them out of logs.
        clientIpAddress: string | null;
        clientUserAgent: string | null;
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

export interface N8nContactPayload {
    requestId: string;
    source: 'submit-contact';
    contact: {
        firstName: string;
        lastName: string | null;
        whatsapp: string;
        email: string | null;
        emailOptIn: boolean;
        eventId: string | null;
        ctaSource: string | null;
        destination: string | null;
    };
    tracking: N8nLeadTracking;
    meta: {
        receivedAt: string;
    };
}

function toNullableTrackingValue(value: string | null | undefined): string | null {
    return value ?? null;
}

function buildLeadTrackingUtms(payload: SubmitLeadRequest) {
    const tracking = payload.tracking;

    return {
        utm_source: tracking?.utm_source ?? payload.utms.utm_source,
        utm_medium: tracking?.utm_medium ?? payload.utms.utm_medium,
        utm_campaign: tracking?.utm_campaign ?? payload.utms.utm_campaign,
        utm_term: tracking?.utm_term ?? payload.utms.utm_term,
        utm_content: tracking?.utm_content ?? payload.utms.utm_content,
    };
}

function buildLeadTrackingIds(payload: SubmitLeadRequest) {
    const tracking = payload.tracking;

    return {
        cid: toNullableTrackingValue(tracking?.cid),
        sid: toNullableTrackingValue(tracking?.sid),
        gclid: toNullableTrackingValue(tracking?.gclid),
        fbclid: toNullableTrackingValue(tracking?.fbclid),
        msclkid: toNullableTrackingValue(tracking?.msclkid),
        ttclid: toNullableTrackingValue(tracking?.ttclid),
        wbraid: toNullableTrackingValue(tracking?.wbraid),
        gbraid: toNullableTrackingValue(tracking?.gbraid),
        fbc: toNullableTrackingValue(tracking?.fbc),
        fbp: toNullableTrackingValue(tracking?.fbp),
    };
}

function buildLeadTracking(payload: SubmitLeadRequest): N8nLeadTracking {
    return {
        ...buildLeadTrackingUtms(payload),
        ...buildLeadTrackingIds(payload),
        extras: payload.tracking?.extras ?? {},
    };
}

function normalizeContextValue(value: string | null | undefined): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function buildN8nLeadPayload(
    payload: SubmitLeadRequest,
    requestId: string,
    context: N8nLeadRequestContext = {},
): N8nLeadPayload {
    return {
        requestId,
        source: 'submit-lead',
        lead: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            whatsapp: payload.whatsapp,
            eventId: payload.event_id ?? null,
            bantSummary: payload.bantSummary,
            destination: payload.destination,
        },
        utms: payload.utms,
        tracking: buildLeadTracking(payload),
        meta: {
            receivedAt: new Date().toISOString(),
            clientIpAddress: normalizeContextValue(context.clientIpAddress),
            clientUserAgent: normalizeContextValue(context.clientUserAgent),
        },
    };
}

export function buildN8nContactPayload(payload: SubmitContactRequest, requestId: string): N8nContactPayload {
    const tracking: N8nLeadTracking = {
        utm_source: payload.tracking?.utm_source ?? payload.utms.utm_source,
        utm_medium: payload.tracking?.utm_medium ?? payload.utms.utm_medium,
        utm_campaign: payload.tracking?.utm_campaign ?? payload.utms.utm_campaign,
        utm_term: payload.tracking?.utm_term ?? payload.utms.utm_term,
        utm_content: payload.tracking?.utm_content ?? payload.utms.utm_content,
        cid: toNullableTrackingValue(payload.tracking?.cid),
        sid: toNullableTrackingValue(payload.tracking?.sid),
        gclid: toNullableTrackingValue(payload.tracking?.gclid),
        fbclid: toNullableTrackingValue(payload.tracking?.fbclid),
        msclkid: toNullableTrackingValue(payload.tracking?.msclkid),
        ttclid: toNullableTrackingValue(payload.tracking?.ttclid),
        wbraid: toNullableTrackingValue(payload.tracking?.wbraid),
        gbraid: toNullableTrackingValue(payload.tracking?.gbraid),
        fbc: toNullableTrackingValue(payload.tracking?.fbc),
        fbp: toNullableTrackingValue(payload.tracking?.fbp),
        extras: payload.tracking?.extras ?? {},
    };

    return {
        requestId,
        source: 'submit-contact',
        contact: {
            firstName: payload.firstName,
            lastName: payload.lastName ?? null,
            whatsapp: payload.whatsapp,
            email: payload.email ?? null,
            emailOptIn: payload.emailOptIn,
            eventId: payload.eventId ?? null,
            ctaSource: payload.source ?? null,
            destination: payload.destination ?? null,
        },
        tracking,
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

export interface N8nQuizPayload {
    requestId: string;
    source: 'submit-quiz';
    quiz: {
        firstName: string;
        lastName: string;
        email: string;
        whatsapp: string | null;
        profileKey: string;
        profileName: string;
        bantSummary: string;
        sourcePage: string;
        destinos: string[];
        skipped: boolean;
        newsletterOptIn: boolean;
    };
    utms: SubmitQuizRequest['utms'];
    tracking: SubmitQuizRequest['tracking'];
    meta: {
        receivedAt: string;
    };
}

export function buildN8nQuizPayload(payload: SubmitQuizRequest, requestId: string): N8nQuizPayload {
    return {
        requestId,
        source: 'submit-quiz',
        quiz: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            whatsapp: payload.whatsapp ?? null,
            profileKey: payload.profileKey,
            profileName: payload.profileName,
            bantSummary: payload.bantSummary,
            sourcePage: payload.sourcePage,
            destinos: payload.destinos ?? [],
            skipped: payload.skipped ?? false,
            newsletterOptIn: payload.newsletterOptIn ?? false,
        },
        utms: payload.utms,
        tracking: payload.tracking,
        meta: {
            receivedAt: new Date().toISOString(),
        },
    };
}

export interface N8nNpsPayload {
    requestId: string;
    firstname: string;
    email: string;
    score: number;
    reason: string;
    highlight: string;
    submittedAt: string;
}
