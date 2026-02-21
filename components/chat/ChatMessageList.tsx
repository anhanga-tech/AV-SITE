import React, { useState } from 'react';
import { Bot, CheckCircle2, ExternalLink, Loader2, User } from 'lucide-react';
import type { ChatMessage, HandoffData } from '../../hooks/useChatSession';

export interface LeadFinalizePayload {
    firstName: string;
    lastName: string;
    email: string;
    bantSummary: string;
    fallbackUrl: string;
}

export type LeadFinalizeResult =
    | { ok: true; url: string; notice?: string }
    | { ok: false; error: string };

interface ChatMessageListProps {
    mode: 'hero' | 'widget';
    messages: ChatMessage[];
    handoff: HandoffData | null;
    isSubmittingLead: boolean;
    onFinalizeLead: (payload: LeadFinalizePayload) => Promise<LeadFinalizeResult>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
    const paragraphs = text.split('\n').filter((paragraph) => paragraph.trim() !== '');

    return (
        <div className="space-y-2">
            {paragraphs.map((paragraph, index) => {
                const isList = paragraph.trim().startsWith('-');
                const cleanText = isList ? paragraph.replace('-', '').trim() : paragraph;
                const parts = cleanText.split(/(\*\*.*?\*\*)/g);

                const content = parts.map((part, partIndex) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={partIndex} className="font-bold">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    }

                    return part;
                });

                if (isList) {
                    return (
                        <div key={index} className="flex items-start gap-2 ml-1">
                            <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 shrink-0 opacity-60" />
                            <span>{content}</span>
                        </div>
                    );
                }

                return (
                    <p key={index} className="leading-relaxed">
                        {content}
                    </p>
                );
            })}
        </div>
    );
};

const ChatLeadHandoffCard: React.FC<{
    mode: 'hero' | 'widget';
    handoff: HandoffData;
    isSubmittingLead: boolean;
    onFinalizeLead: (payload: LeadFinalizePayload) => Promise<LeadFinalizeResult>;
}> = ({ mode, handoff, isSubmittingLead, onFinalizeLead }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setLocalError(null);
        setNotice(null);

        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
            setLocalError('Preencha nome, sobrenome e e-mail para finalizar.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setLocalError('Informe um e-mail válido.');
            return;
        }

        const result = await onFinalizeLead({
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            email: normalizedEmail,
            bantSummary: handoff.bantSummary,
            fallbackUrl: handoff.url,
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
        <div className={mode === 'hero'
            ? 'max-w-[95%] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg'
            : 'max-w-[85%] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg'}
        >
            <div className="bg-brand-vibrant/5 p-4 border-b border-brand-vibrant/10 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-bold text-brand-dark">Link Gerado</span>
            </div>

            <div className="p-4">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Sua solicitação para <strong>{handoff.destination}</strong> está pronta. Finalize seus dados para seguir no WhatsApp com nossa equipe.
                </p>

                <div className="grid grid-cols-1 gap-2 mb-3">
                    <input
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="Nome"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                    <input
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Sobrenome"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="E-mail"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-vibrant/30 focus:border-brand-vibrant/50"
                    />
                </div>

                {localError && <p className="text-xs text-red-500 mb-3">{localError}</p>}
                {notice && <p className="text-xs text-amber-600 mb-3">{notice}</p>}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmittingLead}
                    className={`btn-whatsapp btn-specialist flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-green-500/30 text-sm ${isSubmittingLead ? 'opacity-90 cursor-wait' : ''}`}
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

const ChatMessageList: React.FC<ChatMessageListProps> = ({
    mode,
    messages,
    handoff,
    isSubmittingLead,
    onFinalizeLead,
    messagesEndRef,
}) => {
    const listClassName = mode === 'hero'
        ? 'flex-1 overflow-y-auto p-3 space-y-4 bg-white/5'
        : 'flex-1 overflow-y-auto p-5 bg-slate-50 space-y-6 scroll-smooth';

    return (
        <div className={listClassName} aria-live="polite">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex items-end gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                        message.role === 'user'
                            ? 'bg-brand-dark border-gray-700 text-white'
                            : mode === 'hero'
                                ? 'bg-white/90 border-white/70 text-brand-vibrant'
                                : 'bg-white border-gray-200 text-brand-vibrant'
                    }`}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                    </div>

                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                        message.role === 'user'
                            ? 'bg-brand-vibrant text-white rounded-br-none'
                            : mode === 'hero'
                                ? 'bg-white/95 text-gray-700 border border-white/80 rounded-bl-none'
                                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                    }`}>
                        <FormattedText text={message.text} />
                    </div>
                </div>
            ))}

            {handoff && (
                <div className="flex items-end gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${mode === 'hero' ? 'bg-white/90 border-white/70 text-brand-vibrant' : 'bg-white border-gray-200 text-brand-vibrant'}`}>
                        <Bot className="w-5 h-5" />
                    </div>
                    <ChatLeadHandoffCard
                        mode={mode}
                        handoff={handoff}
                        isSubmittingLead={isSubmittingLead}
                        onFinalizeLead={onFinalizeLead}
                    />
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessageList;
