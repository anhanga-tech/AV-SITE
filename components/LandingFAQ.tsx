import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useFaqAccordion, type FAQItem, type FaqAccordionItemProps } from './landings/shared/useFaqAccordion';

interface LandingFAQProps {
    items: FAQItem[];
    title?: string;
    subtitle?: string;
}

/*
  Estrutura pós-critique de /consultoria-de-viagem (via detector do impeccable):
  - Sem card externo envolvendo os itens (era card dentro de card + filhos
    encostados na borda sem inset lateral) — lista plana com divisores.
  - Expansão anima grid-template-rows 0fr→1fr, não max-height: o max-h-[500px]
    era um número mágico que distorcia a curva de timing e disparava o
    detector de layout-transition.
  - Respostas limitadas a 65ch (linhas de ~87ch estouravam o alvo de leitura).
  - Namespace Tailwind canônico anhanga-* (brand-* é legado congelado).
  - Hover do título em anhanga-blue (6.5:1 sobre branco): o cyan anterior
    media 2.8:1.
*/
const FAQItemComponent = memo(({ question, answer, isOpen, buttonProps, panelProps }: FAQItem & FaqAccordionItemProps) => {
    return (
        <div className="border-b border-zinc-200 last:border-0">
            <button
                type="button"
                className="w-full py-6 flex justify-between items-center gap-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action group"
                {...buttonProps}
            >
                <h3 className="text-xl font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
                    {question}
                </h3>
                <div className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center transition duration-300 ${
                    isOpen ? 'bg-anhanga-action text-anhanga-dark' : 'bg-anhanga-light text-anhanga-actionDark'
                }`}>
                    <ChevronDown
                        className={`size-5 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                </div>
            </button>
            <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
                {...panelProps}
            >
                <div className="overflow-hidden">
                    <div className="pb-8 text-zinc-600 text-lg leading-relaxed max-w-[65ch]">
                        <p>{answer}</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

FAQItemComponent.displayName = 'FAQItemComponent';

export const LandingFAQ: React.FC<LandingFAQProps> = ({
    items,
    title = "Dúvidas Frequentes",
    subtitle = "Tire suas dúvidas sobre o planejamento da sua viagem."
}) => {
    const accordionItems = useFaqAccordion(items);

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-zinc-500">
                        {subtitle}
                    </p>
                </div>

                <div>
                    {items.map((item, idx) => (
                        <FAQItemComponent
                            key={item.question}
                            {...item}
                            {...accordionItems[idx]}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export type { FAQItem };
