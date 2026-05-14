import React, { useState, useEffect, useCallback } from 'react';
import { CaretUp } from '@phosphor-icons/react';

/**
 * BackToTop Component
 * A floating button that appears after scrolling down and smoothly returns the user to the top.
 */
const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Toggle visibility based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = useCallback(async () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Trigger light haptic feedback
    try {
      const { triggerHaptic } = await import('../../utils/haptics');
      triggerHaptic('light');
    } catch (error) {
      // Haptics not supported or failed to load
    }
  }, []);

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`
        fixed bottom-24 right-4 sm:bottom-32 sm:right-8 z-[9980]
        p-3 rounded-2xl bg-white text-brand-cyan border-2 border-brand-cyan/20
        shadow-lg shadow-brand-cyan/10 hover:shadow-brand-cyan/20
        transition-all duration-300 ease-spring
        hover:-translate-y-1 active:scale-90
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-cyan
        ${isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <CaretUp className="size-6" weight="bold" />
    </button>
  );
};

export default BackToTop;
