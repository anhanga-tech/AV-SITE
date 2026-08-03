import React from 'react';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import type { PastorePackage } from '@/data/pastorePackages';
import { openContactModal } from '@/utils/contactForm';

// Rótulo enviado ao CRM (campo `destination` → x_destino no Odoo) e mostrado no
// ContactModal. Inclui o nome do pacote por extenso: lib/destination-region.ts
// casa palavras-chave de destino no texto livre para auto-tag da região no
// Odoo (ex.: "Itália" → Europa, "Cartagena" → América Latina) — mesmo
// mecanismo usado por CruiseOfferCards.tsx, sem precisar mapear manualmente.
function packageCrmLabel(p: PastorePackage): string {
  return `Pastore Turismo — ${p.destino} · ${p.periodo}`;
}

// Mensagem natural pré-preenchida no WhatsApp. Nunca promete vaga: o status do
// catálogo muda entre rebuilds (ver comentário em data/pastorePackages.ts).
function packageWhatsappMessage(p: PastorePackage): string {
  return `Olá! Vi o pacote em grupo "${p.destino}" (${p.periodo}) da Pastore Turismo e quero saber se ainda tem vaga.`;
}

function openPackageConversation(p: PastorePackage): void {
  openContactModal({
    source: 'melhor-idade-pacotes-pastore',
    destination: packageCrmLabel(p),
    message: packageWhatsappMessage(p),
  });
}

function PackageMeta({ pacote, className }: { pacote: PastorePackage; className?: string }): React.ReactElement {
  return (
    <dl className={`flex flex-wrap gap-x-6 gap-y-2 text-sm ${className ?? ''}`}>
      <div className="flex items-center gap-1.5">
        <MapPin className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
        <dt className="sr-only">Categoria</dt>
        <dd className="font-semibold text-anhanga-dark">{pacote.categoria}</dd>
      </div>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="size-4 text-anhanga-action flex-shrink-0" aria-hidden="true" />
        <dt className="sr-only">Duração</dt>
        <dd className="text-slate-600">{pacote.noites} noites</dd>
      </div>
    </dl>
  );
}

function ProfileTags({ perfis }: { perfis: string[] }): React.ReactElement {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Destaques deste pacote">
      {perfis.map((p) => (
        <li key={p} className="text-xs font-semibold text-anhanga-blue bg-anhanga-blue/10 rounded-full px-3 py-1">
          {p}
        </li>
      ))}
    </ul>
  );
}

function PeriodBadge({ periodo }: { periodo: string }): React.ReactElement {
  return (
    <div className="text-xs font-bold uppercase tracking-wide text-anhanga-action">
      {periodo}
    </div>
  );
}

// shadow-float (não border), sem lift no hover: mesmo raciocínio documentado
// em CruiseOfferCards.tsx — o card não é clicável, só o botão dentro dele.
export function FeaturedPackage({ pacote }: { pacote: PastorePackage }): React.ReactElement {
  return (
    <article className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden bg-white shadow-float">
      {/* w-full é obrigatório: sem largura explícita o container do LazyImage
          deriva a largura da altura (aspect-ratio) e estoura a coluna do grid. */}
      <LazyImage
        src={pacote.imagem}
        alt={pacote.imagemAlt}
        width={800}
        height={600}
        sizes="(min-width: 768px) 50vw, 100vw"
        className="w-full h-64 md:h-full"
      />
      <div className="p-8 md:p-10 flex flex-col">
        <PeriodBadge periodo={pacote.periodo} />
        <h3 className="mt-3 text-2xl md:text-3xl font-black text-anhanga-dark leading-tight">
          {pacote.destino}
        </h3>
        <PackageMeta pacote={pacote} className="mt-4" />
        <div className="mt-5 rounded-xl bg-anhanga-blue/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-anhanga-blue mb-1.5">
            Por que este pacote
          </p>
          <p className="text-slate-700 leading-relaxed">{pacote.notaCuratorial}</p>
        </div>
        <div className="mt-6">
          <ProfileTags perfis={pacote.perfis} />
        </div>
        <Button
          variant="action"
          size="lg"
          onClick={() => openPackageConversation(pacote)}
          className="btn-whatsapp btn-specialist mt-8 self-start"
          rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
          aria-label={`Falar com um especialista sobre o pacote ${pacote.destino}`}
          data-tracking={`pastore-pacote-featured-${pacote.id}`}
        >
          Confirmar disponibilidade
        </Button>
      </div>
    </article>
  );
}

export function PastorePackageCard({ pacote }: { pacote: PastorePackage }): React.ReactElement {
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-float">
      <LazyImage
        src={pacote.imagem}
        alt={pacote.imagemAlt}
        width={480}
        height={300}
        sizes="(min-width: 768px) 33vw, 100vw"
        className="w-full h-48"
      />
      <div className="p-6 flex flex-col flex-1">
        <PeriodBadge periodo={pacote.periodo} />
        <h3 className="mt-2 text-xl font-black text-anhanga-dark leading-tight">{pacote.destino}</h3>
        <PackageMeta pacote={pacote} className="mt-3" />
        <div className="mt-4 rounded-lg bg-anhanga-blue/[0.04] p-3 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-anhanga-blue mb-1">
            Por que este pacote
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">{pacote.notaCuratorial}</p>
        </div>
        <div className="mt-4">
          <ProfileTags perfis={pacote.perfis} />
        </div>
        <Button
          variant="action"
          onClick={() => openPackageConversation(pacote)}
          className="btn-whatsapp btn-specialist mt-5 w-full"
          rightIcon={<ArrowRight className="size-4" aria-hidden="true" />}
          aria-label={`Falar com um especialista sobre o pacote ${pacote.destino}`}
          data-tracking={`pastore-pacote-${pacote.id}`}
        >
          Confirmar disponibilidade
        </Button>
      </div>
    </article>
  );
}
