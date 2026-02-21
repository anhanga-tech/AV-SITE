import { useCallback, useMemo, useState } from 'react';
import { getTravelAdvice, type BudgetLinkData, type ChatResponse } from '../services/geminiService.ts';
import { extractStructuredChips, inferFallbackChips, stripChipsBlock } from '../utils/chatChips.ts';

export type ChatPhase = 'input' | 'conversation' | 'lead-form' | 'handoff';
export type ChatRole = 'user' | 'bot';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
}

export interface HandoffData {
    whatsappUrl: string;
    functionArgs: Record<string, unknown>;
    bantSummary: string;
    origin: string;
    destination: string;
    dates: string;
    baggagePreference?: string;
}

export interface ChatState {
    phase: ChatPhase;
    messages: ChatMessage[];
    isLoading: boolean;
    chips: string[];
    pendingHandoff: HandoffData | null;
    handoff: HandoffData | null;
}

interface UseChatSessionOptions {
    initialAssistantMessage?: string;
    initialPhase?: ChatPhase;
}

interface AssistantPresentation {
    cleanText: string;
    chips: string[];
}

const DEFAULT_INITIAL_MESSAGE =
    'Olá! Sou a IA da Anhangá ✈️.\n\nPosso te ajudar com:\n- Dicas de roteiros exclusivos\n- Dúvidas sobre nossos serviços\n- Preparar um **orçamento personalizado**\n\nComo posso ajudar hoje?';

const DEFAULT_INITIAL_PHASE: ChatPhase = 'input';

export const MAX_CHAT_MESSAGES = 50;

let messageCounter = 0;

function createMessage(role: ChatRole, text: string): ChatMessage {
    messageCounter += 1;
    return {
        id: `${Date.now()}-${messageCounter}`,
        role,
        text,
    };
}

function getInitialMessages(initialAssistantMessage: string): ChatMessage[] {
    if (!initialAssistantMessage.trim()) return [];
    return [createMessage('bot', initialAssistantMessage)];
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

export function buildHandoffData(response: ChatResponse): HandoffData | null {
    const budgetLink: BudgetLinkData | undefined = response.budgetLink;
    if (!budgetLink) return null;

    return {
        whatsappUrl: budgetLink.url,
        functionArgs: {
            origin: budgetLink.origin,
            destination: budgetLink.destination,
            dates: budgetLink.dates,
            baggagePreference: budgetLink.baggagePreference || '',
            bantSummary: budgetLink.bantSummary,
        },
        bantSummary: budgetLink.bantSummary,
        origin: budgetLink.origin,
        destination: budgetLink.destination,
        dates: budgetLink.dates,
        baggagePreference: budgetLink.baggagePreference,
    };
}

export function getInitialChatPhase(phase?: ChatPhase): ChatPhase {
    return phase || DEFAULT_INITIAL_PHASE;
}

export function resolvePhaseOnUserSend(currentPhase: ChatPhase): ChatPhase {
    if (currentPhase === 'input') return 'conversation';
    return currentPhase;
}

export function resolvePhaseOnAssistantResponse(hasHandoff: boolean): ChatPhase {
    return hasHandoff ? 'lead-form' : 'conversation';
}

export function resolvePhaseOnLeadSubmit(): ChatPhase {
    return 'handoff';
}

export function useChatSession(options: UseChatSessionOptions = {}) {
    const initialMessage = options.initialAssistantMessage || DEFAULT_INITIAL_MESSAGE;
    const initialPhase = getInitialChatPhase(options.initialPhase);

    const initialMessages = useMemo(() => getInitialMessages(initialMessage), [initialMessage]);

    const [phase, setPhase] = useState<ChatPhase>(initialPhase);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [chips, setChips] = useState<string[]>([]);
    const [pendingHandoff, setPendingHandoff] = useState<HandoffData | null>(null);
    const [handoff, setHandoff] = useState<HandoffData | null>(null);

    const sendMessage = useCallback(async (rawText: string): Promise<boolean> => {
        const text = rawText.trim();
        if (!text) return false;
        if (phase === 'lead-form' || phase === 'handoff') return false;

        if (!canSendMessage(messages.length, isLoading)) {
            if (!isLoading && messages.length >= MAX_CHAT_MESSAGES) {
                setMessages((prev) => [
                    ...prev,
                    createMessage('bot', 'Chegamos ao limite desta conversa. Posso seguir no WhatsApp para continuar seu atendimento.'),
                ]);
            }
            return false;
        }

        const history = [...messages, createMessage('user', text)];
        setMessages(history);
        setIsLoading(true);
        setChips([]);

        setPhase((current) => resolvePhaseOnUserSend(current));

        try {
            const response = await getTravelAdvice(
                history.map((item) => ({ role: item.role === 'bot' ? 'model' : 'user', text: item.text })),
            );

            const presentation = getAssistantPresentation(response.text);

            if (presentation.cleanText) {
                setMessages((prev) => [...prev, createMessage('bot', presentation.cleanText)]);
            }

            const handoffData = buildHandoffData(response);
            if (handoffData) {
                setPendingHandoff(handoffData);
                setPhase(resolvePhaseOnAssistantResponse(true));
                setChips([]);
            } else {
                setPhase(resolvePhaseOnAssistantResponse(false));
                setChips(presentation.chips);
            }

            return true;
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, phase]);

    const completeLeadForm = useCallback((resolvedUrl?: string) => {
        if (!pendingHandoff) return;

        setHandoff({
            ...pendingHandoff,
            whatsappUrl: resolvedUrl || pendingHandoff.whatsappUrl,
        });
        setPendingHandoff(null);
        setPhase(resolvePhaseOnLeadSubmit());
    }, [pendingHandoff]);

    const resetSession = useCallback(() => {
        setPhase(initialPhase);
        setMessages(getInitialMessages(initialMessage));
        setIsLoading(false);
        setChips([]);
        setPendingHandoff(null);
        setHandoff(null);
    }, [initialMessage, initialPhase]);

    return {
        phase,
        messages,
        isLoading,
        chips,
        pendingHandoff,
        handoff,
        sendMessage,
        completeLeadForm,
        resetSession,
    } as ChatState & {
        sendMessage: (text: string) => Promise<boolean>;
        completeLeadForm: (resolvedUrl?: string) => void;
        resetSession: () => void;
    };
}
