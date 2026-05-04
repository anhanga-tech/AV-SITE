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
