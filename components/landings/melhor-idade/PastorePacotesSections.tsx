import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeUp } from '@/components/landings/shared/constants';
import type { PastorePackage } from '@/data/pastorePackages';
import { openContactModal } from '@/utils/contactForm';
import { FeaturedPackage, PastorePackageCard } from './PastorePackageCards';

const VIEWPORT_REVEAL = { once: true, amount: 0.2, margin: '0px 0px 100% 0px' } as const;

const CONTACT_SOURCE = { source: 'melhor-idade-pacotes-pastore' } as const;

export function PastorePacotesMiniHeader(): React.ReactElement {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-anhanga-blue/10 sticky top-0 z-50 py-3">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link
          to="/melhor-idade/"
          className="inline-flex items-center gap-2 group"
          aria-label="Voltar para a página Melhor Idade"
        >
          <ArrowLeft className="size-4 text-zinc-400 group-hover:text-anhanga-blue transition-colors" aria-hidden="true" />
          <span className="size-7 bg-anhanga-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="size-4" />
          </span>
          <span className="text-sm font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
            Anhangá Viagens
          </span>
        </Link>
        <Button
          variant="action"
          size="sm"
          onClick={() => openContactModal(CONTACT_SOURCE)}
          className="btn-whatsapp btn-specialist whitespace-nowrap"
          data-tracking="header-pastore-pacotes"
        >
          Falar com especialista
        </Button>
      </div>
    </header>
  );
}

export function PastorePacotesHero(): React.ReactElement {
  return (
    <section className="pt-16 pb-16 px-6 bg-anhanga-light">
      <div className="max-w-3xl mx-auto">
        <m.span
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-anhanga-dark mb-6"
        >
          <CheckCircle className="size-4 text-anhanga-blue" aria-hidden="true" />
          Parceira Pastore Turismo
        </m.span>
        <m.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl md:text-6xl font-black text-anhanga-dark mb-6 leading-[1.1]"
        >
          Pacotes em grupo do catálogo atual da Pastore
        </m.h1>
        <m.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg md:text-xl text-slate-700 mb-4 leading-relaxed max-w-2xl"
        >
          Uma seleção do catálogo atual da Pastore Turismo, a maior empresa do Brasil em viagens
          em grupo para o público 50+. Roteiro, datas, hospedagem e guia em português resolvidos
          do início ao fim.
        </m.p>
        <m.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="text-sm text-slate-500 max-w-2xl"
        >
          O catálogo muda por temporada e as vagas variam entre um pacote e outro — a gente
          confirma a disponibilidade atualizada na conversa, antes de qualquer reserva.
        </m.p>
      </div>
    </section>
  );
}

interface PastorePacotesListProps {
  featuredPackage?: PastorePackage;
  secondaryPackages: PastorePackage[];
}

// Quando o catálogo (data/pastorePackages.ts) fica sem nenhum pacote ativo —
// todos venceram e a lista ainda não foi reposta — a página não pode ficar
// muda: hero, sitemap e CTA final continuam publicados prometendo pacotes que
// não aparecem. Mostra um estado explícito em vez de esconder a seção inteira.
function PastorePacotesEmptyState(): React.ReactElement {
  return (
    <section className="py-16 bg-white" aria-labelledby="pacotes-titulo">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 id="pacotes-titulo" className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3">
          Catálogo em atualização
        </h2>
        <p className="text-slate-600 text-lg mb-8">
          A seleção desta temporada acabou de fechar e ainda estamos atualizando com os próximos
          pacotes da Pastore Turismo. Fale com um especialista para saber o que abre em seguida.
        </p>
        <Button
          variant="action"
          size="lg"
          onClick={() => openContactModal(CONTACT_SOURCE)}
          className="btn-whatsapp btn-specialist"
          rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
          aria-label="Falar com um especialista sobre os próximos pacotes da Pastore Turismo"
          data-tracking="pacotes-vazio-pastore"
        >
          Falar com um Especialista
        </Button>
      </div>
    </section>
  );
}

export function PastorePacotesList({
  featuredPackage,
  secondaryPackages,
}: PastorePacotesListProps): React.ReactElement {
  if (!featuredPackage && secondaryPackages.length === 0) return <PastorePacotesEmptyState />;

  // `lg:grid-cols-3` deixa o último card sozinho numa linha nova sempre que a
  // contagem % 3 === 1 — mesmo ajuste documentado em CruzeirosLandingSections.
  const secondaryLastOrphanAtLg = secondaryPackages.length % 3 === 1;

  return (
    <section className="py-16 bg-white" aria-labelledby="pacotes-titulo">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_REVEAL}
          custom={0}
          className="mb-10"
        >
          <h2 id="pacotes-titulo" className="text-3xl md:text-4xl font-black text-anhanga-dark mb-3">
            Seleção da temporada 2026/2027
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl">
            Poucos pacotes, escolhidos a dedo entre o catálogo completo da Pastore. Cada um vem
            com o porquê de estar aqui — e um especialista para confirmar sua vaga.
          </p>
        </m.div>

        {featuredPackage ? (
          <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_REVEAL}
            custom={1}
            className="mb-6"
          >
            <FeaturedPackage pacote={featuredPackage} />
          </m.div>
        ) : null}

        {secondaryPackages.length > 0 ? (
          <div data-testid="pacotes-secundarios" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryPackages.map((pacote, idx) => (
              <m.div
                key={pacote.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT_REVEAL}
                custom={idx + 2}
                className={
                  secondaryLastOrphanAtLg && idx === secondaryPackages.length - 1
                    ? 'lg:col-start-2'
                    : undefined
                }
              >
                <PastorePackageCard pacote={pacote} />
              </m.div>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-slate-600 max-w-2xl">
          Não achou o roteiro ideal ou prefere montar uma viagem individual?{' '}
          <button
            type="button"
            onClick={() => openContactModal(CONTACT_SOURCE)}
            className="font-bold text-anhanga-blue underline underline-offset-2 hover:text-anhanga-darkBlue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action rounded"
            data-tracking="pacotes-fallback-pastore"
          >
            Conte o que você procura
          </button>{' '}
          — também montamos roteiro sob medida fora do catálogo em grupo.
        </p>
      </div>
    </section>
  );
}

export function PastorePacotesFinalCta(): React.ReactElement {
  return (
    <section className="py-20 container mx-auto px-6">
      <div className="bg-anhanga-dark text-white rounded-3xl px-6 py-16 md:p-20 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-black mb-6 leading-tight">
          Vamos confirmar a sua vaga?
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Conte qual pacote chamou sua atenção e a gente confirma disponibilidade, valores e
          próximos passos na conversa.
        </p>
        <Button
          variant="cta"
          size="lg"
          onClick={() => openContactModal(CONTACT_SOURCE)}
          className="btn-whatsapp btn-specialist font-black focus-visible:outline-white"
          rightIcon={<ArrowRight className="size-6" aria-hidden="true" />}
          aria-label="Falar com um especialista sobre os pacotes da Pastore Turismo"
          data-tracking="footer-pastore-pacotes"
        >
          Falar com um Especialista
        </Button>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link
            to="/melhor-idade/"
            className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Viagens Individuais 50+
          </Link>
          <Link
            to="/cruzeiros/"
            className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Cruzeiros pelo Brasil
          </Link>
          <Link
            to="/blog/"
            className="min-h-[44px] inline-flex items-center px-5 py-3 rounded-full bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Dicas de Viagem
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PastorePacotesFooter(): React.ReactElement {
  return (
    <footer className="py-8 bg-anhanga-light border-t border-anhanga-blue/10 text-center text-sm text-slate-600">
      <p>Anhangá Viagens · Agência de viagens de São Paulo para todo o Brasil</p>
    </footer>
  );
}
