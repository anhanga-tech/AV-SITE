import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { LandingFAQ } from '../../components/LandingFAQ';
import OrlandoApp from '../../components/landings/orlando/OrlandoApp';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../../components/schemas/FAQPageSchema';
import { ServiceSchema } from '../../components/schemas/ServiceSchema';
import { openContactModal } from '../../utils/contactForm';
import './orlando.css';

const ORLANDO_FAQ_ITEMS = [
  {
    question: 'Qual a melhor época para viajar para Orlando?',
    answer: 'Para quem busca economia e parques menos cheios, os meses de maio, setembro e final de outubro são excelentes. Se o foco for clima agradável e eventos sazonais, novembro e dezembro oferecem a magia das festas, embora com maior movimento.'
  },
  {
    question: 'Preciso de visto americano para viajar para Orlando?',
    answer: 'Sim, cidadãos brasileiros necessitam de visto americano válido. Nossa equipe orienta sobre os passos necessários e prazos recomendados para que você organize sua documentação com antecedência e segurança. Se ainda não tem, fale conosco no chat que te ajudamos com os primeiros passos.'
  },
  {
    question: 'A Anhangá oferece suporte se eu tiver algum problema lá fora?',
    answer: 'Sim! Nosso diferencial é o suporte especializado 24h via WhatsApp. Seja um ajuste no roteiro, dúvida em um hotel ou qualquer imprevisto, nossa equipe está pronta para te atender em tempo real para que sua única preocupação seja aproveitar a magia.'
  },
  {
    question: 'É a nossa primeira viagem. Vocês ajudam com o roteiro detalhado?',
    answer: 'Com certeza. Entregamos um roteiro personalizado dia a dia, indicando quais parques visitar primeiro, dicas de filas (Genie+ e Lightning Lane) e até sugestões de restaurantes onde as crianças mais se divertem.'
  },
  {
    question: 'Qual a duração ideal de uma viagem para Orlando?',
    answer: 'Para conseguir visitar os principais parques da Disney e Universal com calma, recomendamos uma estadia de 10 a 14 dias. Isso permite intercalar dias intensos de parque com dias de descanso ou compras.'
  }
];

const OrlandoLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Pacotes para Orlando: Disney e Universal 2026"
        description="Planeje sua viagem para Orlando com roteiro personalizado, ingressos e hospedagem. Atendimento especializado por agência de viagens em São Paulo."
        canonical="https://www.anhanga.tur.br/orlando/"
        noHreflang
      />
      <ServiceSchema
        name="Pacotes para Orlando 2026/2027"
        description="Planejamento de viagem para Orlando com suporte especializado, incluindo aéreo, hotel, ingressos e roteiro personalizado."
        serviceUrl="https://www.anhanga.tur.br/orlando/"
        serviceType="Planejamento de viagem para Orlando"
        areaServed="São Paulo e Brasil"
        keywords={['pacotes para Orlando', 'roteiro Disney', 'viagem Universal']}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Pacotes para Orlando', item: 'https://www.anhanga.tur.br/orlando/' }
        ]}
      />
      <FAQPageSchema items={ORLANDO_FAQ_ITEMS} />
      <div className="bg-[#fffdf5] py-2 border-b border-zinc-100 relative z-[60]">
        <div className="container mx-auto px-6">
          <a href="https://www.anhanga.tur.br/" className="text-sm font-medium text-zinc-500 hover:text-brand-cyan transition-colors flex items-center gap-1 font-sans">
            ← Voltar para o site principal
          </a>
        </div>
      </div>

      {/* React 19 native resource hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@400;700;900&display=swap"
        rel="stylesheet"
      />

      <OrlandoApp />
      <LandingFAQ items={ORLANDO_FAQ_ITEMS} />
      <section className="bg-[#fffdf5] border-t border-brand-cyan/10 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Pacote para Orlando sem improviso</h2>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Se você busca <strong>pacotes para Orlando</strong> com planejamento profissional, a Anhangá estrutura sua viagem com foco em custo-benefício, logística e experiência.
          </p>
          <p className="text-zinc-700 text-lg leading-relaxed mb-5">
            Definimos roteiro de parques, hospedagem por região, estratégia de ingressos e suporte antes e durante a viagem para você evitar erros comuns e aproveitar melhor cada dia de viagem.
          </p>
          <h3 className="text-xl md:text-2xl font-extrabold text-brand-dark mb-3">O que você pode incluir no pacote</h3>
          <ul className="list-disc list-inside text-zinc-700 space-y-1 mb-6">
            <li>Aéreo e hotel com perfil ideal para sua viagem</li>
            <li>Ingressos Disney e Universal com orientação de uso</li>
            <li>Roteiro diário personalizado por prioridade</li>
            <li>Suporte rápido por WhatsApp para ajustes</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                openContactModal({ source: 'orlando' });
              }}
              className="btn-whatsapp btn-specialist px-5 py-3 rounded-full bg-brand-cyan text-white font-bold hover:bg-brand-cyan/90 transition-colors"
              data-tracking="footer-orlando"
              data-testid="cta-orlando-specialist"
            >
              Falar com especialista
            </button>
            <a href="https://www.anhanga.tur.br/beto-carrero/" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ver pacote Beto Carrero
            </a>
            <a href="/blog" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Ler dicas no blog
            </a>
            <a href="https://www.visitorlando.com/" target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-full bg-white border border-zinc-200 text-brand-dark font-semibold hover:border-brand-cyan/40 transition-colors">
              Guia Oficial Visit Orlando
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrlandoLanding;
