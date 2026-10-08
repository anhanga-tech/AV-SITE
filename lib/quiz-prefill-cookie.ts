/**
 * Cookie that carries the `/quiz` pre-fill off the URL.
 *
 * E-mail links can open the quiz as `/quiz?email=…&nome=…&sobrenome=…&skip=true`
 * to pre-fill (or skip) the lead form. Zaraz's automatic Pageview fires before
 * any page code runs and ships the full URL (query included) to GA4 as
 * `page_location`, so a client-side `history.replaceState` is too late.
 *
 * The edge (`lib/quiz-prefill-redirect.ts`) moves those params into this
 * cookie and redirects to a clean `/quiz/`; the page reads it once on load and
 * then deletes it. Unlike `nps_invite` it can't be `HttpOnly` (the page itself
 * fills the form with it), so it is kept short-lived and scoped to `/quiz`,
 * and it is not a credential: the values are the same ones the visitor could
 * type into the form.
 *
 * Shared by the edge redirect and the page, so it must stay free of
 * server-only imports.
 */
import { readCookie } from './nps-invite-cookie';

export const QUIZ_PREFILL_COOKIE = 'quiz_prefill';
export const QUIZ_PREFILL_COOKIE_PATH = '/quiz';

/** Enough to land and start the quiz; the page deletes it as soon as it reads it. */
export const QUIZ_PREFILL_COOKIE_MAX_AGE_SECONDS = 30 * 60;

export interface QuizPrefill {
    email: string;
    nome: string;
    sobrenome: string;
    skip: boolean;
}

export const EMPTY_QUIZ_PREFILL: QuizPrefill = { email: '', nome: '', sobrenome: '', skip: false };

function serialize(value: string, maxAgeSeconds: number, secure: boolean): string {
    const parts = [
        `${QUIZ_PREFILL_COOKIE}=${encodeURIComponent(value)}`,
        `Path=${QUIZ_PREFILL_COOKIE_PATH}`,
        `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
        'SameSite=Strict',
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

export function buildQuizPrefillCookie(prefill: QuizPrefill, secure: boolean): string {
    return serialize(JSON.stringify(prefill), QUIZ_PREFILL_COOKIE_MAX_AGE_SECONDS, secure);
}

export function buildClearedQuizPrefillCookie(secure: boolean): string {
    return serialize('', 0, secure);
}

/** Parses `quiz_prefill`; `null` when absent or not the shape the edge writes. */
export function parseQuizPrefill(value: string | null): QuizPrefill | null {
    if (!value) return null;
    try {
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object') return null;
        const { email, nome, sobrenome, skip } = parsed as Record<string, unknown>;
        if (typeof email !== 'string' || typeof nome !== 'string' || typeof sobrenome !== 'string') return null;
        // Same rule the URL version had: skipping the form needs a known e-mail.
        return { email, nome, sobrenome, skip: skip === true && email.length > 0 };
    } catch {
        return null;
    }
}

/** Reads the pre-fill from `document.cookie`. Pure, so it is safe in a state initializer. */
export function readQuizPrefillCookie(): QuizPrefill {
    if (typeof document === 'undefined') return EMPTY_QUIZ_PREFILL;
    return parseQuizPrefill(readCookie(document.cookie, QUIZ_PREFILL_COOKIE)) ?? EMPTY_QUIZ_PREFILL;
}

/** Deletes the pre-fill once the page holds it, so the e-mail doesn't linger in a script-readable cookie. */
export function clearQuizPrefillCookie(): void {
    if (typeof document === 'undefined') return;
    if (readCookie(document.cookie, QUIZ_PREFILL_COOKIE) === null) return;
    document.cookie = buildClearedQuizPrefillCookie(window.location.protocol === 'https:');
}
