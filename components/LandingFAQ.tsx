import React, { useState, memo, useCallback } from 'react';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';

interface FAQItem {
    question: string;
    answer: string | React.ReactNode;
}

interface LandingFAQProps {
    items: FAQItem[];
    title?: string;
    subtitle?: string;
}

const FAQItemComponent = memo(({ question, answer, isOpen, onClick }: FAQItem & { isOpen: boolean; onClick: () => void }) => {
    return (
        <div
            className={`border-b border-brand-cyan/10 last:border-0 transition-all duration-300 ${isOpen ? 'bg-white/40' : ''}`}
        >
            <button
                className="w-full py-6 flex justify-between items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan group"
                onClick={onClick}
                aria-expanded={isOpen}
            >
                <h3
                    itemProp="name"
                    className="text-xl font-bold text-brand-dark group-hover:text-brand-cyan transition-colors pr-8"
                >
                    {question}
                </h3>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isOpen ? 'bg-brand-cyan text-white rotate-180' : 'bg-brand-light text-brand-cyan'
                }`}>
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100 pb-8' : 'max-h-0 opacity-0'
                }`}
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
            >
                <div
                    itemProp="text"
                    className="text-gray-600 text-lg leading-relaxed"
                >
                    {typeof answer === 'string' ? <p>{answer}</p> : answer}
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
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleToggle = useCallback((idx: number) => {
        setOpenIndex(prev => prev === idx ? null : idx);
        import('../utils/haptics').then(m => m.triggerHaptic('light'));
    }, []);

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6 max-w-4xl" itemScope itemType="https://schema.org/FAQPage">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-gray-500">
                        {subtitle}
                    </p>
                </div>

                <div className="bg-[#fffdf5]/50 rounded-3xl p-4 md:p-8 border border-brand-cyan/10">
                    {items.map((item, idx) => (
                        <FAQItemComponent
                            key={item.question}
                            {...item}
                            isOpen={openIndex === idx}
                            onClick={() => handleToggle(idx)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

