/**
 * UTM & GA4 Client ID Tracking Script for WhatsApp Buttons
 * Captures marketing parameters and GA4 Client ID, then appends them to WhatsApp links.
 * v2.2 - Added sessionStorage persistence and specialist CTA tracking
 */
(function () {
    const GA4_MEASUREMENT_ID = 'G-QDBT5PM4KP';
    const SESSION_STORAGE_KEY = 'anhanga_tracking_data';
    const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'];

    // Captura o Client ID do GA4 de forma robusta
    function getGACid(callback) {
        let done = false;
        const finish = (cid) => { if (!done) { done = true; callback(cid); } };

        const timeout = setTimeout(() => finish(getCookieCid()), 2000);

        if (typeof gtag === 'function') {
            try {
                gtag('get', GA4_MEASUREMENT_ID, 'client_id', (cid) => {
                    clearTimeout(timeout);
                    finish(cid || getCookieCid());
                });
            } catch { clearTimeout(timeout); finish(getCookieCid()); }
        } else {
            clearTimeout(timeout);
            finish(getCookieCid());
        }
    }

    function getCookieCid() {
        const m = document.cookie.match(/_ga=GA1\.\d+\.(\d+\.\d+)/);
        return m ? m[1] : null;
    }

    function readStoredTracking() {
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    function persistTracking(tracking) {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tracking));
        } catch {}
    }

    function mergeUrlTracking(urlParams, tracking) {
        let foundInUrl = false;

        TRACKING_PARAMS.forEach((param) => {
            const value = urlParams.get(param);
            if (!value) return;

            tracking[param] = value;
            foundInUrl = true;
        });

        return foundInUrl;
    }

    function ensureFacebookClickTracking(tracking) {
        if (!tracking.fbclid || tracking.fbc) return;

        tracking.fbc = `fb.1.${Date.now()}.${tracking.fbclid}`;
        persistTracking(tracking);
    }

    function enrichTrackingWithCid(tracking) {
        getGACid((cid) => {
            if (!cid) return;

            tracking.cid = cid;
            persistTracking(tracking);
        });
    }

    function pushDataLayerEvent(payload) {
        if (typeof window === 'undefined' || !window.dataLayer) return;
        window.dataLayer.push(payload);
    }

    function getElementText(element, fallback) {
        if (!element) return fallback;
        return (element.innerText || element.textContent || '').trim() || fallback;
    }

    function getClosestClickable(target) {
        return target.closest('a, button, [role="button"]');
    }

    function getWhatsAppButton(target) {
        return target.closest('.btn-whatsapp, #btn-whatsapp, a[href*="wa.me"]');
    }

    function trackWhatsAppClick(target) {
        const whatsappButton = getWhatsAppButton(target);
        if (!whatsappButton) return;

        const buttonText = getElementText(whatsappButton, 'WhatsApp Button');
        const trackingId = whatsappButton.getAttribute('data-tracking') || whatsappButton.id || 'not_set';

        pushDataLayerEvent({
            event: 'whatsapp_cta_click',
            event_category: 'engagement',
            event_label: whatsappButton.getAttribute('href') || 'unknown_whatsapp_link',
            button_text: buttonText,
            cta_id: trackingId,
            page_location: window.location.href
        });
    }

    function getSpecialistSourceElement(target) {
        const specialistButton = target.closest('.btn-specialist, [data-specialist-cta], a[href*="#contato"], a[href*="#contact"]');
        return {
            specialistButton,
            clickable: getClosestClickable(target),
        };
    }

    function isSpecialistCtaText(text) {
        if (!text) return false;

        const normalizedText = text.toLowerCase();
        return normalizedText.includes('especialista')
            || normalizedText.includes('orçamento')
            || normalizedText.includes('consultoria');
    }

    function trackSpecialistClick(target) {
        const { specialistButton, clickable } = getSpecialistSourceElement(target);
        const sourceElement = specialistButton || clickable;
        const buttonText = specialistButton
            ? getElementText(specialistButton, '')
            : getElementText(clickable, '');

        if (!sourceElement || (!specialistButton && !isSpecialistCtaText(buttonText))) {
            return;
        }

        const trackingId = sourceElement.getAttribute('data-tracking') || sourceElement.id || 'not_set';
        pushDataLayerEvent({
            event: 'specialist_cta_click',
            event_category: 'engagement',
            event_label: buttonText || 'Specialist CTA',
            cta_id: trackingId,
            page_location: window.location.href
        });
    }

    function handleBodyClick(event) {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;

        trackWhatsAppClick(target);
        trackSpecialistClick(target);
    }

    function initWhatsAppTracking() {
        const urlParams = new URLSearchParams(window.location.search);
        const tracking = readStoredTracking();
        const foundInUrl = mergeUrlTracking(urlParams, tracking);

        if (foundInUrl) persistTracking(tracking);
        ensureFacebookClickTracking(tracking);
        enrichTrackingWithCid(tracking);
    }

    // --- EVENT DELEGATION LOGIC ---
    document.body.addEventListener('click', handleBodyClick, { capture: true });

    // Inicialização: espera a página carregar + delay para GA4
    const init = () => setTimeout(initWhatsAppTracking, 1500);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
