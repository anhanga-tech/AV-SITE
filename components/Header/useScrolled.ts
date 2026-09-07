import { useState, useEffect } from 'react';

export function useScrolled(threshold = 20): boolean {
    // Lazy initializer: lê a posição atual na primeira render (BackToTop monta lazy e o
    // usuário pode já estar rolado além do threshold sem um scroll event futuro — sem isso
    // o controle ficaria oculto até o próximo scroll). Client-only: window existe aqui.
    const [isScrolled, setIsScrolled] = useState(() => window.scrollY > threshold);

    useEffect(() => {
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
        return () => window.removeEventListener('scroll', handleScroll);
    }, [threshold]);

    return isScrolled;
}
