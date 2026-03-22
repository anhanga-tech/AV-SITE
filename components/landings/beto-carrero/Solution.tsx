import React, { useState } from 'react';
import { Check, MapPin, Plane, BedDouble, Ticket, MessageCircle, Send, ArrowRight, X, Sun, Fish, Building2, Sparkles } from 'lucide-react';
import Button from './Button';
import { openAiChat } from '../../../utils/aiChat';

const Solution: React.FC = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);

   // Função que abre o modal
   const handleOpenModal = () => {
      setIsModalOpen(true);
   };

   // Função que fecha o modal
   const handleCloseModal = () => {
      setIsModalOpen(false);
   };

   return (
      <section className="py-24 bg-fun-blue relative border-b-4 border-fun-dark overflow-hidden">

         {/* Custom Styles for Wave Animation */}
         <style>{`
        @keyframes wave-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-wave {
          animation: wave-float 5s ease-in-out infinite;
        }
      `}</style>

         {/* Wave Divider Top - Refined for better transition */}
         <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-10">
            <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[90px] animate-wave" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
               {/* Organic Wave Path */}
               <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-fun-white"></path>
               {/* Shadow/Stroke for depth */}
               <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3" fill="none" stroke="#0F172A" strokeWidth="2" opacity="0.1" />
            </svg>
         </div>

         <div className="container mx-auto px-4 relative z-10 pt-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">

               {/* --- LEFT COLUMN: The Stack (Checklist) --- */}
               <div className="lg:w-1/2 relative flex flex-col items-center lg:items-start">
                  <div className="w-full">
                     <div className="inline-block px-4 py-2 bg-fun-yellow border-2 border-fun-dark rounded-full shadow-hard mb-8 md:mb-10 transform -rotate-2">
                        <span className="font-bold text-fun-dark uppercase tracking-wide text-sm">Zero Stress</span>
                     </div>

                     <h2 className="text-4xl md:text-6xl font-sans font-bold mb-6 text-white drop-shadow-md leading-tight">
                        A Solução é <br className="md:hidden" />
                        <span className="relative inline-block ml-2 md:ml-0">
                           <span className="relative z-10 text-fun-yellow">Simples</span>
                           {/* Custom Brush Stroke Underline - Replaces the 'spell check' wavy line */}
                           <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-[110%] -translate-x-[5%] h-4 md:h-6 text-fun-yellow pointer-events-none z-0" viewBox="0 0 120 15" preserveAspectRatio="none">
                              <path d="M5 10 Q 60 15 115 5" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" className="opacity-80" />
                           </svg>
                        </span>
                     </h2>
                     <p className="text-xl md:text-2xl font-sans mb-10 text-blue-100 leading-relaxed max-w-lg">
                        Enquanto você sonha, a Anhangá organiza. Seu pacote completo chega pronto no seu WhatsApp.
                     </p>
                  </div>

                  <div className="space-y-6 relative z-10 w-full flex flex-col items-center lg:items-start">

                     {/* Card 1: Ticket Style */}
                     <div className="group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-2 hover:rotate-0 transition-transform duration-300 flex overflow-hidden w-full max-w-sm lg:max-w-md">
                        {/* Left Side: Content */}
                        <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
                           {/* Redesigned Icon: Blue Circle Token */}
                           <div className="w-14 h-14 lg:w-20 lg:h-20 bg-fun-blue rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white transform -rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                              <Plane className="w-6 h-6 lg:w-9 lg:h-9" strokeWidth={2.5} />
                           </div>
                           <div>
                              <h4 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Passagem Aérea</h4>
                              <p className="text-slate-600 text-xs lg:text-sm font-bold">Horários que funcionam.</p>
                           </div>
                        </div>
                        {/* Divider Line */}
                        <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
                           <div className="absolute -top-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                           <div className="absolute -bottom-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                        </div>
                        {/* Right Side: Stamp */}
                        <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
                           <div className="bg-green-100 text-green-600 border-2 border-green-500 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transform rotate-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                              <Check className="w-[18px] h-[18px] lg:w-6 lg:h-6" strokeWidth={3} />
                           </div>
                        </div>
                     </div>

                     {/* Card 2: Ticket Style */}
                     <div className="group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform rotate-1 hover:rotate-0 transition-transform duration-300 flex overflow-hidden ml-0 md:ml-12 lg:ml-12 w-full max-w-sm lg:max-w-md">
                        <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
                           {/* Redesigned Icon: Yellow Circle Token */}
                           <div className="w-14 h-14 lg:w-20 lg:h-20 bg-fun-yellow rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-fun-dark transform rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                              <BedDouble className="w-6 h-6 lg:w-9 lg:h-9" strokeWidth={2.5} />
                           </div>
                           <div>
                              <h4 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Hotel Top</h4>
                              <p className="text-slate-600 text-xs lg:text-sm font-bold">Perto da diversão.</p>
                           </div>
                        </div>
                        <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
                           <div className="absolute -top-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                           <div className="absolute -bottom-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                        </div>
                        <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
                           <div className="bg-green-100 text-green-600 border-2 border-green-500 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transform -rotate-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                              <Check className="w-[18px] h-[18px] lg:w-6 lg:h-6" strokeWidth={3} />
                           </div>
                        </div>
                     </div>

                     {/* Card 3: Ticket Style */}
                     <div
                        onClick={() => openAiChat({
                           message: 'Olá! Gostaria de um orçamento para o Beto Carrero incluindo ingressos oficiais.'
                        })}
                        className="btn-specialist cursor-pointer group bg-white rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-1 hover:rotate-0 transition-transform duration-300 flex overflow-hidden w-full max-w-sm lg:max-w-md"
                        data-tracking="mid-betocarrero"
                     >
                        <div className="p-3 pl-4 lg:p-6 lg:pl-8 flex-grow flex items-center gap-4 lg:gap-6">
                           {/* Redesigned Icon: Pink Circle Token */}
                           <div className="w-14 h-14 lg:w-20 lg:h-20 bg-fun-pink rounded-full flex items-center justify-center border-2 border-fun-dark shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white transform -rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                              <Ticket className="w-6 h-6 lg:w-9 lg:h-9" strokeWidth={2.5} />
                           </div>
                           <div>
                              <h4 className="font-sans font-bold text-lg lg:text-2xl text-fun-dark">Ingresso Oficial</h4>
                              <p className="text-slate-600 text-xs lg:text-sm font-bold">Direto na catraca.</p>
                           </div>
                        </div>
                        <div className="w-0 border-l-2 border-dashed border-gray-300 relative my-2">
                           <div className="absolute -top-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                           <div className="absolute -bottom-3 -left-1.5 w-3 h-3 bg-fun-blue rounded-full"></div>
                        </div>
                        <div className="w-16 lg:w-20 bg-gray-50 flex items-center justify-center flex-shrink-0">
                           <div className="bg-green-100 text-green-600 border-2 border-green-500 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transform rotate-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                              <Check className="w-[18px] h-[18px] lg:w-6 lg:h-6" strokeWidth={3} />
                           </div>
                        </div>
                     </div>

                  </div>

                  {/* Sticker: Extra Cities - INCREASED SIZE */}
                  <div className="relative mt-12 xl:mt-0 xl:absolute xl:top-1/2 xl:-right-40 xl:-translate-y-1/2 z-30 w-full max-w-sm xl:w-96">

                     {/* Larger Tape effect */}
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-12 bg-white/40 rotate-2 backdrop-blur-sm border-l-2 border-r-2 border-white/50 shadow-sm pointer-events-none"></div>

                     <button
                        onClick={handleOpenModal}
                        className="bg-fun-yellow p-8 w-full rounded-xl border-4 border-fun-dark shadow-hard-lg transform -rotate-3 hover:rotate-0 hover:scale-105 active:scale-95 transition-all duration-300 text-left group focus:outline-none focus:ring-4 focus:ring-fun-blue focus:ring-offset-2"
                        aria-label="Saiba mais sobre estender a viagem para praias próximas"
                     >

                        {/* Header of Sticker */}
                        <div className="flex items-center gap-3 mb-4 border-b-2 border-fun-dark/20 pb-3">
                           <div className="bg-fun-dark text-white p-2 rounded-lg">
                              <MapPin size={24} strokeWidth={2.5} />
                           </div>
                           <span className="font-sans font-bold text-2xl leading-none text-fun-dark">Estique a viagem</span>
                        </div>

                        {/* Description */}
                        <p className="text-lg font-bold text-slate-800 mb-4 leading-snug">
                           Dá pra incluir praia no roteiro? <br />
                           <span className="text-fun-pink text-xl">Com certeza!</span>
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                           <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform rotate-2">Floripa</span>
                           <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform -rotate-1">Bombinhas</span>
                           <span className="px-3 py-1.5 bg-white border-2 border-fun-dark rounded-lg text-sm font-bold shadow-sm transform rotate-1">Balneário</span>
                        </div>

                        {/* Fake Link */}
                        <div className="flex items-center gap-2 text-fun-dark font-bold text-sm uppercase tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                           Ver opções <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </div>
                     </button>
                  </div>

               </div>

               {/* --- RIGHT COLUMN: The Visual (Phone Chat Mockup) --- */}
               <div className="lg:w-1/2 relative flex justify-center mt-12 lg:mt-0">

                  {/* Decorative Elements behind phone */}
                  <div className="absolute top-10 right-0 w-32 h-32 bg-fun-yellow rounded-full border-2 border-fun-dark mix-blend-multiply opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-10 left-10 w-20 h-20 bg-fun-pink rounded-full border-2 border-fun-dark mix-blend-multiply opacity-80"></div>

                  {/* The Phone */}
                  <div className="bg-white p-3 rounded-[3rem] border-4 border-fun-dark shadow-hard-lg max-w-sm w-full relative z-10 transform rotate-2 transition-transform hover:rotate-0 duration-500">

                     {/* Screen */}
                     <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-gray-200 h-[500px] relative flex flex-col">

                        {/* Header */}
                        <div className="bg-fun-green p-4 pt-8 flex items-center gap-3 border-b-2 border-fun-dark">
                           <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-fun-dark">
                              <span className="font-bold text-fun-green text-lg">A</span>
                           </div>
                           <div>
                              <p className="font-bold text-white text-sm leading-tight">Anhangá Viagens</p>
                              <p className="text-green-100 text-xs flex items-center gap-1">
                                 <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span> Online agora
                              </p>
                           </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                           {/* Background Pattern */}
                           <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                           {/* Msg 1 (User) */}
                           <div className="flex justify-end animate-[slideUp_0.5s_ease-out_forwards]">
                              <div className="bg-white border-2 border-gray-200 text-slate-700 p-3 px-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                                 <p className="text-sm">Oi! Quero levar as crianças pro Beto Carrero em Julho. 🎢</p>
                                 <span className="text-[10px] text-gray-400 block text-right mt-1">10:42</span>
                              </div>
                           </div>

                           {/* Msg 2 (Agent) */}
                           <div className="flex justify-start animate-[slideUp_0.6s_ease-out_0.5s_both]">
                              <div className="bg-fun-green text-white border-2 border-fun-dark p-3 px-4 rounded-2xl rounded-tl-none shadow-hard max-w-[90%]">
                                 <p className="text-sm font-bold">Claro! Já montei tudo pra você:</p>
                                 <ul className="mt-2 text-xs space-y-1 opacity-90">
                                    <li>✈️ Voo direto (manhã)</li>
                                    <li>🏨 Hotel com café (5min do parque)</li>
                                    <li>🎟️ Ingressos p/ 2 dias</li>
                                 </ul>
                                 <span className="text-[10px] text-green-200 block text-right mt-2">10:45</span>
                              </div>
                           </div>

                           {/* Msg 3 (User) */}
                           <div className="flex justify-end animate-[slideUp_0.6s_ease-out_1.5s_both]">
                              <div className="bg-white border-2 border-gray-200 text-slate-700 p-3 px-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                                 <p className="text-sm">Perfeito! Vamos fechar. 😍</p>
                              </div>
                           </div>
                        </div>

                        {/* Footer Input */}
                        <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                           <div className="w-full h-10 bg-gray-100 rounded-full border border-gray-300"></div>
                           <div className="w-10 h-10 bg-fun-blue rounded-full flex items-center justify-center text-white">
                              <Send size={18} />
                           </div>
                        </div>

                     </div>

                     {/* Sticker: "Tudo no Zap" */}
                     <div className="absolute -bottom-6 -right-6 bg-white p-3 rounded-xl border-2 border-fun-dark shadow-hard transform -rotate-6 z-20">
                        <div className="flex items-center gap-2">
                           <MessageCircle className="text-green-500 fill-current" />
                           <span className="font-sans font-bold text-fun-dark text-sm">Tudo no Zap!</span>
                        </div>
                     </div>
                  </div>

               </div>

            </div>
         </div>

         {/* --- FLOATING MODAL --- */}
         {isModalOpen && (
            <div
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
               role="dialog"
               aria-modal="true"
            >
               {/* Backdrop */}
               <div
                  className="absolute inset-0 bg-fun-dark/80 backdrop-blur-sm transition-opacity"
                  onClick={handleCloseModal}
               ></div>

               {/* Modal Content */}
               <div className="relative bg-white w-full max-w-lg rounded-3xl border-4 border-fun-dark shadow-hard-lg p-6 md:p-8 animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden">

                  {/* Close Button */}
                  <button
                     onClick={handleCloseModal}
                     className="absolute top-4 right-4 bg-fun-pink text-white p-2 rounded-full border-2 border-fun-dark shadow-hard hover:scale-110 hover:rotate-90 transition-all z-10"
                     aria-label="Fechar janela"
                  >
                     <X size={20} strokeWidth={3} />
                  </button>

                  {/* Header */}
                  <div className="text-center mb-8">
                     <h3 className="font-sans font-bold text-3xl md:text-4xl text-fun-dark mb-2">Destinos Extras</h3>
                     <p className="text-slate-600 font-bold">Escolha um (ou todos) e peça no Zap!</p>
                  </div>

                  {/* Destinations List */}
                  <div className="space-y-5 mb-4">

                     {/* Item 1: Floripa */}
                     <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-fun-yellow/20 rounded-bl-full z-0"></div>

                        <div className="w-16 h-16 bg-fun-yellow border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:rotate-12 transition-transform duration-300">
                           <Sun size={32} className="text-fun-dark" strokeWidth={2.5} />
                        </div>
                        <div className="z-10">
                           <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Florianópolis</h4>
                           <p className="text-sm font-bold text-slate-500 leading-tight">42 praias, dunas de areia e gastronomia.</p>
                        </div>
                     </div>

                     {/* Item 2: Bombinhas */}
                     <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-fun-green/20 rounded-bl-full z-0"></div>

                        <div className="w-16 h-16 bg-fun-green border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:-rotate-12 transition-transform duration-300">
                           <Fish size={32} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div className="z-10">
                           <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Bombinhas</h4>
                           <p className="text-sm font-bold text-slate-500 leading-tight">Mergulho ecológico e águas cristalinas.</p>
                        </div>
                     </div>

                     {/* Item 3: Balneário */}
                     <div className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 cursor-default relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-16 h-16 bg-fun-blue/20 rounded-bl-full z-0"></div>

                        <div className="w-16 h-16 bg-fun-blue border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:rotate-6 transition-transform duration-300">
                           <Building2 size={32} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div className="z-10">
                           <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">Balneário Camboriú</h4>
                           <p className="text-sm font-bold text-slate-500 leading-tight">Roda gigante, aquário e vida noturna.</p>
                        </div>
                     </div>

                  </div>

                  {/* Footer CTA */}
                  <div className="text-center mt-8 pt-6 border-t-2 border-dashed border-gray-300">
                     <Button
                        text="Montar Roteiro no Zap"
                        variant="secondary"
                        fullWidth={true}
                        onClick={handleCloseModal}
                        tooltip="Ajustamos tudo para você"
                        dataTracking="modal-betocarrero"
                     />
                  </div>

               </div>
            </div>
         )}

      </section>
   );
};

export default Solution;
