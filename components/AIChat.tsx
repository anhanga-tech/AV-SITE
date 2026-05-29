import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChatCircleDots,
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
import { ChatLeadForm, type LeadFinalizePayload, type LeadFinalizeResult } from './ChatLeadForm';
import type { SubmitLeadRequest } from '../types/leadCapture';
import { triggerHaptic } from '../utils/haptics';

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
 * AIChat Component - Optimized for high-frequency interactions.
 *
 * PERFORMANCE WIN:
 * 1. Memoized sub-components and logic to ensure that typing in the input
 *    field doesn't cause expensive re-calculations of the entire message history.
 * 2. Pre-calculates the last model message index once per update (O(N))
 *    instead of within the render loop (O(N^2)).
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const AIChat: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Olá! Sou seu guia Anhangá 🧭.\n\nPosso te ajudar com:\n- Roteiros exclusivos\n- Dúvidas sobre o destino\n- **Orçamento personalizado**\n\nVamos começar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const {
    getLeadWhatsAppUrl,
    prepareLeadSubmitPayload,
    setLeadDraft,
    submitLead,
    isSubmitting: isSubmittingLead,
  } = useLeadCapture();
  const location = useLocation();
  const navigate = useNavigate();
  const isOrlandoPage = location.pathname.startsWith('/orlando');

  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const prevMessagesCount = useRef(messages.length);

  // PERFORMANCE: Pre-calculate the index of the last model message to avoid O(N^2)
  // lookup inside the render loop's map function.
  const lastModelIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model') return i;
    }
    return -1;
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      const newModelMessages = messages
        .slice(prevMessagesCount.current)
        .filter(m => m.role === 'model' && !m.isAction);

      if (newModelMessages.length > 0) {
        const fullText = newModelMessages.map(m => m.text).join(' ');
        setLiveAnnouncement(fullText.replace(/\*\*|\*|- /g, ''));
      }
    }
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
    if (isOpen) {
      // Focus the drawer panel itself to ensure screen readers announce it immediately
      drawerRef.current?.focus();
    }
  }, [isOpen]);

  const openChatDrawer = (enableHaptics: boolean = true) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    if (enableHaptics) {
      void triggerHaptic('light');
    }
    setIsOpen(true);
  };

  const closeChatDrawer = (enableHaptics: boolean = true) => {
    if (enableHaptics) {
      void triggerHaptic('light');
    }
    setIsOpen(false);
    triggerRef.current?.focus();
  };

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
    const result = await submitLead(payload, { pushDataLayerEvent: false });

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

    const newHistory: Message[] = [...messagesRef.current, { id: crypto.randomUUID(), role: 'user', text }];
    setMessages(newHistory);
    setInput('');

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // reset height
      }
    }, 0);

    setIsLoading(true);

    const response = await getTravelAdvice(newHistory);
    setIsLoading(false);

    const nextMessages: Message[] = [];

    if (response.text) {
      nextMessages.push({
        id: crypto.randomUUID(),
        role: 'model',
        text: response.text || '',
        chips: response.chips?.map((label) => ({
          id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
      submitMessage(input);
    }
  };

  // Focus Trapping Logic
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChatDrawer();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      openChatDrawer(false);
      if (customEvent.detail?.message) {
        setTimeout(() => submitMessageRef.current(customEvent.detail.message, false), 400);
      }
    };
    window.addEventListener('toggle-ai-chat', handleToggle);

    // Deep-link support — open chat and optionally pre-fill a destination message
    const CHAT_URL_PARAM = 'chat';
    const DESTINATION_URL_PARAM = 'destino';
    // Delay message until after the drawer slide-in animation (duration-500) completes
    const DEEP_LINK_MESSAGE_DELAY_MS = 600;

    const searchParams = new URLSearchParams(location.search);
    const chatParam = searchParams.get(CHAT_URL_PARAM);
    const destinationParam = searchParams.get(DESTINATION_URL_PARAM);

    if (chatParam === 'open') {
      setIsOpen(true);

      if (destinationParam) {
        // Sanitize: allow only letters (incl. accented), spaces, hyphens, and apostrophes
        // to prevent prompt injection attacks via the URL parameter
        const sanitizedDestination = destinationParam
          .trim()
          .slice(0, 100)
          .replace(/[^\p{L}\s\-']/gu, '');

        if (sanitizedDestination) {
          const message = `Olá! Gostaria de informações sobre viagem para ${sanitizedDestination}.`;
          setTimeout(() => submitMessageRef.current(message, false), DEEP_LINK_MESSAGE_DELAY_MS);
        }
      }

      // Clean URL — remove params to avoid re-triggering on navigation
      searchParams.delete(CHAT_URL_PARAM);
      searchParams.delete(DESTINATION_URL_PARAM);
      const newSearch = searchParams.toString();
      const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
      navigate(newPath, { replace: true });
    }

    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, [location, navigate]);

  // Deep-link handling (chat=1, m/message, destino)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenChat = urlParams.get('chat') === '1';

    if (shouldOpenChat) {
      setIsOpen(true);

      const customMessage = urlParams.get('m') || urlParams.get('message');
      const destination = urlParams.get('destino');

      // Pré-preenche o input em vez de auto-enviar para evitar prompt injection
      if (customMessage) {
        setInput(customMessage);
      } else if (destination) {
        setInput(`Olá! Gostaria de um roteiro personalizado para ${destination}.`);
      }

      // Remove apenas os parâmetros de deep-link, preservando UTMs e outros params de rastreamento
      ['chat', 'm', 'message', 'destino'].forEach(p => urlParams.delete(p));
      const newSearch = urlParams.toString();
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash);
    }
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => openChatDrawer()}
        className={`fixed ${isOpen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
                    bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9990]
                    flex items-center justify-center gap-3
                    bg-brand-vibrant text-white
                    shadow-[0_8px_30px_theme(colors.brand.cyan/30%)] hover:shadow-[0_8px_30px_theme(colors.brand.cyan/50%)] hover:-translate-y-1
                    transition duration-300
                    size-16 rounded-2xl sm:w-auto sm:h-auto sm:px-6 sm:py-3.5 sm:rounded-full
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-vibrant/30
                    ${isOrlandoPage ? 'orlando-chat-glow' : ''}`}
        aria-label="Abrir assistente virtual"
      >
        <div className="relative flex items-center justify-center">
          <ChatCircleDots className="size-7" weight="fill" />
          <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-pulse border-2 border-brand-vibrant"></span>
        </div>

        <div className="text-left hidden sm:flex sm:flex-col">
          <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase opacity-90">Roteiro IA</span>
          <span className="text-sm font-bold leading-none capitalize mt-0.5">Ajuda & Cotação</span>
        </div>
      </button>

      {/* Backdrop Overlay */}
      <div
        role="presentation"
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 ease-in-out bg-brand-dark/20 backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => closeChatDrawer()}
      />

      {/* Drawer Panel - Soft Scrapbook Geometry */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] z-[9999] bg-white flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] sm:rounded-l-[2rem] overflow-hidden outline-none ${isOpen ? 'translate-x-0 visible opacity-100' : 'translate-x-full invisible opacity-0'
          }`}
        role="dialog"
        aria-modal="true"
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
            onClick={() => closeChatDrawer()}
            className="text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-full p-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant"
            aria-label="Fechar gaveta"
          >
            <X className="size-5" weight="bold" />
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
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
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
                        onClick={() => submitMessage(chip.label)}
                        className="text-[12px] font-semibold text-zinc-600 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-sm hover:shadow hover:border-brand-vibrant/30 hover:text-brand-vibrant hover:-translate-y-0.5 transition text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/50"
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
              onClick={() => submitMessage(input)}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2.5 bg-brand-vibrant text-white rounded-[10px] shadow-sm hover:bg-brand-blue hover:shadow-md transition disabled:opacity-0 disabled:scale-75 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-vibrant/50"
              aria-label="Enviar mensagem"
            >
              <PaperPlaneTilt className="size-4 ml-0.5" weight="fill" />
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-400 mt-2">
            Nossa IA pode cometer erros. Confirme os dados no WhatsApp.
          </p>
        </div>
      </div>
    </>
  );
});

AIChat.displayName = 'AIChat';

export default AIChat;
