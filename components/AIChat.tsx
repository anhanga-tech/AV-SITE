import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2, ExternalLink, Bot, User, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getTravelAdvice } from '../services/geminiService';
import { useLeadCapture } from '../hooks/useLeadCapture';

interface Message {
    role: 'user' | 'model';
    text: string;
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

// Componente simples para renderizar Markdown básico (Negrito e Quebras de linha)
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    // Divide por quebras de linha para criar parágrafos
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');

    return (
        <div className="space-y-2">
            {paragraphs.map((paragraph, idx) => {
                // Tratamento básico para listas
                const isList = paragraph.trim().startsWith('-');
                const cleanText = isList ? paragraph.replace('-', '').trim() : paragraph;
                
                // Processa negrito (**texto**)
                const parts = cleanText.split(/(\*\*.*?\*\*)/g);
                
                const content = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });

                if (isList) {
                    return (
                        <div key={idx} className="flex items-start gap-2 ml-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 shrink-0 opacity-60"></span>
                            <span>{content}</span>
                        </div>
                    );
                }

                return <p key={idx} className="leading-relaxed">{content}</p>;
            })}
        </div>
    );
};

// Card de finalização do lead + handoff para WhatsApp
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
        <div className="max-w-[85%] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow">
            <div className="bg-brand-vibrant/5 p-4 border-b border-brand-vibrant/10 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-bold text-brand-dark">Link Gerado</span>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Sua solicitação para <strong>{destination}</strong> está pronta. Finalize seus dados para seguir no WhatsApp com nossa equipe.
                </p>

                <div className="grid grid-cols-1 gap-2 mb-3">
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Nome"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Sobrenome"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="E-mail"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                </div>

                {localError && (
                    <p className="text-xs text-red-500 mb-3">{localError}</p>
                )}

                {notice && (
                    <p className="text-xs text-amber-600 mb-3">{notice}</p>
                )}

                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isSubmittingLead}
                    className={`btn-whatsapp btn-specialist flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-green-500/30 text-sm group-hover:scale-[1.02] ${isSubmittingLead ? 'opacity-90 cursor-wait' : ''}`}
                >
                    {isSubmittingLead ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="truncate">Salvando lead...</span>
                        </>
                    ) : (
                        <>
                            <span className="truncate">Salvar e continuar no WhatsApp</span>
                            <ExternalLink className="w-4 h-4" />
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
    { role: 'model', text: 'Olá! Sou a IA da Anhangá ✈️. \n\nPosso te ajudar com:\n- Dicas de roteiros exclusivos\n- Dúvidas sobre nossos serviços\n- Preparar um **orçamento personalizado**\n\nComo posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const { setLeadDraft, submitLead, isSubmitting: isSubmittingLead } = useLeadCapture();

  // Sync messages with ref to avoid stale closures in event listeners
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleFinalizeLead = async (payload: LeadFinalizePayload): Promise<LeadFinalizeResult> => {
    setLeadDraft({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      bantSummary: payload.bantSummary,
    });

    const result = await submitLead({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      bantSummary: payload.bantSummary,
    });

    if (result.ok) {
      return { ok: true, url: result.whatsappUrl, notice: result.warning };
    }

    if (result.code === 'HUBSPOT_DUPLICATE_CONTACT') {
      return {
        ok: true,
        url: payload.fallbackUrl,
        notice: 'Seu contato já estava cadastrado. Vamos continuar no WhatsApp.',
      };
    }

    return {
      ok: false,
      error: result.error || 'Não foi possível salvar seu lead agora. Tente novamente.',
    };
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userText = text;
    
    const newHistory: Message[] = [...messagesRef.current, { role: 'user', text: userText }];
    setMessages(newHistory);
    setIsLoading(true);

    const response = await getTravelAdvice(newHistory);
    
    setIsLoading(false);

    if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
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

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    submitMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  // Custom Event Listener to open/toggle chat from other components
  useEffect(() => {
    const handleToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { detail } = customEvent;
      setIsOpen(true);
      if (detail?.message) {
        // Wait a bit for the transition to start before sending context
        setTimeout(() => {
            submitMessage(detail.message);
        }, 300);
      }
    };

    window.addEventListener('toggle-ai-chat', handleToggle);
    return () => window.removeEventListener('toggle-ai-chat', handleToggle);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end font-sans">
      {isOpen && (
        <div 
            className="mb-4 w-[90vw] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 animate-fade-in-up origin-bottom-right" 
            style={{ height: '600px', maxHeight: '75vh' }}
            role="dialog"
            aria-label="Assistente Virtual de Viagem"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-brand-vibrant to-brand-blue p-5 text-white flex justify-between items-center shrink-0 shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <Sparkles className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              </div>
              <div>
                  <span className="font-bold block text-base tracking-wide">Assistente Anhangá</span>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                    </span>
                    <span className="text-xs font-medium">Online agora</span>
                  </div>
              </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/20 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Minimizar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-6 scroll-smooth">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-brand-dark border-gray-700 text-white' 
                    : 'bg-white border-gray-200 text-brand-vibrant'
                }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                {msg.isAction ? (
                    // Renderiza Card de Orçamento (Action Ticket)
                    <ChatActionButton 
                        fallbackUrl={msg.actionData?.url || '#'}
                        destination={msg.actionData?.destination} 
                        defaultBantSummary={msg.actionData?.bantSummary}
                        onFinalizeLead={handleFinalizeLead}
                        isSubmittingLead={isSubmittingLead}
                    />
                ) : (
                    // Renderiza Texto Normal com Formatação
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand-vibrant text-white rounded-br-none' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                    }`}>
                      {msg.role === 'model' ? (
                        <ReactMarkdown className="prose prose-sm max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-p:m-0 prose-p:mb-2 last:prose-p:mb-0 prose-strong:text-gray-900 prose-strong:font-bold prose-ul:text-gray-700 prose-li:text-gray-700 prose-li:m-0 prose-ul:my-2">
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        <FormattedText text={msg.text} />
                      )}
                    </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-brand-vibrant flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                 </div>
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-vibrant" />
                    <span className="text-xs text-gray-400 font-medium">Anhangá está digitando...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
             <div className="relative flex items-center bg-gray-100 rounded-2xl border border-transparent focus-within:border-brand-vibrant/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-vibrant/10 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Digite sua dúvida aqui..."
                  aria-label="Digite sua mensagem para o assistente virtual"
                  className="flex-1 pl-4 pr-12 py-3 bg-transparent focus:outline-none text-sm text-gray-800 placeholder-gray-400"
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 bg-brand-vibrant text-white rounded-xl hover:bg-brand-blue transition-all disabled:opacity-0 disabled:scale-75 focus:outline-none shadow-md"
                  aria-label="Enviar mensagem"
                >
                  <Send className="w-4 h-4" />
                </button>
             </div>
             <p className="text-[10px] text-center text-gray-400 mt-2">
                Nossa IA pode cometer erros. Confirme os dados com o agente.
             </p>
          </div>
        </div>
      )}

      {/* Floating Toggle Button - Optimized for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            group flex items-center justify-center gap-3 
            bg-brand-vibrant hover:bg-brand-blue text-white 
            shadow-2xl hover:shadow-brand-vibrant/50
            transition-all duration-300 transform hover:scale-110 active:scale-95 
            focus:outline-none focus:ring-4 focus:ring-brand-vibrant/50 
            z-[100]
            /* Mobile: Circular & Larger Touch Target */
            w-14 h-14 rounded-full p-0
            /* Desktop: Pill Shape */
            sm:w-auto sm:h-auto sm:rounded-full sm:pl-5 sm:pr-6 sm:py-3.5
            ${isOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}
        `}
        aria-label="Abrir assistente virtual"
      >
        {/* Mobile Pulse Effect */}
        <span className="absolute inset-0 rounded-full bg-brand-vibrant opacity-30 animate-ping sm:hidden"></span>

        <div className="relative flex items-center justify-center">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-vibrant animate-pulse sm:top-0 sm:right-0 sm:w-2.5 sm:h-2.5"></span>
        </div>
        
        {/* Text Hidden on Mobile, Visible on Desktop */}
        <div className="text-left hidden sm:block">
            <span className="block text-[10px] font-medium text-brand-yellow uppercase tracking-wider">Online</span>
            <span className="block text-sm font-bold leading-none">Ajuda & Cotação</span>
        </div>
      </button>
    </div>
  );
};

export default AIChat;
