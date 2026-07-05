import React from 'react';

interface ChatLeadFormFeedbackProps {
  localError: string | null;
  notice: string | null;
}

export function ChatLeadFormFeedback({ localError, notice }: ChatLeadFormFeedbackProps) {
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
    </>
  );
}
