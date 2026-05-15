import { Plane, Building2, Trees, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Poi {
  name: string;
  coords: [number, number];
  type: string;
  distance: string;
  time: string;
  description: string;
  transitInfo: string;
  image: string;
}

export interface PoiStyle {
  Icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  label: string;
}

export const POIS: Poi[] = [
  {
    name: "Aeroporto de Guarulhos (GRU)",
    coords: [-23.426173, -46.467733],
    type: 'airport',
    distance: '55 km',
    time: '1h 30min',
    description: "Principal porta de entrada internacional. Recomendamos nosso transfer exclusivo que busca grupos acima de 10 pessoas mediante agendamento.",
    transitInfo: "Expresso Aeroporto até Luz ➔ Linha 4-Amarela até Pinheiros ➔ Linha 9-Esmeralda até Estação Autódromo. (~2h)",
    image: "images/lollapalooza/venue/gru.jpg"
  },
  {
    name: "Aeroporto de Congonhas (CGH)",
    coords: [-23.627325, -46.656545],
    type: 'airport',
    distance: '15 km',
    time: '40 min',
    description: "Aeroporto central para voos domésticos. Localização estratégica, a apenas 15 minutos dos hotéis parceiros na região da Berrini.",
    transitInfo: "Uber até Estação Campo Belo (Linha 5-Lilás) ➔ Santo Amaro ➔ Linha 9-Esmeralda até Estação Autódromo. (~55min)",
    image: "images/lollapalooza/venue/cgh.jpg"
  },
  {
    name: "Parque Ibirapuera",
    coords: [-23.587416, -46.657634],
    type: 'landmark',
    distance: '18 km',
    time: '45 min',
    description: "O pulmão verde de SP. Ótimo para um passeio relaxante na manhã pré-festival. A região conta com hotéis de alto padrão.",
    transitInfo: "Estação Moema (Linha 5-Lilás) ➔ Santo Amaro ➔ Linha 9-Esmeralda até Estação Autódromo. (~50min)",
    image: "images/lollapalooza/venue/ibirapuera.jpg"
  },
  {
    name: "Av. Paulista",
    coords: [-23.561349, -46.656388],
    type: 'landmark',
    distance: '22 km',
    time: '50 min',
    description: "O coração financeiro e cultural. Oferecemos pacotes com hospedagem nesta região para quem quer curtir a cidade além dos shows.",
    transitInfo: "Estação Consolação (Linha 2-Verde) ➔ Pinheiros (Linha 4) ➔ Linha 9-Esmeralda até Estação Autódromo. (~1h)",
    image: "images/lollapalooza/venue/avenida-paulista.jpg"
  },
  {
    name: "Pinheiros (Bares e Restaurantes)",
    coords: [-23.566374, -46.702966],
    type: 'landmark',
    distance: '20 km',
    time: '45 min',
    description: "Bairro boêmio com a melhor gastronomia e vida noturna. Perfeito para o 'esquenta' ou para jantar após o festival.",
    transitInfo: "Estação Pinheiros (Linha 9-Esmeralda) ➔ Direto até Estação Autódromo. Rota mais rápida de trem. (~35min)",
    image: "images/lollapalooza/venue/pinheiros.jpg"
  }
];

export function getPoiStyle(poi: Poi): PoiStyle {
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
}
