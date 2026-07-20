/**
 * Reads an upstream provider error body and caps its length at the trust
 * boundary, before it can reach logs, Sentry, or a returned `error` string.
 *
 * Provider error bodies (Meta Graph API, GA4 Measurement Protocol) are
 * untrusted and unbounded: an attacker-influenced field can be echoed back in
 * the response, and a hostile or misbehaving upstream can return an arbitrarily
 * large body. Passing that straight into `logger.error` (which forwards to
 * Sentry) or into the `error` field we return — which callers such as
 * `api/hubspot-webhook.ts` join into a log line — would let a single response
 * flood observability sinks. Truncating here keeps that blast radius bounded.
 *
 * See docs/standards/security.md — "Truncate large upstream error details
 * before storing or logging them."
 */

/** Max characters of upstream error detail kept for logging / error strings. */
export const MAX_PROVIDER_DETAIL_LENGTH = 300;

const TRUNCATION_SUFFIX = '… [truncated]';

/**
 * Fetches the response body as text (never throws) and truncates it to
 * {@link MAX_PROVIDER_DETAIL_LENGTH}. Returns an empty string when the body
 * cannot be read.
 */
export async function readTruncatedProviderDetail(
  response: Response,
  maxLength: number = MAX_PROVIDER_DETAIL_LENGTH,
): Promise<string> {
  const detail = await response.text().catch(() => '');
  if (detail.length <= maxLength) {
    return detail;
  }
  return `${detail.slice(0, maxLength)}${TRUNCATION_SUFFIX}`;
}
