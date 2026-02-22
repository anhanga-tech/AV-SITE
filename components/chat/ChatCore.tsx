import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatChips from './ChatChips';
import ChatLeadForm from './ChatLeadForm';
import ChatHandoff from './ChatHandoff';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import { useChatSession } from '../../hooks/useChatSession';

interface ChatCoreProps {
    mode: 'hero' | 'widget';
    externalMessage?: string | null;
    onExternalMessageHandled?: () => void;
}

const HERO_INITIAL_BOT_MESSAGE = 'Para onde você sonha em ir? ✈️';

const HERO_PLACEHOLDER_OPTIONS = [
    'Para onde você sonha em ir?',
    'Maldivas...',
    'Fernando de Noronha...',
    'Orlando...',
];

const ChatCore: React.FC<ChatCoreProps> = ({ mode, externalMessage, onExternalMessageHandled }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [leadSubmitError, setLeadSubmitError] = useState<string | null>(null);
    const [cyclingPlaceholder, setCyclingPlaceholder] = useState(HERO_PLACEHOLDER_OPTIONS[0]);

    const {
        leadDraft,
        setLeadDraft,
        submitLead,
        isSubmitting: isSubmittingLead,
    } = useLeadCapture();

    const {
        phase,
        messages,
        isLoading,
        chips,
        pendingHandoff,
        handoff,
        sendMessage,
        completeLeadForm,
        resetSession,
    } = useChatSession({
        initialPhase: mode === 'hero' ? 'input' : 'conversation',
        initialAssistantMessage: mode === 'hero' ? HERO_INITIAL_BOT_MESSAGE : undefined,
    });

    const showConversation = phase === 'conversation';

    useEffect(() => {
        if (!showConversation) return;
        if (mode === 'hero') {
            // Hero: scroll the outer wrapper (overflow-y-auto container)
            const container = scrollContainerRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        } else {
            // Widget: scroll within the list's own overflow container
            const sentinel = messagesEndRef.current;
            if (!sentinel) return;
            const container = sentinel.parentElement;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [messages, isLoading, showConversation, mode]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 120);

        return () => window.clearTimeout(timer);
    }, [phase]);

    useEffect(() => {
        if (mode !== 'hero' || input.trim() !== '') return;

        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % HERO_PLACEHOLDER_OPTIONS.length;
            setCyclingPlaceholder(HERO_PLACEHOLDER_OPTIONS[index]);
        }, 2500);

        return () => clearInterval(interval);
    }, [mode, input]);

    useEffect(() => {
        if (!externalMessage?.trim()) return;

        const timer = window.setTimeout(() => {
            if (phase === 'lead-form' || phase === 'handoff') {
                resetSession();
                onExternalMessageHandled?.();
                return;
            }
            void sendMessage(externalMessage);
            onExternalMessageHandled?.();
        }, 220);

        return () => window.clearTimeout(timer);
    }, [externalMessage, onExternalMessageHandled, phase, resetSession, sendMessage]);

    const handleLeadSubmit = useCallback(async (data: {
        firstName: string;
        lastName: string;
        email: string;
        consent: boolean;
    }) => {
        if (!pendingHandoff) return;

        setLeadSubmitError(null);

        setLeadDraft({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            bantSummary: pendingHandoff.bantSummary,
            origin: pendingHandoff.origin,
            destination: pendingHandoff.destination,
            dates: pendingHandoff.dates,
            baggagePreference: pendingHandoff.baggagePreference || '',
        });

        const result = await submitLead({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            bantSummary: pendingHandoff.bantSummary,
            origin: pendingHandoff.origin,
            destination: pendingHandoff.destination,
            dates: pendingHandoff.dates,
            baggagePreference: pendingHandoff.baggagePreference || '',
        });

        if (result.ok) {
            completeLeadForm(pendingHandoff.whatsappUrl);
            return;
        }

        if (result.code === 'HUBSPOT_DUPLICATE_CONTACT') {
            completeLeadForm(pendingHandoff.whatsappUrl);
            return;
        }

        setLeadSubmitError(result.error || 'Não foi possível salvar seu lead agora. Tente novamente.');
    }, [completeLeadForm, pendingHandoff, setLeadDraft, submitLead]);

    const handleSend = useCallback(() => {
        const text = input.trim();
        if (!text) return;
        setInput('');
        void sendMessage(text);
    }, [input, sendMessage]);

    const handleChipSelect = useCallback((chip: string) => {
        setInput('');
        void sendMessage(chip);
    }, [sendMessage]);

    const handleResetQuote = useCallback(() => {
        setLeadSubmitError(null);
        setInput('');
        resetSession();
    }, [resetSession]);

    return (
        <div className={mode === 'hero' ? 'flex flex-col w-full' : 'flex flex-col h-full'}>
            {showConversation && (
                <div
                    ref={mode === 'hero' ? scrollContainerRef : undefined}
                    className={mode === 'hero'
                        ? 'transition-all duration-300 ease-in-out opacity-100 max-h-[260px] sm:max-h-[320px] min-h-[170px] sm:min-h-[190px] mb-3 overflow-y-auto rounded-sm bg-anhanga-darkBlue border-2 border-slate-900 shadow-hard-lg'
                        : 'flex-1'}
                >
                    <ChatMessageList
                        mode={mode}
                        messages={messages}
                        messagesEndRef={messagesEndRef}
                    />
                </div>
            )
            }

            {
                phase === 'lead-form' && pendingHandoff && (
                    <ChatLeadForm
                        onSubmit={handleLeadSubmit}
                        isSubmitting={isSubmittingLead}
                        error={leadSubmitError}
                        defaultValues={{
                            firstName: leadDraft.firstName,
                            lastName: leadDraft.lastName,
                            email: leadDraft.email,
                            consent: false,
                        }}
                    />
                )
            }

            {
                phase === 'handoff' && handoff && (
                    <ChatHandoff
                        whatsappUrl={handoff.whatsappUrl}
                        onReset={handleResetQuote}
                    />
                )
            }

            {
                (phase === 'input' || phase === 'conversation') && (
                    <>
                        <div className={mode === 'hero' ? 'px-1 pb-1 space-y-2' : 'px-4 pb-3 space-y-2 bg-white'}>
                            {showConversation && isLoading && <ChatTypingIndicator mode={mode} />}
                            {showConversation && (
                                <ChatChips
                                    mode={mode}
                                    chips={chips}
                                    disabled={isLoading}
                                    onSelect={handleChipSelect}
                                />
                            )}
                        </div>

                        <ChatInput
                            mode={mode}
                            inputRef={inputRef}
                            value={input}
                            onChange={setInput}
                            onSend={handleSend}
                            disabled={isLoading}
                            placeholder={mode === 'hero' ? (input.trim() === '' ? cyclingPlaceholder : 'Para onde você sonha em ir?') : undefined}
                        />
                    </>
                )
            }
        </div >
    );
};

export default ChatCore;
