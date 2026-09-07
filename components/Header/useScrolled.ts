import { useState, useEffect } from 'react';

export function useScrolled(threshold = 20): boolean {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // Inicializa da posição atual: se o componente montou lazy (BackToTop), o usuário
        // pode já estar rolado além do threshold sem um scroll event futuro — sem isso o
        // controle ficaria oculto até o próximo scroll.
        setIsScrolled(window.scrollY > threshold);

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
