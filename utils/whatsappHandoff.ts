export interface WhatsAppHandoff {
    /**
     * Navigates the reserved tab to `url`. Returns false when the tab was
     * never opened (blocked) or can no longer be navigated (closed), so the
     * caller can fall back to showing `url` as a link instead.
     */
    open(url: string): boolean;
    /**
     * Closes the reserved tab without navigating it. Call this when the
     * pending request the handoff was waiting on fails, so a blank tab isn't
     * left behind.
     */
    cancel(): void;
}

const NOOP_HANDOFF: WhatsAppHandoff = {
    open: () => false,
    cancel: () => {},
};

/**
 * Reserves a blank browser tab synchronously — call this from inside a click
 * handler, before any `await`, so the tab still counts as a direct result of
 * user activation. Safari revokes that activation as soon as the call stack
 * returns to the event loop, so a `window.open()` issued *after* an `await`
 * (e.g. once a network request resolves) gets silently blocked there. This
 * mirrors the "Safari-safe" native-navigation intent already used for
 * WhatsApp CTAs elsewhere (see components/landings/lollapalooza/Button.tsx),
 * adapted for a flow that must wait on a CRM write before it knows the final
 * URL. Call `.open(url)` once the pending request resolves to navigate the
 * reserved tab, or `.cancel()` to close it if the request failed.
 */
export function reserveWhatsAppWindow(): WhatsAppHandoff {
    if (typeof window === 'undefined') return NOOP_HANDOFF;

    let handle: Window | null;
    try {
        handle = window.open('', '_blank');
    } catch {
        handle = null;
    }

    if (!handle) return NOOP_HANDOFF;

    try {
        // Sever the opener relationship the same way passing 'noopener' to a
        // direct window.open(url, ..., 'noopener') call would.
        handle.opener = null;
    } catch {
        // A browser that rejects this assignment gives no way to confirm the
        // isolation `noopener` would have provided — navigating the tab
        // anyway would let the WhatsApp page (or a redirect in its chain)
        // keep a `window.opener` reference back to this site. Don't hand off
        // through a tab that can't be isolated; the caller falls back to
        // rendering the URL as a plain link instead.
        try {
            handle.close();
        } catch {
            // ignore
        }
        return NOOP_HANDOFF;
    }

    return {
        open(url: string): boolean {
            if (!handle || handle.closed) return false;
            try {
                handle.location.href = url;
                return true;
            } catch {
                // The tab can't be navigated — close it instead of leaving
                // it orphaned as a blank tab; the caller falls back to
                // rendering `url` as a plain link.
                try {
                    handle.close();
                } catch {
                    // ignore
                }
                return false;
            }
        },
        cancel(): void {
            try {
                handle?.close();
            } catch {
                // ignore
            }
        },
    };
}
