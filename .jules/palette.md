## 2025-05-15 - Improving Form Accessibility and Focus States
**Learning:** Placeholders are frequently used as the sole means of labeling inputs in this codebase, which is an accessibility anti-pattern as screen readers may not consistently read them, and they disappear once the user starts typing. Additionally, `focus:outline-none` was found on interactive elements without a fallback focus indicator.
**Action:** Always provide semantic labels (using `sr-only` classes if the design must remain minimal) and ensure every interactive element has a clear `focus-visible` ring or equivalent indicator to support keyboard navigation.

## 2025-05-15 - Enhancing Interactive Delight with Haptics and Focus States
**Learning:** For accordion components like FAQs, combining visible `focus-visible` rings with lightweight haptic feedback on mobile (`triggerHaptic('light')`) creates a more responsive and tactile feel that balances accessibility with "delight." Using `focus-visible:ring-inset` is particularly useful for container-constrained elements (like those with `overflow-hidden`) to prevent the focus ring from being clipped.
**Action:** Integrate `triggerHaptic` for low-latency feedback on critical UI interactions and use `ring-inset` for focus indicators within clipped containers.
