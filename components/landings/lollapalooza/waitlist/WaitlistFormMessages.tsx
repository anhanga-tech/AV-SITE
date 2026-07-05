import React from 'react';
import { m, AnimatePresence } from 'framer-motion';

interface WaitlistFormMessagesProps {
  localError: string | null;
  error: string | null;
  successMessage: string | null;
  warningMessage: string | null;
}

export function WaitlistFormMessages({ localError, error, successMessage, warningMessage }: WaitlistFormMessagesProps) {
  return (
    <AnimatePresence mode="wait">
      {(localError || error) && (
        <m.div
          key="error-message"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="alert"
          className="shadow-[inset_3px_0_0_rgb(239_68_68)] rounded-sm bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400"
        >
          {localError || error}
        </m.div>
      )}

      {successMessage && (
        <m.div
          key="success-message"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="status"
          className="shadow-[inset_3px_0_0_#FFD600] rounded-sm bg-anhanga-yellow/10 px-4 py-3 text-xs font-bold text-anhanga-yellow"
        >
          {successMessage}
        </m.div>
      )}

      {warningMessage && (
        <m.div
          key="warning-message"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="status"
          className="shadow-[inset_3px_0_0_rgb(245_158_11)] rounded-sm bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-400"
        >
          {warningMessage}
        </m.div>
      )}
    </AnimatePresence>
  );
}
