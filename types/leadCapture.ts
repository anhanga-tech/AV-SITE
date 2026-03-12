export interface LeadUtms {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
}

export interface LeadTracking {
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
    extras?: Record<string, string>;
}

export interface SubmitLeadRequest {
    firstName: string;
    lastName: string;
    email: string;
    utms: LeadUtms;
    tracking?: LeadTracking;
    bantSummary: string;
    destination: string;
}

export interface SubmitLeadSuccess {
    ok: true;
    requestId: string;
    contactId: string;
    dealId?: string;
    warning?: string;
    message: string;
}

export type SubmitLeadErrorCode =
    | 'VALIDATION_ERROR'
    | 'HUBSPOT_UNAUTHORIZED'
    | 'HUBSPOT_DUPLICATE_CONTACT'
    | 'HUBSPOT_PROPERTY_ERROR'
    | 'HUBSPOT_API_ERROR'
    | 'SERVER_CONFIG_ERROR'
    | 'METHOD_NOT_ALLOWED'
    | 'RATE_LIMIT_EXCEEDED';

export interface SubmitLeadError {
    ok: false;
    requestId: string;
    error: string;
    code: SubmitLeadErrorCode;
}

export type SubmitLeadResponse = SubmitLeadSuccess | SubmitLeadError;
