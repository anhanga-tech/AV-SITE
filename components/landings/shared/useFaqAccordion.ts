import { useCallback, useState } from 'react';
import type { AriaAttributes, ButtonHTMLAttributes, HTMLAttributes } from 'react';

export interface FAQItem {
    question: string;
    answer: string;
}

export interface FaqAccordionItemProps {
    isOpen: boolean;
    buttonProps: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'onClick'> &
        Pick<AriaAttributes, 'aria-expanded' | 'aria-controls'>;
    panelProps: Pick<HTMLAttributes<HTMLElement>, 'id' | 'role'> &
        Pick<AriaAttributes, 'aria-labelledby' | 'aria-hidden'>;
}

/*
  Dona da amarração ARIA entre a aba do FAQ e o painel de resposta — a parte
  fiddly que ficou faltando em LandingFAQ.tsx (sem id/aria-controls/role/
  aria-labelledby/aria-hidden, só aria-expanded) enquanto OrlandoFAQ.tsx já
  tinha, por ter sido corrigido isoladamente na PR #1352. Centralizar aqui
  garante que nenhuma pele nova precise reconstruir essa amarração à mão.
*/
export function useFaqAccordion(items: FAQItem[]): FaqAccordionItemProps[] {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = useCallback((idx: number) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
        import('../../../utils/haptics')
            .then((m) => m.triggerHaptic('light'))
            .catch(() => {});
    }, []);

    return items.map((_, idx) => {
        const isOpen = openIndex === idx;
        const buttonId = `faq-tab-${idx}`;
        const panelId = `faq-panel-${idx}`;

        return {
            isOpen,
            buttonProps: {
                id: buttonId,
                'aria-expanded': isOpen,
                'aria-controls': panelId,
                onClick: () => handleToggle(idx),
            },
            panelProps: {
                id: panelId,
                role: 'region',
                'aria-labelledby': buttonId,
                'aria-hidden': !isOpen,
            },
        };
    });
}
