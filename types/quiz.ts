import type { LeadTracking, LeadUtms } from './leadCapture';

export interface SubmitQuizRequest {
    firstName: string;
    lastName: string;
    email: string;
    whatsapp?: string;
    profileKey: string;
    profileName: string;
    bantSummary: string;
    sourcePage: string;
    destinos?: string[];
    skipped?: boolean;
    newsletterOptIn?: boolean;
    utms: LeadUtms;
    tracking?: LeadTracking;
}

interface SubmitQuizSuccess {
    ok: true;
    requestId: string;
    warning?: string;
    message: string;
}

type SubmitQuizErrorCode =
    | 'VALIDATION_ERROR'
    | 'SERVER_CONFIG_ERROR'
    | 'N8N_WEBHOOK_ERROR'
    | 'INTERNAL_ERROR'
    | 'METHOD_NOT_ALLOWED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVICE_UNAVAILABLE';

interface SubmitQuizError {
    ok: false;
    requestId: string;
    error: string;
    code: SubmitQuizErrorCode;
}

export type SubmitQuizResponse = SubmitQuizSuccess | SubmitQuizError;
