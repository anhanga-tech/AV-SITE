import type { LeadTracking, LeadUtms } from '../types/leadCapture';
import { trackTraks } from './traks';

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

    // Traks (cookieless): mesma conversão, destino em baixa cardinalidade.
    trackTraks('quote_request', { destination });
}
