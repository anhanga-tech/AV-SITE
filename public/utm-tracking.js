/**
 * UTM & GA4 Client ID Tracking Script for WhatsApp Buttons
 * Captures marketing parameters and GA4 Client ID, then appends them to WhatsApp links.
 * v2.2 - Added sessionStorage persistence and specialist CTA tracking
 */
(function () {
    const GA4_MEASUREMENT_ID = 'G-QDBT5PM4KP';
    const SESSION_STORAGE_KEY = 'anhanga_tracking_data';

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

    function initWhatsAppTracking() {
        // 1. Capturar Parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid'];

        // Tenta recuperar de sessionStorage primeiro para manter persistência em navegação interna
        let tracking = {};
        try {
            const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) tracking = JSON.parse(stored);
        } catch (e) {}

        // Sobrescreve com novos parâmetros da URL se existirem
        let foundInUrl = false;
        params.forEach(p => {
            const v = urlParams.get(p);
            if (v) {
                tracking[p] = v;
                foundInUrl = true;
            }
        });

        // Salva de volta no sessionStorage se encontrou algo novo
        if (foundInUrl) {
            try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tracking));
            } catch (e) {}
        }

        // 2. Buscar CID e salvar no tracking
        getGACid((cid) => {
            if (cid) {
                tracking.cid = cid;
                try {
                    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(tracking));
                } catch (e) {}
            }
        });
    }

    // --- EVENT DELEGATION LOGIC ---
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // 1. WhatsApp Button Tracking
        const whatsappButton = target.closest('.btn-whatsapp, #btn-whatsapp, a[href*="wa.me"]');
        if (whatsappButton) {
            // Extrair o texto do botão de forma robusta
            const buttonText = (whatsappButton.innerText || whatsappButton.textContent || "").trim() || 'WhatsApp Button';

            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    event: 'whatsapp_cta_click',
                    event_category: 'engagement',
                    event_label: whatsappButton.getAttribute('href') || 'unknown_whatsapp_link',
                    button_text: buttonText,
                    page_location: window.location.href
                });
            }
        }

        // 2. Specialist CTA Tracking ("Falar com especialista")
        const specialistButton = target.closest('.btn-specialist, [data-specialist-cta], a[href*="#contato"]');
        const clickable = target.closest('a, button, [role="button"]');

        // Extrair texto do botão ou do elemento clicado (limitado a elementos clicáveis para evitar falsos positivos)
        let fullButtonText = "";
        if (specialistButton) {
            fullButtonText = (specialistButton.innerText || specialistButton.textContent || "").trim();
        } else if (clickable) {
            fullButtonText = (clickable.innerText || clickable.textContent || "").trim();
        }

        const isSpecialistText = fullButtonText && (
                                fullButtonText.toLowerCase().includes('especialista') ||
                                fullButtonText.toLowerCase().includes('orçamento') ||
                                fullButtonText.toLowerCase().includes('consultoria'));

        if (specialistButton || isSpecialistText) {
            // Disparamos specialist_cta_click mesmo se for um link de WhatsApp
            // para garantir que todas as consultas com especialistas sejam rastreadas separadamente.
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    event: 'specialist_cta_click',
                    event_category: 'engagement',
                    event_label: fullButtonText || 'Specialist CTA',
                    page_location: window.location.href
                });
            }
        }
    }, { capture: true });

    // 3. HubSpot Form Tracking
    window.addEventListener("message", function(event) {
        if(event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmitted') {
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    'event': 'form_submission',
                    'form_type': 'hubspot',
                    'form_id': event.data.id,
                    'page_location': window.location.href
                });
            }
        }
    });

    // Inicialização: espera a página carregar + delay para GA4
    const init = () => setTimeout(initWhatsAppTracking, 1500);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
