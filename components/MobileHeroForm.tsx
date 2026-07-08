import React, { useEffect, useState, memo, useRef } from 'react';
import { X } from 'lucide-react';
import { openAiChat } from '../utils/aiChat';
import { triggerHaptic } from '../utils/haptics';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';

/**
 * MobileHeroForm Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: This component isolates the mobile search input state.
 * By moving the 'mobileDestination' state here, typing in the mobile input
 * no longer triggers re-renders of the entire Hero component (which is heavy
 * due to Framer Motion and video background).
 */
const MobileHeroForm: React.FC = memo(() => {
  const [mobileDestination, setMobileDestination] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    pushFormAnalyticsEvent({
      event: 'form_view',
      formType: 'home_search',
      formId: 'hero-search-mobile',
    });
  }, []);

  const trackStart = (value: string) => {
    if (!value.trim() || startedRef.current) return;
    startedRef.current = true;
    pushFormAnalyticsEvent({
      event: 'form_start',
      formType: 'home_search',
      formId: 'hero-search-mobile',
    });
    pushFormAnalyticsEvent({
      event: 'field_complete',
      formType: 'home_search',
      formId: 'hero-search-mobile',
      fieldName: 'destination',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void triggerHaptic('light');
    pushFormAnalyticsEvent({
      event: 'submit_attempt',
      formType: 'home_search',
      formId: 'hero-search-mobile',
      destination: mobileDestination,
    });
    openAiChat({
      haptic: 'none',
      message: mobileDestination.trim()
        ? `Olá! Tenho interesse em viajar para ${mobileDestination.trim()}. Podem me ajudar com um orçamento?`
        : 'Olá! Gostaria de montar um roteiro personalizado. Podem me ajudar?',
    });
    pushFormAnalyticsEvent({
      event: 'submit_success',
      formType: 'home_search',
      formId: 'hero-search-mobile',
      destination: mobileDestination,
    });
  };

  const handleClear = () => {
    setMobileDestination('');
    void triggerHaptic('light');
    inputRef.current?.focus();
  };

  return (
    <div className="md:hidden w-full max-w-sm mx-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/30 transition-shadow focus-within:ring-2 focus-within:ring-brand-cyan">
          <span className="text-brand-cyan text-lg" aria-hidden="true">📍</span>
          <input
            ref={inputRef}
            type="text"
            value={mobileDestination}
            onChange={(e) => {
              setMobileDestination(e.target.value);
              trackStart(e.target.value);
            }}
            placeholder="Para onde você quer ir?"
            aria-label="Destino"
            className="flex-1 outline-none text-zinc-800 font-semibold placeholder-zinc-400 bg-transparent text-base"
            autoComplete="off"
            data-testid="destination-input-mobile"
          />
          {mobileDestination && (
            <button
              type="button"
              // Prevent the input from blurring on pointer-down so the mobile
              // keyboard does not flicker before handleClear restores focus.
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="p-1 text-zinc-400 hover:text-brand-vibrant transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vibrant"
              aria-label="Limpar destino"
              data-testid="clear-destination-btn-mobile"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          data-testid="submit-search-btn-mobile"
          data-tracking="hero-home-mobile"
          className="btn-specialist w-full bg-brand-yellow text-brand-dark font-black text-base py-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-vibrant/30"
        >
          Solicitar proposta →
        </button>
      </form>
    </div>
  );
});

MobileHeroForm.displayName = 'MobileHeroForm';

export default MobileHeroForm;
