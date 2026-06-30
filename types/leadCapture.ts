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
    whatsapp: string;
    event_id?: string;
    utms: LeadUtms;
    tracking?: LeadTracking;
    bantSummary: string;
    destination: string;
    /** E-mail-marketing opt-in → Odoo x_lgpd_consent. */
    marketingOptIn?: boolean;
}

