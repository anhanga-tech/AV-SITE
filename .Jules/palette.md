## 2025-05-15 - Improving Form Accessibility and Focus States
**Learning:** Placeholders are frequently used as the sole means of labeling inputs in this codebase, which is an accessibility anti-pattern as screen readers may not consistently read them, and they disappear once the user starts typing. Additionally, `focus:outline-none` was found on interactive elements without a fallback focus indicator.
**Action:** Always provide semantic labels (using `sr-only` classes if the design must remain minimal) and ensure every interactive element has a clear `focus-visible` ring or equivalent indicator to support keyboard navigation.

## 2025-05-15 - Improving Accessibility with Inset Focus Rings
**Learning:** For accordion components like FAQs that use `overflow-hidden` to animate content, standard focus rings can be clipped by the container boundaries. Using `focus-visible:ring-inset` ensures the focus indicator remains fully visible within the element's border, maintaining accessibility for keyboard users without requiring changes to the container's layout or overflow properties.
**Action:** Use `ring-inset` for focus indicators on interactive elements nested within clipped or overflow-hidden containers.
