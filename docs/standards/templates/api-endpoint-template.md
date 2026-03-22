# API Endpoint Template

Use this template for new endpoints and major changes to existing handlers.

## Endpoint Summary

- Route:
- Method:
- Runtime:
- Owner flow:
- Why this endpoint exists:

## Request Contract

- Headers:
- Query params:
- Body shape:
- Authentication or trust requirement:

## Validation and Normalization

- Boundary validation:
- Sanitization rules:
- Defaults and fallbacks:
- Invalid request behavior:

## Side Effects and Dependencies

- External providers called:
- Internal helpers used:
- Order of side effects:
- Idempotency or retry concerns:

## Response Contract

- Success status:
- Success body shape:
- Expected client error codes:
- Expected server or upstream error codes:
- Request ID policy:

## Abuse and Security Controls

- Rate limit:
- Signature verification:
- Secret usage:
- PII handling:
- Logging policy:

## Testing Plan

- `node:test` coverage:
- Playwright coverage:
- Mocking strategy:
- Verification commands:

## Observability

- Structured logs:
- Key stages or markers:
- Truncation or masking rules:

## Exceptions

- Rule:
- Reason:
- Scope:
- Follow-up:
