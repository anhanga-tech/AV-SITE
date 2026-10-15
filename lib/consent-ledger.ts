/**
 * Ledger append-only de consentimento (LGPD Art. 8º). A ordem que vale é a
 * do ato do titular (`occurredAt`), não a da chegada no servidor: um grant
 * atrasado não desfaz uma revogação mais nova, e reprocessar o mesmo id é
 * no-op.
 */
export type ConsentPurpose = 'ads_measurement' | 'email_marketing';
export type ConsentAction = 'grant' | 'revoke';

export interface ConsentEvent {
    id: string;
    subjectKey: string;
    purpose: ConsentPurpose;
    action: ConsentAction;
    noticeVersion: string;
    origin: string;
    /** Momento em que o titular agiu. Ordena o estado efetivo. */
    occurredAt: string;
    /** Momento em que o servidor gravou. Desempate e trilha de auditoria. */
    recordedAt: string;
}

export interface ConsentEventDraft {
    id: string;
    subjectKey: string;
    purpose: ConsentPurpose;
    action: ConsentAction;
    noticeVersion: string;
    origin: string;
    occurredAt: string;
}

const EVENT_ID_PATTERN = /^[\w:.-]{8,80}$/;
const ANON_SUBJECT_PATTERN = /^anon:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_SUBJECT_PREFIX = 'email:';

export function isConsentEventId(value: string): boolean {
    return EVENT_ID_PATTERN.test(value);
}

export function isAnonSubjectKey(value: string): boolean {
    return ANON_SUBJECT_PATTERN.test(value);
}

export function isEmailSubjectKey(value: string): boolean {
    return value.startsWith(EMAIL_SUBJECT_PREFIX) && value.length > EMAIL_SUBJECT_PREFIX.length + 8;
}

function eventTime(event: ConsentEvent): string {
    return event.occurredAt || event.recordedAt;
}

export function effectiveAction(events: readonly ConsentEvent[], purpose: ConsentPurpose): ConsentAction | null {
    const relevant = events.filter((event) => event.purpose === purpose);
    if (relevant.length === 0) return null;
    const sorted = [...relevant].sort((a, b) => {
        const byAct = eventTime(a).localeCompare(eventTime(b));
        if (byAct !== 0) return byAct;
        return a.recordedAt.localeCompare(b.recordedAt);
    });
    return sorted[sorted.length - 1]?.action ?? null;
}

/**
 * Acrescenta o evento, ou devolve a lista intacta quando o id já existe
 * (replay). Um grant com `occurredAt` anterior à revogação vigente entra no
 * histórico, mas `effectiveAction` continua `revoke`.
 */
export function planAppend(
    existing: readonly ConsentEvent[],
    draft: ConsentEventDraft,
    recordedAt: string,
): { status: 'appended' | 'replay'; events: ConsentEvent[] } {
    const prior = existing.find((event) => event.id === draft.id);
    if (prior) return { status: 'replay', events: [...existing] };
    const event: ConsentEvent = { ...draft, recordedAt };
    return { status: 'appended', events: [...existing, event] };
}

export function adsGrantIsActive(events: readonly ConsentEvent[], eventId: string): boolean {
    const grant = events.find((event) => event.id === eventId);
    if (!grant || grant.purpose !== 'ads_measurement' || grant.action !== 'grant') return false;
    return effectiveAction(events, 'ads_measurement') === 'grant';
}
