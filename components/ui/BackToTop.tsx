import React, { useCallback, memo } from 'react';
import { CaretUp } from '@phosphor-icons/react';
import { useScrolled } from '../Header/useScrolled';

/**
 * BackToTop Component - Optimized for Performance.
 *
 * PERFORMANCE WIN:
 * 1. Utilizes the shared `useScrolled` hook which implements `requestAnimationFrame`
 *    throttling for scroll events, reducing main-thread pressure compared to
 *    unthrottled raw scroll listeners.
 * 2. Wrapped in `React.memo` to prevent unnecessary re-renders when parent components
 *    (like App layout) update their state.
 */
const BackToTop: React.FC = memo(() => {
  const isVisible = useScrolled(400);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Trigger light haptic feedback
    import('../../utils/haptics')
      .then(m => m.triggerHaptic('light'))
      .catch(() => {});
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`
        fixed bottom-24 right-4 sm:bottom-32 sm:right-8 z-[9980]
        p-3 rounded-2xl bg-white text-brand-cyan border-2 border-brand-cyan/20
        shadow-lg shadow-brand-cyan/10 hover:shadow-brand-cyan/20
        transition duration-300 ease-spring
        hover:-translate-y-1 active:scale-90
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-cyan
        ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <CaretUp className="size-6" weight="bold" />
    </button>
  );
});

BackToTop.displayName = 'BackToTop';

export default BackToTop;
