/**
 * Cliente do POST /api/consent. O recibo só volta quando o ledger confirmou
 * o grant — é ele que libera Zaraz marketing e a captura de click IDs.
 */
import type { AdsConsentReceipt } from './consent';

export async function registerAdsConsent(input: {
    action: 'grant' | 'revoke';
    subjectKey: string;
    occurredAt: string;
}): Promise<AdsConsentReceipt | null> {
    const eventId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `ads_${crypto.randomUUID()}`
        : `ads_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    try {
        const response = await fetch('/api/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                purpose: 'ads_measurement',
                action: input.action,
                origin: 'cookie_banner',
                eventId,
                subjectKey: input.subjectKey,
                occurredAt: input.occurredAt,
            }),
            keepalive: true,
        });
        if (!response.ok) return null;
        const payload = (await response.json()) as { ok?: boolean; effective?: string; subjectKey?: string };
        if (input.action === 'revoke') return payload.ok ? { eventId, subjectKey: input.subjectKey } : null;
        if (!payload.ok || payload.effective !== 'grant') return null;
        return { eventId, subjectKey: payload.subjectKey || input.subjectKey };
    } catch {
        return null;
    }
}

export async function revokeEmailMarketing(email: string): Promise<'ok' | 'invalid' | 'unavailable'> {
    const eventId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `emrev_${crypto.randomUUID()}`
        : `emrev_${Date.now()}`;
    try {
        const response = await fetch('/api/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                purpose: 'email_marketing',
                action: 'revoke',
                origin: 'privacy_page',
                eventId,
                email,
                occurredAt: new Date().toISOString(),
            }),
        });
        if (response.status === 400) return 'invalid';
        if (!response.ok) return 'unavailable';
        return 'ok';
    } catch {
        return 'unavailable';
    }
}
