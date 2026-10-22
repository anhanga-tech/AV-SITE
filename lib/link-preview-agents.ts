/**
 * Recognizes requests that fetch a link without a person reading it: chat
 * apps building a preview card when the link is pasted, search and social
 * crawlers, and HTTP libraries. Used by the proposal open counter (#1897) —
 * pasting `/proposta/<id>` into WhatsApp must not count as the customer
 * opening it.
 *
 * lib/bot-detection.ts is a different concern (form-submission honeypots and
 * timing); it never sees GET requests.
 */

// Matched case-insensitively against the whole User-Agent. Each entry names a
// specific fetcher rather than a bare `bot`, which would also match phone
// brands such as "CUBOT" in a real browser's UA — and never an app name alone,
// since in-app browsers (Snapchat, Viber, Instagram…) carry the app name in
// the UA of a real person reading the page.
const PREVIEW_AGENT_PATTERN = new RegExp(
    [
        // Chat and social link previews. iMessage sends
        // "facebookexternalhit/1.1 Facebot Twitterbot/1.0".
        '^WhatsApp/',
        'facebookexternalhit',
        'Facebot',
        'facebookcatalog',
        'meta-external(?:agent|fetcher)',
        'Twitterbot',
        'Slackbot',
        'Slack-ImgProxy',
        'TelegramBot',
        'Discordbot',
        'LinkedInBot',
        'SkypeUriPreview',
        'snapchat_preview',
        'Snap URL Preview',
        'Pinterestbot',
        'redditbot',
        'Embedly',
        'Iframely',
        'Mastodon/',
        // Bluesky's link-card fetcher.
        'Cardyb',
        // Google: search, inspection and fetchers.
        'Googlebot',
        'Google-InspectionTool',
        'GoogleOther',
        'Google-PageRenderer',
        'AdsBot-Google',
        'APIs-Google',
        'FeedFetcher-Google',
        'Google-Safety',
        // PageSpeed Insights / Lighthouse audits.
        'Chrome-Lighthouse',
        // Other crawlers.
        'Applebot',
        'bingbot',
        'DuckDuckBot',
        'YandexBot',
        // Automation and HTTP libraries.
        'HeadlessChrome',
        'curl/',
        'Wget/',
        'python-requests',
        'python-urllib',
        'Go-http-client',
        'node-fetch',
        'axios/',
        'okhttp',
    ].join('|'),
    'i',
);

/**
 * True for a browser fetching the page speculatively — Chrome speculation
 * rules and omnibox prediction (`Sec-Purpose: prefetch`, `…;prerender`),
 * legacy `Purpose: prefetch` and Firefox's `X-Moz: prefetch`. Nobody is
 * reading the page yet, and a later navigation will.
 */
export function isPrefetchRequest(request: Request): boolean {
    const purpose = [
        request.headers.get('sec-purpose'),
        request.headers.get('purpose'),
        request.headers.get('x-purpose'),
        request.headers.get('x-moz'),
    ].join(' ');
    return /\b(?:prefetch|prerender)\b/i.test(purpose);
}

/** True when the request is not a person opening the link in a browser. */
export function isLinkPreviewRequest(request: Request): boolean {
    if (request.method === 'HEAD') return true;
    // Safari's page preview: shown as is, may be all the person ever sees.
    if (/\bpreview\b/i.test(request.headers.get('x-purpose') ?? '')) return true;
    const userAgent = request.headers.get('user-agent')?.trim() ?? '';
    // Browsers always send a User-Agent; its absence means a script.
    if (!userAgent) return true;
    return PREVIEW_AGENT_PATTERN.test(userAgent);
}
