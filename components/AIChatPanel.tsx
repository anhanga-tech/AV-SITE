import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import {
  X,
  PaperPlaneTilt,
  Sparkle,
  CircleNotch,
  Robot,
  User,
} from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import { getTravelAdvice } from '../services/geminiService';
import { useLeadCapture, type SubmitLeadHookResult } from '../hooks/useLeadCapture';
import { PassportStamp } from './ui/PassportStamp';
import { ChatLeadForm } from './ChatLeadForm';
import type { LeadFinalizePayload, LeadFinalizeResult } from '../lib/chat-lead-form-logic';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { triggerHaptic } from '../utils/haptics';
import { sanitizeAiLinkUrl } from '../lib/ai/safe-link';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  chips?: Array<{
    id: string;
    label: string;
  }>;
  isAction?: boolean;
  actionData?: {
    destination: string;
    bantSummary: string;
    iataCode?: string;
  };
}

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
 * Optimized FormattedText component.
 *
 * PERFORMANCE WIN: Wrapped in React.memo to prevent redundant string processing
 * and re-renders of static message content during chat interactions.
 */
const FormattedText = memo(({ text }: { text: string }) => {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '').map((paragraph, idx) => {
    const isList = paragraph.trim().startsWith('-');
    const cleanText = isList ? paragraph.replace('-', '').trim() : paragraph;
    const parts = cleanText.split(/(\*\*.*?\*\*)/g).map((part, i) => ({ id: `${idx}-${i}`, part }));
    return { id: `para-${idx}-${paragraph.slice(0, 20)}`, isList, parts };
  });

  return (
    <div className="space-y-3 font-sans">
      {paragraphs.map(({ id, isList, parts }) => {
        const content = parts.map(({ id: partId, part }) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partId} className="font-bold text-zinc-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isList) {
          return (
            <div key={id} className="flex items-start gap-2 ml-1">
              <span className="shrink-0 mt-1.5 size-1.5 bg-brand-vibrant rounded-full opacity-70"></span>
              <span className="leading-relaxed text-zinc-700">{content}</span>
            </div>
          );
        }

        return <p key={id} className="leading-relaxed text-zinc-700">{content}</p>;
      })}
    </div>
  );
});

FormattedText.displayName = 'FormattedText';

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
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Olá! Sou seu guia Anhangá 🧭.\n\nPosso te ajudar com:\n- Roteiros exclusivos\n- Dúvidas sobre o destino\n- **Orçamento personalizado**\n\nVamos começar?\n\n_Ao conversar comigo, você concorda com nossa [Política de Privacidade](/politica-privacidade/)._' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const messagesRef = useRef<Message[]>(messages);
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

    const newHistory: Message[] = [...messagesRef.current, { id: generateMessageId(), role: 'user', text }];
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

    const nextMessages: Message[] = [];

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
      onConsumePending();
    }, initialAutoSendDelayMs ?? 500);

    return () => clearTimeout(timer);
  }, [initialAutoSendMessage, initialAutoSendDelayMs, onConsumePending]);

  // Applies a pending input pre-fill (`?chat=1&m=`/`message=`/`destino=`) once mounted.
  useEffect(() => {
    if (!initialInputPrefill) return;
    setInput(initialInputPrefill);
    onConsumePending();
  }, [initialInputPrefill, onConsumePending]);

  return (
    <dialog
      ref={dialogRef}
      className="ai-chat-drawer fixed top-0 right-0 h-full w-full sm:w-[450px] z-[9999] m-0 ml-auto p-0 bg-white flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] sm:rounded-l-[2rem] overflow-hidden outline-none max-h-full max-w-full"
      aria-labelledby="ai-chat-title"
    >
      {/* Header - Scrapbook Softness */}
      <div className="bg-white/80 backdrop-blur-md px-6 py-5 border-b border-zinc-100 flex justify-between items-center shrink-0 z-10">
        <div className="flex gap-4 items-center">
          <div className="size-12 bg-zinc-50 rounded-[1.25rem] flex items-center justify-center shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
            <Sparkle className="size-6 text-brand-vibrant" weight="fill" />
          </div>
          <div>
            <h2 id="ai-chat-title" className="font-extrabold text-lg text-brand-dark tracking-tight leading-none">
              Hub Anhangá
            </h2>
            <div className="flex items-center gap-1.5 mt-1 opacity-80">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-green-400"></span>
              </span>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Assistente Online
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={closeChatDrawer}
          className="text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-full p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant"
          aria-label="Fechar gaveta"
        >
          <X className="size-6" weight="bold" />
        </button>
      </div>

      {/* Screen-reader announcer for new AI messages */}
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </output>

      {/* Messages Area - Scrapbook vibe */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-white relative">
        {/* Fundo suave */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {messages.map((msg, idx) => {
          const isLastModelMsg = msg.role === 'model' && idx === lastModelIndex;

          return (
            <div key={msg.id} className={`relative flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} z-10`}>
              <div className={`flex items-end gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`size-9 flex items-center justify-center shrink-0 rounded-full shadow-sm ${msg.role === 'user'
                  ? 'bg-brand-dark text-white'
                  : 'bg-white text-brand-vibrant border border-zinc-100'
                  }`}>
                  {msg.role === 'user' ? <User className="size-4" weight="fill" /> : <Robot className="size-5" weight="fill" />}
                </div>

                {/* Bubble */}
                {msg.isAction ? (
                  <div className="w-full relative mt-3 pt-4">
                    {/* Passport Stamp Overlay */}
                    <PassportStamp
                      destination={msg.actionData?.destination || 'Viagem'}
                      iataCode={msg.actionData?.iataCode}
                      className="absolute top-[-25px] right-[-10px] sm:right-[5px] pointer-events-none"
                    />
                    <ChatLeadForm
                      destination={msg.actionData?.destination}
                      defaultBantSummary={msg.actionData?.bantSummary}
                      getWhatsAppUrl={getLeadWhatsAppUrl}
                      prepareLeadSubmitPayload={handlePrepareLeadSubmitPayload}
                      onFinalizeLead={handleFinalizeLead}
                      isSubmittingLead={isSubmittingLead}
                    />
                  </div>
                ) : (
                  <div
                    data-testid={msg.role === 'user' ? 'chat-user-message' : undefined}
                    className={`p-4 text-sm shadow-sm ${msg.role === 'user'
                    ? 'bg-brand-vibrant text-white rounded-2xl rounded-br-sm'
                    : 'bg-white text-zinc-800 border border-zinc-100 rounded-2xl rounded-bl-sm'
                    }`}>
                    {msg.role === 'model' ? (
                      <div className="prose prose-sm max-w-none prose-p:text-zinc-700 prose-p:leading-relaxed prose-strong:text-zinc-900 prose-strong:font-bold prose-ul:text-zinc-700">
                        <ReactMarkdown
                          urlTransform={sanitizeAiLinkUrl}
                          components={{
                            a: ({ href, children, ...props }) => {
                              if (!href) return <span>{children}</span>;
                              // Internal SPA links stay in-tab; external (allowlisted)
                              // links open in a new tab to preserve chat state.
                              const isInternal = href.startsWith('/') && !href.startsWith('//');
                              return (
                                <a
                                  href={href}
                                  rel="noopener noreferrer"
                                  target={isInternal ? undefined : '_blank'}
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-white font-medium leading-relaxed max-w-[300px] break-words">
                        <FormattedText text={msg.text} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Chips */}
              {isLastModelMsg && msg.chips && msg.chips.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-12 mt-1">
                  {msg.chips.map((chip) => (
                    <button
                      type="button"
                      key={chip.id}
                      onClick={() => void submitMessage(chip.label)}
                      className="text-[13px] font-semibold text-zinc-600 bg-white border border-zinc-200 px-4 py-3 min-h-12 rounded-xl shadow-sm hover:shadow hover:border-brand-vibrant/30 hover:text-brand-vibrant hover:-translate-y-0.5 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div data-testid="chat-typing-indicator" className="flex items-end gap-3 z-10 relative">
            <div className="size-9 bg-white rounded-full border border-zinc-100 text-brand-vibrant flex items-center justify-center shadow-sm">
              <Robot className="size-5" weight="fill" />
            </div>
            <div className="bg-white px-4 py-3 border border-zinc-100 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2.5">
              <CircleNotch className="size-4 animate-spin text-brand-vibrant" weight="bold" />
              <span className="text-xs font-medium text-zinc-400">Anhangá digitando…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-5 bg-white border-t border-zinc-100 shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="relative flex items-end bg-zinc-50 border border-zinc-200 rounded-2xl focus-within:border-brand-vibrant/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-vibrant/10 transition">
          <label htmlFor="chat-textarea" className="sr-only">Sua mensagem</label>
          <textarea
            id="chat-textarea"
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida aqui..."
            rows={1}
            className="flex-1 max-h-[120px] pl-4 pr-[50px] py-4 bg-transparent outline-none text-sm text-zinc-700 font-medium placeholder-zinc-400 resize-none overflow-y-auto w-full leading-snug"
          />
          <button
            type="button"
            onClick={() => void submitMessage(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-1 min-h-12 min-w-12 flex items-center justify-center bg-brand-vibrant text-white rounded-[10px] shadow-sm hover:bg-brand-blue hover:shadow-md transition disabled:opacity-0 disabled:scale-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-vibrant/50"
            aria-label="Enviar mensagem"
          >
            <PaperPlaneTilt className="size-5 ml-0.5" weight="fill" />
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-2">
          Nossa IA pode cometer erros. Confirme os dados no WhatsApp.
        </p>
      </div>
    </dialog>
  );
});

AIChatPanel.displayName = 'AIChatPanel';

export default AIChatPanel;
