import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { SEO } from '../components/SEO';
import { OrganizationSchema } from '../components/schemas/OrganizationSchema';
import { BreadcrumbSchema } from '../components/schemas/BreadcrumbSchema';
import { LazyImage } from '../components/ui/LazyImage';
import { openAiChat } from '../utils/aiChat';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Award from 'lucide-react/dist/esm/icons/award';
import Users from 'lucide-react/dist/esm/icons/users';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Coffee from 'lucide-react/dist/esm/icons/coffee';

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

const CHAT_MESSAGE_ORCAMENTO = "Olá! Gostaria de conversar sobre um roteiro personalizado.";

const About: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="bg-[#fffdf5] pt-32 pb-20">
      <SEO
        title="Sobre a Anhangá Viagens | Agência Boutique em São Paulo"
        description="Conheça a história e os valores da Anhangá Viagens. Somos uma agência de turismo certificada pela Cadastur em São Paulo, especializada em roteiros personalizados."
        canonical="https://www.anhanga.tur.br/sobre/"
      />
      <OrganizationSchema />
      <BreadcrumbSchema
        items={[
          { name: 'Home', item: 'https://www.anhanga.tur.br/' },
          { name: 'Sobre Nós', item: 'https://www.anhanga.tur.br/sobre/' },
        ]}
      />

      <div className="container mx-auto px-6">
        {/* HERO SECTION */}
        <motion.section
          className="text-center mb-24"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <div className="inline-block relative mb-6">
            <span className="absolute inset-0 bg-brand-cyan/20 transform -skew-x-12 rounded-lg"></span>
            <span className="relative px-4 py-1 text-brand-dark font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-cyan" /> Nossa Essência
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-brand-dark mb-6 leading-tight">
            Viagens com alma, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-vibrant to-brand-cyan">
              design e zero estresse.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg md:text-xl font-medium leading-relaxed mb-8">
            Na Anhangá Viagens, acreditamos que viajar é mais do que carimbar um passaporte — é sobre colecionar histórias que valem a pena ser contadas.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => openAiChat({ message: CHAT_MESSAGE_ORCAMENTO })}
              className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3"
              data-tracking="hero-about"
            >
              Solicitar Orçamento
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </motion.section>

        {/* HISTORIA SECTION */}
        <section id="nossa-historia" className="mb-32">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              className="w-full lg:w-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand-yellow/30 rounded-full blur-2xl z-0"></div>
                <div className="relative rounded-3xl overflow-hidden border-8 border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <LazyImage
                    src="images/about/equipe-anhanga.jpg"
                    alt="Equipe da Anhangá Viagens planejando um roteiro personalizado"
                    className="w-full h-auto object-cover aspect-[4/3]"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-cyan/10 rounded-full flex items-center justify-center text-brand-cyan">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paixão por</p>
                      <p className="text-lg font-black text-brand-dark leading-none">Pessoas</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="w-full lg:w-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-6">Nossa História</h2>
              <div className="space-y-4 text-gray-600 font-medium leading-relaxed text-lg">
                <p>
                  A Anhangá Viagens nasceu em São Paulo com um propósito claro: resgatar o prazer de planejar uma viagem sem as dores de cabeça da burocracia digital e dos roteiros engessados.
                </p>
                <p>
                  Fundada por especialistas apaixonados pelo setor, nossa agência boutique foca no <strong>atendimento consultivo</strong>. Não somos apenas um motor de busca; somos curadores de experiências.
                </p>
                <p>
                  Do primeiro café (virtual ou presencial) até o seu retorno para casa, cuidamos de cada detalhe como se a viagem fosse nossa. É esse cuidado artesanal que nos define.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* EXPERTISE SECTION */}
        <section className="mb-32">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4">Por que viajar com a Anhangá?</h2>
            <p className="text-gray-500 font-medium">O que nos torna diferentes no mercado de turismo.</p>
          </motion.div>

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
              <motion.div
                key={item.title}
                className="bg-white p-10 rounded-[2.5rem] border-2 border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-brand-dark mb-4">{item.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TRUST & COMPLIANCE SECTION */}
        <section id="certificacoes" className="bg-brand-dark rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-vibrant/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-cyan/10 blur-[100px] rounded-full"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-brand-cyan text-sm font-bold mb-6">
                <Award className="w-4 h-4" /> Credibilidade & Confiança
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6">Agência Certificada</h2>
              <p className="text-gray-300 text-lg font-medium leading-relaxed mb-8">
                Sua segurança é nossa prioridade. A Anhangá Viagens é uma empresa devidamente registrada nos órgãos competentes, garantindo total conformidade legal para suas férias.
              </p>

              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Cadastur Oficial</p>
                    <p className="text-gray-400">Registro MTUR: 37.036.732/0001-41</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none mb-1">Sede Própria em São Paulo</p>
                    <p className="text-gray-400">Av. Dom Pedro I, 773 - Vila Monumento</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Award className="w-12 h-12 text-brand-cyan mb-4" />
                <p className="text-sm font-bold uppercase tracking-tighter opacity-50 mb-2">Membro Oficial</p>
                <p className="font-black text-xl">Beto Carrero World</p>
                <p className="text-xs text-brand-cyan mt-1">Agente Credenciado</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center">
                <Coffee className="w-12 h-12 text-brand-yellow mb-4" />
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

        {/* CTA */}
        <motion.section
          className="mt-32 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="bg-brand-cyan/5 rounded-[3rem] p-12 md:p-20 border-2 border-dashed border-brand-cyan/20">
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-6">Pronto para sua próxima história?</h2>
            <p className="text-gray-600 text-lg font-medium mb-10 max-w-xl mx-auto">
              Seja para um festival épico ou um refúgio relaxante, nós desenhamos a viagem perfeita para você.
            </p>
            <button
              onClick={() => openAiChat({ message: CHAT_MESSAGE_ORCAMENTO })}
              className="btn-whatsapp btn-specialist bg-brand-vibrant text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-brand-vibrant/20 hover:scale-105 transition-transform active:scale-95 flex items-center gap-3 mx-auto"
              data-tracking="footer-about"
            >
              Começar Planejamento
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default About;
