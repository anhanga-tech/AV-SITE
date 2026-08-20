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

  const scrollToTop = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // Move focus off the button before the scroll crosses the visibility threshold —
    // otherwise it becomes aria-hidden while still document.activeElement, which is
    // an invalid ARIA state (aria-hidden is disallowed on a focused element).
    event.currentTarget.blur();

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
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      className={`
        fixed bottom-[calc(6rem+var(--cookie-banner-h,0px))] right-4 sm:bottom-[calc(8rem+var(--cookie-banner-h,0px))] sm:right-8 z-[9980]
        p-3 rounded-2xl bg-white text-anhanga-action border-2 border-anhanga-action/20
        shadow-lg shadow-anhanga-action/10 hover:shadow-anhanga-action/20
        transition-[bottom,transform,opacity,box-shadow] duration-300 ease-spring
        hover:-translate-y-1 active:scale-90
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-anhanga-action
        ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <CaretUp className="size-6" weight="bold" />
    </button>
  );
});

BackToTop.displayName = 'BackToTop';

export default BackToTop;
