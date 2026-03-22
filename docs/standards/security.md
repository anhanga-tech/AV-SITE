# Security Standard

## Purpose

Reduce avoidable security risk in a site that handles AI chat, lead capture, webhook traffic, conversion tracking, and third-party provider integrations.

## Applies To

- API handlers under `api/`
- Shared validation and normalization code
- Browser code that sends user input or tracking data
- Pages or components that render HTML strings
- Provider integrations with Gemini, HubSpot, Meta, GA, Redis, or similar services

## REQUIRED

- Treat all external input as untrusted:
  - request bodies
  - query parameters
  - headers
  - webhook payloads
  - model output
  - CMS or content-derived HTML
- Validate and sanitize input at the boundary before it reaches business logic or provider APIs.
- Keep secrets in environment variables only. Never hard-code tokens, secrets, webhook keys, or production identifiers in source files.
- Do not log raw secrets, tokens, webhook signatures, or full PII. Mask emails and truncate provider error details where needed.
- Verify webhook authenticity before processing payloads or triggering downstream side effects.
- Apply rate limiting to endpoints exposed to user traffic or abuse-prone automation.
- Sanitize or constrain AI output before turning it into links, actions, or provider payloads. Prefer structured handoff objects over free-form link text.
- Use `dangerouslySetInnerHTML` only for content that is static, sanitized, or otherwise tightly controlled. The source must be documented in code comments when the safety is not obvious.
- Send only the minimum necessary user data to external analytics or CRM providers.
- Add or update regression coverage for security-sensitive fixes such as XSS handling, unsafe link stripping, signature validation, and abuse controls.

## RECOMMENDED

- Reuse existing sanitization helpers such as `cleanString` and existing validation modules before introducing new ad hoc filters.
- Keep trust boundaries obvious:
  - validation in `lib/`
  - transport in `services/`
  - orchestration in `api/`
- Prefer allowlists and structured payloads over free-form text parsing when building outbound requests.
- Keep timeout behavior explicit for external calls so upstream stalls do not create hung user flows.
- Store only the minimum lead and tracking data needed for the current flow.
- Review whether logs are still needed after debugging and remove high-noise diagnostic output before merging.

## AVOID

- Passing unsanitized user input, model text, or HTML straight into DOM rendering, CRM properties, tracking payloads, or outbound messages.
- Returning raw upstream error text to browsers.
- Trusting client-provided identifiers, click IDs, or tracking payloads without normalization.
- Adding new persistent client-side storage for sensitive data when session-scoped or server-side handling is sufficient.
- Copying provider tokens into fixtures, screenshots, docs, or test snapshots.

## Examples

- `lib/lead-logic.ts` is the model for boundary sanitization and safe normalization of lead-related inputs.
- `lib/hubspot-validation.ts` is the model for webhook signature verification before processing.
- `api/generate.ts` shows why model output must be normalized and filtered before handoff behavior is exposed to users.
- `tests/e2e/destructive.spec.ts` and `tests/hubspot-validation.test.ts` are the kinds of regression tests expected for security-sensitive behavior.
- Static legal content that uses controlled HTML in `pages/Privacy.tsx` or `pages/Terms.tsx` is acceptable only because the content is repo-managed rather than user supplied.

## Exceptions

- Repo-managed legal or brand copy may use tightly controlled HTML when the content is static and reviewed, but the source must remain non-user-editable at runtime.
- Temporary debug logging during incident response may be added briefly, but it must still avoid secrets and raw PII and must be removed before finalizing the change.
