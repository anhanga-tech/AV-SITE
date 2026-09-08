import { useState, useEffect } from 'react';

export function useScrolled(threshold = 20): boolean {
    // SSR renderiza false (guard abaixo); o valor real só é lido no cliente.
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // rAF no mount: roda DEPOIS da hidratação/paint. Sem isso, um lazy-mounted
        // BackToTop com o usuário já rolado (sem scroll event futuro) ficaria oculto, e o
        // Header (eager) divergiria do SSR quando o browser restaura o scroll no refresh —
        // ler scrollY num lazy initializer causaria hydration mismatch. rAF também mantém o
        // setState fora do caminho síncrono do effect (react-hooks/set-state-in-effect).
        const initialRaf = window.requestAnimationFrame(() => {
            setIsScrolled(window.scrollY > threshold);
        });

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > threshold);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.cancelAnimationFrame(initialRaf);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [threshold]);

    return isScrolled;
}
