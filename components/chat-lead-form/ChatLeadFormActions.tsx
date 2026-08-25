import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface ChatLeadFormActionsProps {
  isSubmitting: boolean;
  /** True once the lead was already saved — blocks resubmission without relabeling the button as "Salvando…". */
  disabled?: boolean;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenLeadModal: () => void;
}

export function ChatLeadFormActions({ isSubmitting, disabled, onSubmit, onOpenLeadModal }: ChatLeadFormActionsProps) {
  const isInteractionBlocked = isSubmitting || disabled;

  return (
    <>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isInteractionBlocked}
        className={`group flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition ${isSubmitting ? 'opacity-90 cursor-wait' : disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>Salvando…</span>
          </>
        ) : (
          <>
            <span>Salvar e abrir WhatsApp</span>
            <ExternalLink className="size-4 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenLeadModal}
        disabled={isInteractionBlocked}
        className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 transition hover:border-brand-vibrant hover:text-brand-vibrant disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant/30"
      >
        Preencher contato e continuar
      </button>
    </>
  );
}
