import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, ExternalLink, Bot, User, CheckCircle2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getTravelAdvice } from '../services/geminiService';
import { useLeadCapture } from '../hooks/useLeadCapture';

interface Message {
  role: 'user' | 'model';
  text: string;
  chips?: string[];
  isAction?: boolean;
  actionData?: {
    url: string;
    destination: string;
    bantSummary: string;
  };
}

interface LeadFinalizePayload {
  firstName: string;
  lastName: string;
  email: string;
  bantSummary: string;
  fallbackUrl: string;
}

type LeadFinalizeResult =
  | { ok: true; url: string; notice?: string }
  | { ok: false; error: string };

// Formatted text for Markdown
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="space-y-3 font-sans">
      {paragraphs.map((paragraph, idx) => {
        const isList = paragraph.trim().startsWith('-');
        const cleanText = isList ? paragraph.replace('-', '').trim() : paragraph;

        const parts = cleanText.split(/(\*\*.*?\*\*)/g);

        const content = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isList) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 bg-brand-vibrant rounded-full opacity-70"></span>
              <span className="leading-relaxed text-gray-700">{content}</span>
            </div>
          );
        }

        return <p key={idx} className="leading-relaxed text-gray-700">{content}</p>;
      })}
    </div>
  );
};

// Lead action card
const ChatActionButton: React.FC<{
  fallbackUrl: string;
  destination?: string;
  defaultBantSummary?: string;
  isSubmittingLead: boolean;
  onFinalizeLead: (payload: LeadFinalizePayload) => Promise<LeadFinalizeResult>;
}> = ({ fallbackUrl, destination, defaultBantSummary, isSubmittingLead, onFinalizeLead }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLocalError(null);
    setNotice(null);

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
      setLocalError('Preencha nome, sobrenome e e-mail para finalizar.');
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isEmailValid) {
      setLocalError('Informe um e-mail válido.');
      return;
    }

    const result = await onFinalizeLead({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      bantSummary: defaultBantSummary || 'Não informado',
      fallbackUrl,
    });

    if (!result.ok) {
      setLocalError(result.error);
      return;
    }

    if (result.notice) {
      setNotice(result.notice);
    }

    window.open(result.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-blue/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full overflow-hidden transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1">
      <div className="bg-gradient-to-r from-brand-vibrant/10 to-transparent p-3 flex items-center gap-2 border-b border-gray-100">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <span className="text-sm font-bold tracking-wide text-brand-dark uppercase">
          Link Gerado
        </span>
      </div>
      <div className="p-5 bg-gradient-to-br from-white to-slate-50/50">
        <p className="text-sm text-gray-600 mb-5 font-medium leading-relaxed">
          Sua solicitação para <strong className="font-bold text-brand-vibrant relative px-1"><span className="absolute inset-0 bg-brand-yellow/20 -skew-x-6 rounded"></span><span className="relative">{destination}</span></strong> está pronta. Finalize seus dados:
        </p>

        <div className="space-y-3 mb-5">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Nome"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Sobrenome"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant transition-all shadow-sm"
          />
        </div>

        {localError && (
          <div className="bg-red-50/80 text-red-600 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-red-100">
            {localError}
          </div>
        )}
        {notice && (
          <div className="bg-amber-50/80 text-amber-700 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-amber-100">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={isSubmittingLead}
          className={`group flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all ${isSubmittingLead ? 'opacity-90 cursor-wait' : ''}`}
        >
          {isSubmittingLead ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-4 h-4 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu guia Anhangá 🧭.\n\nPosso te ajudar com:\n- Roteiros exclusivos\n- Dúvidas sobre o destino\n- **Orçamento personalizado**\n\nVamos começar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const { setLeadDraft, submitLead, isSubmitting: isSubmittingLead } = useLeadCapture();

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
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleFinalizeLead = async (payload: LeadFinalizePayload): Promise<LeadFinalizeResult> => {
    setLeadDraft({ ...payload });
    const result = await submitLead({ ...payload });

    if (result.ok) {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'form_submission',
          form_type: 'ai_chatbot_lead',
          destination: payload.fallbackUrl.includes('whatsapp') ? 'whatsapp' : 'lead_captured',
          page_location: window.location.href
        });
      }
      return { ok: true, url: result.whatsappUrl, notice: result.warning };
    }

    const errorResult = result as { ok: false; error: string; code: string };
    if (errorResult.code === 'HUBSPOT_DUPLICATE_CONTACT') {
      return {
        ok: true,
        url: payload.fallbackUrl,
        notice: 'Seu contato já estava cadastrado. Vamos continuar.',
      };
    }
    return { ok: false, error: errorResult.error || 'Erro ao salvar dados.' };
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newHistory: Message[] = [...messagesRef.current, { role: 'user', text }];
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

    if (response.text) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: response.text || '',
        chips: response.chips
      }]);
    }

    if (response.budgetLink) {
      setLeadDraft({
        bantSummary: response.budgetLink.bantSummary,
        origin: response.budgetLink.origin,
        destination: response.budgetLink.destination,
        dates: response.budgetLink.dates,
        baggagePreference: response.budgetLink.baggagePreference || '',
      });

      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Orçamento Pronto',
        isAction: true,
        actionData: {
          url: response.budgetLink!.url,
          destination: response.budgetLink!.destination,
          bantSummary: response.budgetLink!.bantSummary
        }
      }]);
    }
  };

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

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail?.message) {
        setTimeout(() => submitMessage(customEvent.detail.message), 400);
      }
    };
    window.addEventListener('toggle-ai-chat', handleToggle);
    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, []);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${isOpen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'} 
                    bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9990]
                    flex items-center justify-center gap-3 
                    bg-brand-vibrant text-white 
                    shadow-[0_8px_30px_rgba(255,107,53,0.3)] hover:shadow-[0_8px_30px_rgba(255,107,53,0.5)] hover:-translate-y-1
                    transition-all duration-300
                    w-16 h-16 rounded-2xl sm:w-auto sm:h-auto sm:px-6 sm:py-3.5 sm:rounded-full
                    focus:outline-none focus:ring-4 focus:ring-brand-vibrant/30`}
        aria-label="Abrir assistente virtual"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-brand-vibrant"></span>
        </div>

        <div className="text-left hidden sm:flex sm:flex-col">
          <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase opacity-90">Roteiro IA</span>
          <span className="text-sm font-bold leading-none capitalize mt-0.5">Ajuda & Cotação</span>
        </div>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 ease-in-out bg-brand-dark/20 backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel - Soft Scrapbook Geometry */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] z-[9999] bg-[#fdfdfc] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] sm:rounded-l-[2rem] overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        role="dialog"
        aria-label="Assistente Virtual Anhangá"
      >
        {/* Header - Scrapbook Softness */}
        <div className="bg-white/80 backdrop-blur-md px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0 z-10">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-[1.25rem] flex items-center justify-center shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
              <Sparkles className="w-6 h-6 text-brand-vibrant" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-brand-dark tracking-tight leading-none">
                Hub Anhangá
              </h2>
              <div className="flex items-center gap-1.5 mt-1 opacity-80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Assistente Online
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2.5 transition-colors focus:outline-none"
            aria-label="Fechar gaveta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area - Scrapbook vibe */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#fdfdfc] relative">
          {/* Fundo suave */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          {messages.map((msg, idx) => {
            const isLastModelMsg = msg.role === 'model' && idx === messages.map(m => m.role).lastIndexOf('model');

            return (
              <div key={idx} className={`relative flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} z-10`}>
                <div className={`flex items-end gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-9 h-9 flex items-center justify-center shrink-0 rounded-full shadow-sm ${msg.role === 'user'
                    ? 'bg-brand-dark text-white'
                    : 'bg-white text-brand-vibrant border border-gray-100'
                    }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  {msg.isAction ? (
                    <div className="w-full">
                      <ChatActionButton
                        fallbackUrl={msg.actionData?.url || '#'}
                        destination={msg.actionData?.destination}
                        defaultBantSummary={msg.actionData?.bantSummary}
                        onFinalizeLead={handleFinalizeLead}
                        isSubmittingLead={isSubmittingLead}
                      />
                    </div>
                  ) : (
                    <div className={`p-4 text-sm shadow-sm ${msg.role === 'user'
                      ? 'bg-brand-vibrant text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'
                      }`}>
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-bold prose-ul:text-gray-700">
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
                    {msg.chips.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => submitMessage(chip)}
                        className="text-[12px] font-semibold text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hover:shadow hover:border-brand-vibrant/30 hover:text-brand-vibrant hover:-translate-y-0.5 transition-all text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-end gap-3 z-10 relative">
              <div className="w-9 h-9 bg-white rounded-full border border-gray-100 text-brand-vibrant flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white px-4 py-3 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-brand-vibrant" />
                <span className="text-xs font-medium text-gray-400">Anhangá digitando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div className="relative flex items-end bg-slate-50 border border-gray-200 rounded-2xl focus-within:border-brand-vibrant/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-vibrant/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua dúvida aqui..."
              rows={1}
              className="flex-1 max-h-[120px] pl-4 pr-[50px] py-4 bg-transparent outline-none text-sm text-gray-700 font-medium placeholder-gray-400 resize-none overflow-y-auto w-full leading-snug"
            />
            <button
              onClick={() => submitMessage(input)}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2.5 bg-brand-vibrant text-white rounded-[10px] shadow-sm hover:bg-brand-blue hover:shadow-md transition-all disabled:opacity-0 disabled:scale-75 focus:outline-none"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Nossa IA pode cometer erros. Confirme os dados no WhatsApp.
          </p>
        </div>
      </div>
    </>
  );
};

export default AIChat;
