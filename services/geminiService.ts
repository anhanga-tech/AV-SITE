import { getWhatsAppLink } from "../utils/whatsapp.ts";

interface BudgetFunctionArgs {
  destination?: string;
  dates?: string;
  adults?: number;
  child_ages?: number[];
  interests?: string;
  origin_city?: string;
  origin_region?: string;
  destination_city?: string;
  destination_region?: string;
  trip_scope?: 'national' | 'south_america' | 'international' | string;
  budget_range?: string;
  decision_role?: string;
  need_summary?: string;
  timeline_window?: string;
  baggage_preference?: string;
  iata_code?: string;
}

interface ChatResponse {
  text?: string;
  chips?: string[];
  budgetLink?: {
    origin: string;
    destination: string;
    dates: string;
    baggagePreference?: string;
    url: string;
    bantSummary: string;
    iataCode?: string;
  };
}

const formatLocation = (city?: string, region?: string, fallback = 'A definir'): string => {
  const cityText = typeof city === 'string' ? city.trim() : '';
  const regionText = typeof region === 'string' ? region.trim() : '';

  if (!cityText && !regionText) return fallback;
  if (!regionText) return cityText || fallback;
  if (!cityText) return regionText;

  return `${cityText}, ${regionText}`;
};

const cleanOptional = (value?: string): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const getTravelAdvice = async (history: { role: 'user' | 'model', text: string }[]): Promise<ChatResponse> => {
  try {
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const apiEndpoint = '/api/generate';

    console.log('[GeminiService] Using endpoint:', apiEndpoint);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 60;
        return {
          text: `⏳ Você enviou muitas mensagens. Por favor, aguarde ${retryAfter} segundos e tente novamente.\n\nEnquanto isso, você pode falar diretamente conosco pelo WhatsApp!`
        };
      }

      if (response.status === 500) {
        console.error('[GeminiService] Server error:', errorData);
        throw new Error('Erro interno do servidor');
      }

      if (response.status === 503) {
        throw new Error('Serviço temporariamente indisponível');
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('API key missing or invalid');
      }

      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    const result: ChatResponse = {};

    if (data.text) {
      result.text = data.text;
    }

    if (data.chips && Array.isArray(data.chips)) {
      result.chips = data.chips;
    }

    if (data.functionCall && data.functionCall.name === 'generate_budget_link') {
      const args: BudgetFunctionArgs = data.functionCall.args || {};

      const originText = formatLocation(args.origin_city, args.origin_region, 'Origem a definir');
      const destinationText = formatLocation(
        args.destination_city,
        args.destination_region,
        args.destination || 'Destino a definir'
      );

      const budgetText = args.budget_range?.trim() || 'A definir';
      const needText = args.need_summary?.trim() || 'Não informado';
      const decisionRoleText = args.decision_role?.trim() || 'Não informado';
      const timelineText = args.timeline_window?.trim() || 'Não informado';
      const bantSummary = `Need: ${needText} | Authority: ${decisionRoleText} | Budget: ${budgetText} | Timeline: ${timelineText}`;

      const baggagePreference = cleanOptional(args.baggage_preference);

      const messageLines = [
        'Olá! Vim pelo Chatbot da Anhangá. Gostaria de continuar meu atendimento:',
        '',
        `🛫 Origem: ${originText}`,
        `📍 Destino: ${destinationText}`,
        `📅 Datas: ${args.dates || 'A definir'}`,
      ];

      if (baggagePreference) {
        messageLines.push(`🧳 Bagagem: ${baggagePreference}`);
      }

      result.budgetLink = {
        origin: originText,
        destination: destinationText,
        dates: args.dates || 'A definir',
        baggagePreference: baggagePreference || undefined,
        url: getWhatsAppLink(messageLines.join('\n'), { appendTrackingRef: false }),
        bantSummary,
        iataCode: args.iata_code || undefined,
      };

      if (!result.text) {
        result.text = "Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇";
      }
    }

    return result;

  } catch (error: any) {
    console.error("[GeminiService] Erro ao consultar Gemini:", error);

    if (error?.message?.includes('API key missing') || error?.message?.includes('invalid')) {
      return { text: "⚠️ Erro de configuração no servidor. A chave da API não foi encontrada ou é inválida." };
    }

    if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
      return {
        text: "🔌 Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente em alguns instantes."
      };
    }

    if (error?.message?.includes('Erro interno do servidor')) {
      return { text: "⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes." };
    }

    if (error?.message?.includes('Serviço temporariamente indisponível')) {
      return { text: "🕐 Nosso serviço está temporariamente indisponível. Por favor, tente novamente em breve." };
    }

    return { text: `Desculpe, tive um problema técnico momentâneo. Poderia tentar novamente?` };
  }
};
