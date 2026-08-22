import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import { trackTraks } from './traks';

/** Pathname atual sem query/hash — prop de baixa cardinalidade, sem PII. */
function currentTraksPathname(): string {
    if (typeof window === 'undefined') return '';
    try {
        return new URL(window.location.href).pathname;
    } catch {
        return '/';
    }
}

interface GenerateLeadConversionEvent {
    eventId?: string;
    destination: string;
    utms?: Pick<LeadUtms, 'utm_source' | 'utm_medium' | 'utm_campaign'>;
    tracking?: Pick<LeadTracking, 'cid' | 'sid'>;
}

export function pushGenerateLeadConversionEvent({
    eventId,
    destination,
    utms,
    tracking,
}: GenerateLeadConversionEvent): void {
    if (typeof window === 'undefined' || !window.dataLayer) {
        return;
    }

    window.dataLayer.push({
        event: 'generate_lead',
        event_id: eventId,
        destination,
        utm_source: utms?.utm_source,
        utm_medium: utms?.utm_medium,
        utm_campaign: utms?.utm_campaign,
        ga_client_id: tracking?.cid,
        ga_session_id: tracking?.sid,
    });

    // Traks (cookieless): conversão sem dados do lead. `destination` aqui é texto
    // livre digitado pelo usuário (ver cleanValue em useLeadCapture) — NÃO vai
    // para provedor externo. O pathname da rota dá o bucket de origem.
    trackTraks('quote_request', { location: currentTraksPathname() });
}
