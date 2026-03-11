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

interface GenerateFunctionCall {
  name?: string;
  args?: BudgetFunctionArgs;
}

interface GenerateApiResponse {
  text?: string;
  chips?: string[];
  functionCall?: GenerateFunctionCall;
  error?: string;
  code?: string;
  retryAfter?: number;
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

const buildContactFallbackResponse = (message: string): ChatResponse => ({
  text: withContactFallback(message),
});

const buildServerErrorResponse = (status: number, errorData: GenerateApiResponse): ChatResponse | null => {
  if (status === 429) {
    return buildContactFallbackResponse(
      `⏳ Você enviou muitas mensagens. Por favor, aguarde ${errorData.retryAfter || 60} segundos e tente novamente.`
    );
  }

  if (status === 401 || status === 403) {
    return buildContactFallbackResponse(
      '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
    );
  }

  if (status === 503) {
    return buildContactFallbackResponse(
      '🕐 Nosso serviço de IA está temporariamente indisponível no momento.'
    );
  }

  if (status !== 500) return null;

  console.error('[GeminiService] Server error:', errorData);
  if (errorData.code === 'SERVER_CONFIG_ERROR' || errorData.code === 'GEMINI_MODEL_ERROR') {
    return buildContactFallbackResponse(
      '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
    );
  }

  return buildContactFallbackResponse(
    '⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes.'
  );
};

function buildBantSummary(args: BudgetFunctionArgs): string {
  const budgetText = args.budget_range?.trim() || 'A definir';
  const needText = args.need_summary?.trim() || 'Não informado';
  const decisionRoleText = args.decision_role?.trim() || 'Não informado';
  const timelineText = args.timeline_window?.trim() || 'Não informado';

  return `Need: ${needText} | Authority: ${decisionRoleText} | Budget: ${budgetText} | Timeline: ${timelineText}`;
}

function buildBudgetMessage(args: BudgetFunctionArgs, originText: string, destinationText: string, baggagePreference: string): string {
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

  return messageLines.join('\n');
}

function buildBudgetLink(args: BudgetFunctionArgs): ChatResponse['budgetLink'] {
  const originText = formatLocation(args.origin_city, args.origin_region, 'Origem a definir');
  const destinationText = formatLocation(
    args.destination_city,
    args.destination_region,
    args.destination || 'Destino a definir'
  );
  const baggagePreference = cleanOptional(args.baggage_preference);

  return {
    origin: originText,
    destination: destinationText,
    dates: args.dates || 'A definir',
    baggagePreference: baggagePreference || undefined,
    url: getWhatsAppLink(buildBudgetMessage(args, originText, destinationText, baggagePreference), { appendTrackingRef: false }),
    bantSummary: buildBantSummary(args),
    iataCode: args.iata_code || undefined,
  };
}

function applyGenerateApiData(result: ChatResponse, data: GenerateApiResponse): void {
  if (data.text) {
    result.text = data.text;
  }

  if (data.chips && Array.isArray(data.chips)) {
    result.chips = data.chips;
  }

  if (data.functionCall?.name !== 'generate_budget_link') {
    return;
  }

  const args = data.functionCall.args || {};
  result.budgetLink = buildBudgetLink(args);

  if (!result.text) {
    result.text = "Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇";
  }
}

function buildUnexpectedServiceError(error: unknown): ChatResponse {
  console.error("[GeminiService] Erro ao consultar Gemini:", error);
  const errorMessage = getErrorMessage(error);
  const errorName = getErrorName(error);

  if (errorMessage.includes('API key missing') || errorMessage.includes('invalid')) {
    return buildContactFallbackResponse(
      '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
    );
  }

  if (errorMessage.includes('Failed to fetch') || errorName === 'TypeError') {
    return buildContactFallbackResponse(
      '🔌 Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente em alguns instantes.'
    );
  }

  if (errorMessage.includes('Serviço temporariamente indisponível')) {
    return buildContactFallbackResponse(
      '🕐 Nosso serviço está temporariamente indisponível. Por favor, tente novamente em breve.'
    );
  }

  return buildContactFallbackResponse(
    '⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes.'
  );
}

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
      const errorData = await response.json().catch(() => ({} as GenerateApiResponse));
      const handledError = buildServerErrorResponse(response.status, errorData);
      if (handledError) return handledError;
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json() as GenerateApiResponse;
    const result: ChatResponse = {};
    applyGenerateApiData(result, data);

    if (!result.text && !result.budgetLink) {
      result.text = withContactFallback('Não consegui gerar uma resposta agora. Pode reformular sua pergunta e tentar novamente?');
    }

    return result;

  } catch (error: unknown) {
    return buildUnexpectedServiceError(error);
  }
};
