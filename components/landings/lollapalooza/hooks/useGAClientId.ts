import { useState, useEffect } from 'react';

/**
 * Custom Hook para capturar o Client ID do Google Analytics 4.
 * 
 * O hook lê o cookie _ga e extrai o Client ID (parte numérica final).
 * Implementa um mecanismo de retry para aguardar o carregamento do GA4.
 * 
 * @param maxRetries - Número máximo de tentativas (padrão: 10)
 * @param retryInterval - Intervalo entre tentativas em ms (padrão: 500ms)
 * @returns O Client ID do GA4 ou null se não encontrado
 */
export function useGAClientId(maxRetries: number = 10, retryInterval: number = 500): string | null {
    const [clientId, setClientId] = useState<string | null>(null);

    useEffect(() => {
        let attempts = 0;
        let intervalId: NodeJS.Timeout | null = null;

        /**
         * Extrai o Client ID do cookie _ga.
         * Formato esperado: GA1.1.123456789.123456789
         * Retorna: 123456789.123456789 (parte numérica final)
         */
        const extractClientId = (): string | null => {
            if (typeof document === 'undefined') return null;

            // Busca o cookie _ga
            const gaCookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('_ga='));

            if (!gaCookie) return null;

            // Extrai o valor do cookie
            const cookieValue = gaCookie.split('=')[1];

            // Formato: GA1.1.123456789.123456789 ou GA1.2.123456789.123456789
            // Queremos apenas a parte numérica final: 123456789.123456789
            const match = cookieValue.match(/^GA1\.\d+\.(.+)$/);

            if (match && match[1]) {
                return match[1];
            }

            return null;
        };

        /**
         * Tenta capturar o Client ID com retry
         */
        const attemptCapture = () => {
            const id = extractClientId();

            if (id) {
                setClientId(id);
                if (intervalId) {
                    clearInterval(intervalId);
                }
                return true;
            }

            attempts++;

            // Se atingiu o máximo de tentativas, para de tentar
            if (attempts >= maxRetries) {
                if (intervalId) {
                    clearInterval(intervalId);
                }
                console.warn('[useGAClientId] Client ID do GA4 não encontrado após', maxRetries, 'tentativas');
                return false;
            }

            return false;
        };

        // Primeira tentativa imediata
        if (!attemptCapture()) {
            // Se não encontrou, inicia o intervalo de retry
            intervalId = setInterval(attemptCapture, retryInterval);
        }

        // Cleanup ao desmontar o componente
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [maxRetries, retryInterval]);

    return clientId;
}

/**
 * Função utilitária para obter o Client ID do GA4 de forma síncrona.
 * Útil para uso fora de componentes React.
 * 
 * @returns O Client ID do GA4 ou null se não encontrado
 */
export function getGAClientId(): string | null {
    if (typeof document === 'undefined') return null;

    const gaCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('_ga='));

    if (!gaCookie) return null;

    const cookieValue = gaCookie.split('=')[1];
    const match = cookieValue.match(/^GA1\.\d+\.(.+)$/);

    return match && match[1] ? match[1] : null;
}
