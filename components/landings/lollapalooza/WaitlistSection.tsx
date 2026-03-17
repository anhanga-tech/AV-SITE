import React, { useState } from 'react';
import { BellRing, CheckCircle2, Loader2, Mail, TicketX, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWaitlistCapture } from '../../../hooks/useWaitlistCapture';
import { WAITLIST_SECTION_ID } from './constants';

const WaitlistSection: React.FC = () => {
  const { submitWaitlist, isSubmitting, error } = useWaitlistCapture();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    if (!name.trim() || !email.trim()) {
      setLocalError('Preencha nome completo e e-mail para entrar na lista.');
      return;
    }

    if (!acceptedLgpd) {
      setLocalError('Você precisa aceitar a política de privacidade para continuar.');
      return;
    }

    const result = await submitWaitlist({
      name,
      email,
      sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/lollapalooza',
    });

    if (result.ok === false) {
      setLocalError(result.error);
      return;
    }

    setSuccessMessage('Você entrou na lista de espera para o Lollapalooza 2027.');
    setWarningMessage(result.warning || null);
    setName('');
    setEmail('');
    setAcceptedLgpd(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } as const }
  };

  return (
    <section
      id={WAITLIST_SECTION_ID}
      className="relative scroll-mt-28 bg-black py-24 sm:py-32 overflow-hidden"
      aria-labelledby="waitlist-heading"
    >
      {/* Background Graphic Elements */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="absolute -top-10 -right-20 text-[20vw] font-black italic text-white/5 leading-none select-none">
          2027
        </span>
        <div className="absolute top-1/4 left-0 w-px h-64 bg-gradient-to-b from-transparent via-anhanga-yellow/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(400px,500px)] items-center">
          
          {/* Content Corner - Compressed Text */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-anhanga-yellow text-black px-4 py-1 text-[10px] font-black uppercase tracking-[0.25em] ring-2 ring-anhanga-yellow ring-offset-4 ring-offset-black mb-10">
              <TicketX size={14} strokeWidth={3} aria-hidden="true" />
              Sold Out 2026
            </motion.div>

            <motion.h2 
              variants={itemVariants}
              id="waitlist-heading" 
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] uppercase italic tracking-tighter mb-8"
            >
              Não fique de fora do <span className="text-anhanga-yellow">Lolla 2027.</span>
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 font-medium leading-relaxed max-w-xl mb-12">
              A jornada de 2026 lotou em tempo recorde. Garanta seu lugar na lista de prioridade para a edição 2027 e receba avisos antecipados sobre pacotes, logística e condições exclusivas Anhangá.
            </motion.p>

            <div className="grid gap-6 w-full max-w-lg">
              <motion.div variants={itemVariants} className="group flex gap-4 p-6 bg-white/[0.03] border border-white/10 hover:border-anhanga-yellow transition-colors duration-300">
                <div className="bg-anhanga-yellow text-black p-3 h-fit">
                  <BellRing size={20} strokeWidth={3} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider mb-2">Prioridade Total</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Recepção de ofertas antes do lançamento público geral.</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="group flex gap-4 p-6 bg-white/[0.03] border border-white/10 hover:border-anhanga-blue transition-colors duration-300">
                <div className="bg-anhanga-blue text-white p-3 h-fit">
                  <Zap size={20} strokeWidth={3} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider mb-2">Logística Hardcore</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Saiba primeiro os hotéis mais próximos e as rotas mais eficientes.</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Form Block - The Asymmetric Tension */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative lg:mt-0 mt-12"
          >
            {/* Geometric Accent Decoration */}
            <div className="absolute -top-6 -left-6 w-24 h-24 border-t-2 border-l-2 border-anhanga-yellow z-0 opacity-50" />
            <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b-2 border-r-2 border-anhanga-blue z-0 opacity-50" />

            <div className="relative z-10 flex flex-col bg-anhanga-darkBlue/50 backdrop-blur-xl border border-white/10 ring-1 ring-white/5 p-8 md:p-10">
              <div className="mb-10 text-center lg:text-left">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Waiting List 2027</h3>
                <div className="h-1 w-20 bg-anhanga-yellow mt-4 mx-auto lg:mx-0" />
              </div>

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="group relative space-y-2">
                  <label htmlFor="lolla-waitlist-name" className="block text-[10px] font-black text-anhanga-yellow uppercase tracking-[0.2em] transition-colors group-focus-within:text-white">
                    Nome completo
                  </label>
                  <div className="relative">
                    <input
                      id="lolla-waitlist-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="peer w-full bg-black/60 border-l-2 border-white/10 px-6 py-4 text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-anhanga-yellow focus:bg-anhanga-yellow/5"
                      placeholder="EX: SABRINA CARPENTER"
                      autoComplete="name"
                    />
                    {/* Focus geometric accent */}
                    <div className="absolute left-0 bottom-0 h-0.5 w-0 bg-anhanga-yellow transition-all duration-500 peer-focus:w-full" />
                    <div className="absolute -left-[2px] top-0 h-0 w-2.5 bg-anhanga-yellow transition-all duration-500 peer-focus:h-full" />
                  </div>
                </div>

                <div className="group relative space-y-2">
                  <label htmlFor="lolla-waitlist-email" className="block text-[10px] font-black text-anhanga-blue uppercase tracking-[0.2em] transition-colors group-focus-within:text-white">
                    Seu melhor E-mail
                  </label>
                  <div className="relative">
                    <input
                      id="lolla-waitlist-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="peer w-full bg-black/60 border-l-2 border-white/10 px-6 py-4 text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-anhanga-blue focus:bg-anhanga-blue/5"
                      placeholder="VOICE@EXEMPLO.COM"
                      autoComplete="email"
                    />
                    {/* Focus geometric accent */}
                    <div className="absolute left-0 bottom-0 h-0.5 w-0 bg-anhanga-blue transition-all duration-500 peer-focus:w-full" />
                    <div className="absolute -left-[2px] top-0 h-0 w-2.5 bg-anhanga-blue transition-all duration-500 peer-focus:h-full" />
                  </div>
                </div>

                <label className="flex items-start gap-4 cursor-pointer group pt-4">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={acceptedLgpd}
                      onChange={(event) => setAcceptedLgpd(event.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 border-2 border-white/20 peer-checked:border-anhanga-yellow peer-checked:bg-anhanga-yellow transition-all duration-200" />
                    <CheckCircle2 size={12} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs text-gray-400 leading-snug group-hover:text-gray-300 transition-colors">
                    Autorizo a Anhangá a me enviar novidades exclusivas conforme a{' '}
                    <a
                      href="https://www.anhanga.tur.br/politica-privacidade/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-anhanga-yellow underline underline-offset-4"
                    >
                      Política de Privacidade
                    </a>.
                  </span>
                </label>

                <AnimatePresence mode="wait">
                  {(localError || error) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      role="alert" 
                      className="border-l-4 border-red-500 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400"
                    >
                      {localError || error}
                    </motion.div>
                  )}

                  {successMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      role="status" 
                      className="border-l-4 border-anhanga-yellow bg-anhanga-yellow/10 px-4 py-3 text-xs font-bold text-anhanga-yellow"
                    >
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex w-full items-center justify-center gap-3 bg-anhanga-yellow px-8 py-5 text-sm font-black text-black transition-all duration-300 hover:tracking-[0.1em] disabled:cursor-wait disabled:opacity-50"
                  style={{ borderRadius: '1px' }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        ENVIANDO...
                      </>
                    ) : (
                      <>
                        ENTRAR NA LISTA 2027
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </span>
                  
                  {/* Magnetic/Glow Background effect on hover */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistSection;
