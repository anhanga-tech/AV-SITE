import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin, Minus, Plus, Star, X } from 'lucide-react';
import { SocialShare } from '../SocialShare';
import { LazyImage } from '../ui/LazyImage';
import { openContactModal } from '../../utils/contactForm';
import { NOISE_TEXTURE_URL } from '../../lib/static-assets';
import { FILTERS, type Destination } from '../../data/mapDestinations';

const noiseTextureStyle = {
    backgroundImage: `url("${NOISE_TEXTURE_URL}")`,
};

interface DestinationsHeaderProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

function DestinationsHeader({ activeFilter, onFilterChange }: DestinationsHeaderProps) {
    return (
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
                        type="button"
                        onClick={() => onFilterChange(filter)}
                        aria-pressed={activeFilter === filter}
                        className={`px-5 py-2 rounded-lg text-sm font-bold border-2 transition whitespace-nowrap flex-shrink-0 shadow-[3px_3px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] ${activeFilter === filter
                            ? 'bg-brand-dark text-white border-brand-dark transform -rotate-1'
                            : 'bg-white text-zinc-600 border-zinc-100 hover:border-brand-vibrant hover:text-brand-vibrant'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface DestinationMapFrameProps {
    mapRef: RefObject<HTMLDivElement | null>;
    onZoom: (type: 'in' | 'out') => void;
}

function DestinationMapFrame({ mapRef, onZoom }: DestinationMapFrameProps) {
    return (
        <div className="relative mb-16 px-2">
            {/* The Map Frame */}
            <div className="relative w-full h-[500px] bg-white p-3 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] transform rotate-1 transition-transform duration-500 hover:rotate-0 group">
                {/* Washi Tapes */}
                <div className="absolute -top-3 -left-3 w-32 h-8 bg-red-400/80 rotate-[-45deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>
                <div className="absolute -bottom-3 -right-3 w-32 h-8 bg-brand-cyan/80 rotate-[-45deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>
                <div className="absolute -top-3 right-10 w-24 h-8 bg-yellow-400/80 rotate-[10deg] z-30 backdrop-blur-sm shadow-sm opacity-90 border-l border-r border-white/30"></div>

                {/* Map Inner Border & Content */}
                <div className="w-full h-full border-2 border-zinc-100 overflow-hidden relative bg-[#FAFAFA]">
                    {/* Paper Texture Overlay */}
                    <div className="absolute inset-0 z-[5] pointer-events-none opacity-[0.15] mix-blend-multiply" style={noiseTextureStyle}></div>

                    {/* Inner Shadow for Depth */}
                    <div className="absolute inset-0 z-[5] pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]"></div>

                    <div ref={mapRef} className="w-full h-full z-0" />

                    {/* Mobile Hint */}
                    <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-bold text-zinc-500 pointer-events-none z-[400] shadow-md border border-zinc-200">
                        Use dois dedos para mover
                    </div>
                </div>

                {/* Custom Controls (Stickers) */}
                <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[400]">
                    <button
                        type="button"
                        onClick={() => onZoom('in')}
                        className="size-12 bg-white border-2 border-zinc-200 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition text-zinc-700 font-black"
                        aria-label="Aumentar zoom no mapa"
                    >
                        <Plus className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onZoom('out')}
                        className="size-12 bg-white border-2 border-zinc-200 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition text-zinc-700 font-black"
                        aria-label="Diminuir zoom no mapa"
                    >
                        <Minus className="size-5" />
                    </button>
                </div>

                {/* "Note" Sticker */}
                <div className="hidden md:block absolute top-8 left-8 bg-yellow-100 p-4 rounded-sm shadow-md transform -rotate-3 z-[400] max-w-[150px] border border-yellow-200">
                    <div className="size-3 rounded-full bg-red-400 mx-auto -mt-6 mb-2 shadow-sm border border-red-500"></div>
                    <p className="font-serif italic text-zinc-700 text-sm leading-tight text-center">
                        "O mundo é um livro e quem não viaja lê apenas uma página."
                        <span className="block not-italic text-zinc-400 text-xs mt-1">(Santo Agostinho)</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

interface DestinationCardsProps {
    destinations: Destination[];
    onDestinationSelect: (destination: Destination) => void;
}

function DestinationCards({ destinations, onDestinationSelect }: DestinationCardsProps) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.slice(0, 3).map((destination) => (
                <button
                    type="button"
                    key={`${destination.city}-${destination.country}`}
                    aria-label={`Ver detalhes de ${destination.city}, ${destination.country}`}
                    className="group bg-white rounded-[2rem] border-2 border-zinc-100 p-4 pb-0 shadow-[6px_6px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition cursor-pointer flex flex-col focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan w-full text-left"
                    onClick={() => onDestinationSelect(destination)}
                >
                    <div className="relative h-56 rounded-[1.5rem] overflow-hidden mb-4 border border-zinc-100">
                        <LazyImage
                            src={destination.image}
                            alt={`${destination.city}, ${destination.country} — pacote de viagem personalizado Anhangá Viagens`}
                            width={600}
                            height={400}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Price Tag Sticker */}
                        <div className="absolute top-4 right-4 bg-white text-brand-dark font-black px-3 py-1 rounded-md shadow-[3px_3px_0px_rgba(0,0,0,0.2)] text-sm rotate-3 group-hover:rotate-6 transition-transform border border-zinc-100">
                            A partir de {destination.price}
                        </div>
                    </div>

                    <div className="px-2 pb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-black text-zinc-800">{destination.city}</h3>
                            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                <Star className="size-3 fill-current" /> {destination.rating}
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium mb-4">{destination.description}</p>

                        <div className="flex items-center gap-2 text-brand-cyan font-bold text-sm uppercase tracking-wide group-hover:gap-3 transition-[gap,color]">
                            Saiba Mais <ArrowRight className="size-4" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

interface DestinationDialogProps {
    destination: Destination | null;
    destinationModalRef: RefObject<HTMLDialogElement | null>;
    onCloseModal: () => void;
}

function DestinationDialog({ destination, destinationModalRef, onCloseModal }: DestinationDialogProps) {
    return (
        <dialog
            ref={destinationModalRef}
            className="fixed inset-0 z-[9999] m-auto p-4 bg-transparent backdrop:bg-zinc-900/60 backdrop:backdrop-blur-sm max-w-4xl w-full"
            aria-labelledby="dest-modal-title"
        >
            {destination && (
                <div
                    className="bg-brand-surface w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row max-h-[90vh] border-8 border-white transform rotate-1"
                >
                    {/* Washi Tape Decor */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-red-400/80 rotate-1 backdrop-blur-sm z-20 shadow-sm border-l-2 border-r-2 border-white/40"></div>

                    <button
                        type="button"
                        onClick={onCloseModal}
                        className="absolute top-4 right-4 z-30 bg-white border-2 border-zinc-100 p-2 rounded-full shadow-md hover:scale-110 transition-transform text-zinc-800"
                        aria-label="Fechar detalhes do destino"
                    >
                        <X className="size-5" />
                    </button>

                    <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-zinc-100">
                        <LazyImage
                            src={destination.image}
                            alt={destination.city}
                            width={1200}
                            height={800}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <h2 id="dest-modal-title" className="text-4xl font-black mb-1 drop-shadow-md">{destination.city}</h2>
                            <div className="flex items-center gap-2 font-medium opacity-90 drop-shadow-sm">
                                <MapPin className="size-4" /> {destination.country}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 p-8 md:p-10 overflow-y-auto" style={noiseTextureStyle}>
                        <p className="text-zinc-600 mb-8 text-lg leading-relaxed font-medium font-serif italic">"{destination.details}"</p>

                        <h4 className="font-black text-zinc-900 mb-4 flex items-center gap-2">
                            <Star className="size-5 text-yellow-400 fill-current" /> Atrações Imperdíveis
                        </h4>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {destination.activities.map((activity) => (
                                <span key={activity} className="bg-white border-2 border-zinc-100 px-4 py-2 rounded-xl text-sm text-zinc-700 font-bold shadow-sm transform hover:-rotate-1 transition-transform cursor-default">
                                    {activity}
                                </span>
                            ))}
                        </div>

                        <div className="mb-8 p-4 bg-white/50 rounded-2xl border border-zinc-100">
                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Compartilhar destino</p>
                            <SocialShare
                                url="https://www.anhanga.tur.br/#destinos"
                                title={`Confira esse destino na Anhangá Viagens: ${destination.city}`}
                                excerpt={destination.details}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            {destination.landingPage && (
                                <Link
                                    to={destination.landingPage}
                                    onClick={onCloseModal}
                                    className="w-full bg-white border-2 border-brand-dark text-brand-dark py-4 rounded-xl font-black text-lg hover:bg-zinc-50 transition shadow-[4px_4px_0px_#0f172a] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Ver detalhes do pacote <ArrowRight className="size-5" />
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.preventDefault();
                                    openContactModal({
                                        source: 'destinations-modal',
                                        destination: destination.city,
                                    });
                                    onCloseModal();
                                }}
                                className={`btn-whatsapp btn-specialist w-full bg-brand-dark text-white py-4 rounded-xl font-black text-lg hover:bg-brand-vibrant transition shadow-[4px_4px_0px_#94a3b8] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2`}
                                data-tracking={`modal-destinations-${destination.city.toLowerCase()}`}
                            >
                                Solicitar Orçamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </dialog>
    );
}

export interface DestinationsViewProps {
    activeFilter: string;
    filteredDestinations: Destination[];
    selectedDestination: Destination | null;
    mapRef: RefObject<HTMLDivElement | null>;
    destinationModalRef: RefObject<HTMLDialogElement | null>;
    onFilterChange: (filter: string) => void;
    onDestinationSelect: (destination: Destination) => void;
    onCloseModal: () => void;
    onZoom: (type: 'in' | 'out') => void;
}

export function DestinationsView({
    activeFilter,
    filteredDestinations,
    selectedDestination,
    mapRef,
    destinationModalRef,
    onFilterChange,
    onDestinationSelect,
    onCloseModal,
    onZoom,
}: DestinationsViewProps) {
    return (
        <section id="destinos" className="py-24 bg-brand-surface relative overflow-hidden">
            {/* Background Doodles */}
            <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

            <div className="container mx-auto px-6 relative z-10">
                <DestinationsHeader activeFilter={activeFilter} onFilterChange={onFilterChange} />
                <DestinationMapFrame mapRef={mapRef} onZoom={onZoom} />
                <DestinationCards destinations={filteredDestinations} onDestinationSelect={onDestinationSelect} />
            </div>

            <DestinationDialog
                destination={selectedDestination}
                destinationModalRef={destinationModalRef}
                onCloseModal={onCloseModal}
            />
        </section>
    );
}
