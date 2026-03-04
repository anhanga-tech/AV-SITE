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
            return <strong key={i} className="font-extrabold text-brand-dark tracking-tight">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isList) {
          return (
            <div key={idx} className="flex items-start gap-3 ml-2">
              <span className="shrink-0 mt-1">
                <ChevronRight className="w-4 h-4 text-brand-vibrant" />
              </span>
              <span className="leading-relaxed text-gray-800">{content}</span>
            </div>
          );
        }

        return <p key={idx} className="leading-relaxed text-gray-800">{content}</p>;
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
      setLocalError('PREENCHA NOME, SOBRENOME E E-MAIL PARA FINALIZAR.');
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isEmailValid) {
      setLocalError('INFORME UM E-MAIL VÁLIDO.');
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
    <div className="bg-white border-2 border-brand-dark shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full">
      <div className="bg-brand-vibrant p-3 border-b-2 border-brand-dark flex items-center justify-between">
        <span className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-brand-dark fill-white" />
          LINK GERADO
        </span>
      </div>
      <div className="p-5">
        <p className="text-sm text-brand-dark mb-5 font-medium leading-relaxed">
          Sua solicitação para <strong className="font-black bg-brand-yellow/30 px-1">{destination}</strong> está pronta. Finalize seus dados:
        </p>

        <div className="space-y-3 mb-5">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="NOME"
            className="w-full bg-slate-50 border-2 border-gray-300 px-4 py-3 text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:border-brand-vibrant focus:bg-white transition-colors"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="SOBRENOME"
            className="w-full bg-slate-50 border-2 border-gray-300 px-4 py-3 text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:border-brand-vibrant focus:bg-white transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-MAIL"
            className="w-full bg-slate-50 border-2 border-gray-300 px-4 py-3 text-sm font-bold uppercase placeholder-gray-400 focus:outline-none focus:border-brand-vibrant focus:bg-white transition-colors"
          />
        </div>

        {localError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 text-xs font-bold mb-4">
            {localError}
          </div>
        )}
        {notice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 text-xs font-bold mb-4">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={isSubmittingLead}
          className={`flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase tracking-wide py-4 px-4 border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${isSubmittingLead ? 'opacity-90 cursor-wait' : ''}`}
        >
          {isSubmittingLead ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>SALVANDO...</span>
            </>
          ) : (
            <>
              <span>ABRIR WHATSAPP</span>
              <ExternalLink className="w-5 h-5" />
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
        notice: 'SEU CONTATO JÁ ESTAVA CADASTRADO. VAMOS CONTINUAR.',
      };
    }
    return { ok: false, error: errorResult.error || 'ERRO AO SALVAR DADOS.' };
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
                    bg-brand-dark text-white 
                    shadow-[6px_6px_0px_rgba(33,53,88,0.2)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]
                    transition-all duration-300 border-2 border-brand-dark 
                    w-16 h-16 rounded-none sm:w-auto sm:h-auto sm:px-6 sm:py-4
                    focus:outline-none focus:ring-4 focus:ring-brand-vibrant/30`}
        aria-label="Abrir assistente virtual"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-brand-yellow" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-vibrant border-2 border-brand-dark animate-pulse"></span>
        </div>

        <div className="text-left hidden sm:flex sm:flex-col">
          <span className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">ROTEIRO IA</span>
          <span className="text-sm font-black leading-none uppercase tracking-wide mt-1">AJUDA & COTAÇÃO</span>
        </div>
      </button>

      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-[9998] transition-opacity duration-500 ease-in-out bg-brand-dark/60 backdrop-blur-sm ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[500px] z-[9999] bg-slate-50 border-l-4 border-brand-dark flex flex-col shadow-2xl transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        role="dialog"
        aria-label="Assistente Virtual Anhangá"
      >
        {/* Header (Brutalist) */}
        <div className="bg-brand-vibrant px-6 py-6 border-b-4 border-brand-dark flex justify-between items-start shrink-0">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-brand-dark border-2 border-white flex items-center justify-center rotate-3 hover:rotate-0 transition-transform">
              <Sparkles className="w-7 h-7 text-brand-yellow fill-brand-yellow" />
            </div>
            <div>
              <h2 className="font-black text-xl text-brand-dark uppercase tracking-wider leading-none">HUB ANHANGÁ</h2>
              <span className="inline-block mt-2 font-bold text-[10px] px-2 py-0.5 bg-brand-dark text-white uppercase tracking-widest break-words relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                IA ONLINE
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-brand-dark text-white hover:bg-white hover:text-brand-dark border-2 border-transparent hover:border-brand-dark p-2 transition-colors focus:outline-none"
            aria-label="Fechar drawer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[url('/noise.png')] bg-repeat" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          {messages.map((msg, idx) => {
            const isLastModelMsg = msg.role === 'model' && idx === messages.map(m => m.role).lastIndexOf('model');

            return (
              <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 border-2 border-brand-dark ${msg.role === 'user'
                      ? 'bg-brand-vibrant text-white'
                      : 'bg-white text-brand-vibrant shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                    }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
                  </div>

                  {/* Bubble */}
                  {msg.isAction ? (
                    <ChatActionButton
                      fallbackUrl={msg.actionData?.url || '#'}
                      destination={msg.actionData?.destination}
                      defaultBantSummary={msg.actionData?.bantSummary}
                      onFinalizeLead={handleFinalizeLead}
                      isSubmittingLead={isSubmittingLead}
                    />
                  ) : (
                    <div className={`p-5 text-sm ${msg.role === 'user'
                        ? 'bg-brand-dark text-white border-2 border-brand-dark shadow-[4px_4px_0px_rgba(255,107,53,1)]'
                        : 'bg-white text-brand-dark border-2 border-brand-dark shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                      }`}>
                      {msg.role === 'model' ? (
                        <div className="prose prose-sm max-w-none prose-p:text-gray-800 prose-strong:text-brand-dark prose-strong:font-black prose-ul:text-gray-800">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <FormattedText text={msg.text} />
                      )}
                    </div>
                  )}
                </div>

                {/* Action Chips (Assigned only to the latest model message if they exist) */}
                {isLastModelMsg && msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-[52px] mt-2">
                    {msg.chips.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => submitMessage(chip)}
                        className="text-[11px] font-black uppercase tracking-wider px-3 py-2 bg-white text-brand-dark border-2 border-brand-dark shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-brand-vibrant hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-left"
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
            <div className="flex items-end gap-3">
              <div className="w-10 h-10 bg-white border-2 border-brand-dark text-brand-vibrant flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <Bot className="w-6 h-6" />
              </div>
              <div className="bg-white px-5 py-4 border-2 border-brand-dark shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-brand-vibrant" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">PROCESSANDO...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area (Textarea that expands) */}
        <div className="p-6 bg-white border-t-4 border-brand-dark shrink-0">
          <div className="relative flex items-end bg-slate-50 border-2 border-brand-dark flex-wrap shadow-[4px_4px_0px_rgba(0,0,0,0.1)] focus-within:shadow-[4px_4px_0px_rgba(255,107,53,0.5)] transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="ESCREVA SUA MENSAGEM..."
              rows={1}
              className="flex-1 max-h-[120px] pl-4 pr-[60px] py-4 bg-transparent outline-none text-sm text-brand-dark font-bold uppercase placeholder-gray-400 resize-none overflow-y-auto w-full"
            />
            <button
              onClick={() => submitMessage(input)}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-3 bg-brand-vibrant text-white border-2 border-brand-dark hover:bg-white hover:text-brand-vibrant transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              aria-label="Enviar mensagem"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChat;
