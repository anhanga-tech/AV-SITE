import React, { memo } from 'react';
import {
  CircleNotch,
  PaperPlaneTilt,
  Robot,
  Sparkle,
  User,
  X,
} from '@phosphor-icons/react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { ChatLeadForm } from '../ChatLeadForm';
import { PassportStamp } from '../ui/PassportStamp';
import type { useLeadCapture } from '../../hooks/useLeadCapture';
import type { LeadFinalizePayload, LeadFinalizeResult } from '../../lib/chat-lead-form-logic';
import { sanitizeAiLinkUrl } from '../../lib/ai/safe-link';
import type { SubmitLeadRequest } from '../../types/leadCapture';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  chips?: Array<{ id: string; label: string }>;
  isAction?: boolean;
  actionData?: {
    destination: string;
    bantSummary: string;
    iataCode?: string;
    whatsappMessage?: string;
  };
}

interface AIChatPanelViewProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  /** Whether the drawer is visually open — threaded down to ChatLeadForm so it can cancel a pending handoff on close. */
  isOpen: boolean;
  messages: ChatMessage[];
  lastModelIndex: number;
  liveAnnouncement: string;
  input: string;
  isLoading: boolean;
  isSubmittingLead: boolean;
  getLeadWhatsAppUrl: ReturnType<typeof useLeadCapture>['getLeadWhatsAppUrl'];
  prepareLeadSubmitPayload: (payload: LeadFinalizePayload, eventId: string) => SubmitLeadRequest;
  finalizeLead: (payload: SubmitLeadRequest) => Promise<LeadFinalizeResult>;
  onClose: () => void;
  onInput: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmitMessage: (text: string) => void;
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

// Hoisted to a module constant so the `components` object keeps a stable identity
// across renders — a fresh object on every render would defeat ModelMessageBody's memo.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children, ...props }) => {
    if (!href) return <span>{children}</span>;
    // Internal SPA links stay in-tab; external (allowlisted) links open in a new
    // tab to preserve chat state.
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
};

/**
 * Model message body, memoized on its (immutable) `text`.
 *
 * PERFORMANCE WIN: ReactMarkdown runs a full remark→rehype parse pipeline on
 * every render. Because the composer's `input` state lives above this subtree,
 * each keystroke re-rendered the whole message list and re-parsed the markdown
 * of *every* prior model message — so typing lag grew linearly with the
 * conversation length. Message text never changes once created, so memoizing on
 * the `text` string reuses the parsed output and keeps keystrokes O(1)
 * regardless of history size.
 */
const ModelMessageBody = memo(({ text }: { text: string }) => (
  <div className="prose prose-sm max-w-none prose-p:text-zinc-700 prose-p:leading-relaxed prose-strong:text-zinc-900 prose-strong:font-bold prose-ul:text-zinc-700">
    <ReactMarkdown urlTransform={sanitizeAiLinkUrl} components={MARKDOWN_COMPONENTS}>
      {text}
    </ReactMarkdown>
  </div>
));

ModelMessageBody.displayName = 'ModelMessageBody';

function ChatPanelHeader({ onClose }: Pick<AIChatPanelViewProps, 'onClose'>) {
  return (
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
        onClick={onClose}
        className="text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-full p-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant"
        aria-label="Fechar gaveta"
      >
        <X className="size-6" weight="bold" />
      </button>
    </div>
  );
}

type ChatMessageListProps = Pick<AIChatPanelViewProps,
  | 'messagesEndRef'
  | 'isOpen'
  | 'messages'
  | 'lastModelIndex'
  | 'liveAnnouncement'
  | 'isLoading'
  | 'isSubmittingLead'
  | 'getLeadWhatsAppUrl'
  | 'prepareLeadSubmitPayload'
  | 'finalizeLead'
  | 'onSubmitMessage'
>;

function ChatMessageList({
  messagesEndRef,
  isOpen,
  messages,
  lastModelIndex,
  liveAnnouncement,
  isLoading,
  isSubmittingLead,
  getLeadWhatsAppUrl,
  prepareLeadSubmitPayload,
  finalizeLead,
  onSubmitMessage,
}: ChatMessageListProps) {
  return (
    <>
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
                      whatsappMessage={msg.actionData?.whatsappMessage}
                      isOpen={isOpen}
                      getWhatsAppUrl={getLeadWhatsAppUrl}
                      prepareLeadSubmitPayload={prepareLeadSubmitPayload}
                      onFinalizeLead={finalizeLead}
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
                      <ModelMessageBody text={msg.text} />
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
                      onClick={() => onSubmitMessage(chip.label)}
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
    </>
  );
}

type ChatComposerProps = Pick<AIChatPanelViewProps,
  | 'inputRef'
  | 'input'
  | 'isLoading'
  | 'onInput'
  | 'onKeyDown'
  | 'onSubmitMessage'
>;

function ChatComposer({
  inputRef,
  input,
  isLoading,
  onInput,
  onKeyDown,
  onSubmitMessage,
}: ChatComposerProps) {
  return (
    <div className="p-4 sm:p-5 bg-white border-t border-zinc-100 shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="relative flex items-end bg-zinc-50 border border-zinc-200 rounded-2xl focus-within:border-brand-vibrant/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-vibrant/10 transition">
        <label htmlFor="chat-textarea" className="sr-only">Sua mensagem</label>
        <textarea
          id="chat-textarea"
          ref={inputRef}
          value={input}
          onChange={onInput}
          onKeyDown={onKeyDown}
          placeholder="Digite sua dúvida aqui..."
          rows={1}
          className="flex-1 max-h-[120px] pl-4 pr-[50px] py-4 bg-transparent outline-none text-sm text-zinc-700 font-medium placeholder-zinc-400 resize-none overflow-y-auto w-full leading-snug"
        />
        <button
          type="button"
          onClick={() => onSubmitMessage(input)}
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
  );
}

export function AIChatPanelView({
  dialogRef,
  messagesEndRef,
  inputRef,
  isOpen,
  messages,
  lastModelIndex,
  liveAnnouncement,
  input,
  isLoading,
  isSubmittingLead,
  getLeadWhatsAppUrl,
  prepareLeadSubmitPayload,
  finalizeLead,
  onClose,
  onInput,
  onKeyDown,
  onSubmitMessage,
}: AIChatPanelViewProps) {
  return (
    <dialog
      ref={dialogRef}
      className="ai-chat-drawer fixed top-0 right-0 h-full w-full sm:w-[450px] z-[9999] m-0 ml-auto p-0 bg-white flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.1)] sm:rounded-l-[2rem] overflow-hidden outline-none max-h-full max-w-full"
      aria-labelledby="ai-chat-title"
    >
      <ChatPanelHeader onClose={onClose} />
      <ChatMessageList
        messagesEndRef={messagesEndRef}
        isOpen={isOpen}
        messages={messages}
        lastModelIndex={lastModelIndex}
        liveAnnouncement={liveAnnouncement}
        isLoading={isLoading}
        isSubmittingLead={isSubmittingLead}
        getLeadWhatsAppUrl={getLeadWhatsAppUrl}
        prepareLeadSubmitPayload={prepareLeadSubmitPayload}
        finalizeLead={finalizeLead}
        onSubmitMessage={onSubmitMessage}
      />
      <ChatComposer
        inputRef={inputRef}
        input={input}
        isLoading={isLoading}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onSubmitMessage={onSubmitMessage}
      />
    </dialog>
  );
}
