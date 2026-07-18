import React, {
  memo,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getTravelAdvice } from '../services/geminiService';
import { useLeadCapture, type SubmitLeadHookResult } from '../hooks/useLeadCapture';
import type { LeadFinalizePayload, LeadFinalizeResult } from '../lib/chat-lead-form-logic';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { triggerHaptic } from '../utils/haptics';
import { AIChatPanelView, type ChatMessage } from './ai-chat/AIChatPanelView';

/** crypto.randomUUID() is unavailable in older browsers and non-secure (HTTP) contexts. */
function generateMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}

export interface AIChatPanelProps {
  /** Whether the drawer should be visually open (`<dialog>` shown as modal). */
  isOpen: boolean;
  /** Requests the drawer be closed; owned by the always-mounted trigger button. */
  onClose: () => void;
  /** Shared ref to the element that had focus before opening, for focus restoration on close. */
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  /** A message to auto-send once the panel mounts (toggle event / `?chat=open&destino=`). */
  initialAutoSendMessage?: string;
  /** Delay before auto-sending `initialAutoSendMessage`, matching the drawer's slide-in animation. */
  initialAutoSendDelayMs?: number;
  /** Text to pre-fill the input with, without auto-sending (`?chat=1&m=`/`message=`/`destino=`). */
  initialInputPrefill?: string;
  /** Called once a pending auto-send/prefill has been applied, so the trigger doesn't repeat it. */
  onConsumePending: () => void;
}

/**
 * AIChatPanel — the full chat drawer (messages, markdown rendering, lead capture).
 * Loaded on demand via `React.lazy` from `AIChat.tsx` once the visitor expresses
 * intent to chat, so its dependencies (react-markdown, geminiService, lead-capture
 * form) never ship in the initial bundle for visitors who never open it.
 *
 * PERFORMANCE WIN:
 * 1. Memoized sub-components and logic to ensure that typing in the input
 *    field doesn't cause expensive re-calculations of the entire message history.
 * 2. Pre-calculates the last model message index once per update (O(N))
 *    instead of within the render loop (O(N^2)).
 */
const AIChatPanel: React.FC<AIChatPanelProps> = memo(({
  isOpen,
  onClose,
  triggerRef,
  initialAutoSendMessage,
  initialAutoSendDelayMs,
  initialInputPrefill,
  onConsumePending,
}) => {
  const onConsumePendingEvent = useEffectEvent(onConsumePending);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Olá! Sou seu guia Anhangá 🧭.\n\nPosso te ajudar com:\n- Roteiros exclusivos\n- Dúvidas sobre o destino\n- **Orçamento personalizado**\n\nVamos começar?\n\n_Ao conversar comigo, você concorda com nossa [Política de Privacidade](/politica-privacidade/)._' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const {
    getLeadWhatsAppUrl,
    prepareLeadSubmitPayload,
    setLeadDraft,
    submitLead,
    isSubmitting: isSubmittingLead,
  } = useLeadCapture();

  const prevMessagesCount = useRef(messages.length);

  // PERFORMANCE: Pre-calculate the index of the last model message to avoid O(N^2)
  // lookup inside the render loop's map function.
  const lastModelIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') return i;
    }
    return -1;
  }, [messages]);

  // Derive the screen-reader announcement from the latest model messages added this render.
  // Read the ref snapshot before useMemo so the memo body stays pure.
  const prevCount = prevMessagesCount.current;
  const liveAnnouncement = useMemo(() => {
    if (messages.length <= prevCount) return '';
    const newModelMessages = messages
      .slice(prevCount)
      .filter(m => m.role === 'model' && !m.isAction);
    if (newModelMessages.length === 0) return '';
    return newModelMessages.map(m => m.text).join(' ').replace(/\*\*|\*|- /g, '');
  }, [messages, prevCount]);

  useEffect(() => {
    prevMessagesCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
      triggerRef.current?.focus();
    }
  }, [isOpen, triggerRef]);

  const closeChatDrawer = useCallback(() => {
    void triggerHaptic('light');
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeChatDrawer();
    };
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) closeChatDrawer();
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
    };
  }, [closeChatDrawer]);

  const handlePrepareLeadSubmitPayload = (payload: LeadFinalizePayload, eventId: string): SubmitLeadRequest => {
    setLeadDraft({ ...payload });
    return prepareLeadSubmitPayload({ ...payload }, eventId);
  };

  const handleFinalizeLead = async (payload: SubmitLeadRequest): Promise<LeadFinalizeResult> => {
    if (isSubmittingLead) {
      return { ok: true }; // Already processing
    }

    setLeadDraft({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      whatsapp: payload.whatsapp,
      bantSummary: payload.bantSummary,
      destination: payload.destination,
    });
    const result = await submitLead(payload, {
      pushDataLayerEvent: false,
    });

    if (!result.ok) {
      const errorResult = result as Extract<SubmitLeadHookResult, { ok: false }>;

      console.warn('AI_CHAT: lead submit failed before WhatsApp handoff', {
        code: errorResult.code,
        requestId: errorResult.requestId,
        status: errorResult.status,
      });

      return {
        ok: false,
        error: errorResult.error,
        requestId: errorResult.requestId,
      };
    }


    return {
      ok: true,
      notice: result.warning,
    };
  };

  const submitMessage = useCallback(async (text: string, enableHaptics: boolean = true) => {
    if (!text.trim() || isLoading) return;

    if (enableHaptics) {
      void triggerHaptic('medium');
    }

    const newHistory: ChatMessage[] = [...messagesRef.current, { id: generateMessageId(), role: 'user', text }];
    setMessages(newHistory);
    setInput('');

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // reset height
      }
    }, 0);

    setIsLoading(true);

    // Filter out UI-only action messages before sending to the API.
    // Action messages (isAction: true) represent budget-link handoff cards in
    // the chat UI, but they are not part of the conversation from the model's
    // perspective. Including them creates consecutive model-role turns in the
    // history, which the Gemini API rejects with a 400 INVALID_ARGUMENT error
    // ("role alternation" requirement). The preceding text message already
    // carries the handoff context for the model.
    const apiHistory = newHistory.filter(msg => !msg.isAction);

    let response: Awaited<ReturnType<typeof getTravelAdvice>>;
    try {
      response = await getTravelAdvice(apiHistory);
    } catch {
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: generateMessageId(),
          role: 'model' as const,
          text: '⚙️ Tivemos um problema técnico. Por favor, tente novamente em alguns instantes.',
        },
      ]);
      return;
    }
    setIsLoading(false);

    const nextMessages: ChatMessage[] = [];

    if (response.text) {
      nextMessages.push({
        id: generateMessageId(),
        role: 'model',
        text: response.text || '',
        chips: response.chips?.map((label) => ({
          id: generateMessageId(),
          label,
        }))
      });
    }

    if (response.budgetLink) {
      setLeadDraft({
        bantSummary: response.budgetLink.bantSummary,
        origin: response.budgetLink.origin,
        destination: response.budgetLink.destination,
        dates: response.budgetLink.dates,
        baggagePreference: response.budgetLink.baggagePreference || '',
      });

      nextMessages.push({
        id: generateMessageId(),
        role: 'model',
        text: 'Orçamento Pronto',
        isAction: true,
        actionData: {
          destination: response.budgetLink!.destination,
          bantSummary: response.budgetLink!.bantSummary,
          iataCode: response.budgetLink!.iataCode
        }
      });
    }

    if (nextMessages.length > 0) {
      setMessages(prev => [...prev, ...nextMessages]);

      if (enableHaptics) {
        void triggerHaptic('heavy');
      }
    }
  }, [isLoading, setLeadDraft]);

  const submitMessageRef = useRef(submitMessage);
  useEffect(() => { submitMessageRef.current = submitMessage; }, [submitMessage]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitMessage(input);
    }
  };

  // Applies a pending auto-send message (toggle event / `?chat=open&destino=`) once this
  // panel has mounted — the delay lets the drawer's slide-in animation settle first.
  useEffect(() => {
    if (!initialAutoSendMessage) return;

    const timer = setTimeout(() => {
      void submitMessageRef.current(initialAutoSendMessage, false);
      onConsumePendingEvent();
    }, initialAutoSendDelayMs ?? 500);

    return () => clearTimeout(timer);
  }, [initialAutoSendMessage, initialAutoSendDelayMs]);

  // Applies a pending input pre-fill (`?chat=1&m=`/`message=`/`destino=`) once mounted.
  useEffect(() => {
    if (!initialInputPrefill) return;
    setInput(initialInputPrefill);
    onConsumePendingEvent();
  }, [initialInputPrefill]);

  return (
    <AIChatPanelView
      dialogRef={dialogRef}
      messagesEndRef={messagesEndRef}
      inputRef={inputRef}
      messages={messages}
      lastModelIndex={lastModelIndex}
      liveAnnouncement={liveAnnouncement}
      input={input}
      isLoading={isLoading}
      isSubmittingLead={isSubmittingLead}
      getLeadWhatsAppUrl={getLeadWhatsAppUrl}
      prepareLeadSubmitPayload={handlePrepareLeadSubmitPayload}
      finalizeLead={handleFinalizeLead}
      onClose={closeChatDrawer}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onSubmitMessage={(text) => void submitMessage(text)}
    />
  );
});

AIChatPanel.displayName = 'AIChatPanel';

export default AIChatPanel;
