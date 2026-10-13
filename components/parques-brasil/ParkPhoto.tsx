import React from 'react';
import { Castle, Droplets, RollerCoaster, TreePalm, Waves, type LucideIcon } from 'lucide-react';
import type { Park } from './constants';

/*
  Foto do parque, ou o placeholder da marca enquanto não há foto com direito de
  uso confirmado (ver ParkImage em constants.ts). O placeholder é decorativo
  (aria-hidden): o nome do parque já está no heading ao lado, e um alt
  descrevendo um degradê não ajuda ninguém.

  Quem chama define o tamanho pelo `className` (altura fixa, não aspect-ratio):
  os dois cards credenciados têm larguras diferentes, e foto proporcional
  desalinharia os títulos.
*/

const PLACEHOLDER_ICON: Record<string, LucideIcon> = {
  'beto-carrero': Castle,
  'hopi-hari': RollerCoaster,
  'thermas-dos-laranjais': Droplets,
  'beach-park': TreePalm,
  'hot-park': Waves,
};

interface ParkPhotoProps {
  park: Pick<Park, 'slug' | 'name' | 'kind' | 'image'>;
  className?: string;
  /** Mostra o nome sobre a imagem — só onde não há heading do parque ao lado (mosaico do hero). */
  showName?: boolean;
  /** Prioriza o carregamento (acima da dobra). */
  eager?: boolean;
}

export const ParkPhoto: React.FC<ParkPhotoProps> = ({ park, className = '', showName = false, eager = false }) => {
  const nameTag = showName ? (
    <span className="absolute bottom-3 left-3 rounded-lg bg-anhanga-dark/70 px-2.5 py-1 font-display text-xs font-bold text-white/90">
      {park.name}
    </span>
  ) : null;

  if (park.image) {
    return (
      <figure className={`relative m-0 overflow-hidden bg-anhanga-light ${className}`}>
        <img
          src={park.image.src}
          alt={park.image.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
        />
        {nameTag}
        {park.image.credit ? (
          // Com o nome do parque no rodapé (mosaico do hero), o crédito sobe
          // para o topo: nos tiles de ~130px do celular os dois se sobrepunham.
          <figcaption
            className={`absolute right-2 max-w-[calc(100%-1rem)] text-right text-[10px] text-white/80 [text-shadow:0_1px_2px_rgba(15,23,42,0.8)] ${
              showName ? 'top-1.5' : 'bottom-1'
            }`}
          >
            {park.image.credit}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const Icon = PLACEHOLDER_ICON[park.slug] ?? (park.kind === 'Parque aquático' ? Waves : RollerCoaster);
  // Temático em Safira, aquático puxando para o Céu Vivo: o placeholder já
  // separa os dois grupos pela cor, como a foto vai separar pela cena.
  const tint =
    park.kind === 'Parque aquático'
      ? 'from-anhanga-action to-anhanga-blue'
      : 'from-anhanga-blue to-anhanga-darkBlue';

  return (
    <div
      data-park-placeholder={park.slug}
      aria-hidden="true"
      className={`relative overflow-hidden bg-gradient-to-br ${tint} ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
      />
      <Icon className="absolute -right-4 -bottom-6 size-40 text-white/20" strokeWidth={1.25} />
      {nameTag}
    </div>
  );
};
