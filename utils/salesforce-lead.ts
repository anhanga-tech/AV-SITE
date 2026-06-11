import type { LeadUtms } from '../types/leadCapture';

export interface SalesforceLeadClientPayload {
    firstName: string;
    lastName: string;
    email?: string;
    whatsapp?: string;
    empresa?: string;
    cargo?: string;
    leadSource: string;
    description?: string;
    utms?: LeadUtms;
}

/**
 * Fire-and-forget para o web-to-lead do Salesforce via /api/submit-lead-sf.
 * Nunca bloqueia nem quebra o fluxo principal do formulário — o lead primário
 * segue pelo n8n/HubSpot; o Salesforce é um espelho best-effort.
 * `keepalive` garante que o envio sobreviva à navegação para o WhatsApp.
 */
export function sendLeadToSalesforce(payload: SalesforceLeadClientPayload): void {
    if (typeof fetch === 'undefined') return;

    void fetch('/api/submit-lead-sf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
    }).catch(() => undefined);
}
