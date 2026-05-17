import { getWhatsAppLink } from "../utils/whatsapp.ts";
import { buildGenerateHandoff, type GenerateHandoff } from "../lib/ai/handoff.ts";
import type { BudgetToolArgs } from "../lib/ai/types.ts";
import { logger } from "../lib/logger.ts";

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
  args?: BudgetToolArgs;
}

interface GenerateApiResponse {
  text?: string;
  chips?: string[];
  functionCall?: GenerateFunctionCall;
  handoff?: GenerateHandoff;
  error?: string;
  code?: string;
  retryAfter?: number;
}

const INVALID_HANDOFF_MESSAGE = 'Tive um problema ao concluir seu orçamento agora. Por favor, tente novamente em alguns instantes para gerar seu atendimento corretamente.';

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
  return 'Se preferir, fale conosco no WhatsApp com a equipe da Anhangá.';
};

const withContactFallback = (message: string): string => {
  return `${message}\n\n${buildFallbackContactMarkdown()}`;
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

  logger.error('[GeminiService] Server error', { code: errorData.code, error: errorData.error });
  if (errorData.code === 'SERVER_CONFIG_ERROR' || errorData.code === 'GEMINI_MODEL_ERROR') {
    return buildContactFallbackResponse(
      '⚠️ O chat está com um problema de configuração no servidor. Nossa equipe já precisa revisar isso.'
    );
  }

  return buildContactFallbackResponse(
    '⚙️ Tivemos um problema técnico interno. Por favor, tente novamente em alguns instantes.'
  );
};

function buildBudgetMessage(handoff: GenerateHandoff): string {
  const messageLines = [
    'Olá! Vim pelo Chatbot da Anhangá. Gostaria de continuar meu atendimento:',
    '',
    `🛫 Origem: ${handoff.origin}`,
    `📍 Destino: ${handoff.destination}`,
    `📅 Datas: ${handoff.dates}`,
  ];

  if (handoff.baggagePreference) {
    messageLines.push(`🧳 Bagagem: ${handoff.baggagePreference}`);
  }

  return messageLines.join('\n');
}

function buildBudgetLink(handoff: GenerateHandoff): ChatResponse['budgetLink'] {
  if (!handoff) return undefined;

  return {
    origin: handoff.origin,
    destination: handoff.destination,
    dates: handoff.dates,
    baggagePreference: handoff.baggagePreference,
    url: getWhatsAppLink(buildBudgetMessage(handoff), { appendTrackingRef: false }),
    bantSummary: handoff.bantSummary,
    iataCode: handoff.iataCode,
  };
}

function containsUnsafeHandoffText(text?: string): boolean {
  if (!text) return false;

  return /wa\.me|api\.whatsapp\.com/i.test(text) || /clique aqui para receber seu or[cç]amento|clique no link abaixo|finalizar seu atendimento|falar com nossos especialistas/i.test(text);
}

function stripWhatsAppLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^)]+)\)/gi, '$1')
    .replace(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\S*/gi, '')
    .trim();
}

function applyGenerateApiData(result: ChatResponse, data: GenerateApiResponse): void {
  if (data.text) {
    result.text = data.text;
  }

  if (data.chips && Array.isArray(data.chips)) {
    result.chips = data.chips;
  }

  if (data.handoff) {
    result.budgetLink = buildBudgetLink(data.handoff);
  } else if (data.functionCall?.name === 'generate_budget_link') {
    result.budgetLink = buildBudgetLink(buildGenerateHandoff(data.functionCall.args || {}, 'tool'));
  }

  if (!result.text && result.budgetLink) {
    result.text = "Prontinho! ✨ Preparei seu link direto para falar com nossos especialistas. É só clicar abaixo 👇";
  }

  if (result.budgetLink && result.text) {
    result.text = stripWhatsAppLinks(result.text);
  }

  if (!result.budgetLink && result.text) {
    if (containsUnsafeHandoffText(result.text)) {
      result.text = INVALID_HANDOFF_MESSAGE;
      result.chips = undefined;
      return;
    }

    result.text = stripWhatsAppLinks(result.text);
  }
}

function buildUnexpectedServiceError(error: unknown): ChatResponse {
  logger.error('[GeminiService] Erro ao consultar Gemini', error);
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

    logger.debug('[GeminiService] Using endpoint', { endpoint: apiEndpoint });

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
