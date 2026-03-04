# 🛡️ Sentinel Journal - 2024-03-04

## Security: Sanitized Navigation and Lead Attribution

### Finding
During the navigation update, verified that lead attribution parameters (UTMs, GCLID) are correctly persisted across internal links when using React Router `<Link>`.

### Resolution
Ensured that custom landing page Navbars use `<Link to="/">` which preserves state/session context, and validated that manual breadcrumb links don't leak internal routing logic or bypass global tracking scripts (public/utm-tracking.js).

### Pattern Discovery
Standardized the use of `<Link>` for all internal routes to maintain session continuity, which is critical for the AI Chatbot's lead qualification flow that relies on persisted context.
