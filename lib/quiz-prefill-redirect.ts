/**
 * Edge handoff for the `/quiz` pre-fill link: `/quiz?email=…&nome=…` never
 * reaches the HTML. Same approach as the NPS invite (lib/nps-invite-redirect.ts):
 * the request is answered here with a 303 to a clean `/quiz/` that sets the
 * `quiz_prefill` cookie (lib/quiz-prefill-cookie.ts), so Zaraz's automatic
 * Pageview, the Cloudflare Web Analytics beacon and Traks never see the
 * visitor's e-mail or name. Other params (e.g. `utm_*`) are kept.
 */
import { buildClearedQuizPrefillCookie, buildQuizPrefillCookie } from './quiz-prefill-cookie';

const QUIZ_PATHS = new Set(['/quiz', '/quiz/index.html']);
const QUIZ_CLEAN_PATH = '/quiz/';

/** `skip` isn't personal data, but it only means something next to `email`. */
const PREFILL_PARAMS = ['email', 'nome', 'sobrenome', 'skip'] as const;

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;
// eslint-disable-next-line no-control-regex -- stripping control characters is the point
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function isQuizPrefillRequest(request: Request): boolean {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    const url = new URL(request.url);
    // React Router matches `/quiz` case-insensitively and with or without a
    // trailing slash, and the 404 HTML boots Zaraz just the same.
    const pathname = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (!QUIZ_PATHS.has(pathname)) return false;
    return PREFILL_PARAMS.some((param) => url.searchParams.has(param));
}

function cleanParam(value: string | null, maxLength: number): string {
    // Over-long values are dropped, not truncated: a cut e-mail would pre-fill
    // (or, with skip, submit) a wrong address.
    const cleaned = (value ?? '').replace(CONTROL_CHARS, '').trim();
    return cleaned.length > maxLength ? '' : cleaned;
}

function buildCleanLocation(url: URL): string {
    const clean = new URLSearchParams(url.searchParams);
    for (const param of PREFILL_PARAMS) clean.delete(param);
    const query = clean.toString();
    return query ? `${QUIZ_CLEAN_PATH}?${query}` : QUIZ_CLEAN_PATH;
}

/** Returns the redirect for a quiz pre-fill request, or `null` when the request isn't one. */
export function handleQuizPrefillRequest(request: Request): Response | null {
    if (!isQuizPrefillRequest(request)) return null;

    const url = new URL(request.url);
    const secure = url.protocol === 'https:';
    const email = cleanParam(url.searchParams.get('email'), MAX_EMAIL_LENGTH);
    const nome = cleanParam(url.searchParams.get('nome'), MAX_NAME_LENGTH);
    const sobrenome = cleanParam(url.searchParams.get('sobrenome'), MAX_NAME_LENGTH);
    const skip = url.searchParams.get('skip') === 'true' && email.length > 0;

    const cookie = email || nome || sobrenome
        ? buildQuizPrefillCookie({ email, nome, sobrenome, skip }, secure)
        // Nothing usable: clear any leftover pre-fill instead of leaving a stale one.
        : buildClearedQuizPrefillCookie(secure);

    return new Response(null, {
        status: 303,
        headers: {
            Location: buildCleanLocation(url),
            'Set-Cookie': cookie,
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
        },
    });
}
