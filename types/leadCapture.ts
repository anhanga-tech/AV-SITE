export interface LeadUtms {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
}

export interface SubmitLeadRequest {
    firstName: string;
    lastName: string;
    email: string;
    utms: LeadUtms;
    bantSummary: string;
}

export interface SubmitLeadSuccess {
    ok: true;
    contactId: string;
    message: string;
}

export type SubmitLeadErrorCode =
    | 'VALIDATION_ERROR'
    | 'HUBSPOT_UNAUTHORIZED'
    | 'HUBSPOT_DUPLICATE_CONTACT'
    | 'HUBSPOT_API_ERROR'
    | 'SERVER_CONFIG_ERROR'
    | 'METHOD_NOT_ALLOWED';

export interface SubmitLeadError {
    ok: false;
    error: string;
    code: SubmitLeadErrorCode;
}

export type SubmitLeadResponse = SubmitLeadSuccess | SubmitLeadError;
