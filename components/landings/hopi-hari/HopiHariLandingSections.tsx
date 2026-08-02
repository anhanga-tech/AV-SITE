import { Link } from 'react-router-dom';
import { CheckCircle, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { openContactModal } from '@/utils/contactForm';

const CONTACT_SOURCE = { source: 'hopi-hari' } as const;

const WHATS_INCLUDED = [
  'Ingresso oficial, emitido por agente credenciado do parque',
  'Orientação de roteiro dentro do parque conforme seu grupo',
  'Hospedagem e transporte, se quiser fechar o pacote completo',
  'Suporte por WhatsApp antes e durante a viagem',
];

export function HopiHariHero() {
  return (
    <section className="relative w-full pt-16 md:pt-24 pb-20 px-6 overflow-hidden bg-anhanga-dark">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#001836] via-[#003B8E] to-[#0056D2]" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 mb-5 text-xs font-black uppercase tracking-widest text-white">
          Vinhedo · SP
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Pacote Hopi Hari
        </h1>
        <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-xl mx-auto">
          O parque de montanha-russa de São Paulo, a um bate-volta da capital pela Rodovia Bandeirantes. A gente organiza ingresso, hospedagem e transporte — você aproveita o dia de radical.
        </p>
        <Button
          variant="cta"
          size="lg"
          className="font-black btn-whatsapp btn-specialist"
          onClick={() => openContactModal(CONTACT_SOURCE)}
          data-tracking="hero-hopi-hari"
          data-contact-intent
        >
          Falar com especialista
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}

export function HopiHariContent() {
  return (
    <section className="bg-white py-16 border-b border-zinc-100">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">
          Um parque que resolve em um dia
        </h2>
        <p className="text-zinc-700 text-lg leading-relaxed mb-5">
          O Hopi Hari fica em Vinhedo (SP), na Rodovia Bandeirantes, a cerca de 70 km da capital — o único dos parques temáticos que a Anhangá vende que cabe numa viagem de um único dia.
        </p>
        <p className="text-zinc-700 text-lg leading-relaxed mb-5">
          Rende mais para adolescente, adulto e criança grande que já encara brinquedo radical. Para quem viaja com filho pequeno, o <Link to="/beto-carrero/" className="text-anhanga-blue font-semibold hover:underline">Beto Carrero World</Link> costuma render melhor.
        </p>
        <div className="flex items-start gap-2 text-zinc-600 text-sm bg-anhanga-light rounded-xl p-4 mb-8">
          <MapPin className="size-5 flex-shrink-0 mt-0.5 text-anhanga-blue" aria-hidden="true" />
          <span>Melhor época: dia de semana, fora de férias escolares. A diferença de fila é grande.</span>
        </div>

        <h3 className="text-xl md:text-2xl font-extrabold text-anhanga-dark mb-3">O que pode entrar no seu pacote</h3>
        <ul className="space-y-2 mb-2">
          {WHATS_INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-zinc-700">
              <CheckCircle className="size-5 flex-shrink-0 mt-0.5 text-anhanga-blue" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HopiHariOtherServices() {
  return (
    <section className="py-16 bg-anhanga-light">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-black text-anhanga-dark mb-8">Outros parques do Brasil</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/parques-brasil/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Comparar todos os parques
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Veja qual parque combina com o seu grupo
            </div>
          </Link>
          <Link
            to="/beto-carrero/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Pacote Beto Carrero
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              O parque temático de Penha (SC), melhor para criança pequena
            </div>
          </Link>
          <Link
            to="/"
            className="block p-5 rounded-xl bg-white hover:bg-anhanga-blue/5 transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action"
          >
            <div className="font-bold text-anhanga-dark group-hover:text-anhanga-blue transition-colors">
              Site principal
            </div>
            <div className="text-sm text-zinc-600 mt-1">
              Conheça todos os serviços da Anhangá
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HopiHariFinalCta() {
  return (
    <section className="py-20 bg-anhanga-blue">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Vamos planejar seu dia no Hopi Hari
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          Conte pra gente quando você quer ir e a gente cuida do ingresso, da hospedagem e do transporte.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="cta"
            size="lg"
            className="font-black btn-whatsapp btn-specialist"
            onClick={() => openContactModal(CONTACT_SOURCE)}
            data-tracking="footer-hopi-hari"
            data-contact-intent
          >
            Falar com especialista
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-white hover:text-white/80">
            <a href="https://www.hopihari.com.br/" target="_blank" rel="noopener noreferrer">
              Site oficial Hopi Hari
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
