import React from 'react';
import { ArrowRight, MapPin, Moon, Ship } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import type { CruiseOffer } from '@/data/cruiseOffers';
import { openContactModal } from '@/utils/contactForm';

// Rótulo enviado ao CRM (campo `destination` → x_destino no Odoo) e mostrado no
// ContactModal. A palavra "cruzeiro" auto-classifica o lead com a tag Cruzeiros
// (lib/destination-region.ts). Também é o texto que o especialista vê primeiro.
function offerCrmLabel(o: CruiseOffer): string {
  return `Cruzeiro ${o.navio} · ${o.portoEmbarque} · ${o.saida}`;
}

// Mensagem natural pré-preenchida no WhatsApp quando o lead abre a conversa.
function offerWhatsappMessage(o: CruiseOffer): string {
  return `Olá! Tenho interesse no cruzeiro do ${o.navio} saindo de ${o.portoEmbarque} em ${o.saida}. Podem me ajudar?`;
}

function openOfferConversation(o: CruiseOffer): void {
  openContactModal({
    source: 'cruzeiros-oferta',
    destination: offerCrmLabel(o),
    message: offerWhatsappMessage(o),
  });
}

function OfferMeta({ offer, className }: { offer: CruiseOffer; className?: string }): React.ReactElement {
  return (
    <dl className={`flex flex-wrap gap-x-6 gap-y-2 text-sm ${className ?? ''}`}>
      <div className="flex items-center gap-1.5">
        <Ship className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
        <dt className="sr-only">Navio</dt>
        <dd className="font-semibold text-anhanga-dark">{offer.companhia}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
        <dt className="sr-only">Roteiro</dt>
        <dd className="text-zinc-600">{offer.roteiro.join(' · ')}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <Moon className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
        <dt className="sr-only">Duração</dt>
        <dd className="text-zinc-600">{offer.noites} noites</dd>
      </div>
    </dl>
  );
}

function ProfileTags({ perfis }: { perfis: string[] }): React.ReactElement {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Perfis indicados">
      {perfis.map((p) => (
        <li key={p} className="text-xs font-semibold text-anhanga-blue bg-anhanga-blue/10 rounded-full px-3 py-1">
          {p}
        </li>
      ))}
    </ul>
  );
}

function RegionBadge({ regiao, saida }: { regiao: string; saida: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-anhanga-action">
      <span>{regiao}</span>
      <span className="text-zinc-300" aria-hidden="true">·</span>
      <span className="text-zinc-500">{saida}</span>
    </div>
  );
}

// shadow-float (não border): DESIGN.md §5 reserva border a inputs — cards
// separam por sombra ou fundo tonalizado. Sem lift no hover: o card em si não
// é clicável, só o botão dentro dele; sombra que cresce ao passar o mouse no
// card inteiro seria affordance de clique sem clique (mesmo raciocínio do
// PILLARS de /consultoria-de-viagem).
export function FeaturedOffer({ offer }: { offer: CruiseOffer }): React.ReactElement {
  return (
    <article className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-white shadow-float">
      {/* w-full é obrigatório: o LazyImage aplica `aspect-ratio` inline a partir de
          width/height, e sem uma largura explícita o container deriva a largura da
          altura (h-full) e estoura a coluna do grid. */}
      <LazyImage
        src={offer.imagem}
        alt={offer.imagemAlt}
        width={800}
        height={600}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="w-full h-64 md:h-full"
      />
      <div className="p-8 md:p-10 flex flex-col">
        <RegionBadge regiao={offer.regiao} saida={offer.saida} />
        <h3 className="mt-3 text-2xl md:text-3xl font-black text-anhanga-dark leading-tight">
          {offer.navio}
        </h3>
        <OfferMeta offer={offer} className="mt-4" />
        <div className="mt-5 rounded-xl bg-anhanga-blue/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-anhanga-blue mb-1.5">
            Por que escolhemos
          </p>
          <p className="text-zinc-700 leading-relaxed">{offer.notaCuratorial}</p>
        </div>
        <div className="mt-6">
          <ProfileTags perfis={offer.perfis} />
        </div>
        <Button
          variant="action"
          size="lg"
          onClick={() => openOfferConversation(offer)}
          className="btn-whatsapp btn-specialist mt-8 self-start"
          rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
          aria-label={`Falar com um especialista sobre o cruzeiro ${offer.navio}`}
          data-tracking={`oferta-featured-${offer.id}`}
        >
          Quero saber mais
        </Button>
      </div>
    </article>
  );
}

export function OfferCard({ offer }: { offer: CruiseOffer }): React.ReactElement {
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-float">
      <LazyImage
        src={offer.imagem}
        alt={offer.imagemAlt}
        width={480}
        height={300}
        sizes="(min-width: 768px) 33vw, 100vw"
        className="w-full h-48"
      />
      <div className="p-6 flex flex-col flex-1">
        <RegionBadge regiao={offer.regiao} saida={offer.saida} />
        <h3 className="mt-2 text-xl font-black text-anhanga-dark leading-tight">{offer.navio}</h3>
        <OfferMeta offer={offer} className="mt-3" />
        <div className="mt-4 rounded-lg bg-anhanga-blue/[0.04] p-3 flex-1">
          <p className="text-[0.65rem] font-black uppercase tracking-wide text-anhanga-blue mb-1">
            Por que escolhemos
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed">{offer.notaCuratorial}</p>
        </div>
        <div className="mt-4">
          <ProfileTags perfis={offer.perfis} />
        </div>
        <Button
          variant="action"
          onClick={() => openOfferConversation(offer)}
          className="btn-whatsapp btn-specialist mt-5 w-full"
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          aria-label={`Falar com um especialista sobre o cruzeiro ${offer.navio}`}
          data-tracking={`oferta-${offer.id}`}
        >
          Falar sobre este
        </Button>
      </div>
    </article>
  );
}
