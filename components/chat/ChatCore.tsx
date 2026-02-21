import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChatMessageList, { type LeadFinalizePayload, type LeadFinalizeResult } from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatChips from './ChatChips';
import { useLeadCapture } from '../../hooks/useLeadCapture';
import { useChatSession } from '../../hooks/useChatSession';
import type { BudgetLinkData } from '../../services/geminiService';

interface ChatCoreProps {
    mode: 'hero' | 'widget';
    externalMessage?: string | null;
    onExternalMessageHandled?: () => void;
}

const ChatCore: React.FC<ChatCoreProps> = ({ mode, externalMessage, onExternalMessageHandled }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const { setLeadDraft, submitLead, isSubmitting: isSubmittingLead } = useLeadCapture();

    const handleBudgetLink = useCallback((budgetLink: BudgetLinkData) => {
        setLeadDraft({
            bantSummary: budgetLink.bantSummary,
            origin: budgetLink.origin,
            destination: budgetLink.destination,
            dates: budgetLink.dates,
            baggagePreference: budgetLink.baggagePreference || '',
        });
    }, [setLeadDraft]);

    const { messages, isLoading, chips, handoff, sendMessage } = useChatSession({
        onBudgetLink: handleBudgetLink,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, handoff]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 120);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!externalMessage?.trim()) return;

        const timer = window.setTimeout(() => {
            void sendMessage(externalMessage);
            onExternalMessageHandled?.();
        }, 200);

        return () => window.clearTimeout(timer);
    }, [externalMessage, onExternalMessageHandled, sendMessage]);

    const handleFinalizeLead = useCallback(async (payload: LeadFinalizePayload): Promise<LeadFinalizeResult> => {
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
    }, [setLeadDraft, submitLead]);

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

    return (
        <div className={mode === 'hero' ? 'flex flex-col h-[300px] sm:h-[340px]' : 'flex flex-col h-full'}>
            <ChatMessageList
                mode={mode}
                messages={messages}
                handoff={handoff}
                isSubmittingLead={isSubmittingLead}
                onFinalizeLead={handleFinalizeLead}
                messagesEndRef={messagesEndRef}
            />

            <div className={mode === 'hero' ? 'px-3 pb-2 space-y-2 bg-white/5' : 'px-4 pb-3 space-y-2 bg-white'}>
                {isLoading && <ChatTypingIndicator mode={mode} />}
                <ChatChips
                    mode={mode}
                    chips={chips}
                    disabled={isLoading}
                    onSelect={handleChipSelect}
                />
            </div>

            <ChatInput
                mode={mode}
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={isLoading}
            />
        </div>
    );
};

export default ChatCore;
