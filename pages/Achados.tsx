import React from 'react';
import { WhatsappLogo } from '@phosphor-icons/react';
import { Seo } from '../components/Seo';
import { openContactModal } from '../utils/contactForm';
import { useWhatsAppLink } from '../utils/whatsapp';
import {
  formatIsoDateBR,
  getActiveAchados,
  getAchadosReferenceDate,
  type Achado,
} from '../lib/achados';
import achadosContent from '../content/achados.json';

const PAGE_URL = 'https://www.anhanga.tur.br/achados/';

const EMPTY_STATE_MESSAGE = 'Olá! Vi a página de achados e quero ajuda para encontrar uma oferta para a minha viagem. Destino:';

// Calculado uma vez por bundle: a data de referência é a do build (ver lib/achados.ts).
const ACTIVE_ACHADOS = getActiveAchados(achadosContent.achados as Achado[], getAchadosReferenceDate());

// O clique abre o ContactModal (mesmo padrão do /links e do Header): grava nome e WhatsApp no
// Odoo via /api/submit-contact e só então abre o WhatsApp. É o que transforma o interesse numa
// oferta em perfil no CRM — `source` chega como "Origem (CTA)" e `destination` como destino de
// interesse do lead. O `href` wa.me fica como fallback sem JS; `data-no-whatsapp-cta` evita que
// public/utm-tracking.js conte a abertura do formulário como chegada ao WhatsApp.
const handleAchadoClick = (event: React.MouseEvent<HTMLAnchorElement>, achado: Achado) => {
  event.preventDefault();
  openContactModal({ source: `achados-${achado.id}`, destination: achado.destino, message: achado.mensagemWhatsapp });
};

const AchadoCard: React.FC<{ achado: Achado }> = ({ achado }) => {
  const whatsappUrl = useWhatsAppLink(achado.mensagemWhatsapp);

  return (
    <article
      className="flex flex-col rounded-2xl bg-white p-6 sm:p-8 shadow-float"
      aria-labelledby={`achado-${achado.id}-titulo`}
      data-testid="achado-card"
    >
      <p className="font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-actionDark">
        {achado.destino} · {achado.fornecedor}
      </p>
      <h2 id={`achado-${achado.id}-titulo`} className="mt-3 font-display text-2xl font-extrabold leading-tight text-anhanga-dark">
        {achado.titulo}
      </h2>
      <p className="mt-4 leading-relaxed text-zinc-700">{achado.porQueVale}</p>
      {achado.preco ? (
        <p className="mt-4 font-semibold text-anhanga-dark">{achado.preco}</p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{achado.condicoes}</p>
      <p className="mt-4 text-sm font-semibold text-anhanga-dark">
        Reservas até {formatIsoDateBR(achado.validoAte)}
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-tracking={`achados-${achado.id}`}
        data-no-whatsapp-cta
        onClick={(event) => handleAchadoClick(event, achado)}
        className="btn-whatsapp mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-anhanga-dark px-6 py-3 font-display font-bold text-white transition-colors hover:bg-anhanga-darkBlue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action sm:self-start"
      >
        <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
        Quero saber mais
      </a>
    </article>
  );
};

const handleEmptyStateClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  openContactModal({ source: 'achados-vazio', message: EMPTY_STATE_MESSAGE });
};

const AchadosEmptyState: React.FC = () => {
  const whatsappUrl = useWhatsAppLink(EMPTY_STATE_MESSAGE);

  return (
    <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-float" data-testid="achados-vazio">
      <p className="font-display text-xl font-extrabold text-anhanga-dark">Nenhum achado no ar agora.</p>
      <p className="mt-3 leading-relaxed text-zinc-700">
        As ofertas desta página duram poucos dias e a próxima leva ainda está sendo escolhida. Se você já tem um destino em
        mente, conte pra gente que procuramos a melhor condição.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-tracking="achados-vazio"
        data-no-whatsapp-cta
        onClick={handleEmptyStateClick}
        className="btn-whatsapp mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-anhanga-dark px-6 py-3 font-display font-bold text-white transition-colors hover:bg-anhanga-darkBlue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
      >
        <WhatsappLogo size={20} weight="fill" aria-hidden="true" />
        Falar no WhatsApp
      </a>
    </div>
  );
};

const Achados: React.FC = () => (
  <>
    {/* noindex: as ofertas duram dias. Indexadas, ficariam em snippets e caches de busca depois
        de vencidas — e oferta anunciada vincula quem anuncia (CDC, art. 30). O tráfego desta
        página vem do /links, do canal de WhatsApp e do e-mail, não da busca orgânica. */}
    <Seo
      title="Achados da quinzena | Anhangá Viagens"
      description="Ofertas de viagem escolhidas a dedo pela Anhangá Viagens, por tempo limitado."
      canonical={PAGE_URL}
      robots="noindex, follow"
    />
    <section className="bg-anhanga-light pt-32 pb-16 sm:pt-36 sm:pb-24">
      <div className="container mx-auto max-w-3xl px-6">
        <p className="font-display text-xs font-black uppercase tracking-[0.1em] text-anhanga-actionDark">
          Por tempo limitado
        </p>
        <h1 className="mt-4 font-display text-4xl font-black leading-[0.95] tracking-tight text-anhanga-dark sm:text-5xl">
          Achados da quinzena
        </h1>
        <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-zinc-700">
          Toda semana chegam dezenas de ofertas das operadoras. Aqui ficam só as que a gente indicaria para um amigo: no
          máximo três, cada uma com o motivo de estar aqui.
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {ACTIVE_ACHADOS.length > 0 ? (
            ACTIVE_ACHADOS.map((achado) => <AchadoCard key={achado.id} achado={achado} />)
          ) : (
            <AchadosEmptyState />
          )}
        </div>

        {ACTIVE_ACHADOS.length > 0 ? (
          <p className="mt-8 text-xs leading-relaxed text-zinc-600">
            Preços e condições divulgados pelas operadoras, sujeitos a disponibilidade e a alteração até a confirmação da
            reserva. Valores &ldquo;a partir de&rdquo; referem-se à menor tarifa da saída indicada. Cada oferta sai desta
            página no dia seguinte ao fim do prazo de reserva.
          </p>
        ) : null}
      </div>
    </section>
  </>
);

export default Achados;
