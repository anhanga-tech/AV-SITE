import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { m, Variants } from 'framer-motion';
import { Seo } from '../components/Seo';
import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { FAQPageSchema } from '../components/schemas/FAQPageSchema';
import { PersonSchema } from '../components/schemas/PersonSchema';
import { LazyImage } from '../components/ui/LazyImage';
import { openContactModal } from '../utils/contactForm';
import { getReviewSummary } from '../data/reviewsAdapter';
import { AUTHORS } from '../data/blogData';
import googleReviewsRaw from '../data/googleReviews.json';
import type { GoogleReviewsData } from '../types/reviews';
import { ShieldCheck, Award, Users, Sparkles, Heart, Coffee, Ship, Anchor } from 'lucide-react';
import { InstagramLogo, LinkedinLogo } from '@phosphor-icons/react';

const ORG_NAME = 'Anhangá Viagens';
const ORG_URL = 'https://www.anhanga.tur.br/';

const reviewSummary = getReviewSummary(googleReviewsRaw as GoogleReviewsData);

// FAQ de entidade/confiança — respostas answer-first e verificáveis, o padrão
// que motores de resposta (ChatGPT, Gemini, Perplexity) extraem para
// *recomendar* a marca, não só citar fatos. Mantido em sincronia com a seção
// visível renderizada abaixo e com o FAQPage JSON-LD.
const TRUST_FAQ_ITEMS = [
  {
    question: 'A Anhangá Viagens é confiável?',
    answer:
      'Sim. A Anhangá Viagens é uma agência de turismo registrada no Cadastur (Ministério do Turismo) sob o CNPJ 37.036.732/0001-41, com sede física em São Paulo, na Av. Dom Pedro I, 773 — Vila Monumento. É agente credenciado do Beto Carrero World e do Hopi Hari e parceira da Norwegian Cruise Line (NCL). O atendimento é consultivo e humano, com suporte 24h por WhatsApp durante toda a viagem.',
  },
  {
    question: 'A Anhangá é registrada no Cadastur?',
    answer:
      'Sim. O registro no Cadastur, cadastro oficial do Ministério do Turismo do Brasil, é 37.036.732/0001-41 — o mesmo número do CNPJ. O Cadastur é a autorização que habilita uma empresa a operar legalmente como agência de turismo no país.',
  },
  {
    question: 'Quais credenciamentos e parcerias a Anhangá possui?',
    answer:
      'A Anhangá é agente credenciado do Beto Carrero World e do Hopi Hari, parceira da Norwegian Cruise Line (NCL) para cruzeiros e registrada no Cadastur do Ministério do Turismo. Esses credenciamentos permitem emitir ingressos, pacotes e reservas oficiais desses parceiros com condições e suporte diretos.',
  },
  {
    question: 'Como funciona o atendimento da Anhangá?',
    answer:
      'O atendimento é consultivo, não de balcão. Um consultor humano desenha o roteiro dia a dia conforme seu perfil e orçamento — sem pacotes prontos de prateleira. Você aprova a proposta com todos os custos listados antes de qualquer emissão e conta com suporte 24h por WhatsApp durante a viagem. O primeiro contato pode ser pelo chat com IA no site, por WhatsApp ou presencialmente em São Paulo.',
  },
  {
    question: 'A Anhangá tem sede física e atendimento presencial?',
    answer:
      'Sim. A sede fica na Av. Dom Pedro I, 773 — Vila Monumento, São Paulo (SP), CEP 01552-001. O atendimento pode ser presencial, por WhatsApp no (11) 5283-3309 ou pelo chat com IA disponível no site.',
  },
];

// Consultores expostos como entidades Person (E-E-A-T) ligados à organização.
const TEAM = [AUTHORS['felipe-william'], AUTHORS['queila-oliveira']].filter(Boolean);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

const About: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="bg-brand-surface pt-32 pb-20">
      <Seo
        title="Sobre a Anhangá Viagens | Agência de Viagens em São Paulo"
        description="Anhangá Viagens: agência registrada no Cadastur (CNPJ 37.036.732/0001-41), com sede em São Paulo, agente credenciado Beto Carrero World e Hopi Hari e parceira Norwegian Cruise Line. Atendimento consultivo e roteiros personalizados."
        canonical="https://www.anhanga.tur.br/sobre/"
      />
      <OrganizationSchema
        aggregateRating={reviewSummary ? {
          ratingValue: reviewSummary.averageRating,
          reviewCount: reviewSummary.totalReviews,
        } : undefined}
      />
      <FAQPageSchema items={TRUST_FAQ_ITEMS} />
      {TEAM.map((member) => (
        <PersonSchema
          key={member.id}
          id={`person-${member.id}`}
          name={member.name}
          image={member.image}
          description={member.bio}
          jobTitle={member.role}
          sameAs={member.social ? (Object.values(member.social).filter(Boolean) as string[]) : undefined}
          worksFor={{ name: ORG_NAME, url: ORG_URL }}
        />
      ))}
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Sobre Nós', item: 'https://www.anhanga.tur.br/sobre/' },
        ]}
      />

      <div className="container mx-auto px-6">
        {/* HERO SECTION */}
        <m.section
          className="text-center mb-24"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <div className="inline-block relative mb-6">
            <span className="absolute inset-0 bg-brand-cyan/20 transform -skew-x-12 rounded-lg"></span>
            <span className="relative px-4 py-1 text-brand-dark font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-brand-cyan" /> Nossa Essência
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-brand-dark mb-6 leading-tight">
            Viagens com alma, <br />
            <span className="text-brand-cyan">
              design e zero estresse.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-zinc-600 text-lg md:text-xl font-medium leading-relaxed mb-8">
            Na Anhangá Viagens, acreditamos que viajar é mais do que carimbar um passaporte: é sobre colecionar histórias que valem a pena ser contadas.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openContactModal({ source: 'about' })}
              className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
              data-tracking="hero-about"
            >
              Solicitar Orçamento
              <Sparkles className="size-5" />
            </button>
          </div>
        </m.section>

        {/* HISTORIA SECTION */}
        <section id="nossa-historia" className="mb-32">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <m.div
              className="w-full lg:w-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 size-24 bg-brand-yellow/30 rounded-full blur-2xl z-0"></div>
                <div className="relative rounded-3xl overflow-hidden border-8 border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <LazyImage
                    src="images/about/equipe-anhanga.jpg"
                    alt="Equipe da Anhangá Viagens planejando um roteiro personalizado"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover aspect-[4/3]"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-zinc-100 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-brand-cyan/10 rounded-full flex items-center justify-center text-brand-cyan">
                      <Heart className="size-6 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Paixão por</p>
                      <p className="text-lg font-black text-brand-dark leading-none">Pessoas</p>
                    </div>
                  </div>
                </div>
              </div>
            </m.div>

            <m.div
              className="w-full lg:w-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-6">Nossa História</h2>
              <div className="space-y-4 text-zinc-600 font-medium leading-relaxed text-lg">
                <p>
                  A Anhangá Viagens nasceu em São Paulo com um propósito claro: resgatar o prazer de planejar uma viagem sem as dores de cabeça da burocracia digital e dos roteiros engessados.
                </p>
                <p>
                  Fundada por especialistas apaixonados pelo setor, nossa agência foca no <strong>atendimento consultivo</strong>. Não somos apenas um motor de busca; somos curadores de experiências.
                </p>
                <p>
                  Do primeiro café (virtual ou presencial) até o seu retorno para casa, cuidamos de cada detalhe como se a viagem fosse nossa. É esse cuidado artesanal que nos define.
                </p>
              </div>
            </m.div>
          </div>
        </section>

        {/* EXPERTISE SECTION */}
        <section className="mb-32">
          <m.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Por que viajar com a Anhangá?</h2>
            <p className="text-zinc-500 font-medium">O que nos torna diferentes no mercado de turismo.</p>
          </m.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Atendimento Humano",
                desc: "Nada de bots ou respostas automáticas. Você fala com especialistas que conhecem os destinos de verdade.",
                color: "bg-orange-100 text-orange-600"
              },
              {
                icon: Sparkles,
                title: "Curadoria Premium",
                desc: "Selecionamos hotéis e experiências que fogem do óbvio, garantindo que sua viagem seja única.",
                color: "bg-brand-cyan/10 text-brand-cyan"
              },
              {
                icon: ShieldCheck,
                title: "Suporte 24/7",
                desc: "Durante sua viagem, nossa equipe está a um WhatsApp de distância para resolver qualquer imprevisto.",
                color: "bg-emerald-100 text-emerald-600"
              }
            ].map((item, i) => (
              <m.div
                key={item.title}
                className="bg-white p-10 rounded-[2.5rem] border-2 border-zinc-100 shadow-sm hover:shadow-xl transition duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <div className={`size-14 rounded-2xl ${item.color} flex items-center justify-center mb-6`}>
                  <item.icon className="size-8" />
                </div>
                <h3 className="text-xl font-black text-brand-dark mb-4">{item.title}</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
              </m.div>
            ))}
          </div>
        </section>

        {/* TRUST & COMPLIANCE SECTION */}
        <section id="certificacoes" className="bg-brand-dark rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 size-64 bg-brand-vibrant/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 size-64 bg-brand-cyan/10 blur-[100px] rounded-full"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-brand-cyan text-sm font-bold mb-6">
                <Award className="size-4" /> Credibilidade & Confiança
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">Agência Certificada</h2>
              <p className="text-zinc-300 text-lg font-medium leading-relaxed mb-8">
                Sua segurança é nossa prioridade. A Anhangá Viagens é uma empresa devidamente registrada nos órgãos competentes, garantindo total conformidade legal para suas férias.
              </p>

              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-brand-cyan"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Cadastur Oficial</p>
                    <p className="text-zinc-400">Registro MTUR: 37.036.732/0001-41</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-brand-cyan"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Sede Própria em São Paulo</p>
                    <p className="text-zinc-400">Av. Dom Pedro I, 773 - Vila Monumento, CEP 01552-001</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-anhanga-action"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Agente Credenciado</p>
                    <p className="text-zinc-400">Beto Carrero World e Hopi Hari</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-anhanga-action/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="size-2 rounded-full bg-anhanga-action"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Parceira Norwegian Cruise Line</p>
                    <p className="text-zinc-400">Cruzeiros nacionais e internacionais (NCL)</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Award className="size-12 text-brand-cyan mb-4" />
                <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Membro Oficial</p>
                <p className="font-black text-xl">Beto Carrero World</p>
                <p className="text-xs text-brand-cyan mt-1">Agente Credenciado</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Anchor className="size-12 text-anhanga-action mb-4" />
                <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Membro Oficial</p>
                <p className="font-black text-xl">Hopi Hari</p>
                <p className="text-xs text-anhanga-action mt-1">Agente Credenciado</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Ship className="size-12 text-anhanga-action mb-4" />
                <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Parceira</p>
                <p className="font-black text-xl">Norwegian Cruise Line</p>
                <p className="text-xs text-anhanga-action mt-1">Cruzeiros NCL</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Coffee className="size-12 text-brand-yellow mb-4" />
                <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Localizada em</p>
                <p className="font-black text-xl">São Paulo - SP</p>
                <p className="text-xs text-brand-yellow mt-1">Atendimento Presencial</p>
              </div>
              <div className="col-span-2 bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-brand-vibrant">4.9/5</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Avaliação Média</p>
                </div>
                <div className="h-10 w-px bg-white/10"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-brand-cyan">100%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Roteiros sob medida</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TEAM / CONSULTORES SECTION */}
        <section id="consultores" className="mt-32">
          <m.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">Quem planeja a sua viagem</h2>
            <p className="text-zinc-500 font-medium max-w-2xl mx-auto">
              Atendimento consultivo é feito por gente de verdade. Conheça os consultores que desenham cada roteiro sob medida.
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {TEAM.map((member, i) => (
              <m.div
                key={member.id}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-zinc-100 shadow-sm hover:shadow-xl transition duration-300 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                {member.image && (
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.role} na Anhangá Viagens`}
                    width={96}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    className="size-24 rounded-2xl object-cover shrink-0 border-4 border-white shadow-md"
                  />
                )}
                <div>
                  <h3 className="text-xl font-black text-anhanga-dark leading-tight">{member.name}</h3>
                  <p className="text-sm font-bold text-anhanga-action uppercase tracking-wide mb-3">{member.role}</p>
                  <p className="text-zinc-500 font-medium leading-relaxed mb-4">{member.bio}</p>
                  {member.social && (
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      {member.social.instagram && (
                        <a
                          href={member.social.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Instagram de ${member.name}`}
                          className="size-9 rounded-full bg-anhanga-action/10 text-anhanga-action flex items-center justify-center hover:bg-anhanga-action hover:text-white transition-colors"
                        >
                          <InstagramLogo className="size-4" weight="fill" />
                        </a>
                      )}
                      {member.social.linkedin && (
                        <a
                          href={member.social.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`LinkedIn de ${member.name}`}
                          className="size-9 rounded-full bg-anhanga-action/10 text-anhanga-action flex items-center justify-center hover:bg-anhanga-action hover:text-white transition-colors"
                        >
                          <LinkedinLogo className="size-4" weight="fill" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </m.div>
            ))}
          </div>
        </section>

        {/* FAQ / CONFIANÇA SECTION */}
        <section id="perguntas-frequentes" className="mt-32">
          <m.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black text-anhanga-dark mb-4">Perguntas frequentes sobre a Anhangá</h2>
            <p className="text-zinc-500 font-medium max-w-2xl mx-auto">
              Confiança, credenciamentos e como funciona o atendimento — em respostas diretas.
            </p>
          </m.div>

          <div className="max-w-3xl mx-auto space-y-5">
            {TRUST_FAQ_ITEMS.map((item, i) => (
              <m.div
                key={item.question}
                className="bg-white p-8 rounded-3xl border-2 border-zinc-100 shadow-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <h3 className="text-lg md:text-xl font-black text-anhanga-dark mb-3">{item.question}</h3>
                <p className="text-zinc-600 font-medium leading-relaxed">{item.answer}</p>
              </m.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <m.section
          className="mt-32 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="bg-brand-cyan/5 rounded-[3rem] p-12 md:p-20 border-2 border-dashed border-brand-cyan/20">
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-6">Pronto para sua próxima história?</h2>
            <p className="text-zinc-600 text-lg font-medium mb-10 max-w-xl mx-auto">
              Seja para um festival épico ou um refúgio relaxante, nós desenhamos a viagem perfeita para você.
            </p>
            <button
              type="button"
              onClick={() => openContactModal({ source: 'about' })}
              className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
              data-tracking="footer-about"
            >
              Começar Planejamento
              <Sparkles className="size-5" />
            </button>
          </div>
        </m.section>
      </div>
    </div>
  );
};

export default About;
