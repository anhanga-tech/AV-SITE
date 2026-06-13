const ANHANGA_HOSTNAME = 'anhanga.tur.br';
const ANHANGA_SUBDOMAIN_SUFFIX = `.${ANHANGA_HOSTNAME}`;

/**
 * Restricts links rendered from AI-generated markdown to an allowlist.
 * Used as react-markdown's `urlTransform` to defend against prompt-injection
 * that tries to render phishing links inside the branded chat UI.
 */
export function sanitizeAiLinkUrl(url: string): string {
  // Reject protocol-relative URLs (`//evil.com`): they start with `/` but
  // resolve to an external origin, bypassing the host allowlist below.
  if ((url.startsWith('/') && !url.startsWith('//')) || url.startsWith('#')) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return '';
  }

  if (parsed.protocol !== 'https:') {
    return '';
  }

  const isAnhangaHost =
    parsed.hostname === ANHANGA_HOSTNAME || parsed.hostname.endsWith(ANHANGA_SUBDOMAIN_SUFFIX);

  if (!isAnhangaHost) {
    return '';
  }

  return url;
}
