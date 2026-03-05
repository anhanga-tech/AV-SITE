# 🛡️ Sentinel Journal - 2024-03-04

## Security: Sanitized Navigation and Lead Attribution

### Finding
During the navigation update, verified that lead attribution parameters (UTMs, GCLID) are correctly persisted across internal links when using React Router `<Link>`.

### Resolution
Ensured that custom landing page Navbars use `<Link to="/">` which preserves state/session context, and validated that manual breadcrumb links don't leak internal routing logic or bypass global tracking scripts (public/utm-tracking.js).

### Pattern Discovery
Standardized the use of `<Link>` for all internal routes to maintain session continuity, which is critical for the AI Chatbot's lead qualification flow that relies on persisted context.

# 🛡️ Sentinel Journal - 2026-03-03

## Security: Regional Safety Blocklist Hardening

### Finding
Implemented a comprehensive regional blocklist for Middle Eastern countries to mitigate risks associated with escalating conflicts.

### Resolution
Centralized destination safety rules in `utils/constants.ts` and integrated them into both the programmatic validation layer (`detectBlockedDestination`) and the AI system prompt. This dual-layer approach ensures that even if the AI attempts to bypass instructions, the validation logic will intercept and enforce the safety policy.

### Pattern Discovery
Established a "Centralized Safety Constants" pattern. By decoupling the list of high-risk destinations from the core logic, we enable faster response times to geopolitical changes without deep code refactoring.
