import React from 'react';
import { useGAClientId } from './hooks/useGAClientId';
import { getWhatsAppLink } from './utils/whatsapp';

/**
 * Exemplo de componente de botão CTA para WhatsApp
 * que utiliza o hook useGAClientId para capturar o Client ID do GA4
 */
export function WhatsAppCTAButton({ dataWhatsappLocation = "example_button_component" }: { dataWhatsappLocation?: string }) {
    // Hook captura o Client ID do GA4 automaticamente com retry
    const gaClientId = useGAClientId();

    const handleClick = () => {
        // getWhatsAppLink já captura o Client ID automaticamente
        // e o combina com os parâmetros UTM e GCLID existentes
        const whatsappUrl = getWhatsAppLink();

        // Abre o link do WhatsApp em uma nova aba
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className="cta-button"
                disabled={!gaClientId} // Opcional: desabilita até capturar o Client ID
                data-whatsapp-location={dataWhatsappLocation}
            >
                Falar no WhatsApp
            </button>

            {/* Indicador de status (opcional - apenas para debug) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                    {gaClientId ? (
                        <span>✅ Client ID capturado: {gaClientId}</span>
                    ) : (
                        <span>⏳ Aguardando Client ID do GA4...</span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Exemplo alternativo: Usando link direto <a> ao invés de botão
 */
export function WhatsAppCTALink() {
    const gaClientId = useGAClientId();
    const whatsappUrl = getWhatsAppLink();

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-link"
            data-whatsapp-location="example_link_component"
        >
            Falar no WhatsApp
            {process.env.NODE_ENV === 'development' && gaClientId && (
                <span style={{ fontSize: '10px', marginLeft: '8px' }}>
                    (CID: {gaClientId.substring(0, 10)}...)
                </span>
            )}
        </a>
    );
}

/**
 * Exemplo avançado: Componente que mostra o link completo gerado
 */
export function WhatsAppCTAAdvanced() {
    const gaClientId = useGAClientId(15, 500); // 15 tentativas, 500ms de intervalo
    const [whatsappUrl, setWhatsappUrl] = React.useState('');

    React.useEffect(() => {
        // Atualiza o link sempre que o Client ID mudar
        setWhatsappUrl(getWhatsAppLink());
    }, [gaClientId]);

    return (
        <div className="whatsapp-cta-container">
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                data-whatsapp-location="example_advanced_component"
            >
                💬 Falar com Especialista
            </a>

            {/* Debug info - remover em produção */}
            {process.env.NODE_ENV === 'development' && (
                <details style={{ marginTop: '16px', fontSize: '12px' }}>
                    <summary>Debug Info</summary>
                    <div style={{ marginTop: '8px' }}>
                        <p><strong>Client ID:</strong> {gaClientId || 'Não capturado'}</p>
                        <p><strong>URL gerada:</strong></p>
                        <code style={{
                            display: 'block',
                            padding: '8px',
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            wordBreak: 'break-all',
                            fontSize: '11px'
                        }}>
                            {whatsappUrl}
                        </code>
                    </div>
                </details>
            )}
        </div>
    );
}
