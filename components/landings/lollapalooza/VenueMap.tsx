import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { POIS, getPoiStyle } from './venueMapData';
import { VenuePoiList } from './VenuePoiList';

const VenueMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Refs para controle de scroll da lista
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let a11yTimer: ReturnType<typeof setTimeout>;
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
      a11yTimer = setTimeout(() => {
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

      POIS.forEach((poi, index) => {
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
    return () => clearTimeout(a11yTimer);
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
      const poi = POIS[index];

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

          <VenuePoiList
            pois={POIS}
            activeIndex={activeIndex}
            listContainerRef={listContainerRef}
            itemsRef={itemsRef}
            onItemClick={handleListClick}
            getPoiStyle={getPoiStyle}
          />

          {/* Mapa */}
          <div className="w-full md:w-2/3 h-[400px] md:h-auto min-h-[400px] relative bg-gray-200">
            <section
              ref={mapContainerRef}
              className="w-full h-full z-0 outline-none"
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
