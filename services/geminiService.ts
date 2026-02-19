import { getWhatsAppLink } from "../utils/whatsapp";

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
}

interface ChatResponse {
  text?: string;
  budgetLink?: {
    destination: string;
    dates: string;
    travelers: string;
    interests: string;
    url: string;
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

const mapTripScopeLabel = (scope?: string): string => {
  if (scope === 'national') return 'Nacional';
  if (scope === 'south_america') return 'América do Sul';
  if (scope === 'international') return 'Internacional';
  return 'A definir';
};

export const getTravelAdvice = async (history: { role: 'user' | 'model', text: string }[]): Promise<ChatResponse> => {
  try {
    // Converter histórico simples para o formato da API
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Detectar ambiente e configurar endpoint
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const apiEndpoint = isDev 
      ? 'http://localhost:3000/api/generate' 
      : '/api/generate';

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

      // Handle rate limiting specifically
      if (response.status === 429) {
        const retryAfter = errorData.retryAfter || 60;
        return {
          text: `⏳ Você enviou muitas mensagens. Por favor, aguarde ${retryAfter} segundos e tente novamente.\n\nEnquanto isso, você pode falar diretamente conosco pelo WhatsApp!`
        };
      }

      // Handle specific error types
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

    // 1. Texto da resposta
    if (data.text) {
      result.text = data.text;
    }

    // 2. Function Call (Orçamento)
    if (data.functionCall && data.functionCall.name === 'generate_budget_link') {
      const args: BudgetFunctionArgs = data.functionCall.args || {};

      // Formatar texto de viajantes
      const adultsCount = Number.isInteger(args.adults) && (args.adults as number) > 0 ? (args.adults as number) : 2;
      const childAges = Array.isArray(args.child_ages) ? args.child_ages : [];

      let travelersText = `${adultsCount} Adulto${adultsCount !== 1 ? 's' : ''}`;

      if (childAges.length > 0) {
        const agesString = childAges.map((age: number) => `${age} anos`).join(', ');
        travelersText += `, ${childAges.length} Criança${childAges.length !== 1 ? 's' : ''} (${agesString})`;
      }

      const originText = formatLocation(args.origin_city, args.origin_region, 'Origem a definir');
      const destinationText = formatLocation(
        args.destination_city,
        args.destination_region,
        args.destination || 'Destino a definir'
      );
      const scopeText = mapTripScopeLabel(args.trip_scope);
      const budgetText = args.budget_range?.trim() || 'A definir';
      const needText = args.need_summary?.trim() || 'Não informado';
      const decisionRoleText = args.decision_role?.trim() || 'Não informado';
      const timelineText = args.timeline_window?.trim() || 'Não informado';

      // Construir link do WhatsApp
      const text = `Olá! Vim pelo Chatbot da Anhangá. Gostaria de um orçamento:\n\n🛫 Origem: ${originText}\n📍 Destino: ${destinationText}\n🌎 Escopo: ${scopeText}\n📅 Data: ${args.dates || 'A definir'}\n👥 Viajantes: ${travelersText}\n💰 Faixa de investimento: ${budgetText}\n✨ Interesses: ${args.interests || 'Geral'}\n🎯 Necessidade principal: ${needText}\n👤 Decisor(a): ${decisionRoleText}\n⏱️ Janela de decisão: ${timelineText}`;

      result.budgetLink = {
        destination: destinationText,
        dates: args.dates || 'A definir',
        travelers: travelersText,
        interests: args.interests || '',
        url: getWhatsAppLink(text)
      };

      // Fallback: se não veio texto, adicionar um padrão
      if (!result.text) {
        result.text = "Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇";
      }
    }

    return result;

  } catch (error: any) {
    console.error("[GeminiService] Erro ao consultar Gemini:", error);

    // Mensagens de erro amigáveis baseadas no tipo de erro
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
