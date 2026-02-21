import { useCallback, useState } from 'react';
import { getTravelAdvice, type BudgetLinkData, type ChatResponse } from '../services/geminiService.ts';
import { extractStructuredChips, inferFallbackChips, stripChipsBlock } from '../utils/chatChips.ts';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export type HandoffData = BudgetLinkData;

export interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    chips: string[];
    handoff: HandoffData | null;
}

interface UseChatSessionOptions {
    initialAssistantMessage?: string;
    onBudgetLink?: (budgetLink: BudgetLinkData) => void;
}

interface AssistantPresentation {
    cleanText: string;
    chips: string[];
}

const DEFAULT_INITIAL_MESSAGE =
    'Olá! Sou a IA da Anhangá ✈️.\n\nPosso te ajudar com:\n- Dicas de roteiros exclusivos\n- Dúvidas sobre nossos serviços\n- Preparar um **orçamento personalizado**\n\nComo posso ajudar hoje?';

export const MAX_CHAT_MESSAGES = 50;

let messageCounter = 0;

function createMessage(role: 'user' | 'model', text: string): ChatMessage {
    messageCounter += 1;
    return {
        id: `${Date.now()}-${messageCounter}`,
        role,
        text,
    };
}

export function canSendMessage(messagesCount: number, isLoading: boolean): boolean {
    return !isLoading && messagesCount < MAX_CHAT_MESSAGES;
}

export function getAssistantPresentation(text?: string): AssistantPresentation {
    if (!text) {
        return { cleanText: '', chips: [] };
    }

    const structuredChips = extractStructuredChips(text);
    const cleanText = stripChipsBlock(text);

    if (structuredChips && structuredChips.length > 0) {
        return {
            cleanText,
            chips: structuredChips,
        };
    }

    return {
        cleanText,
        chips: inferFallbackChips(cleanText),
    };
}

export function getHandoffFromResponse(response: ChatResponse): HandoffData | null {
    return response.budgetLink ?? null;
}

export function useChatSession(options: UseChatSessionOptions = {}) {
    const initialMessage = options.initialAssistantMessage || DEFAULT_INITIAL_MESSAGE;
    const onBudgetLink = options.onBudgetLink;

    const [messages, setMessages] = useState<ChatMessage[]>([
        createMessage('model', initialMessage),
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [chips, setChips] = useState<string[]>([]);
    const [handoff, setHandoff] = useState<HandoffData | null>(null);

    const sendMessage = useCallback(async (rawText: string): Promise<boolean> => {
        const text = rawText.trim();
        if (!text) return false;

        if (!canSendMessage(messages.length, isLoading)) {
            if (!isLoading && messages.length >= MAX_CHAT_MESSAGES) {
                setMessages((prev) => [
                    ...prev,
                    createMessage('model', 'Chegamos ao limite desta conversa. Posso seguir no WhatsApp para continuar seu atendimento.'),
                ]);
            }
            return false;
        }

        const history = [...messages, createMessage('user', text)];
        setMessages(history);
        setIsLoading(true);
        setChips([]);
        setHandoff(null);

        try {
            const response = await getTravelAdvice(history.map((item) => ({ role: item.role, text: item.text })));
            const presentation = getAssistantPresentation(response.text);

            if (presentation.cleanText) {
                setMessages((prev) => [...prev, createMessage('model', presentation.cleanText)]);
            }

            const handoffData = getHandoffFromResponse(response);
            if (handoffData) {
                setHandoff(handoffData);
                onBudgetLink?.(handoffData);
                setChips([]);
            } else {
                setChips(presentation.chips);
            }

            return true;
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, onBudgetLink]);

    return {
        messages,
        isLoading,
        chips,
        handoff,
        sendMessage,
    } as ChatState & { sendMessage: (text: string) => Promise<boolean> };
}
