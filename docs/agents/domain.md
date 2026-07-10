# Domain docs

This is a **single-context** repository for the Anhangá Viagens website and its
Cloudflare-hosted API integrations.

## Read before exploring

- `PRODUCT.md` for users, product purpose, brand language, and strategic rules.
- `DESIGN.md` for the visual system and interaction constraints.
- `docs/standards/` for engineering, API, testing, and security conventions.
- `CONTEXT.md` at the repository root when it exists.
- Relevant decisions under `docs/adr/` when that directory exists.

Missing `CONTEXT.md` or ADRs are not setup failures. Continue using the existing
product, design, and engineering documents; domain-modeling workflows create
additional context or decisions only when real terminology or trade-offs need
to be recorded.

## Vocabulary and decisions

- Use the project's own terms in issue titles, acceptance criteria, tests, and
  implementation plans. Do not replace established funnel or CRM concepts with
  generic synonyms.
- If proposed work contradicts an ADR, surface that conflict explicitly rather
  than silently overriding the recorded decision.
- Product strategy follows `PRODUCT.md`; visual decisions follow `DESIGN.md`.
