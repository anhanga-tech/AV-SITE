
import React, { useState, memo, useCallback } from 'react';
import {
    CaretDown,
    CaretUp,
    Sparkle,
    AirplaneTilt,
    Buildings,
    Ticket,
    MapPin,
} from '@phosphor-icons/react';

interface FAQItemProps {
    question: string;
    answer: React.ReactNode;
    idx: number;
}

const FAQItem = memo(({ question, answer, idx }: FAQItemProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
        import('../utils/haptics').then(m => m.triggerHaptic('light'));
    }, []);

    return (
        <div
            className={`mb-4 rounded-2xl overflow-hidden transition-all duration-300 border border-white/40 shadow-sm custom-backdrop ${isOpen ? 'shadow-md scale-[1.01]' : ''}`}
        >
            <button
                className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan group bg-white/60 hover:bg-white/80 transition-colors"
                onClick={handleToggle}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {/* Semantic icon visual aid (optional but nice) */}
                    <span className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-brand-light text-brand-cyan text-xs font-bold">
                        {idx + 1}
                    </span>
                    <h3
                        className="font-bold text-lg md:text-xl text-brand-dark group-hover:text-brand-cyan transition-colors"
                    >
                        {question}
                    </h3>
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen
                    ? 'bg-brand-cyan text-white rotate-180'
                    : 'bg-white text-gray-400 group-hover:text-brand-cyan'
                    }`}>
                    {isOpen ? <CaretUp className="w-6 h-6" weight="bold" /> : <CaretDown className="w-6 h-6" weight="bold" />}
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-6 pb-8 pt-4 text-gray-700 font-medium leading-relaxed text-lg bg-white/40">
                    {/* The answer content is injected here */}
                    {answer}
                </div>
            </div>
        </div>
    );
});

// Defines the data with strict structure passing React Nodes (JSX) as answer
// Moved outside component to prevent re-allocation on every render
const FAQS = [
    {
        question: "Quanto custa um roteiro personalizado?",
        answer: (
            <div>
                <p className="mb-4">
                    O preço varia conforme a complexidade, duração e destino. Nossos roteiros começam
                    em <strong>R$ 3.800</strong> e podem chegar a <strong>R$ 50.000+</strong> para experiências premium.
                </p>
                <strong className="block mb-2 text-brand-dark">Fatores que influenciam o preço:</strong>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Passagens aéreas (variável conforme data e companhia)</li>
                    <li>Hospedagem (economia a luxo)</li>
                    <li>Experiências e passeios</li>
                    <li>Duração da viagem</li>
                    <li>Sazonalidade do destino</li>
                </ul>
                <p className="border-l-4 border-brand-yellow pl-4 italic">
                    <strong>Receba uma cotação personalizada gratuitamente!</strong> <br />
                    Fale com nossa IA agora mesmo no chat!
                </p>
            </div>
        )
    },
    {
        question: "Como funciona a estrutura de preço da Anhangá?",
        answer: (
            <div>
                <p className="mb-4">
                    Nós montamos seu roteiro dia-a-dia conforme seu estilo e orçamento.
                    Você recebe uma proposta com todos os custos listados:
                </p>
                <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2"><AirplaneTilt className="w-4 h-4 text-brand-cyan" weight="fill" /> Passagens aéreas (consultamos o melhor preço do dia)</li>
                    <li className="flex items-center gap-2"><Buildings className="w-4 h-4 text-brand-cyan" weight="fill" /> Hospedagem (você escolhe o nível de conforto)</li>
                    <li className="flex items-center gap-2"><Ticket className="w-4 h-4 text-brand-cyan" weight="fill" /> Entradas em atrações</li>
                    <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-cyan" weight="fill" /> Transporte terrestre</li>
                    <li className="flex items-center gap-2"><Sparkle className="w-4 h-4 text-brand-cyan" weight="fill" /> Refeições recomendadas (opcionais)</li>
                </ul>
                <p className="font-bold text-brand-dark">Só avançamos após sua aprovação. Sem surpresas!</p>
            </div>
        )
    },
    {
        question: "Quanto tempo antes devo planejar minha viagem?",
        answer: (
            <div>
                <p className="mb-4">
                    Recomendamos começar com <strong>3-6 meses de antecedência</strong> para viagens internacionais.
                    Isso nos permite:
                </p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Consultar as melhores tarifas de passagens aéreas</li>
                    <li>Garantir hospedagem em alta temporada</li>
                    <li>Organizar vistos (se necessário)</li>
                    <li>Ajustar o roteiro conforme preferências</li>
                </ul>
                <p>
                    Mas não se preocupe! Somos especialistas em <span className="text-brand-button font-bold">"milagres de última hora"</span> também - conseguimos viagens em 48 horas em casos urgentes.
                </p>
            </div>
        )
    },
    {
        question: "Por que a Anhangá em vez de outra agência?",
        answer: (
            <div>
                <p className="mb-2"><strong>1. Roteiros 100% personalizados:</strong> Não vendemos pacotes prontos.</p>
                <p className="mb-2"><strong>2. Sem burocracia:</strong> Cuidamos de vistos, formulários, tudo.</p>
                <p className="mb-2"><strong>3. Concierge humano:</strong> Fale com especialistas, não robôs.</p>
                <p className="mb-2"><strong>4. Suporte 24/7:</strong> Temos um "botão de pânico" no WhatsApp.</p>
                <p><strong>5. Especialistas em transformação:</strong> Viagens que mudam vidas, não apenas destinos.</p>
            </div>
        )
    },
    {
        question: "Como funciona o processo? É complicado?",
        answer: (
            <div>
                <strong className="block mb-3">4 passos simples:</strong>
                <ol className="list-decimal pl-5 space-y-3">
                    <li className="pl-1"><strong className="text-brand-dark">Oie! Vamos conversar?</strong> <br /> Você nos conta seus sonhos e orçamento via Chatbot</li>
                    <li className="pl-1"><strong className="text-brand-dark">Desenhando o Sonho</strong> <br /> Nossos especialistas criam um roteiro dia-a-dia personalizado</li>
                    <li className="pl-1"><strong className="text-brand-dark">Burocracia? Deixa com a gente</strong> <br /> Emitimos voos, hotéis, passeios e parcelamos</li>
                    <li className="pl-1"><strong className="text-brand-dark">Fui! Partiu Viajar</strong> <br /> Você recebe vouchers organizados. A gente fica de plantão 24h</li>
                </ol>
            </div>
        )
    },
    {
        question: "Como funciona a página do Lollapalooza Brasil na Anhangá?",
        answer: (
            <div>
                <p className="mb-4">
                    Somos especialistas em grandes festivais. A landing do <strong>Lollapalooza Brasil</strong> concentra as atualizações da campanha vigente, histórico da operação e a lista de espera para a próxima abertura quando a edição atual já estiver encerrada.
                </p>
                <p className="font-bold text-brand-dark italic">Quem se cadastra primeiro recebe aviso prioritário quando a próxima edição abre.</p>
            </div>
        )
    },
    {
        question: "Vocês têm viagens para quem tem 50+ (Melhor Idade)?",
        answer: (
            <div>
                <p className="mb-4">
                    Sim! O <strong>Turismo 50+</strong> é um de nossos pilares. Criamos roteiros com ritmo desacelerado, foco em conforto, acessibilidade e experiências culturais enriquecedoras, tanto no Brasil quanto no exterior.
                </p>
                <p>Nossa curadoria seleciona hotéis e passeios que priorizam o bem-estar e a segurança deste público exigente.</p>
            </div>
        )
    },
    {
        question: "A Anhangá Viagens é uma agência credenciada?",
        answer: (
            <div>
                <p className="mb-2">
                    Com certeza. Somos uma agência de turismo com <strong>Certificado Cadastur (37.036.732/0001-41)</strong> e parceiros credenciados dos maiores parques do Brasil, como <strong>Beto Carrero World</strong> e <strong>Hopi Hari</strong>.
                </p>
                <p>Isso garante segurança jurídica e oficialidade em todos os ingressos e serviços que comercializamos.</p>
            </div>
        )
    }
];

/**
 * FAQ Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents the entire FAQ section from re-rendering when parent state changes.
 * Individual FAQ items are already memoized, but memoizing the container avoids the outer render logic.
 */
const FAQ = memo(() => {
    return (
        <section
            id="faq-section"
            className="py-24 relative overflow-hidden"
            // Soft background request
            style={{ backgroundColor: '#fffdf5' }}
        >
            {/* Decorative blob for background interest */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-100/40 rounded-full blur-3xl pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>

            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-block bg-brand-vibrant text-white px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-4 shadow-sm transform -rotate-1">
                        Tire suas dúvidas
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight mb-4">
                        Tá na cabeça?<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-blue-600">
                            A gente responde.
                        </span>
                    </h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                        As perguntas que chegam mais no nosso WhatsApp, com resposta de verdade.
                    </p>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq, idx) => (
                        <FAQItem key={idx} {...faq} idx={idx} />
                    ))}
                </div>

                {/* AI Helper Teaser */}
                <div className="mt-16 flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm border border-brand-cyan/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-5 max-w-lg shadow-[0_8px_30px_rgba(14,165,233,0.1)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.2)] transition-shadow cursor-default">
                        <div className="bg-brand-light p-4 rounded-full">
                            <Sparkle className="w-8 h-8 text-brand-cyan animate-pulse" weight="fill" />
                        </div>
                        <div className="text-center md:text-left">
                            <h4 className="font-bold text-brand-dark text-xl mb-1">Ainda tem dúvidas?</h4>
                            <p className="text-gray-600">
                                Nossa <span className="font-bold text-brand-cyan">IA Especialista</span> está pronta para ajudar.
                                Chame no chat aqui no canto! 👉
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-backdrop {
                    background-color: rgba(255, 255, 255, 0.95);
                }
            `}</style>
        </section>
    );
});

FAQItem.displayName = 'FAQItem';
FAQ.displayName = 'FAQ';

export default FAQ;
