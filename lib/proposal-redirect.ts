/**
 * Destinations a `redirect` proposal may send the customer to (#1896).
 *
 * The tracked redirect is the fallback when there's no operator adapter or the
 * extraction fails (#1906): `/proposta/<id>` records the open and answers 302
 * to the operator's own proposal page. Only operators listed here are
 * accepted, on save and again on every read, so a proposal can never become
 * an open redirect. Adding an operator is a reviewed code change, not
 * configuration.
 *
 * The operator URL carries the booking token, so it is a credential too:
 * never log it.
 */
interface AllowedOperator {
    pathPrefix: string;
    /** Query params forced on every link, overriding whatever the operator generated. */
    forcedParams: Readonly<Record<string, string>>;
}

const ALLOWED_OPERATORS: ReadonlyMap<string, AllowedOperator> = new Map([
    // Infotravel (RCA): https://premium.infotravel.com.br/orcamento-web/pt/link?token=…
    ['premium.infotravel.com.br', {
        pathPrefix: '/orcamento-web/',
        // Decision D7 (#1894): no operator payment button — closing goes through
        // Anhangá. Generated links come with `shouldShowPay=true`.
        forcedParams: { shouldShowPay: 'false' },
    }],
]);

const MAX_REDIRECT_URL_LENGTH = 2048;

/**
 * Replaces the forced params in a raw query string, leaving every other pair
 * byte-for-byte: `URLSearchParams` would re-encode the base64 booking token
 * (`/` → `%2F`, `=` → `%3D`) on the way out.
 */
function withForcedParams(search: string, forced: Readonly<Record<string, string>>): string {
    const names = new Set(Object.keys(forced));
    const kept = search
        .replace(/^\?/, '')
        .split('&')
        .filter((pair) => pair && !names.has(decodeParamName(pair)));
    const appended = Object.entries(forced).map(([name, value]) => `${name}=${encodeURIComponent(value)}`);
    return `?${[...kept, ...appended].join('&')}`;
}

function decodeParamName(pair: string): string {
    const name = pair.split('=', 1)[0];
    try {
        return decodeURIComponent(name.replace(/\+/g, ' '));
    } catch {
        return name;
    }
}

/**
 * The normalized URL when `value` is an allowed operator link, otherwise
 * `null`. Normalizing is idempotent, so a stored URL re-checks as itself.
 */
export function parseAllowedRedirectUrl(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > MAX_REDIRECT_URL_LENGTH) return null;

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return null;
    }

    if (url.protocol !== 'https:') return null;
    // `https://premium.infotravel.com.br@evil.example` parses with evil.example
    // as the host; credentials have no business in an operator link anyway.
    if (url.username || url.password) return null;
    if (url.port) return null;

    const operator = ALLOWED_OPERATORS.get(url.hostname);
    if (!operator || !url.pathname.startsWith(operator.pathPrefix)) return null;

    url.search = withForcedParams(url.search, operator.forcedParams);

    const normalized = url.href;
    return normalized.length > MAX_REDIRECT_URL_LENGTH ? null : normalized;
}
