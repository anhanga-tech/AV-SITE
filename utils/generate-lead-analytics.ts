import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import { isSafeTrackingValue } from './piiRedaction';
import { trackTraks, currentPathname as currentTraksPathname } from './traks';

interface GenerateLeadConversionEvent {
    eventId?: string;
    destination?: string;
    utms?: Partial<Pick<LeadUtms, 'utm_source' | 'utm_medium' | 'utm_campaign'>>;
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

    // destination é texto livre digitado pelo usuário (ver cleanValue em useLeadCapture) —
    // pode conter um e-mail/telefone que a pessoa colou por conta própria. Sem esse check,
    // isso ia direto pro dataLayer (generate_lead) que o Zaraz encaminha ao GA4 sem
    // scrubbing (achado de review, chatgpt-codex-connector[bot]).
    window.dataLayer.push({
        event: 'generate_lead',
        event_id: eventId,
        ...(destination !== undefined && isSafeTrackingValue(destination) ? { destination } : {}),
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
