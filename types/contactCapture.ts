import type { AttributionConsentReceipt, LeadTracking, LeadUtms } from './leadCapture';

export interface ContactFormFields {
    firstName: string;
    lastName: string;
    whatsapp: string;
    email: string;
    emailOptIn: boolean;
    /** Opcional, só pedido quando o CTA abre o modal com `askTripDetails`. */
    childrenAges: string;
    tripDays: string;
}

export interface SubmitContactRequest {
    firstName: string;
    lastName?: string;
    whatsapp: string;
    email?: string;
    emailOptIn: boolean;
    source?: string;
    destination?: string;
    /** Texto livre ("4 e 9 anos") — vai para a descrição da oportunidade. */
    childrenAges?: string;
    /** Texto livre ("4 dias", "um feriado") — vai para a descrição da oportunidade. */
    tripDays?: string;
    eventId?: string;
    utms: LeadUtms;
    tracking?: LeadTracking;
    attributionConsent?: AttributionConsentReceipt | null;
}

export type SubmitContactErrorCode =
    | 'VALIDATION_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SERVER_CONFIG_ERROR'
    | 'N8N_WEBHOOK_ERROR'
    | 'METHOD_NOT_ALLOWED'
    | 'INTERNAL_ERROR'
    | 'SERVICE_UNAVAILABLE';

interface SubmitContactSuccess {
    ok: true;
    requestId: string;
}

interface SubmitContactError {
    ok: false;
    requestId: string;
    error: string;
    code: SubmitContactErrorCode;
}

export type SubmitContactResponse = SubmitContactSuccess | SubmitContactError;
