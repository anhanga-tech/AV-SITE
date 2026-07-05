import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface WaitlistSubmitButtonProps {
  isSubmitting: boolean;
}

export function WaitlistSubmitButton({ isSubmitting }: WaitlistSubmitButtonProps) {
  return (
    <button
      id="lolla-waitlist-submit"
      type="submit"
      disabled={isSubmitting}
      className="group relative flex w-full items-center justify-center gap-3 rounded-[1px] bg-anhanga-yellow px-8 py-5 text-sm font-black text-black transition-[letter-spacing,opacity] duration-300 hover:tracking-[0.1em] disabled:cursor-wait disabled:opacity-50"
    >
      <span className="relative z-10 flex items-center gap-2">
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            ENVIANDO…
          </>
        ) : (
          <>
            ENTRAR NA LISTA 2027
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
          </>
        )}
      </span>

      {/* Magnetic/Glow Background effect on hover */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
    </button>
  );
}
