import type { Page } from '@playwright/test';

declare global {
  interface Window {
    /** URLs actually navigated to via the reserved tab's `location.href`. */
    __whatsappUrls?: string[];
    /** Number of times the reserved tab was closed without navigating. */
    __whatsappWindowClosed?: number;
  }
}

/**
 * Stubs `window.open` to mimic the synchronous placeholder-tab handoff in
 * utils/whatsappHandoff.ts: the app now calls `window.open('', '_blank')`
 * immediately on click (before the CRM request resolves) to reserve a tab,
 * then either navigates it via `location.href` on success or closes it via
 * `.close()` on failure. Tracking the raw `window.open()` call is no longer a
 * useful signal of "did WhatsApp open" — it now fires on every attempt,
 * success or failure. `window.__whatsappUrls` records only real navigations;
 * `window.__whatsappWindowClosed` records cancellations.
 *
 * Pass `blocked: true` to simulate a browser that blocks the popup outright
 * (`window.open` returns `null`), exercising the same fallback-link path.
 */
export async function stubWhatsAppWindow(page: Page, options: { blocked?: boolean } = {}): Promise<void> {
  await page.addInitScript((blocked: boolean) => {
    window.__whatsappUrls = [];
    window.__whatsappWindowClosed = 0;

    Object.defineProperty(window, 'open', {
      configurable: true,
      value: () => {
        if (blocked) return null;

        let closed = false;
        return {
          get closed() {
            return closed;
          },
          close() {
            closed = true;
            window.__whatsappWindowClosed = (window.__whatsappWindowClosed ?? 0) + 1;
          },
          location: {
            set href(url: string) {
              window.__whatsappUrls?.push(url);
            },
          },
          opener: null,
        };
      },
    });
  }, options.blocked ?? false);
}
