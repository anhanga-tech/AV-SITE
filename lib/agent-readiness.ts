const SUPPORTED_DISCOVERY_PATHS = new Set([
    '/.well-known/api-catalog',
    '/.well-known/api-docs',
    '/.well-known/http-message-signatures-directory',
    '/.well-known/openapi.json',
    '/.well-known/security.txt',
]);

export function normalizeAgentPath(pathname: string): string {
    const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function requestsMarkdown(accept: string | null): boolean {
    if (!accept) return false;

    return accept.split(',').some((entry) => {
        const [mediaType, ...parameters] = entry.trim().toLowerCase().split(';');
        if (mediaType !== 'text/markdown') return false;

        const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
        return !quality || Number(quality.trim().slice(2)) > 0;
    });
}

export function isUnsupportedDiscoveryPath(pathname: string): boolean {
    const path = normalizeAgentPath(pathname);

    if (path === '/auth.md') return true;
    if (!path.startsWith('/.well-known/')) return false;

    return !SUPPORTED_DISCOVERY_PATHS.has(path);
}
