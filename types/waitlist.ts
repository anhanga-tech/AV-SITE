import type { LeadTracking, LeadUtms } from './leadCapture';

export interface SubmitWaitlistRequest {
    name: string;
    email: string;
    sourcePage: string;
    utms: LeadUtms;
    tracking?: LeadTracking;
}

export interface SubmitWaitlistSuccess {
    ok: true;
    requestId: string;
    warning?: string;
    message: string;
}

export type SubmitWaitlistErrorCode =
    | 'VALIDATION_ERROR'
    | 'SERVER_CONFIG_ERROR'
    | 'N8N_WEBHOOK_ERROR'
    | 'INTERNAL_ERROR'
    | 'METHOD_NOT_ALLOWED'
    | 'RATE_LIMIT_EXCEEDED';

export interface SubmitWaitlistError {
    ok: false;
    requestId: string;
    error: string;
    code: SubmitWaitlistErrorCode;
}

export type SubmitWaitlistResponse = SubmitWaitlistSuccess | SubmitWaitlistError;
