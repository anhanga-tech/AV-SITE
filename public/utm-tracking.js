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

        // 2. Buscar CID e atualizar links
        getGACid((cid) => {
            if (cid) tracking.cid = cid;

            const dataArr = Object.entries(tracking);
            if (dataArr.length === 0) return;

            const dataSuffix = ' || Dados: ' + dataArr.map(([k, v]) => k + '=' + v).join(', ');

            // Seleciona todos os botões de WhatsApp
            const allButtons = document.querySelectorAll('.btn-whatsapp, #btn-whatsapp, a[href*="wa.me"]');

            allButtons.forEach(btn => {
                const href = btn.getAttribute('href');
                if (!href || !href.includes('wa.me')) return;

                // Evita duplicação
                if (href.includes('Dados:') || href.includes('%7C%7C')) return;

                // Extrai o texto atual manualmente (mais robusto que URL API em mobile)
                const textMatch = href.match(/[?&]text=([^&]*)/);
                let currentText = textMatch ? decodeURIComponent(textMatch[1]) : '';

                // Limpa sufixos antigos se existirem
                currentText = currentText.split(' || Dados:')[0].split(' [ref:')[0];

                // Monta a nova mensagem
                const newText = currentText + dataSuffix;
                const encodedText = encodeURIComponent(newText);

                // Reconstrói o href de forma simples
                let newHref;
                if (textMatch) {
                    // Substitui o text existente
                    newHref = href.replace(/([?&]text=)[^&]*/, '$1' + encodedText);
                } else {
                    // Adiciona o parâmetro text
                    const separator = href.includes('?') ? '&' : '?';
                    newHref = href + separator + 'text=' + encodedText;
                }

                btn.setAttribute('href', newHref);
            });
        });
    }

    // --- EVENT DELEGATION LOGIC ---
    document.body.addEventListener('click', (event) => {
        const target = event.target;

        // 1. WhatsApp Button Tracking
        const whatsappButton = target.closest('.btn-whatsapp, #btn-whatsapp, a[href*="wa.me"]');
        if (whatsappButton) {
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    event: 'whatsapp_cta_click',
                    event_category: 'engagement',
                    event_label: whatsappButton.getAttribute('href') || 'unknown_whatsapp_link',
                    button_text: whatsappButton.innerText.trim() || 'WhatsApp Button',
                    page_location: window.location.href
                });
            }
        }

        // 2. Specialist CTA Tracking ("Falar com especialista")
        const specialistButton = target.closest('.btn-specialist, [data-specialist-cta], a[href*="#contato"]');

        // Check text content safely
        const buttonText = target.innerText || target.textContent || "";
        const isSpecialistText = buttonText.toLowerCase().includes('especialista') ||
                                buttonText.toLowerCase().includes('orçamento');

        if (specialistButton || isSpecialistText) {
            // Se for um link de WhatsApp, o tracker acima já cuida disso.
            // Só disparamos este se não for um link de WhatsApp para evitar duplicidade.
            if (!whatsappButton) {
                if (typeof window !== 'undefined' && window.dataLayer) {
                    window.dataLayer.push({
                        event: 'specialist_cta_click',
                        event_category: 'engagement',
                        event_label: buttonText.trim(),
                        page_location: window.location.href
                    });
                }
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
