import React from 'react';
import { useGAClientId } from './hooks/useGAClientId';
import { getWhatsAppLink } from '../../../utils/whatsapp';
import { WHATSAPP_MESSAGE } from './constants';

/**
 * Componente otimizado para mobile que evita bloqueio de pop-up.
 * 
 * IMPORTANTE: Em dispositivos móveis, navegadores bloqueiam window.open()
 * se não for executado DIRETAMENTE em resposta a uma ação do usuário.
 * 
 * Estratégias implementadas:
 * 1. Usar <a href> ao invés de window.open() quando possível
 * 2. Atualizar o href dinamicamente conforme o Client ID é capturado
 * 3. Para botões, usar window.location.href ao invés de window.open()
 */

/**
 * OPÇÃO 1: Link Direto (O PADRÃO OURO PARA iOS)
 * O href é atualizado automaticamente conforme os dados chegam.
 * O clique é uma navegação 100% nativa, impossível de ser bloqueada.
 */
export function WhatsAppCTALinkMobile() {
    const gaClientId = useGAClientId();

    // O link é calculado em cada renderização
    // Como getWhatsAppLink é síncrona, o link sempre estará pronto antes do clique
    const whatsappUrl = getWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            id="btn-whatsapp"
            data-whatsapp-location="mobile_link_component"
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#25D366',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                textAlign: 'center'
            }}
        >
            💬 Falar no WhatsApp
        </a>
    );
}

/**
 * OPÇÃO 2: Botão Baseado em ID (Exact match com a sua solicitação)
 * Atualiza o HREF por ID se necessário
 */
export function WhatsAppCTAById() {
    const gaClientId = useGAClientId();
    const whatsappUrl = getWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    return (
        <a
            id="btn-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            data-whatsapp-location="mobile_id_component"
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#25D366',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
            }}
        >
            💬 Falar com Especialista
        </a>
    );
}

/**
 * OPÇÃO 3: Visual Loading (O MELHOR DOS DOIS MUNDOS)
 * Fornece feedback visual ("Carregando...") sem impedir a navegação nativa.
 * NÃO usa e.preventDefault(), garantindo que o Safari confie no clique.
 */
export function WhatsAppCTAVisualLoading() {
    const [isLoading, setIsLoading] = React.useState(false);
    const gaClientId = useGAClientId();
    const whatsappUrl = getWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    const handleClick = () => {
        // Ativamos o loading apenas como feedback visual instantâneo
        setIsLoading(true);

        // Resetamos o estado após 3 segundos (tempo suficiente para o app abrir)
        // Isso garante que se o usuário voltar, o botão esteja normal
        setTimeout(() => setIsLoading(false), 3000);
    };

    return (
        <a
            href={whatsappUrl}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-whatsapp ${isLoading ? 'is-loading' : ''}`}
            data-whatsapp-location="mobile_visual_loading_component"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 28px',
                backgroundColor: '#25D366',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                minWidth: '220px',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.8 : 1
            }}
        >
            {isLoading ? (
                <>
                    <span className="spinner" style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></span>
                    Abrindo WhatsApp...
                </>
            ) : (
                <>💬 Falar com Especialista</>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </a>
    );
}

/**
 * POR QUE ISSO FUNCIONA NO iOS?
 * No Safari, qualquer window.open() ou redirecionamento via JS é bloqueado 
 * se houver uma operação assíncrona (como setTimeout ou Promise) entre 
 * o clique e a ação.
 * 
 * Nesta implementação:
 * 1. O HREF é definido estaticamente: O navegador sabe o destino imediatamente.
 * 2. Sem preventDefault: O clique触发 a navegação nativa do sistema.
 * 3. Feedback Paralelo: O React atualiza o visual (loading) enquanto o 
 *    sistema operacional abre o app do WhatsApp.
 * 
 * Resultado: Zero bloqueios e UX fluida.
 */
