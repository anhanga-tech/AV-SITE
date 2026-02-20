## 2025-05-22 - Skip to Content & ARIA Label Polish
**Learning:** Skip to Content links must use `fixed` positioning and a high `z-index` in layouts with sticky headers to remain visible when focused. ARIA labels on icon-only buttons (like guest counters or map controls) are critical for screen reader users to navigate complex interactive widgets.
**Action:** Always implement `fixed` skip links for sticky navs and ensure `aria-live` is used for dynamic count displays.

## 2025-05-22 - PR Hygiene and Verification Artifacts
**Learning:** Including binary screenshots or redundant verification scripts in a Pull Request can be seen as repository pollution and may lead to rejection during code review.
**Action:** Clean up all temporary scripts, logs, and screenshots before submitting a PR. Stick to the codebase's established testing and verification patterns.
