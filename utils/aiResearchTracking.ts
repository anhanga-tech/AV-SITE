import { currentPageLocation } from './formAnalytics';

export type AIResearchAssistantId = 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'grok';

/**
 * Evento GA4 disparado ao clicar (mouse ou teclado) num link da AIResearchBar,
 * antes da navegação externa ao provedor. Payload contém só metadados seguros:
 * nunca o prompt completo nem a URL final de busca (que carrega o prompt).
 * `page_location` reusa a mesma redação de e-mail/telefone/nome de `formAnalytics.ts`,
 * já que a home pode ser acessada com esses dados na própria query string.
 */
export function pushAiResearchClick(assistant: AIResearchAssistantId, placement: string): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];

    const event: Record<string, string> = {
        event: 'ai_research_click',
        assistant,
        placement,
    };

    const pageLocation = currentPageLocation();
    if (pageLocation) {
        event.page_location = pageLocation;
    }

    window.dataLayer.push(event);
}
