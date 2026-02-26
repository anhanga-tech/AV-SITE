import React, { useEffect } from 'react';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';

const Terms: React.FC = () => {
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const canonicalUrl = "https://www.anhanga.tur.br/termos-de-uso";
  const metaDescription = "Termos de uso e condições gerais da Anhangá Viagens. Leia sobre nossas políticas de serviço, reservas e responsabilidades.";
  const lastUpdated = "Fevereiro de 2026"; // Data estática honesta

  return (
    <>
      <SEO
        title="Termos de Uso"
        description={metaDescription}
        canonical={canonicalUrl}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', item: 'https://www.anhanga.tur.br/' },
        { name: 'Termos de Uso', item: canonicalUrl }
      ]} />
      
      {/* Schema restaurado para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
            __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: "Termos de Uso - Anhangá Viagens",
                url: canonicalUrl,
                description: metaDescription,
                dateModified: "2026-02-26", // Data ISO para robôs
                inLanguage: "pt-BR"
            }),
        }}
      />

      <main className="min-h-screen bg-[#fffdf5] pt-32 pb-24">
        <article className="container mx-auto px-6 max-w-4xl prose prose-lg prose-headings:font-black prose-headings:text-brand-dark prose-p:text-gray-600 prose-a:text-brand-cyan">
          <h1>Termos de Uso</h1>
          <p className="lead text-xl text-gray-500 font-medium mb-10">
            Última atualização: {lastUpdated}
          </p>

          <h2>1. Introdução</h2>
          <p>
            Bem-vindo à Anhangá Viagens. Ao acessar nosso site e utilizar nossos serviços, você concorda com estes termos de uso.
            Por favor, leia atentamente.
          </p>

          <h2>2. Serviços Oferecidos</h2>
          <p>
            A Anhangá Viagens atua como intermediária entre o cliente e os prestadores de serviços turísticos (companhias aéreas, hotéis, operadoras, etc).
            Nossa responsabilidade é garantir a correta contratação dos serviços solicitados, conforme as condições especificadas em cada orçamento.
          </p>

          <h2>3. Orçamentos e Reservas</h2>
          <p>
            Os orçamentos enviados têm validade limitada e estão sujeitos à alteração de preço e disponibilidade até a confirmação do pagamento.
            A reserva só é garantida após a confirmação do pagamento e emissão dos vouchers.
          </p>

          <h2>4. Cancelamentos e Reembolsos</h2>
          <p>
            As políticas de cancelamento e reembolso seguem as regras de cada fornecedor contratado e a legislação vigente (CDC e leis do turismo).
            Em caso de cancelamento, taxas administrativas podem ser aplicadas.
          </p>

          <h2>5. Documentação</h2>
          <p>
            É de inteira responsabilidade do passageiro possuir a documentação necessária para a viagem (passaporte válido, vistos, vacinas, etc).
            A Anhangá Viagens orienta, mas não se responsabiliza por impedimentos decorrentes de documentação irregular.
          </p>

          <h2>6. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de alterar estes termos a qualquer momento. O uso continuado do site após as alterações constitui aceitação dos novos termos.
          </p>

          <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500 m-0">
              Dúvidas? Entre em contato através do e-mail: <a href="mailto:contato@anhanga.tur.br">contato@anhanga.tur.br</a>
            </p>
          </div>
        </article>
      </main>
    </>
  );
};

export default Terms;
