import React from 'react';
import { Music, Star, Zap, Calendar, ExternalLink } from 'lucide-react';
import useIntersectionObserver from './hooks/useIntersectionObserver';
import sabrinaImage from './assets/sabrina-carpenter-devushka-vzgliad-volosy-litso-guby-blondin.webp';
import { getMediaUrl, optimizeRemoteImageUrl } from '../../../data/mediaConfig';

const LineupSection: React.FC = () => {
  const { elementRef, isVisible } = useIntersectionObserver(0.05);

  const FALLBACK_IMAGE = getMediaUrl('images/lollapalooza/lineup/fallback-crowd.jpg');

  const getArtistImageUrl = (url: string, width: number, height?: number) => {
    if (!url) return FALLBACK_IMAGE;
    if (url.startsWith('images/')) {
      return height
        ? optimizeRemoteImageUrl(url, width, height)
        : optimizeRemoteImageUrl(url, width);
    }

    return url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const headliners = [
    {
      name: "SABRINA CARPENTER",
      genre: "Pop",
      image: sabrinaImage
    },
    {
      name: "CHAPPELL ROAN",
      genre: "Pop / Camp",
      image: "images/lollapalooza/lineup/chappell-roan.png"
    },
    {
      name: "TYLER, THE CREATOR",
      genre: "Hip Hop",
      image: "images/lollapalooza/lineup/tyler-the-creator.jpg"
    },
    {
      name: "LORDE",
      genre: "Alt Pop",
      image: "images/lollapalooza/lineup/lorde.jpg"
    },
    {
      name: "SKRILLEX",
      genre: "Electronic",
      image: "images/lollapalooza/lineup/skrillex.jpg"
    },
    {
      name: "DEFTONES",
      genre: "Alt Metal",
      image: "images/lollapalooza/lineup/deftones.jpg"
    },
    {
      name: "DOECHII",
      genre: "Hip Hop",
      image: "images/lollapalooza/lineup/doechii.jpg"
    },
    {
      name: "LEWIS CAPALDI",
      genre: "Pop / Soul",
      image: "images/lollapalooza/lineup/lewis-capaldi.jpg"
    },
    {
      name: "TURNSTILE",
      genre: "Hardcore Punk",
      image: "images/lollapalooza/lineup/turnstile.jpg"
    }
  ];

  const dailyLineup = [
    {
      day: "Sexta-feira",
      date: "20 de Março",
      main: [
        { name: "Sabrina Carpenter", image: headliners[0].image },
        { name: "Deftones", image: headliners[5].image },
        { name: "Doechii", image: headliners[6].image }
      ],
      others: "Kygo, Interpol, Ben Böhmer, Edson Gomes, Men I Trust, Bunt., Viagra Boys, DJ Diesel, Horsegiirl, Negra Li, Aline Rocha, Atkö, Scalene, Worst, Terraplana, Stefanie, Bruna Strait, Camila Jun."
    },
    {
      day: "Sábado",
      date: "21 de Março",
      main: [
        { name: "Chappell Roan", image: headliners[1].image },
        { name: "Skrillex", image: headliners[4].image },
        { name: "Lewis Capaldi", image: headliners[7].image }
      ],
      others: "Cypress Hill, Brutalismus 3000, Marina, TV Girl, MU540, Riize, 2hollis, NL!NA, Foto em Grupo, The Warning, Hamdi, Febre90s, Agnes Nunes, Varanda, Cidade Dormitório, JadsA, Blackat, Crizin da Z.O., Marcelin o Brabo, Artur Menezes."
    },
    {
      day: "Domingo",
      date: "22 de Março",
      main: [
        { name: "Tyler, The Creator", image: headliners[2].image },
        { name: "Lorde", image: headliners[3].image },
        { name: "Turnstile", image: headliners[8].image }
      ],
      others: "Peggy Gou, Addison Rae, Katseye, Djo, Yousuke Yukimatsu, FBC, Royel Otis, The Dare, Balu Brigada, Mundo Livre S/A, Róz, Zopelar, Idlibra, Nina Maia, Oruã, Alírio, Papisa, Analu, Jonabug, Entropia."
    }
  ];

  return (
    <section id="lineup" className="py-20 bg-black text-white relative overflow-hidden" aria-labelledby="lineup-heading" ref={elementRef}>
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-anhanga-blue opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-anhanga-yellow opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" aria-hidden="true"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Headline Section */}
        <div className={`text-center mb-16 animate-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          {/* Artist Avatars Cluster */}
          <div className="flex justify-center items-center -space-x-4 mb-8" aria-hidden="true">
            {headliners.slice(0, 5).map((artist) => (
              <div key={artist.name} className="relative z-0 hover:z-10 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 group">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-black group-hover:border-anhanga-yellow overflow-hidden relative shadow-lg">
                  <img
                    src={getArtistImageUrl(artist.image, 96, 96)}
                    alt={`Foto de ${artist.name}`}
                    onError={handleImageError}
                    loading="lazy"
                    decoding="async"
                    width="96"
                    height="96"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-anhanga-blue/40 to-transparent opacity-50"></div>
                </div>
              </div>
            ))}
            <div className="relative z-0 w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-black bg-anhanga-yellow flex flex-col items-center justify-center text-anhanga-darkBlue shadow-lg transform hover:scale-105 transition-transform">
              <span className="font-black text-lg md:text-2xl leading-none">+50</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Stars</span>
            </div>
          </div>

          <div className="inline-flex items-center justify-center p-3 bg-gray-800 rounded-full mb-4 animate-pulse">
            <Music className="text-anhanga-yellow" size={24} aria-hidden="true" />
          </div>

          <h2 id="lineup-heading" className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter">
            Lineup <span className="text-transparent bg-clip-text bg-gradient-to-r from-anhanga-yellow to-anhanga-blue pr-2">2026</span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-light mb-8">
            Os maiores nomes da música mundial confirmados no Autódromo de Interlagos.
          </p>
        </div>

        {/* Headliners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
          {headliners.map((artist, index) => (
            <div key={artist.name} className={`group relative h-96 sm:h-80 lg:h-96 overflow-hidden rounded-2xl border border-gray-800 hover:border-anhanga-yellow transition-all duration-300 animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: `${index * 50}ms` }}>
              {/* Background Image - Optimized to 600px width */}
              <div className="absolute inset-0 bg-gray-900">
                <img
                  src={getArtistImageUrl(artist.image, 600)}
                  alt={artist.name}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="800"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0 grayscale opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="inline-block px-2 py-1 mb-2 text-xs font-bold text-black bg-anhanga-yellow rounded uppercase tracking-wider">
                  {artist.genre}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-none uppercase italic drop-shadow-lg">
                  {artist.name}
                </h3>
              </div>

              {/* Top Icon */}
              <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                <Star size={16} className="text-anhanga-yellow" fill="#FFD600" />
              </div>
            </div>
          ))}
        </div>

        {/* Daily Lineup - Festival Poster Style */}
        <div className={`mb-16 animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '300ms' }}>
          <h3 className="text-center text-3xl font-black text-white mb-10 uppercase tracking-widest border-b border-gray-800 pb-4">
            Programação por Dia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dailyLineup.map((day) => (
              <div key={day.day} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-anhanga-blue transition-colors">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="text-anhanga-yellow" size={20} aria-hidden="true" />
                  <span className="text-gray-400 font-bold uppercase text-sm tracking-wider">{day.day} • {day.date}</span>
                </div>

                {/* Main Acts with Images - Optimized to 100px width for thumbnails */}
                <div className="mb-6 space-y-4">
                  {day.main.map((act) => (
                    <div key={act.name} className="flex items-center gap-4 group/artist">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 group-hover/artist:border-anhanga-yellow transition-colors shrink-0 bg-gray-800">
                        <img
                          src={getArtistImageUrl(act.image, 100, 100)}
                          alt={act.name}
                          onError={handleImageError}
                          loading="lazy"
                          decoding="async"
                          width="48"
                          height="48"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-2xl font-black text-white uppercase leading-none group-hover/artist:text-anhanga-yellow transition-colors cursor-default">
                        {act.name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Other Acts */}
                <p className="text-sm text-gray-400 leading-relaxed text-justify uppercase font-medium pt-4 border-t border-gray-800">
                  {day.others}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className={`bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-gray-800 animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '500ms' }}>
          <div className="flex flex-col md:flex-row items-stretch gap-12">
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-4 text-white">
                <Zap className="inline-block mr-2 text-anhanga-yellow" aria-hidden="true" />
                Foque apenas na música
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                O Lollapalooza é gigante e a logística pode ser cansativa. Com nossos pacotes, você elimina o estresse do trânsito, a busca por hotéis e a insegurança na saída do festival.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Chegada tranquila ao Autódromo', 'Descanso em hotel 4 estrelas', 'Suporte local para imprevistos', 'After-parties sugeridas'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base text-gray-200">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-anhanga-blue flex items-center justify-center text-xs font-bold" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/3 p-6 bg-gradient-to-br from-anhanga-darkBlue to-black rounded-2xl border border-white/10 text-center flex flex-col justify-center">
              <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Ingressos</p>
              <p className="text-white text-lg font-medium mb-6">
                Compre os ingressos com a <span className="font-bold text-anhanga-yellow">Ticketmaster</span> e deixa que a gente cuida do resto.
              </p>
              <a
                href="https://www.ticketmaster.com.br/event/lollapaloozabr?utm_source=site&utm_medium=site_festival&utm_campaign=ll-ingressos2026&utm_id=header&utm_term=botao_compreagora&utm_content=site_site_festival_header_ll-ingressos2026_botao_compreagora_contlol01090"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-anhanga-darkBlue font-bold rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-4 focus:ring-anhanga-yellow/50"
              >
                Comprar Ingresso <ExternalLink size={16} />
              </a>
              <p className="text-[10px] text-gray-500 mt-4 opacity-70">
                *A Anhangá vende apenas o pacote de viagem.
              </p>
            </div>
          </div>
        </div>

        {/* Spotify Playlist Embed */}
        <div className={`mt-12 max-w-4xl mx-auto animate-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '700ms' }}>
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/playlist/1Zix4yY2vkoQ6LbOQ6GEWt?utm_source=generator"
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Playlist Lollapalooza 2026"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default LineupSection;
