export interface ContactModalOptions {
    source?: string;
    destination?: string;
    message?: string;
    /**
     * Mostra os campos opcionais "Idade das crianças" e "Quantos dias" no modal.
     * Para CTAs cuja copy promete responder com base nisso (hub /parques-brasil).
     */
    askTripDetails?: boolean;
}

export function openContactModal(options: ContactModalOptions = {}): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: options }));
}

export interface ContactTripDetails {
    childrenAges?: string;
    tripDays?: string;
}

/**
 * Anexa idade das crianças e dias disponíveis à mensagem pré-preenchida do
 * WhatsApp, para o consultor não ter de perguntar de novo o que o visitante
 * já respondeu no modal. Campos vazios não geram linha.
 */
export function appendTripDetailsToMessage(message: string, details: ContactTripDetails): string {
    const lines = [message];
    const childrenAges = details.childrenAges?.trim();
    const tripDays = details.tripDays?.trim();
    if (childrenAges) lines.push(`Idade das crianças: ${childrenAges}`);
    if (tripDays) lines.push(`Dias disponíveis: ${tripDays}`);
    return lines.join('\n');
}
