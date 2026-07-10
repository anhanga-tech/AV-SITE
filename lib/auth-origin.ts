/**
 * Explicit allowlist of origins allowed to initiate and receive the Decap CMS
 * OAuth handshake. Issue #1135: an earlier implementation accepted any
 * `*.anhanga.tur.br` subdomain and fell back to `window.location.origin`,
 * which would trust an attacker-controlled subdomain or preview deploy.
 * Only these exact origins are ever used as a `postMessage` target.
 */
const DECLARED_DEV_ORIGINS = ['http://localhost:3000'];

export function resolveProductionOAuthOrigin(): string {
    return process.env.ALLOWED_ORIGIN || 'https://www.anhanga.tur.br';
}

export function getAllowedOAuthOrigins(): string[] {
    return [resolveProductionOAuthOrigin(), ...DECLARED_DEV_ORIGINS];
}

export function isAllowedOAuthOrigin(origin: string | null | undefined): origin is string {
    if (!origin) return false;
    return getAllowedOAuthOrigins().includes(origin);
}

/** Extracts the page origin from a `Referer` header, or null if absent/malformed. */
export function extractOriginFromReferer(referer: string | null): string | null {
    if (!referer) return null;
    try {
        return new URL(referer).origin;
    } catch {
        return null;
    }
}

/**
 * Validates that an OAuth-initiation request (`/api/auth`) was navigated to
 * from an authorized origin. Returns the validated origin, or null if the
 * referer is missing, malformed, or not in the allowlist — callers must
 * fail closed (reject the request) rather than guess a default.
 */
export function validateOAuthInitiationOrigin(refererHeader: string | null): string | null {
    const origin = extractOriginFromReferer(refererHeader);
    return isAllowedOAuthOrigin(origin) ? origin : null;
}
