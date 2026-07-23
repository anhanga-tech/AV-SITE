## 2025-05-15 - Improving Form Accessibility and Focus States
**Learning:** Placeholders are frequently used as the sole means of labeling inputs in this codebase, which is an accessibility anti-pattern as screen readers may not consistently read them, and they disappear once the user starts typing. Additionally, `focus:outline-none` was found on interactive elements without a fallback focus indicator.
**Action:** Always provide semantic labels (using `sr-only` classes if the design must remain minimal) and ensure every interactive element has a clear `focus-visible` ring or equivalent indicator to support keyboard navigation.

## 2025-05-15 - Improving Accessibility with Inset Focus Rings
**Learning:** For accordion components like FAQs that use `overflow-hidden` to animate content, standard focus rings can be clipped by the container boundaries. Using `focus-visible:ring-inset` ensures the focus indicator remains fully visible within the element's border, maintaining accessibility for keyboard users without requiring changes to the container's layout or overflow properties.
**Action:** Use `ring-inset` for focus indicators on interactive elements nested within clipped or overflow-hidden containers.

## 2025-05-15 - Enhancing Form Control Interactions and State Feedback
**Learning:** Interactive form elements like guest counters and destination inputs benefit significantly from explicit state constraints and quick-reset actions. Disabling invalid decrement actions (e.g., <1 adult) prevents user error before it occurs, while a dedicated "Clear" button for text inputs reduces the interaction cost for corrections. Furthermore, a transient "loading" state on the primary CTA provides immediate feedback for background processes, preventing duplicate submissions and confirming user intent.
**Action:** Always implement boundary constraints for numeric inputs, provide clear reset options for searchable fields, and ensure CTAs reflect their processing state during asynchronous operations.

## 2025-05-15 - Synchronized Haptics and Accessible Destination Cards
**Learning:** Micro-interactions like haptic feedback ('light' for toggles/counters, 'medium' for copy actions) significantly increase the "physical" feel of the interface on mobile. For card-based layouts that trigger modals, adding semantic role="button" and keyboard listeners (Enter/Space) ensures that keyboard and screen-reader users can access the same rich content as mouse users. Using dynamic imports for the haptics utility keeps the bundle lean for non-mobile or low-interaction sessions.
**Action:** Use haptic feedback to confirm discrete UI actions and always ensure custom interactive elements (like cards) are reachable and activatable via keyboard.

## 2026-04-22 - Managing Floating UI Component Collisions
**Learning:** In applications with multiple persistent floating widgets (like AI Chat drawers and Back-to-Top buttons), simple absolute positioning can lead to "UI Stacking" where elements overlap, rendering one or both inaccessible. Coordinating responsive offsets (e.g., using `bottom-32` on one element when another is present at `bottom-8`) is necessary to maintain a clear visual hierarchy and usability across screen sizes.
**Action:** When adding new floating elements, audit existing sticky/fixed components and implement conditional or responsive spacing to prevent overlap, especially on mobile where screen real estate is limited.

## 2026-04-29 - Transitioning from Blocking Alerts to State-Driven Feedback
**Learning:** Browser native `alert()` calls are disruptive and break the user's immersion. Replacing them with state-driven inline error messages, combined with 'medium' haptic feedback, provides a more modern and integrated experience. Using `role="alert"` ensures accessibility, while tactile feedback on both failure and success paths reinforces the user's actions.
**Action:** Avoid native `alert()` for validation; use integrated UI components with animations for error feedback and leverage haptics to provide a "physical" feel to interactions.

## 2026-05-13 - Implementing Accessible Search Comboboxes
**Learning:** Search inputs with dynamic suggestions often lack essential keyboard navigation (ArrowUp/Down) and aria-activedescendant mapping, making them difficult for screen reader and keyboard-only users. Additionally, "Clear" actions on inputs should always programmatically return focus to the field to maintain context and allow immediate correction or new search.
**Action:** Implement the WAI-ARIA combobox pattern (aria-activedescendant, aria-selected, role="option") for all autocomplete components. Ensure keyboard event listeners manage focus and selection, and always restore focus after destructive input resets.

## 2026-06-15 - Robust Modal/Drawer Accessibility and Visibility
**Learning:** Managing modal visibility using only CSS transforms (e.g., `translate-x-full`) is insufficient for accessibility and automated testing. Even if off-screen, elements may remain "visible" to screen readers and tools like Playwright, leading to focus management issues or test false positives. Additionally, drawers must follow the WAI-ARIA dialog pattern: trapping focus, handling the 'Escape' key, and restoring focus to the trigger element upon closing.
**Action:** Use conditional `invisible` or `hidden` classes combined with `transition-all` and `opacity` to ensure closed drawers are correctly removed from the accessibility tree *after* their exit animation completes. Always implement a manual focus trap and focus restoration for custom dialog components to support keyboard-only users.

## 2026-07-22 - text-zinc-300 Fails Contrast When Used as Meaningful Text on White
**Learning:** `text-zinc-300` (#d4d4d8 on white, ~1.5:1) is used repo-wide, including as the "unselected/placeholder" state for real CTA copy (e.g. the homepage hero search widget's "Definir datas" / "Lazer, Lua de Mel..." / "Definir padrão" labels) — failing WCAG AA even at large/bold sizes. It's fine for genuinely decorative use (disabled calendar days, divider dots) but not for text a user is meant to read and act on. `text-zinc-500` (~4.8:1 on white) is the existing token already used for labels elsewhere (e.g. `FormField.tsx`) and preserves the same "lighter than selected state" visual hierarchy.
**Action:** Before reusing `text-zinc-300`/`text-zinc-400` for un-selected-but-readable states on a white/light background, check contrast — prefer `text-zinc-500` as the floor for text carrying meaning, reserving lighter tones for purely decorative or disabled elements.

## 2026-05-27 - Restoring Focus Visibility and Platform-Specific Branding
**Learning:** The widespread use of `focus:outline-none` without `focus-visible` fallbacks is a critical accessibility barrier for keyboard users. Restoring visibility using brand-aligned colors (like `brand-cyan` for general links or platform-specific colors like `#25D366` for WhatsApp) maintains the design aesthetic while significantly improving WCAG compliance. For complex card layouts (like Polaroids), using a semantic `Link` container with a larger ring ensures the focus indicator follows the component's geometry without clipping.
**Action:** Audit and replace `focus:outline-none` with `focus-visible:ring-4 focus-visible:ring-brand-cyan` (or context-specific colors). Ensure the focusable element is the container or a properly styled semantic element to provide clear visual feedback.
