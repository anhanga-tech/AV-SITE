export type AIResearchAssistantId = 'chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'grok';

/**
 * Evento GA4 disparado ao clicar (mouse ou teclado) num link da AIResearchBar,
 * antes da navegação externa ao provedor. Payload contém só metadados seguros:
 * nunca o prompt completo nem a URL final de busca (que carrega o prompt).
 */
export function pushAiResearchClick(assistant: AIResearchAssistantId, placement: string): void {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: 'ai_research_click',
        assistant,
        placement,
        page_location: window.location.href,
    });
}
