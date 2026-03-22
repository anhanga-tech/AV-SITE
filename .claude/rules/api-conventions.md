# API Conventions Standard

## Purpose

Keep API handlers under `api/` consistent in structure, validation order, response shape, and provider integration boundaries.

## Applies To

- Files under `api/`
- Shared request and response helpers under `lib/`
- Validation logic used by handlers
- Provider integration code called by handlers

## REQUIRED

- Validate method and request shape before business logic or outbound calls.
- Validate and normalize untrusted input before any side effect such as HubSpot writes, AI calls, list updates, note creation, or conversion tracking.
- Reuse shared helpers for cross-cutting concerns when they already exist:
  - `lib/network.ts` for CORS and client IP extraction
  - `lib/rate-limit.ts` for abuse control
  - shared validation and normalization helpers in `lib/`
- Return JSON responses with explicit HTTP status codes and `Content-Type: application/json`.
- Provide stable machine-readable error codes for expected failure paths such as validation failures, rate limits, provider auth issues, and upstream errors.
- Include or propagate a request ID for write flows or multi-step provider orchestration so logs and client errors can be correlated safely.
- Keep environment-variable access near configuration or setup boundaries. Do not scatter `process.env` reads across unrelated execution branches.
- Separate concerns clearly:
  - handler orchestration in `api/`
  - validation and normalization in `lib/`
  - provider-specific transport in `services/` or focused helper modules
- Verify signatures or equivalent trust checks before processing webhook payloads.
- Add rate limiting to abuse-prone endpoints, especially chat generation and lead-creation flows.
- Return sanitized client-facing error messages. Do not expose raw upstream responses directly.

## RECOMMENDED

- Keep the handler flow readable in a stable order:
  - method gate
  - CORS preflight
  - configuration check
  - request parsing
  - validation and normalization
  - rate limiting
  - provider orchestration
  - structured response
- Build small local response helpers when a handler has multiple success or failure shapes.
- Use explicit status groupings:
  - `4xx` for client input, auth, or rate-limit problems
  - `5xx` for configuration or upstream failures
- Keep logs structured and stage-based so failures can be traced without dumping raw payloads.
- Truncate large upstream error details before storing or logging them.
- Favor explicit response objects over implicit fall-through behavior.

## AVOID

- Monolithic handlers that parse, validate, fetch, and format responses inline without helper boundaries.
- Mutating external systems before validation and configuration checks are complete.
- Returning HTML, raw stack traces, or provider-native error blobs to the client.
- Re-implementing CORS, rate limiting, request ID generation, or provider fetch wrappers in multiple handlers.
- Treating `process.env` presence as guaranteed without a guarded config step.

## Examples

- `api/submit-lead.ts` shows a strong pattern for structured responses, request IDs, rate limiting, and staged provider orchestration.
- `api/generate.ts` shows a readable split between input parsing, rate limiting, model response handling, and client-safe error mapping.
- `api/hubspot-webhook.ts` shows why trust checks must happen before business processing.
- `lib/network.ts` is the preferred place for shared CORS and IP extraction instead of duplicating header logic in handlers.

## Exceptions

- Library-owned handlers such as the Keystatic generic route may require framework-specific wiring that does not fully match custom handler structure. Keep the surrounding security and validation posture as close to the standard as the library allows.
- A trivial read-only endpoint may use a smaller helper surface, but it must still return structured JSON and validate its inputs.
