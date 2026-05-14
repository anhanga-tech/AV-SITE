import type { MutableRefObject, RefObject } from 'react';
import { MapPin, Navigation, CarFront, Info, ChevronRight, TrainFront } from 'lucide-react';
import { optimizeRemoteImageUrl } from '../../../data/mediaConfig';
import type { Poi, PoiStyle } from './venueMapData';

interface VenuePoiListProps {
  pois: Poi[];
  activeIndex: number | null;
  listContainerRef: RefObject<HTMLDivElement | null>;
  itemsRef: MutableRefObject<(HTMLButtonElement | null)[]>;
  onItemClick: (index: number) => void;
  getPoiStyle: (poi: Poi) => PoiStyle;
}

export function VenuePoiList({ pois, activeIndex, listContainerRef, itemsRef, onItemClick, getPoiStyle }: VenuePoiListProps) {
  return (
    <div className="w-full md:w-1/3 p-6 md:p-8 bg-white flex flex-col border-r border-gray-100 h-auto flex-shrink-0">
      <div className="inline-flex items-center gap-2 text-anhanga-blue font-bold uppercase tracking-wider text-xs mb-3">
        <MapPin size={16} aria-hidden="true" /> Localização & Referências
      </div>

      <h3 className="text-2xl font-black text-anhanga-darkBlue mb-2 leading-tight">
        Explore os arredores de <br /><span className="text-anhanga-yellow">Interlagos</span>
      </h3>

      <p className="text-gray-500 text-sm mb-6">
        Clique nos pontos abaixo para ver detalhes.
      </p>

      {/* Container da Lista com Scroll - Adicionado padding extra (p-2) para evitar corte da sombra/scale */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 min-h-0 -mx-4"
      >
        {pois.map((poi, idx) => {
          const style = getPoiStyle(poi);
          return (
            <button
              key={poi.name}
              ref={el => {
                itemsRef.current[idx] = el;
              }}
              onClick={() => onItemClick(idx)}
              className={`w-full text-left transition-all duration-300 rounded-xl border-2 group overflow-hidden relative ${activeIndex === idx
                ? 'border-anhanga-blue shadow-xl ring-2 ring-blue-100 z-10'
                : 'border-gray-100 hover:border-anhanga-yellow hover:shadow-md'
                }`}
            >
              {/* Imagem de Fundo Otimizada */}
              <div className="absolute inset-0 z-0">
                <img
                  src={optimizeRemoteImageUrl(poi.image, 400, 300)}
                  alt={`Local: ${poi.name}`}
                  width="400"
                  height="300"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30"
                />
                {/* Overlay para garantir legibilidade do texto sobre a imagem */}
                <div className={`absolute inset-0 transition-colors duration-300 ${activeIndex === idx ? 'bg-blue-50/90' : 'bg-white/90 group-hover:bg-white/80'
                  }`}></div>
              </div>

              {/* Conteúdo com z-10 para ficar sobre a imagem */}
              <div className="relative z-10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="size-8 rounded-full flex items-center justify-center shadow-sm transition-colors shrink-0"
                    style={{
                      backgroundColor: activeIndex === idx ? '#0056D2' : style.bgColor,
                      color: activeIndex === idx ? 'white' : style.iconColor
                    }}
                  >
                    <style.Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-sm leading-tight transition-colors ${activeIndex === idx ? 'text-anhanga-darkBlue whitespace-normal' : 'text-gray-800 truncate'}`}>
                      {poi.name}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      {style.label}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0 pl-2">
                  {activeIndex === idx ? (
                    <ChevronRight size={16} className="text-anhanga-blue rotate-90 transition-transform" />
                  ) : (
                    <>
                      <p className="font-black text-anhanga-darkBlue text-sm">{poi.distance}</p>
                      <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                        <CarFront size={10} /> {poi.time}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Detalhes Expandidos */}
              <div className={`relative z-10 grid transition-all duration-300 ease-in-out ${activeIndex === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}>
                <div className="overflow-hidden min-h-0">
                  <div className="p-3 pt-0 text-sm text-gray-600 border-t border-blue-100/50 mx-3 mt-1 space-y-3">

                    {/* Descrição Geral */}
                    <div className="flex items-start gap-2 pt-3">
                      <Info size={14} className="text-anhanga-blue shrink-0 mt-0.5" />
                      <p className="leading-snug">{poi.description}</p>
                    </div>

                    {/* Rota de Transporte Público */}
                    <div className="bg-white/60 backdrop-blur-sm p-2.5 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-1.5 text-gray-800 font-bold text-xs uppercase tracking-wide">
                        <TrainFront size={12} className="text-gray-600" />
                        Rota até o Autódromo (Transporte Público):
                      </div>
                      <p className="text-xs text-gray-600 leading-snug pl-5 border-l-2 border-gray-300">
                        {poi.transitInfo}
                      </p>
                    </div>

                    {/* Rodapé do Item */}
                    <div className="flex items-center justify-between text-xs font-semibold text-anhanga-darkBlue bg-blue-50/50 p-2 rounded-lg backdrop-blur-sm">
                      <span className="flex items-center gap-1"><CarFront size={12} /> Distância: {poi.distance}</span>
                      <span>Tempo est. carro: {poi.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 hidden md:block">
        <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
          <Navigation className="text-anhanga-blue shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-blue-800 leading-snug">
            <span className="font-bold">Dica:</span> Selecione um ponto para ver no mapa.
          </p>
        </div>
      </div>
    </div>
  );
}
