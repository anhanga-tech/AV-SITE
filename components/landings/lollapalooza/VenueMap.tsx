import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapPin, Navigation, Plane, Building2, Trees, CarFront, Info, ChevronRight, Utensils, TrainFront } from 'lucide-react';

const VenueMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Refs para controle de scroll da lista
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  /**
   * Helper para otimização de imagens
   * Utiliza wsrv.nl para converter para WebP, redimensionar e comprimir
   */
  const getOptimizedUrl = (url: string, width: number) => {
    // Remove query params para evitar conflitos e adiciona os parametros do wsrv.nl
    const cleanUrl = url.split('?')[0];
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&output=webp&q=80&fit=cover`;
  };

  // Dados dos Pontos de Interesse
  const pois = [
    {
      name: "Aeroporto de Guarulhos (GRU)",
      coords: [-23.426173, -46.467733] as [number, number],
      type: 'airport',
      distance: '55 km',
      time: '1h 30min',
      description: "Principal porta de entrada internacional. Recomendamos nosso transfer exclusivo que busca grupos acima de 10 pessoas mediante agendamento.",
      transitInfo: "Expresso Aeroporto até Luz ➔ Linha 4-Amarela até Pinheiros ➔ Linha 9-Esmeralda até Estação Autódromo. (~2h)",
      image: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1"
    },
    {
      name: "Aeroporto de Congonhas (CGH)",
      coords: [-23.627325, -46.656545] as [number, number],
      type: 'airport',
      distance: '15 km',
      time: '40 min',
      description: "Aeroporto central para voos domésticos. Localização estratégica, a apenas 15 minutos dos hotéis parceiros na região da Berrini.",
      transitInfo: "Uber até Estação Campo Belo (Linha 5-Lilás) ➔ Santo Amaro ➔ Linha 9-Esmeralda até Estação Autódromo. (~55min)",
      image: "https://images.unsplash.com/photo-1559406041-c7d2b2e986a3"
    },
    {
      name: "Parque Ibirapuera",
      coords: [-23.587416, -46.657634] as [number, number],
      type: 'landmark',
      distance: '18 km',
      time: '45 min',
      description: "O pulmão verde de SP. Ótimo para um passeio relaxante na manhã pré-festival. A região conta com hotéis boutique de alto padrão.",
      transitInfo: "Estação Moema (Linha 5-Lilás) ➔ Santo Amaro ➔ Linha 9-Esmeralda até Estação Autódromo. (~50min)",
      image: "https://images.unsplash.com/photo-1596484552993-9c59508927eb"
    },
    {
      name: "Av. Paulista",
      coords: [-23.561349, -46.656388] as [number, number],
      type: 'landmark',
      distance: '22 km',
      time: '50 min',
      description: "O coração financeiro e cultural. Oferecemos pacotes com hospedagem nesta região para quem quer curtir a cidade além dos shows.",
      transitInfo: "Estação Consolação (Linha 2-Verde) ➔ Pinheiros (Linha 4) ➔ Linha 9-Esmeralda até Estação Autódromo. (~1h)",
      image: "https://images.unsplash.com/photo-1554862426-3d2f267793d5"
    },
    {
      name: "Pinheiros (Bares e Restaurantes)",
      coords: [-23.566374, -46.702966] as [number, number],
      type: 'landmark',
      distance: '20 km',
      time: '45 min',
      description: "Bairro boêmio com a melhor gastronomia e vida noturna. Perfeito para o 'esquenta' ou para jantar após o festival.",
      transitInfo: "Estação Pinheiros (Linha 9-Esmeralda) ➔ Direto até Estação Autódromo. Rota mais rápida de trem. (~35min)",
      image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b"
    }
  ];

  // Helper para determinar estilo do ícone baseado no tipo/nome
  const getPoiStyle = (poi: typeof pois[0]) => {
    if (poi.type === 'airport') {
      return { Icon: Plane, bgColor: '#4B5563', iconColor: 'white', label: 'Aeroporto' };
    }
    if (poi.name.includes('Parque')) {
      return { Icon: Trees, bgColor: '#059669', iconColor: 'white', label: 'Natureza' };
    }
    if (poi.name.includes('Pinheiros')) {
      return { Icon: Utensils, bgColor: '#FFD600', iconColor: '#003B8E', label: 'Gastronomia' };
    }
    return { Icon: Building2, bgColor: '#0056D2', iconColor: 'white', label: 'Cidade' };
  };

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const interlagosCoords: [number, number] = [-23.701186, -46.697076];

      // Inicializa o mapa com controle de zoom desabilitado para adicionar manualmente depois com posição personalizada
      const map = L.map(mapContainerRef.current, {
        center: interlagosCoords,
        zoom: 11,
        scrollWheelZoom: false,
        dragging: true,
        zoomControl: false, // Vamos adicionar manualmente
        keyboard: true
      });

      // Adiciona controle de zoom no canto inferior direito (mais fácil em mobile)
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Acessibilidade: Traduzir os botões de zoom para PT-BR
      setTimeout(() => {
        const zoomInBtn = mapContainerRef.current?.querySelector('.leaflet-control-zoom-in');
        const zoomOutBtn = mapContainerRef.current?.querySelector('.leaflet-control-zoom-out');

        if (zoomInBtn) {
          zoomInBtn.setAttribute('aria-label', 'Aumentar zoom do mapa');
          zoomInBtn.setAttribute('title', 'Aumentar zoom');
        }
        if (zoomOutBtn) {
          zoomOutBtn.setAttribute('aria-label', 'Diminuir zoom do mapa');
          zoomOutBtn.setAttribute('title', 'Diminuir zoom');
        }
      }, 500);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // --- ÍCONE PRINCIPAL (INTERLAGOS) ---
      const interlagosIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div role="img" aria-label="Localização do Autódromo" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                 <div class="pin-pulse" style="position: absolute; inset: -10px;"></div>
                 <div style="background-color: #003B8E; border: 3px solid #FFD600; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 20; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                    ${renderToStaticMarkup(<MapPin size={22} color="white" strokeWidth={2.5} />)}
                 </div>
               </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const interlagosMarker = L.marker(interlagosCoords, {
        icon: interlagosIcon,
        title: "Autódromo de Interlagos",
        zIndexOffset: 1000,
        alt: "Marcador do Autódromo de Interlagos", // Acessibilidade
        keyboard: true
      }).addTo(map).bindPopup(`
        <div style="text-align: center; font-family: 'Outfit', sans-serif;">
            <strong style="color: #003B8E; font-size: 14px;">Autódromo de Interlagos</strong><br/>
            <span style="font-size: 12px; color: #666;">O Palco do Lolla</span>
        </div>
      `);

      markersRef.current = [];

      // --- ÍCONES DOS POIS ---
      const markers: L.Marker[] = [interlagosMarker];

      pois.forEach((poi, index) => {
        const style = getPoiStyle(poi);
        const iconSvgString = renderToStaticMarkup(
          <style.Icon size={18} color={style.iconColor} strokeWidth={2.5} />
        );

        const poiIcon = L.divIcon({
          className: 'custom-poi-pin',
          html: `<div role="img" aria-label="${poi.name}" style="background-color: ${style.bgColor}; border: 2px solid white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 6px rgba(0,0,0,0.25); transition: transform 0.2s;">
                   ${iconSvgString}
                 </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker(poi.coords, {
          icon: poiIcon,
          title: poi.name,
          alt: `Localização: ${poi.name}`, // Acessibilidade
          keyboard: true
        }).addTo(map);

        marker.bindPopup(`
           <div style="text-align: center; font-family: 'Outfit', sans-serif; max-width: 200px;">
            <strong style="color: #333; font-size: 13px; display: block; margin-bottom: 4px;">${poi.name}</strong>
            <span style="font-size: 11px; color: #666;">${poi.description}</span>
          </div>
        `);

        marker.on('click', () => {
          setActiveIndex(index);
          map.flyTo(poi.coords, 13, { animate: true, duration: 1 });
        });

        markersRef.current.push(marker);
        markers.push(marker);
      });

      const group = new L.FeatureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });

      mapInstanceRef.current = map;
    }
  }, []);

  // Efeito para rolar a lista até o item ativo quando selecionado via Mapa
  useEffect(() => {
    if (activeIndex !== null && itemsRef.current[activeIndex] && listContainerRef.current) {
      const itemElement = itemsRef.current[activeIndex];
      itemElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [activeIndex]);

  const handleListClick = (index: number) => {
    const newIndex = activeIndex === index ? null : index;
    setActiveIndex(newIndex);

    if (newIndex !== null && mapInstanceRef.current && markersRef.current[index]) {
      const marker = markersRef.current[index];
      const poi = pois[index];

      mapInstanceRef.current.flyTo(poi.coords, 14, { animate: true, duration: 1.5 });
      marker.openPopup();

      if (window.innerWidth < 768 && mapContainerRef.current) {
        setTimeout(() => {
          mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  };

  return (
    <section className="relative z-20 -mt-10 mb-10 px-4" aria-label="Mapa da localização e pontos de interesse">
      <div className="container mx-auto">
        {/* Instruções para leitores de tela */}
        <p id="map-a11y-instructions" className="sr-only">
          Utilize as setas do teclado para mover o mapa. Utilize as teclas de mais e menos para aumentar e diminuir o zoom. Pressione Tab para navegar entre os marcadores dos locais.
        </p>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

          {/* Informações / Lista de Distâncias */}
          {/* Aumentei o max-h no mobile de 50vh para 600px para evitar cortes no card */}
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
                    key={idx}
                    ref={el => {
                      itemsRef.current[idx] = el;
                    }}
                    onClick={() => handleListClick(idx)}
                    className={`w-full text-left transition-all duration-300 rounded-xl border-2 group overflow-hidden relative ${activeIndex === idx
                      ? 'border-anhanga-blue shadow-xl ring-2 ring-blue-100 z-10'
                      : 'border-gray-100 hover:border-anhanga-yellow hover:shadow-md'
                      }`}
                  >
                    {/* Imagem de Fundo Otimizada */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={getOptimizedUrl(poi.image, 400)}
                        alt={`Local: ${poi.name}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Overlay para garantir legibilidade do texto sobre a imagem */}
                      <div className={`absolute inset-0 transition-colors duration-300 ${activeIndex === idx ? 'bg-blue-50/90' : 'bg-white/90 group-hover:bg-white/80'
                        }`}></div>
                    </div>

                    {/* Conteúdo com z-10 para ficar sobre a imagem */}
                    <div className="relative z-10 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors shrink-0"
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

          {/* Mapa */}
          <div className="w-full md:w-2/3 h-[400px] md:h-auto min-h-[400px] relative bg-gray-200">
            <div
              ref={mapContainerRef}
              className="w-full h-full z-0 outline-none"
              role="region"
              aria-label="Mapa interativo com pontos de interesse"
              aria-describedby="map-a11y-instructions"
              tabIndex={0}
            />
            {/* Gradient Overlay apenas desktop */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none hidden md:block z-[400]" aria-hidden="true"></div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default VenueMap;