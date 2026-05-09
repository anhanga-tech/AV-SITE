import { normalizeNullable, normalizeTracking, normalizeUtms } from './lead-logic';
import type { SubmitWaitlistRequest } from '../types/waitlist';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitWaitlistName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const [firstName = '', ...rest] = parts;

    return {
        firstName,
        lastName: rest.join(' '),
    };
}

function buildWaitlistNoteBody(payload: SubmitWaitlistRequest): string {
    const lines = [
        'Lista de Espera Lollapalooza 2027',
        `Nome: ${payload.name}`,
        `Email: ${payload.email}`,
        `Origem da captura: ${payload.sourcePage}`,
    ];

    if (payload.utms.utm_source) lines.push(`UTM Source: ${payload.utms.utm_source}`);
    if (payload.utms.utm_medium) lines.push(`UTM Medium: ${payload.utms.utm_medium}`);
    if (payload.utms.utm_campaign) lines.push(`UTM Campaign: ${payload.utms.utm_campaign}`);

    return lines.join('\n');
}

export function validateWaitlistPayload(
    payload: unknown,
): { valid: true; data: SubmitWaitlistRequest } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload inválido.' };
    }

    const raw = payload as Record<string, unknown>;
    const name = normalizeNullable(raw.name, 160);
    const email = normalizeNullable(raw.email)?.toLowerCase() ?? null;
    const sourcePage = normalizeNullable(raw.sourcePage, 255);

    if (!name || !email || !sourcePage) {
        return { valid: false, error: 'Campos obrigatórios ausentes.' };
    }

    if (!EMAIL_REGEX.test(email)) {
        return { valid: false, error: 'Email inválido.' };
    }

    const utms = normalizeUtms(raw.utms);
    const tracking = normalizeTracking(raw.tracking, utms);

    return {
        valid: true,
        data: {
            name,
            email,
            sourcePage,
            utms,
            tracking,
        },
    };
}
