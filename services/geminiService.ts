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

const PLACEHOLDER_LOCATION_VALUES = new Set([
  'a definir',
  'a confirmar',
  'nao informado',
  'não informado',
  'nao sei',
  'não sei',
  'indefinido',
  'destino a definir',
  'origem a definir',
]);

const normalizeText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

const isPlaceholderLocation = (value?: string): boolean => {
  if (!value || !value.trim()) return true;
  const normalized = normalizeText(value);
  if (PLACEHOLDER_LOCATION_VALUES.has(normalized)) return true;

  const parts = normalized
    .split(/[,\-/|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return true;
  return parts.every((part) => PLACEHOLDER_LOCATION_VALUES.has(part));
};

const resolveDestinationText = (args: BudgetFunctionArgs): string => {
  const cityText = args.destination_city?.trim() || '';
  const regionText = args.destination_region?.trim() || '';
  const summaryText = args.destination?.trim() || '';

  const hasCity = !isPlaceholderLocation(cityText);
  const hasRegion = !isPlaceholderLocation(regionText);
  const hasSummary = !isPlaceholderLocation(summaryText);

  if (hasCity) {
    return hasRegion ? `${cityText}, ${regionText}` : cityText;
  }

  if (hasSummary) {
    return hasRegion ? `${summaryText} (${regionText})` : summaryText;
  }

  if (hasRegion) return regionText;
  return 'Destino a definir';
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

    // In local development you might want to point this to localhost:3000/api/generate
    // In production (Vercel), '/api/generate' is automatically routed to the serverless function.
    const apiEndpoint = '/api/generate';

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
      const destinationText = resolveDestinationText(args);
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
    console.error("Erro ao consultar Gemini via Server:", error);

    // Mensagens de erro amigáveis
    if (error?.message?.includes('API key missing')) {
      return { text: "⚠️ Erro de configuração no servidor. A chave da API não foi encontrada." };
    }

    return { text: `Desculpe, tive um problema técnico momentâneo. Poderia tentar novamente?` };
  }
};
