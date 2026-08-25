import React from 'react';

interface ChatLeadFormFeedbackProps {
  localError: string | null;
  notice: string | null;
  whatsappUrl?: string | null;
}

export function ChatLeadFormFeedback({ localError, notice, whatsappUrl }: ChatLeadFormFeedbackProps) {
  return (
    <>
      {localError && (
        <div role="alert" className="bg-red-50/80 text-red-600 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-red-100 animate-in fade-in slide-in-from-top-1">
          {localError}
        </div>
      )}
      {notice && (
        <div className="bg-amber-50/80 text-amber-700 px-4 py-3 text-xs font-medium rounded-xl mb-4 border border-amber-100">
          {notice}
        </div>
      )}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block w-full rounded-xl bg-[#25D366] px-4 py-3 text-center text-sm font-black text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-vibrant"
        >
          Abrir WhatsApp
        </a>
      )}
    </>
  );
}
