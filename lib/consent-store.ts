/**
 * Persistência do ledger. Fonte de verdade: Upstash (mesma conta do rate
 * limit), chaveada por id de evento e por sujeito. Sem Redis no edge o
 * append falha fechado — não há como provar o consentimento. Em dev/test
 * (sem CF_PAGES) um mapa em memória cobre o processo.
 *
 * Retenção: 5 anos, alinhada ao cadastro no CRM (Política de Privacidade §7.1).
 * As chaves não guardam e-mail em claro: o sujeito de e-mail é um HMAC.
 */
import { logger } from './logger';
import { isEdgeRuntime } from './redis-client';
import { getRateLimitKeySecret } from './rate-limit';
import {
    planAppend,
    type ConsentEvent,
    type ConsentEventDraft,
} from './consent-ledger';

const RETENTION_SECONDS = 5 * 365 * 24 * 60 * 60;
const KEY_PREFIX = 'lgpd:consent';

export class ConsentLedgerUnavailable extends Error {
    constructor() {
        super('CONSENT_LEDGER_UNAVAILABLE');
        this.name = 'ConsentLedgerUnavailable';
    }
}

export interface ConsentAppendResult {
    status: 'appended' | 'replay';
    events: ConsentEvent[];
}

export interface ConsentStore {
    readSubject(subjectKey: string): Promise<ConsentEvent[]>;
    append(draft: ConsentEventDraft): Promise<ConsentAppendResult>;
    readAnonEmail(anonKey: string): Promise<string | null>;
    linkAnonEmail(anonKey: string, emailSubjectKey: string): Promise<void>;
}

const memoryEvents = new Map<string, ConsentEvent[]>();
const memoryAnonEmail = new Map<string, string>();

export function _resetConsentStoreForTests(): void {
    memoryEvents.clear();
    memoryAnonEmail.clear();
}

function memoryStore(): ConsentStore {
    return {
        async readSubject(subjectKey) {
            return [...(memoryEvents.get(subjectKey) ?? [])];
        },
        async append(draft) {
            const existing = memoryEvents.get(draft.subjectKey) ?? [];
            const planned = planAppend(existing, draft, new Date().toISOString());
            memoryEvents.set(draft.subjectKey, planned.events);
            return planned;
        },
        async readAnonEmail(anonKey) {
            return memoryAnonEmail.get(anonKey) ?? null;
        },
        async linkAnonEmail(anonKey, emailSubjectKey) {
            memoryAnonEmail.set(anonKey, emailSubjectKey);
        },
    };
}

interface UpstashResult {
    result?: unknown;
    error?: string;
}

async function upstash(command: unknown[]): Promise<unknown> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new ConsentLedgerUnavailable();

    const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
    });
    if (!response.ok) throw new ConsentLedgerUnavailable();
    const payload = (await response.json()) as UpstashResult;
    if (payload.error) throw new ConsentLedgerUnavailable();
    return payload.result;
}

function subjectListKey(subjectKey: string): string {
    return `${KEY_PREFIX}:subject:${subjectKey}`;
}

function eventKey(eventId: string): string {
    return `${KEY_PREFIX}:event:${eventId}`;
}

function anonEmailKey(anonKey: string): string {
    return `${KEY_PREFIX}:anon-email:${anonKey}`;
}

function parseEvent(raw: unknown): ConsentEvent | null {
    if (typeof raw !== 'string' || !raw) return null;
    try {
        const parsed = JSON.parse(raw) as ConsentEvent;
        if (!parsed || typeof parsed !== 'object' || typeof parsed.id !== 'string') return null;
        return parsed;
    } catch {
        return null;
    }
}

function upstashStore(): ConsentStore {
    return {
        async readSubject(subjectKey) {
            const rows = await upstash(['LRANGE', subjectListKey(subjectKey), '0', '-1']);
            if (!Array.isArray(rows)) return [];
            return rows.flatMap((row) => {
                const event = parseEvent(row);
                return event ? [event] : [];
            });
        },
        async append(draft) {
            const existingRaw = await upstash(['GET', eventKey(draft.id)]);
            const existingEvent = parseEvent(existingRaw);
            const current = await this.readSubject(draft.subjectKey);
            if (existingEvent) {
                const events = current.some((event) => event.id === draft.id)
                    ? current
                    : [...current, existingEvent];
                return { status: 'replay', events };
            }
            const recordedAt = new Date().toISOString();
            const planned = planAppend(current, draft, recordedAt);
            const created = planned.events[planned.events.length - 1];
            if (!created || planned.status !== 'appended') return planned;
            const payload = JSON.stringify(created);
            const wrote = await upstash(['SET', eventKey(draft.id), payload, 'NX', 'EX', RETENTION_SECONDS]);
            if (wrote !== 'OK') {
                const raced = await this.readSubject(draft.subjectKey);
                return { status: 'replay', events: raced };
            }
            await upstash(['RPUSH', subjectListKey(draft.subjectKey), payload]);
            await upstash(['EXPIRE', subjectListKey(draft.subjectKey), RETENTION_SECONDS]);
            return planned;
        },
        async readAnonEmail(anonKey) {
            const value = await upstash(['GET', anonEmailKey(anonKey)]);
            return typeof value === 'string' && value ? value : null;
        },
        async linkAnonEmail(anonKey, emailSubjectKey) {
            await upstash(['SET', anonEmailKey(anonKey), emailSubjectKey, 'EX', RETENTION_SECONDS]);
        },
    };
}

function ledgerSecret(): string | null {
    const configured = getRateLimitKeySecret();
    if (configured) return configured;
    if (isEdgeRuntime()) return null;
    return 'dev-only-rate-limit-key';
}

export async function emailSubjectKey(email: string): Promise<string> {
    const secret = ledgerSecret();
    if (!secret) throw new ConsentLedgerUnavailable();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(email.trim().toLowerCase()));
    const hex = Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `email:${hex.slice(0, 32)}`;
}

export function getConsentStore(): ConsentStore {
    if (process.env.CONSENT_LEDGER_FORCE_FAIL === '1') {
        return {
            async readSubject() { throw new ConsentLedgerUnavailable(); },
            async append() { throw new ConsentLedgerUnavailable(); },
            async readAnonEmail() { throw new ConsentLedgerUnavailable(); },
            async linkAnonEmail() { throw new ConsentLedgerUnavailable(); },
        };
    }
    const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    if (hasRedis) return upstashStore();
    if (isEdgeRuntime()) {
        logger.error('ConsentStore', { stage: 'config', detail: 'Upstash ausente no edge' });
        return {
            async readSubject() { throw new ConsentLedgerUnavailable(); },
            async append() { throw new ConsentLedgerUnavailable(); },
            async readAnonEmail() { throw new ConsentLedgerUnavailable(); },
            async linkAnonEmail() { throw new ConsentLedgerUnavailable(); },
        };
    }
    return memoryStore();
}
