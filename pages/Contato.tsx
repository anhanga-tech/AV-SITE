import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { Seo } from '../components/Seo';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { WebPageSchema } from '../components/schemas/WebPageSchema';
import { Button } from '../components/ui/Button';
import { openContactModal } from '../utils/contactForm';
import { useWhatsAppLink } from '../utils/whatsapp';

const CANONICAL = 'https://www.anhanga.tur.br/contato/';
const DESCRIPTION =
  'Fale com a Anhangá Viagens por WhatsApp, telefone ou e-mail. Atendimento 100% online, consultivo e humano, para montar sua viagem sob medida.';
const WHATSAPP_MESSAGE = 'Olá! Vim pela página de contato e quero planejar uma viagem.';

const linkClass =
  'font-bold text-anhanga-actionInk underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-action rounded';

interface ChannelProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Channel: React.FC<ChannelProps> = ({ icon, title, children }) => (
  <li className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm">
    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-anhanga-action/10 text-anhanga-action">
      {icon}
    </span>
    <div className="space-y-1 text-zinc-700">
      <h2 className="text-lg font-black text-anhanga-dark">{title}</h2>
      {children}
    </div>
  </li>
);

// Página de contato: canais diretos em texto no HTML estático, para quem chega sem JS
// (buscadores e agentes de IA) e para quem prefere não abrir o chat.
const Contato: React.FC = () => {
  const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE);

  return (
    <div className="bg-brand-surface pt-32 pb-20">
      <Seo title="Contato | Anhangá Viagens" description={DESCRIPTION} canonical={CANONICAL} />
      <WebPageSchema
        type="ContactPage"
        name="Contato - Anhangá Viagens"
        url={CANONICAL}
        description={DESCRIPTION}
        aboutOrganization
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Contato', item: CANONICAL },
        ]}
      />

      <div className="container mx-auto max-w-4xl px-6">
        <header className="mb-12 text-center">
          <h1 className="mb-6 text-4xl font-black leading-tight text-anhanga-dark md:text-5xl">
            Fale com a Anhangá Viagens
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-zinc-600">
            Do primeiro roteiro ao retorno para casa, quem responde é um consultor de verdade. Escolha o canal que for
            mais confortável para você: a conversa começa sem compromisso e sem custo.
          </p>
        </header>

        <ul className="mb-12 grid gap-4 md:grid-cols-2">
          <Channel icon={<MessageCircle className="size-6" aria-hidden="true" />} title="WhatsApp">
            <p>
              {/* <a> com href wa.me: sem JS navega direto; com JS abre o modal de contato, como nas
                  landings (#1969). `data-no-whatsapp-cta`: o clique não é handoff, que só conta
                  depois do envio do modal (hooks/useContactForm.ts). */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  event.preventDefault();
                  openContactModal({ source: 'contato-whatsapp', message: WHATSAPP_MESSAGE });
                }}
                className={linkClass}
                data-contact-intent
                data-no-whatsapp-cta
                data-tracking="contato-whatsapp"
                aria-haspopup="dialog"
              >
                (11) 95502-1519<span className="sr-only"> (abre o formulário de contato)</span>
              </a>
            </p>
            <p>O canal mais rápido para cotações, dúvidas e suporte durante a viagem.</p>
          </Channel>
          <Channel icon={<Phone className="size-6" aria-hidden="true" />} title="Telefone">
            <p>
              <a href="tel:+551152833309" className={linkClass}>
                (11) 5283-3309
              </a>
            </p>
            <p>Para falar direto com a equipe da agência.</p>
          </Channel>
          <Channel icon={<Mail className="size-6" aria-hidden="true" />} title="E-mail">
            <p>
              <a href="mailto:contato@anhanga.tur.br" className={linkClass}>
                contato@anhanga.tur.br
              </a>
            </p>
            <p>
              Pedidos sobre dados pessoais (LGPD):{' '}
              <a href="mailto:privacidade@anhanga.tur.br" className={linkClass}>
                privacidade@anhanga.tur.br
              </a>
            </p>
          </Channel>
          <Channel icon={<MapPin className="size-6" aria-hidden="true" />} title="Endereço comercial">
            <address className="not-italic">
              Av. Dom Pedro I, 773 — Vila Monumento
              <br />
              São Paulo (SP), CEP 01552-001
            </address>
            <p>Endereço de registro da empresa. Não recebemos clientes no local: todo o atendimento é online.</p>
          </Channel>
        </ul>

        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm md:p-12">
          <h2 className="mb-4 text-2xl font-black text-anhanga-dark md:text-3xl">Prefere que a gente chame você?</h2>
          <p className="mx-auto mb-8 max-w-xl text-zinc-600">
            Deixe seu nome e WhatsApp e a conversa continua por lá, onde você conta para onde quer ir. Um consultor
            responde com as primeiras ideias de roteiro. Viagem corporativa ou em grupo?{' '}
            <Link to="/corporativo/" className={linkClass}>
              Conheça o atendimento para empresas
            </Link>
            .
          </p>
          <div className="flex justify-center">
            <Button
              variant="cta"
              size="lg"
              onClick={() => openContactModal({ source: 'contato' })}
              className="btn-whatsapp btn-specialist font-black"
              rightIcon={<Sparkles className="size-5" aria-hidden="true" />}
              data-tracking="contato-page"
            >
              Começar Planejamento
            </Button>
          </div>
        </section>

        <p className="mt-10 text-center text-sm text-zinc-500">
          ANHANGA TURISMO LTDA · CNPJ e Cadastur 37.036.732/0001-41 ·{' '}
          <Link to="/sobre/" className={linkClass}>
            Sobre a Anhangá
          </Link>{' '}
          ·{' '}
          <Link to="/politica-privacidade/" className={linkClass}>
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Contato;
