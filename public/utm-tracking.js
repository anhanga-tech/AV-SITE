/**
 * UTM & GA4 Client ID Tracking Script for WhatsApp Buttons
 * Captures marketing parameters and GA4 Client ID, then appends them to WhatsApp links.
 * v2.2 - Added sessionStorage persistence and specialist CTA tracking
 */
(function () {
    const SESSION_STORAGE_KEY = 'anhanga_tracking_data';
    const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'];

    // Nada carrega o gtag.js real do Google desde a migração pro Zaraz (Stape/GTM
    // removidos) — gtag() aqui é só o stub que empurra pro dataLayer, então
    // gtag('get', ..., 'client_id', callback) nunca chama o callback de verdade.
    // Sem isso, visitantes sem cookie _ga legado (todo visitante novo daqui pra
    // frente) nunca teriam ga_client_id, quebrando a correlação de conversão no
    // GA4 (achado de review). getGACid agora gera e persiste seu próprio ID
    // quando não existe nenhum, em vez de depender de um script do Google que
    // não roda mais.
    function getGACid(callback) {
        callback(getCookieCid() || getOrCreateOwnCid());
    }

    function getCookieCid() {
        const m = document.cookie.match(/_ga=GA1\.\d+\.(\d+\.\d+)/);
        return m ? m[1] : null;
    }

    const OWN_CID_COOKIE = 'anhanga_ga_cid';

    function getOrCreateOwnCid() {
        const existing = document.cookie.match(new RegExp(OWN_CID_COOKIE + '=([^;]+)'));
        if (existing) return existing[1];

        const cid = Math.floor(Math.random() * 2147483647) + '.' + Math.floor(Date.now() / 1000);
        const expires = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = OWN_CID_COOKIE + '=' + cid + '; expires=' + expires + '; path=/; SameSite=Lax';
        return cid;
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
        // Opt-out explícito: CTAs marcados data-no-whatsapp-cta (ex.: os links tipo whatsapp de
        // /links, que mantêm href=wa.me só como fallback de progressive enhancement — o clique de
        // verdade abre o ContactModal via openContactModal(), não navega pro WhatsApp na hora).
        // Sem isso, whatsapp_cta_click contaria "abriu o formulário" como "chegou no WhatsApp",
        // inflando a métrica mesmo quando a pessoa fecha o modal ou falha a validação — o handoff
        // real já é rastreado depois do envio bem-sucedido em hooks/useContactForm.ts.
        if (target.closest('[data-no-whatsapp-cta]')) return;

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
        // Opt-out explícito: CTAs marcados data-no-specialist-cta (ex.: o link de
        // agendamento pago da consultoria, cujo texto "Agendar consultoria" casaria
        // no heurístico textual isSpecialistCtaText) não são pedidos de contato com
        // especialista da porta gratuita e não devem disparar specialist_cta_click.
        if (target.closest('[data-no-specialist-cta]')) return;

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
