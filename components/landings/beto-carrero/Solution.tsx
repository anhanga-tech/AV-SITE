import React, { useState } from 'react';
import { SolutionChecklist } from './SolutionChecklist';
import { SolutionPhoneMockup } from './SolutionPhoneMockup';
import { DestinationsModal } from './DestinationsModal';

const Solution: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <SolutionChecklist onOpenModal={() => setIsModalOpen(true)} />
          <SolutionPhoneMockup />
        </div>
      </div>

      <DestinationsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </section>
  );
};

export default Solution;
