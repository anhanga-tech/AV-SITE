import type { LeadTracking, LeadUtms } from './leadCapture';

export interface ContactFormFields {
    firstName: string;
    lastName: string;
    whatsapp: string;
    email: string;
    emailOptIn: boolean;
}

export interface SubmitContactRequest {
    firstName: string;
    lastName?: string;
    whatsapp: string;
    email?: string;
    emailOptIn: boolean;
    source?: string;
    destination?: string;
    eventId?: string;
    utms: LeadUtms;
    tracking?: LeadTracking;
}

export type SubmitContactErrorCode =
    | 'VALIDATION_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVER_CONFIG_ERROR'
    | 'N8N_WEBHOOK_ERROR'
    | 'METHOD_NOT_ALLOWED'
    | 'INTERNAL_ERROR';

export interface SubmitContactSuccess {
    ok: true;
    requestId: string;
}

export interface SubmitContactError {
    ok: false;
    requestId: string;
    error: string;
    code: SubmitContactErrorCode;
}

export type SubmitContactResponse = SubmitContactSuccess | SubmitContactError;
