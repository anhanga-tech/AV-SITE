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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

function getErrorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = (error as { name?: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return '';
}

const buildFallbackContactMarkdown = (): string => {
  const whatsappUrl = getWhatsAppLink(
    'Olá! Tive um problema no chat do site e gostaria de continuar meu atendimento pelo WhatsApp.',
    { appendTrackingRef: false },
  );

  return `Se preferir, [fale conosco no WhatsApp](${whatsappUrl}).`;
};

const withContactFallback = (message: string): string => {
  return `${message}\n\n${buildFallbackContactMarkdown()}`;
};

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
          text: withContactFallback(
            `⏳ Você enviou muitas mensagens. Por favor, aguarde ${retryAfter} segundos e tente novamente.`
          )
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          text: withContactFallback(
            '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
          )
        };
      }

      if (response.status === 503) {
        return {
          text: withContactFallback(
            '🕐 Nosso serviço de IA está temporariamente indisponível no momento.'
          )
        };
      }

      if (response.status === 500) {
        console.error('[GeminiService] Server error:', errorData);
        if (errorData.code === 'SERVER_CONFIG_ERROR' || errorData.code === 'GEMINI_MODEL_ERROR') {
          return {
            text: withContactFallback(
              '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
            )
          };
        }

        return {
          text: withContactFallback(
            '⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes.'
          )
        };
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

    if (!result.text && !result.budgetLink) {
      result.text = withContactFallback(
        'Não consegui gerar uma resposta agora. Pode reformular sua pergunta e tentar novamente?'
      );
    }

    return result;

  } catch (error: unknown) {
    console.error("[GeminiService] Erro ao consultar Gemini:", error);
    const errorMessage = getErrorMessage(error);
    const errorName = getErrorName(error);

    if (errorMessage.includes('API key missing') || errorMessage.includes('invalid')) {
      return {
        text: withContactFallback(
          '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
        )
      };
    }

    if (errorMessage.includes('Failed to fetch') || errorName === 'TypeError') {
      return {
        text: withContactFallback(
          '🔌 Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente em alguns instantes.'
        )
      };
    }

    if (errorMessage.includes('Serviço temporariamente indisponível')) {
      return {
        text: withContactFallback(
          '🕐 Nosso serviço está temporariamente indisponível. Por favor, tente novamente em breve.'
        )
      };
    }

    return {
      text: withContactFallback(
        '⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes.'
      )
    };
  }
};
