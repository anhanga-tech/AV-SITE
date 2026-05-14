import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X, Calendar, ArrowRight, Star, Compass, MousePointerClick, Share2, Image as ImageIcon, Loader2, Plus, Minus, Share } from 'lucide-react';
import { SocialShare } from './SocialShare';
import { LazyImage } from './ui/LazyImage';
import { openContactModal } from '../utils/contactForm';
import { getDestinationImage } from '../data/mediaConfig';
import { NOISE_TEXTURE_URL } from '../lib/static-assets';

import { Link } from "react-router-dom";

interface Destination {
    coords: [number, number];
    image: string;
    city: string;
    country: string;
    rating: string;
    price: string;
    description: string;
    continent: string;
    details: string;
    activities: string[];
    landingPage?: string;
}

const noiseTextureStyle = {
    backgroundImage: `url("${NOISE_TEXTURE_URL}")`,
};

// Static configuration moved outside component to prevent recreation on every render
const DESTINATIONS: Destination[] = [
    // --- AMÉRICAS ---
    {
        coords: [28.5383, -81.3792],
        image: getDestinationImage("Orlando"),
        city: "Orlando",
        landingPage: "/orlando",
        country: "EUA",
        rating: "4.98",
        price: "R$ 15.000",
        description: "Magia dos parques e compras",
        continent: "América do Norte",
        details: "A capital mundial da diversão.",
        activities: ["Disney", "Universal", "Compras"]
    },
    {
        coords: [18.5601, -68.3725],
        image: getDestinationImage("Punta Cana"),
        city: "Punta Cana",
        country: "Rep. Dominicana",
        rating: "4.95",
        price: "R$ 3.800",
        description: "Praias de areia branca",
        continent: "América Central",
        details: "Resorts All-Inclusive de luxo.",
        activities: ["Praia", "Mergulho", "Relax"]
    },
    {
        coords: [21.1619, -86.8515],
        image: getDestinationImage("Cancún"),
        city: "Cancún",
        country: "México",
        rating: "4.89",
        price: "R$ 4.100",
        description: "Caribe vibrante",
        continent: "América do Norte",
        details: "Beleza do Caribe e cultura Maia.",
        activities: ["Praia", "Festas", "História"]
    },
    // --- AMÉRICA DO SUL ---
    {
        coords: [-26.8041, -48.6521],
        image: getDestinationImage("Beto Carrero"),
        city: "Beto Carrero",
        landingPage: "/beto-carrero",
        country: "Brasil",
        rating: "4.92",
        price: "R$ 1.500",
        description: "Maior parque temático da AL",
        continent: "América do Sul",
        details: "Diversão garantida para toda a família em Santa Catarina.",
        activities: ["Hot Wheels", "FireWhip", "Zoológico"]
    },
    {
        coords: [-29.3738, -50.8764],
        image: getDestinationImage("Gramado"),
        city: "Gramado",
        country: "Brasil",
        rating: "4.91",
        price: "R$ 2.200",
        description: "Charme na Serra",
        continent: "América do Sul",
        details: "Europa no Brasil.",
        activities: ["Frio", "Chocolate", "Romance"]
    },
    {
        coords: [-22.9068, -43.1729],
        image: getDestinationImage("Rio de Janeiro"),
        city: "Rio de Janeiro",
        country: "Brasil",
        rating: "4.93",
        price: "R$ 1.900",
        description: "Cidade Maravilhosa",
        continent: "América do Sul",
        details: "Samba, praias icônicas e paisagens de tirar o fôlego.",
        activities: ["Cristo Redentor", "Praias", "Pão de Açúcar"]
    },
    {
        coords: [-5.7945, -35.2110],
        image: getDestinationImage("Natal"),
        city: "Natal",
        country: "Brasil",
        rating: "4.92",
        price: "R$ 2.300",
        description: "Cidade do Sol",
        continent: "América do Sul",
        details: "Dunas emocionantes, praias mornas e muito sol o ano todo.",
        activities: ["Genipabu", "Ponta Negra", "Buggy"]
    },
    {
        coords: [-13.1631, -72.5450],
        image: getDestinationImage("Cusco"),
        city: "Cusco",
        country: "Peru",
        rating: "4.98",
        price: "R$ 4.200",
        description: "Império Inca",
        continent: "América do Sul",
        details: "História viva, lhamas e os mistérios dos Andes.",
        activities: ["Machu Picchu", "Vale Sagrado", "História"]
    },
    {
        coords: [-33.4489, -70.6693],
        image: getDestinationImage("Santiago"),
        city: "Santiago",
        country: "Chile",
        rating: "4.88",
        price: "R$ 3.500",
        description: "Cordilheira e Vinhos",
        continent: "América do Sul",
        details: "Neve, vinhos premiados e modernidade aos pés dos Andes.",
        activities: ["Valle Nevado", "Vinícolas", "Cajón del Maipo"]
    },
    {
        coords: [10.3910, -75.4795],
        image: getDestinationImage("Cartagena"),
        city: "Cartagena",
        country: "Colômbia",
        rating: "4.90",
        price: "R$ 3.900",
        description: "Caribe Colonial",
        continent: "América do Sul",
        details: "Charme histórico, cores vibrantes e mar do Caribe.",
        activities: ["Cidade Murada", "Ilhas do Rosário", "Café"]
    },

    // --- EUROPA ---
    {
        coords: [48.8566, 2.3522],
        image: getDestinationImage("Paris"),
        city: "Paris",
        country: "França",
        rating: "4.92",
        price: "R$ 6.200",
        description: "Romance e história",
        continent: "Europa",
        details: "A Cidade Luz.",
        activities: ["Torre Eiffel", "Louvre", "Sena"]
    },
    {
        coords: [38.7223, -9.1393],
        image: getDestinationImage("Lisboa"),
        city: "Lisboa",
        country: "Portugal",
        rating: "4.96",
        price: "R$ 5.500",
        description: "História e fado",
        continent: "Europa",
        details: "Charme e azulejos.",
        activities: ["História", "Comida", "Vinho"]
    },
    {
        coords: [36.3932, 25.4615],
        image: getDestinationImage("Santorini"),
        city: "Santorini",
        country: "Grécia",
        rating: "4.97",
        price: "R$ 7.800",
        description: "Pôr do sol mágico",
        continent: "Europa",
        details: "Casinhas brancas e mar azul profundo.",
        activities: ["Vistas", "Vinho", "Praias"]
    },

    // --- ÁSIA ---
    {
        coords: [35.6762, 139.6503],
        image: getDestinationImage("Tóquio"),
        city: "Tóquio",
        country: "Japão",
        rating: "4.99",
        price: "R$ 8.500",
        description: "Tradição e Futuro",
        continent: "Ásia",
        details: "A metrópole mais fascinante do mundo.",
        activities: ["Tecnologia", "Templos", "Gastronomia"]
    },
    {
        coords: [-8.4095, 115.1889],
        image: getDestinationImage("Bali"),
        city: "Bali",
        country: "Indonésia",
        rating: "4.94",
        price: "R$ 6.800",
        description: "Paraíso Zen",
        continent: "Ásia",
        details: "Espiritualidade e natureza exuberante.",
        activities: ["Praias", "Templos", "Yoga"]
    },
    {
        coords: [25.2048, 55.2708],
        image: getDestinationImage("Dubai"),
        city: "Dubai",
        country: "Emirados Árabes",
        rating: "4.90",
        price: "R$ 7.200",
        description: "Luxo no Deserto",
        continent: "Ásia",
        details: "Arquitetura futurista e compras.",
        activities: ["Burj Khalifa", "Deserto", "Shoppings"]
    },
    {
        coords: [13.7563, 100.5018],
        image: getDestinationImage("Bangkok"),
        city: "Bangkok",
        country: "Tailândia",
        rating: "4.87",
        price: "R$ 5.500",
        description: "Templos Dourados",
        continent: "Ásia",
        details: "Cultura vibrante e comida de rua incrível.",
        activities: ["Grand Palace", "Massagem", "Street Food"]
    },

    // --- ÁFRICA ---
    {
        coords: [-33.9249, 18.4241],
        image: getDestinationImage("Cidade do Cabo"),
        city: "Cidade do Cabo",
        country: "África do Sul",
        rating: "4.88",
        price: "R$ 5.100",
        description: "Encontro de Oceanos",
        continent: "África",
        details: "Montanhas, vinhedos e pinguins.",
        activities: ["Table Mountain", "Vinhos", "Safári"]
    },
    {
        coords: [30.0444, 31.2357],
        image: getDestinationImage("Cairo"),
        city: "Cairo",
        country: "Egito",
        rating: "4.85",
        price: "R$ 5.900",
        description: "Berço da História",
        continent: "África",
        details: "Onde o passado encontra o presente.",
        activities: ["Pirâmides", "Nilo", "Museus"]
    },
    {
        coords: [31.6295, -7.9811],
        image: getDestinationImage("Marrakech"),
        city: "Marrakech",
        country: "Marrocos",
        rating: "4.89",
        price: "R$ 6.100",
        description: "Cores e Aromas",
        continent: "África",
        details: "Uma experiência sensorial única.",
        activities: ["Medina", "Jardins", "Deserto"]
    },

    // --- OCEANIA ---
    {
        coords: [-33.8688, 151.2093],
        image: getDestinationImage("Sydney"),
        city: "Sydney",
        country: "Austrália",
        rating: "4.92",
        price: "R$ 9.500",
        description: "Vibe Australiana",
        continent: "Oceania",
        details: "Praias urbanas e arquitetura icônica.",
        activities: ["Opera House", "Surf", "Cangurus"]
    },
    {
        coords: [-16.5004, -151.7415],
        image: getDestinationImage("Bora Bora"),
        city: "Bora Bora",
        country: "Polinésia Francesa",
        rating: "4.99",
        price: "R$ 12.000",
        description: "A Lagoa Azul",
        continent: "Oceania",
        details: "O destino definitivo de lua de mel.",
        activities: ["Bungalows", "Mergulho", "Relax"]
    }
];

const FILTERS = ['Todos', 'América do Norte', 'América Central', 'América do Sul', 'Europa', 'Ásia', 'África', 'Oceania'];

const CONTINENT_COLORS: Record<string, string> = {
    'América do Norte': '#0ea5e9',
    'América Central': '#06b6d4',
    'América do Sul': '#10b981',
    'Europa': '#10b981',
    'Ásia': '#f43f5e', // Rose
    'África': '#d97706', // Amber
    'Oceania': '#0891b2', // Cyan-700
};

// Componente LazyImage Otimizado - REFATORADO PARA COMPONENTE COMPARTILHADO
// importado de ../components/ui/LazyImage

/**
 * Destinations Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents the entire Destinations section from re-rendering when parent state changes.
 * This is particularly important because this component initializes a Leaflet map and
 * iterates over a large set of destination markers and cards.
 */
const Destinations: React.FC = memo(() => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.FeatureGroup | null>(null);

    const [activeFilter, setActiveFilter] = useState('Todos');
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);


    const filteredDestinations = useMemo(() => {
        if (activeFilter === 'Todos') return DESTINATIONS;
        return DESTINATIONS.filter(d => d.continent === activeFilter);
    }, [activeFilter]);



    // Map Init
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Check if mobile for config
        const isMobile = window.innerWidth < 768;

        // CSS Injection for markers, Map Tile Styling & Washi Tapes
        const styleId = 'leaflet-marker-anim-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
            @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3) translateY(-10px); } 50% { opacity: 1; transform: scale(1.1) translateY(5px); } 70% { transform: scale(0.95) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes pin-shadow-pulse { 0% { opacity: 0.3; transform: scale(0.8); } 100% { opacity: 0.5; transform: scale(1.1); } }
            
            /* CUSTOM STICKER MARKER */
            .custom-marker-container { position: relative; display: flex; align-items: flex-end; justify-content: center; cursor: pointer; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3)); }
            
            /* Pin Animation */
            .pin-animated { animation: bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: bottom center; }

            /* Pin Shadow on Map */
            .pin-shadow { position: absolute; bottom: 0px; width: 60%; height: 15%; background: black; border-radius: 50%; opacity: 0.3; filter: blur(3px); z-index: -1; transform: translateY(2px); animation: pin-shadow-pulse 2s infinite alternate; }

            .leaflet-div-icon { background: transparent; border: none; }
            
            /* Tooltip "Handwritten" Style - Updated for better Portuguese legibility */
            .custom-dest-tooltip { 
                background-color: #ffffff !important; 
                color: #0f172a !important; 
                font-family: 'Poppins', sans-serif !important; 
                font-weight: 700 !important; 
                font-size: 14px !important; 
                border: 2px solid #fff !important; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                border-radius: 8px !important; 
                padding: 6px 12px !important; 
                white-space: nowrap; 
                transform: rotate(-1deg); 
            }
            .leaflet-tooltip-top.custom-dest-tooltip::before { border-top-color: #ffffff !important; }
            
            /* MAP TILE STYLING - CartoDB Voyager (Clean, No strong borders) */
            .leaflet-tile-pane { 
                /* High saturation to keep it fun, contrast for clarity */
                filter: contrast(1.05) saturate(1.2); 
            }
            /* Background matches Voyager water color */
            .leaflet-container { background: #FAFAFA; font-family: 'Poppins', sans-serif; } 
            
            /* Hide Default Zoom Controls to replace with custom stickers */
            .leaflet-control-zoom { display: none !important; }
        `;
            document.head.appendChild(style);
        }

        const map = L.map(mapRef.current, {
            scrollWheelZoom: false,
            zoomControl: false, // Hidden default, using custom
            dragging: !isMobile,
            touchZoom: true,
            zoomSnap: 0.5,
            zoomDelta: 0.5
        }).setView([20, -40], 3);

        mapInstance.current = map;
        markersLayerRef.current = L.featureGroup().addTo(map);

        // CartoDB Voyager - Clean, Modern, No Heavy Borders. Perfect for overlaying Portuguese labels.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 20
        }).addTo(map);

        return () => { map.remove(); mapInstance.current = null; };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !markersLayerRef.current) return;
        markersLayerRef.current.clearLayers();

        const isMobile = window.innerWidth < 768;
        // Tamanho do pin ajustado para o novo SVG (Lollipop Style)
        const markerWidth = isMobile ? 32 : 36;
        const markerHeight = isMobile ? 48 : 54;

        filteredDestinations.forEach((dest, idx) => {
            const baseColor = CONTINENT_COLORS[dest.continent] || '#0ea5e9';

            // Creating a "Lollipop/Tack" style icon using SVG
            const icon = L.divIcon({
                className: 'bg-transparent border-none',
                html: `
                <div class="custom-marker-container" style="width: ${markerWidth}px; height: ${markerHeight}px;">
                    <div class="pin-animated" style="animation-delay: ${idx * 50}ms; opacity: 0; width: 100%; height: 100%;">
                         <svg viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
                            <!-- Stick -->
                            <path d="M16 30V48" stroke="#555" stroke-width="2" stroke-linecap="round"/>
                            <!-- Head -->
                            <circle cx="16" cy="16" r="15" fill="${baseColor}" stroke="white" stroke-width="3"/>
                            <!-- Inner Shine/Dot -->
                            <circle cx="16" cy="16" r="5" fill="white"/>
                            <!-- Reflection -->
                            <path d="M16 4 Q 24 4 26 8" stroke="white" stroke-width="2" opacity="0.4" fill="none" stroke-linecap="round"/>
                         </svg>
                    </div>
                    <div class="pin-shadow" style="width: 40%; height: 8%; opacity: 0.2;"></div>
                </div>
            `,
                iconSize: [markerWidth, markerHeight],
                iconAnchor: [markerWidth / 2, markerHeight],
                popupAnchor: [0, -markerHeight],
            });

            const marker = L.marker(dest.coords, {
                icon,
                riseOnHover: true,
                zIndexOffset: 100
            });

            marker.bindTooltip(dest.city, {
                direction: 'top',
                offset: [0, -(markerHeight + 5)],
                className: 'custom-dest-tooltip',
                permanent: false
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                setSelectedDestination(dest);
            });

            marker.addTo(markersLayerRef.current!);
        });

        let flyTimer: ReturnType<typeof setTimeout> | undefined;
        if (markersLayerRef.current.getLayers().length > 0 && mapInstance.current) {
            flyTimer = setTimeout(() => {
                const map = mapInstance.current;
                const markers = markersLayerRef.current;
                if (map && markers) {
                    try {
                        map.invalidateSize();
                        const bounds = markers.getBounds();
                        if (bounds.isValid()) {
                            map.flyToBounds(bounds, {
                                padding: isMobile ? [40, 40] : [80, 80],
                                duration: 1.5,
                                maxZoom: 5
                            });
                        }
                    } catch (e) { }
                }
            }, 100);
        }
        return () => {
            clearTimeout(flyTimer);
            markersLayerRef.current?.clearLayers();
        };
    }, [filteredDestinations, activeFilter]);

    // Custom Zoom Handlers
    const handleZoom = (type: 'in' | 'out') => {
        if (mapInstance.current) {
            if (type === 'in') mapInstance.current.zoomIn();
            else mapInstance.current.zoomOut();
        }
    };

    return (
        <section id="destinos" className="py-24 bg-[#fffdf5] relative overflow-hidden">

            {/* Background Doodles */}
            <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

            <div className="container mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-dashed border-brand-dark bg-yellow-100 text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm transform -rotate-1 mb-4">
                            <Compass className="size-4" /> Mapa Mundi
                        </div>
                        <h2 className="text-4xl font-black text-brand-dark">Escolha seu <span className="text-brand-cyan relative inline-block">Pin 📍<svg className="absolute w-full h-3 -bottom-1 left-0 text-brand-cyan opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" /></svg></span></h2>
                    </div>

                    {/* Filter Pills - Sticker Style */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 md:pb-0 w-full md:w-auto mt-6 md:mt-0 px-1">
                        {FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold border-2 transition-all whitespace-nowrap flex-shrink-0 shadow-[3px_3px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${activeFilter === filter
                                    ? 'bg-brand-dark text-white border-brand-dark transform -rotate-1'
                                    : 'bg-white text-gray-600 border-gray-100 hover:border-brand-vibrant hover:text-brand-vibrant'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map Container - The "Glued Photo" Look */}
                <div className="relative mb-16 px-2">
                    {/* The Map Frame */}
                    <div className="relative w-full h-[500px] bg-white p-3 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] transform rotate-1 transition-transform duration-500 hover:rotate-0 group">

                        {/* Washi Tapes */}
                        <div className="absolute -top-3 -left-3 w-32 h-8 bg-red-400/80 rotate-[-45deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>
                        <div className="absolute -bottom-3 -right-3 w-32 h-8 bg-brand-cyan/80 rotate-[-45deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>
                        <div className="absolute -top-3 right-10 w-24 h-8 bg-yellow-400/80 rotate-[10deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>

                        {/* Map Inner Border & Content */}
                        <div className="w-full h-full border-2 border-gray-100 overflow-hidden relative bg-[#FAFAFA]">
                            {/* Paper Texture Overlay */}
                            <div className="absolute inset-0 z-[5] pointer-events-none opacity-[0.15] mix-blend-multiply" style={noiseTextureStyle}></div>

                            {/* Inner Shadow for Depth */}
                            <div className="absolute inset-0 z-[5] pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]"></div>

                            <div ref={mapRef} className="w-full h-full z-0" />

                            {/* Mobile Hint */}
                            <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-bold text-gray-500 pointer-events-none z-[400] shadow-md border border-gray-200">
                                Use dois dedos para mover
                            </div>
                        </div>

                        {/* Custom Controls (Stickers) */}
                        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[400]">
                            <button
                                onClick={() => handleZoom('in')}
                                className="size-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-gray-700 font-black"
                                aria-label="Aumentar zoom no mapa"
                            >
                                <Plus className="size-5" />
                            </button>
                            <button
                                onClick={() => handleZoom('out')}
                                className="size-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all text-gray-700 font-black"
                                aria-label="Diminuir zoom no mapa"
                            >
                                <Minus className="size-5" />
                            </button>
                        </div>

                        {/* "Note" Sticker */}
                        <div className="hidden md:block absolute top-8 left-8 bg-yellow-100 p-4 rounded-sm shadow-md transform -rotate-3 z-[400] max-w-[150px] border border-yellow-200">
                            <div className="size-3 rounded-full bg-red-400 mx-auto -mt-6 mb-2 shadow-sm border border-red-500"></div>
                            <p className="font-serif italic text-gray-700 text-sm leading-tight text-center">
                                "O mundo é um livro e quem não viaja lê apenas uma página."
                                <span className="block not-italic text-gray-400 text-xs mt-1">(Santo Agostinho)</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Destinations Grid - Luggage Tag Style */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredDestinations.slice(0, 3).map((dest) => (
                        <div
                            key={`${dest.city}-${dest.country}`}
                            tabIndex={0}
                            role="button"
                            aria-label={`Ver detalhes de ${dest.city}, ${dest.country}`}
                            className="group bg-white rounded-[2rem] border-2 border-gray-100 p-4 pb-0 shadow-[6px_6px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan"
                            onClick={() => setSelectedDestination(dest)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedDestination(dest);
                                }
                            }}
                        >
                            <div className="relative h-56 rounded-[1.5rem] overflow-hidden mb-4 border border-gray-100">
                                <LazyImage
                                    src={dest.image}
                                    alt={`${dest.city}, ${dest.country} — pacote de viagem personalizado Anhangá Viagens`}
                                    width={600}
                                    height={400}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* Price Tag Sticker */}
                                <div className="absolute top-4 right-4 bg-white text-brand-dark font-black px-3 py-1 rounded-md shadow-[3px_3px_0px_rgba(0,0,0,0.2)] text-sm rotate-3 group-hover:rotate-6 transition-transform border border-gray-100">
                                    A partir de {dest.price}
                                </div>
                            </div>

                            <div className="px-2 pb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-2xl font-black text-gray-800">{dest.city}</h3>
                                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                        <Star className="size-3 fill-current" /> {dest.rating}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm font-medium mb-4">{dest.description}</p>

                                <div className="flex items-center gap-2 text-brand-cyan font-bold text-sm uppercase tracking-wide group-hover:gap-3 transition-all">
                                    Saiba Mais <ArrowRight className="size-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal - Scrapbook Page Style */}
            {selectedDestination && (
                <div role="button" tabIndex={0} aria-label="Fechar destino" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDestination(null)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDestination(null); }}>
                    <div role="presentation" className="bg-[#fffdf5] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh] border-8 border-white transform rotate-1" onClick={e => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>

                        {/* Washi Tape Decor */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-red-400/80 rotate-1 backdrop-blur-sm z-20 shadow-sm border-l-2 border-r-2 border-white/40"></div>

                        <button
                            onClick={() => setSelectedDestination(null)}
                            className="absolute top-4 right-4 z-30 bg-white border-2 border-gray-100 p-2 rounded-full shadow-md hover:scale-110 transition-transform text-gray-800"
                            aria-label="Fechar detalhes do destino"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-gray-100">
                            <LazyImage
                                src={selectedDestination.image}
                                alt={selectedDestination.city}
                                width={1200}
                                height={800}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 text-white">
                                <h2 className="text-4xl font-black mb-1 drop-shadow-md">{selectedDestination.city}</h2>
                                <div className="flex items-center gap-2 font-medium opacity-90 drop-shadow-sm">
                                    <MapPin className="size-4" /> {selectedDestination.country}
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 p-8 md:p-10 overflow-y-auto" style={noiseTextureStyle}>
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed font-medium font-serif italic">"{selectedDestination.details}"</p>

                            <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Star className="size-5 text-yellow-400 fill-current" /> Atrações Imperdíveis
                            </h4>
                            <div className="flex flex-wrap gap-3 mb-8">
                                {selectedDestination.activities.map((act) => (
                                    <span key={act} className="bg-white border-2 border-gray-100 px-4 py-2 rounded-xl text-sm text-gray-700 font-bold shadow-sm transform hover:-rotate-1 transition-transform cursor-default">
                                        {act}
                                    </span>
                                ))}
                            </div>

                            <div className="mb-8 p-4 bg-white/50 rounded-2xl border border-gray-100">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Compartilhar destino</p>
                                <SocialShare
                                    url={`https://www.anhanga.tur.br/#destinos`}
                                    title={`Confira esse destino na Anhangá Viagens: ${selectedDestination.city}`}
                                    excerpt={selectedDestination.details}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                {selectedDestination.landingPage && (
                                    <Link
                                        to={selectedDestination.landingPage}
                                        onClick={() => setSelectedDestination(null)}
                                        className="w-full bg-white border-2 border-brand-dark text-brand-dark py-4 rounded-xl font-black text-lg hover:bg-gray-50 transition-all shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
                                    >
                                        Ver detalhes do pacote <ArrowRight className="size-5" />
                                    </Link>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openContactModal({
                                            source: 'destinations-modal',
                                            destination: selectedDestination.city,
                                        });
                                        setSelectedDestination(null);
                                    }}
                                    className={`btn-whatsapp btn-specialist w-full bg-brand-dark text-white py-4 rounded-xl font-black text-lg hover:bg-brand-vibrant transition-all shadow-[4px_4px_0px_#94a3b8] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2`}
                                    data-tracking={`modal-destinations-${selectedDestination.city.toLowerCase()}`}
                                >
                                    Solicitar Orçamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
});

Destinations.displayName = 'Destinations';

export default Destinations;
