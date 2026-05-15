import React from 'react';
import SectionTitle from './SectionTitle';
import { Search, BatteryLow, AlertTriangle, X, MousePointer2, HelpCircle } from 'lucide-react';

const Problem: React.FC = () => {
   return (
      <section className="py-24 pt-32 md:pt-40 lg:pt-24 bg-fun-white relative overflow-hidden">

         {/* Background Decor: Confused Squiggle */}
         <svg className="absolute top-20 left-0 w-full h-full text-zinc-200 pointer-events-none -z-0" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="5,5" />
         </svg>

         <div className="container mx-auto px-4 relative z-10">
            <SectionTitle
               title="Você já passou por isso?"
               subtitle="Aquele momento em que você decide viajar… e o pesadelo começa."
            />

            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mt-12 md:mt-16">

               {/* --- LEFT COLUMN: The Visual Chaos (Collage) --- */}
               {/* Tablet Adjustment: Increased height and centered content */}
               <div className="lg:col-span-6 relative h-[450px] md:h-[550px] lg:h-[600px] flex items-center justify-center w-full md:max-w-2xl md:mx-auto lg:max-w-none">

                  {/* Decorative Background Blob */}
                  <div className="absolute size-80 md:size-[450px] lg:size-[500px] bg-fun-pink/10 rounded-full blur-3xl"></div>

                  {/* Element 1: The Browser Window (Base) */}
                  {/* Tablet Adjustment: Centered using translate-x logic and adjusted width */}
                  <div className="absolute top-10 left-0 md:left-1/2 md:-translate-x-1/2 lg:left-0 lg:translate-x-0 w-full md:w-[480px] lg:w-[32rem] bg-white border-2 border-fun-dark rounded-xl shadow-hard z-10 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                     {/* Browser Header */}
                     <div className="bg-zinc-100 border-b-2 border-fun-dark p-2 lg:p-3 flex items-center gap-2 rounded-t-lg">
                        <div className="size-3 lg:size-4 rounded-full bg-red-400 border border-fun-dark"></div>
                        <div className="size-3 lg:size-4 rounded-full bg-yellow-400 border border-fun-dark"></div>
                        <div className="size-3 lg:size-4 rounded-full bg-green-400 border border-fun-dark"></div>
                        <div className="flex-grow bg-white border border-zinc-300 h-5 lg:h-7 rounded-md text-[10px] lg:text-xs flex items-center px-2 text-zinc-400 overflow-hidden">
                           betocarrero-hoteis-baratos-socorro.com...
                        </div>
                     </div>
                     {/* Browser Body */}
                     <div className="p-6 md:p-8 lg:p-10 flex flex-col items-center text-center">
                        <Search className="text-fun-blue size-10 lg:size-16 mb-2 animate-pulse" />
                        <h3 className="font-sans font-bold text-xl md:text-2xl lg:text-3xl text-fun-dark">157 abas abertas</h3>
                        <p className="text-sm md:text-base lg:text-lg text-zinc-500 mt-2 leading-tight">
                           Comparando preços, lendo reviews antigos e ficando cada vez mais confuso.
                        </p>
                     </div>
                  </div>

                  {/* Element 2: The "Error/Alert" Toast (Floating Right) */}
                  {/* Tablet Adjustment: Increased width (md:w-72), padding (md:p-6), and text sizes */}
                  <div className="absolute bottom-20 right-0 md:right-[2%] lg:-right-4 bg-fun-yellow p-4 md:p-6 lg:p-6 rounded-xl border-2 border-fun-dark shadow-hard z-20 transform rotate-6 w-56 md:w-72 lg:w-80 hover:scale-105 transition-transform">
                     <div className="flex items-start gap-3 lg:gap-4">
                        <AlertTriangle className="text-fun-dark size-6 md:size-8 lg:size-10 flex-shrink-0" />
                        <div>
                           <h3 className="font-bold text-sm md:text-lg lg:text-xl leading-tight mb-1">Preço mudou!</h3>
                           <p className="text-xs md:text-sm lg:text-base text-fun-dark/80">A passagem aumentou enquanto você pensava.</p>
                        </div>
                     </div>
                  </div>

                  {/* Element 3: Low Battery (Floating Left) */}
                  {/* Tablet Adjustment: Increased padding (md:p-4 md:px-8), icon size, and font size */}
                  <div className="absolute bottom-10 left-4 md:left-[5%] lg:left-4 bg-white p-3 px-5 md:p-4 md:px-8 lg:p-5 lg:px-8 rounded-full border-2 border-fun-dark shadow-hard z-30 transform -rotate-12 flex items-center gap-2 md:gap-3 lg:gap-3">
                     <BatteryLow className="text-fun-pink size-5 md:size-7 lg:size-8" />
                     <span className="font-bold text-sm md:text-lg lg:text-xl text-zinc-600">Exaustão Mental</span>
                  </div>

                  {/* Floating Cursor */}
                  <MousePointer2 className="absolute top-1/2 right-1/4 md:right-[20%] text-fun-dark size-8 lg:size-12 fill-white stroke-[1.5px] z-40 animate-float" />

                  {/* Floating Question Marks */}
                  <HelpCircle className="absolute top-0 right-10 md:right-[15%] lg:right-0 text-zinc-300 size-12 lg:size-20 transform rotate-12" />
               </div>


               {/* --- RIGHT COLUMN: The Pain Points (Redesigned Cards) --- */}
               {/* Tablet Adjustment: Uses a grid (md:grid-cols-2) to reduce vertical height on tablets, enabling 2 cards top + 1 centered bottom */}
               <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 lg:gap-10">

                  {/* Problem Card 1 */}
                  <div className="group bg-white p-6 lg:p-8 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 transform rotate-1 h-full">
                     <div className="flex gap-5 lg:gap-8 items-start h-full">
                        <div className="flex-shrink-0 size-14 lg:size-20 rounded-xl bg-red-100 flex items-center justify-center text-fun-pink border-2 border-fun-dark shadow-sm group-hover:scale-110 transition-transform">
                           <HelpCircle size={28} className="lg:size-10" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h3 className="font-sans font-extrabold text-xl md:text-2xl lg:text-3xl mb-2 text-fun-dark">Insegurança na escolha</h3>
                           <p className="text-zinc-600 font-medium leading-relaxed text-sm md:text-base lg:text-lg">
                              "Será que esse hotel é limpo? Fica longe do parque? O transfer busca a gente?"
                           </p>
                           <span className="inline-block mt-3 lg:mt-4 bg-fun-pink text-white text-xs lg:text-sm font-bold px-3 py-1 lg:px-4 lg:py-2 rounded-full border-2 border-fun-dark transform -rotate-1 shadow-sm">
                              ⚠️ Medo de errar
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Problem Card 2 */}
                  <div className="group bg-white p-6 lg:p-8 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 transform -rotate-1 h-full">
                     <div className="flex gap-5 lg:gap-8 items-start h-full">
                        <div className="flex-shrink-0 size-14 lg:size-20 rounded-xl bg-fun-yellow flex items-center justify-center text-fun-dark border-2 border-fun-dark shadow-sm group-hover:scale-110 transition-transform">
                           <X size={28} className="lg:size-10" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h3 className="font-sans font-extrabold text-xl md:text-2xl lg:text-3xl mb-2 text-fun-dark">Logística Complicada</h3>
                           <p className="text-zinc-600 font-medium leading-relaxed text-sm md:text-base lg:text-lg">
                              Conciliar horário de voo, check-in do hotel e dias de parque sem perder tempo é um quebra-cabeça chato.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Problem Card 3 - Spans 2 columns on tablet to center it */}
                  <div className="group bg-white p-6 lg:p-8 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition duration-300 transform rotate-1 md:col-span-2 lg:col-span-1 md:w-3/4 md:mx-auto lg:w-full">
                     <div className="flex gap-5 lg:gap-8 items-start h-full">
                        <div className="flex-shrink-0 size-14 lg:size-20 rounded-xl bg-blue-100 flex items-center justify-center text-fun-blue border-2 border-fun-dark shadow-sm group-hover:scale-110 transition-transform">
                           <AlertTriangle size={28} className="lg:size-10" strokeWidth={2.5} />
                        </div>
                        <div>
                           <h3 className="font-sans font-extrabold text-xl md:text-2xl lg:text-3xl mb-2 text-fun-dark">Surpresas no Pagamento</h3>
                           <p className="text-zinc-600 font-medium leading-relaxed text-sm md:text-base lg:text-lg">
                              Taxas escondidas, sites que travam na hora de pagar e parcelamentos com juros abusivos.
                           </p>
                        </div>
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </section>
   );
};

export default Problem;