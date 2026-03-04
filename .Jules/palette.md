## 2025-05-22 - Skip to Content & ARIA Label Polish
**Learning:** Skip to Content links must use `fixed` positioning and a high `z-index` in layouts with sticky headers to remain visible when focused. ARIA labels on icon-only buttons (like guest counters or map controls) are critical for screen reader users to navigate complex interactive widgets.
**Action:** Always implement `fixed` skip links for sticky navs and ensure `aria-live` is used for dynamic count displays.

## 2025-05-22 - PR Hygiene and Verification Artifacts
**Learning:** Including binary screenshots or redundant verification scripts in a Pull Request can be seen as repository pollution and may lead to rejection during code review.
**Action:** Clean up all temporary scripts, logs, and screenshots before submitting a PR. Stick to the codebase's established testing and verification patterns.

## 2026-02-25 - Semantic Search Bar Triggers
**Learning:** Using generic `div` elements for complex search triggers (Dates, Guests, etc.) breaks keyboard navigation and hides interactive state from screen readers. Wrapping search widgets in a semantic `<form>` and using `<button>` with `aria-haspopup` allows users to interact with the search functionality using only the keyboard.
**Action:** Audit complex UI widgets for non-semantic interactive elements and replace them with buttons/inputs while ensuring nested buttons have `type="button"` to avoid unintended form submissions.

## 2026-02-25 - ARIA Combobox for Custom Selects
**Learning:** Custom search dropdowns that don't use native `<select>` must implement the `combobox` / `listbox` pattern to be accessible. Providing visual feedback via `group-focus-within` ensures that keyboard users (tabbing) receive the same "active" cues as mouse users (hovering).
**Action:** Use `role="combobox"` on the trigger and `role="listbox"` on the dropdown container. Always implement an `Escape` key listener to allow users to quickly dismiss transient search panels.
