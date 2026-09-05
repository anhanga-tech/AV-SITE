import React, { useState, useEffect, useRef } from 'react';
import Hero from './Hero';
import Problem from './Problem';
import Solution from './Solution';
import Attractions from './Attractions';
import Features from './Features';
import Testimonials from './Testimonials';
import Footer from './Footer';
import Button from './Button';
import { Menu, X } from 'lucide-react';
import { getBetoAssetUrl } from './assetPath';
import BetoCarreroFaq from './BetoCarreroFaq';

const NAV_LINKS = [
  { name: 'O Perrengue', href: '#problem' },
  { name: 'A Solução', href: '#solution' },
  { name: 'Atrações', href: '#attractions' },
  { name: 'Depoimentos', href: '#testimonials' },
  { name: 'Dúvidas', href: '#faq' },
];

const App: React.FC = () => {
  const [showSticky, setShowSticky] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showStickyRef = useRef(false);
  const isScrolledRef = useRef(false);
  const handleScrollRef = useRef<() => void>(() => {
    // Throttle: só executa a cada 16ms (~60fps)
    if (throttleTimeoutRef.current) return;

    throttleTimeoutRef.current = setTimeout(() => {
      throttleTimeoutRef.current = null;
      const scrollY = window.scrollY;


      // Só atualiza estado se realmente mudou para evitar re-renders desnecessários
      const newShowSticky = scrollY > 600;
      const newIsScrolled = scrollY > 20;

      // Verifica se o estado realmente precisa mudar usando refs
      if (newShowSticky !== showStickyRef.current) {
        setShowSticky(newShowSticky);
        showStickyRef.current = newShowSticky;
      }

      if (newIsScrolled !== isScrolledRef.current) {
        setIsScrolled(newIsScrolled);
        isScrolledRef.current = newIsScrolled;
      }
    }, 16);
  });

  // Atualiza refs quando estado muda para usar valores atuais no handler
  useEffect(() => {
    showStickyRef.current = showSticky;
  }, [showSticky]);

  useEffect(() => {
    isScrolledRef.current = isScrolled;
  }, [isScrolled]);

  useEffect(() => {
    const handleScroll = () => handleScrollRef.current();

    // Usa passive listener para melhor performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    const throttleTimeout = throttleTimeoutRef;

    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
        throttleTimeout.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = NAV_LINKS;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-fun-pink selection:text-white pt-[84px] md:pt-[132px]">

      {/* 
         Header Changes:
         1. Fixed instead of Sticky for consistent overlay.
         2. Always has border-b-4 (thick border).
         3. Shadow appears only on scroll (shadow-hard).
      */}
      <nav
        className={`fixed top-0 left-0 right-0 bg-white border-fun-dark z-50 transition-[padding,box-shadow] duration-300 ease-in-out border-b-4 ${isScrolled
          ? 'py-3 shadow-hard' // Scrolled: Compact padding, Solid Shadow
          : 'py-5 md:py-6 shadow-none' // Top: Spacious, No shadow
          }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center relative">

          {/* Logo Area */}
          <a
            href="/"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              handleLinkClick();
            }}
            className="focus:outline-none focus:ring-4 focus:ring-fun-blue focus:ring-offset-2 rounded-lg px-2 -ml-2 block group relative z-50"
            aria-label="Anhangá Viagens Home"
          >
            <img
              src={getBetoAssetUrl('LOGO ANHANGA VIAGENS - AZUL.svg')}
              alt="Anhangá Viagens"
              width="154"
              height="80"
              fetchPriority="high"
              className={`transition-[height] duration-300 w-auto ${isScrolled ? 'h-9 md:h-16' : 'h-10 md:h-20'}`}
            />
          </a>
          <div className="hidden lg:flex items-center gap-8 xl:gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative group font-sans font-bold text-fun-dark text-lg hover:text-fun-pink transition-colors py-2"
              >
                {link.name}
                {/* Scribble Underline Effect */}
                <svg
                  className="absolute bottom-0 left-0 w-full h-3 text-fun-yellow opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </a>
            ))}
          </div>

          {/* CTA Button (Desktop) & Mobile Toggle */}
          <div className="flex items-center gap-4">

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Button
                text="Falar no WhatsApp"
                variant="secondary"
                icon={true}
                className={`transition-[padding,font-size,line-height,transform,box-shadow] duration-300 ${isScrolled ? 'py-1 px-3 text-xs lg:py-1.5 lg:px-4 lg:text-sm' : 'py-1.5 px-4 text-sm lg:py-2 lg:px-5 lg:text-base'}`}
                tooltip="Atendimento rápido"
                tooltipPosition="bottom"
                dataTracking="navbar-desktop-betocarrero"
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="lg:hidden relative z-50 p-2 text-fun-dark hover:bg-zinc-100 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-fun-blue"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X size={32} strokeWidth={2.5} /> : <Menu size={32} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <div className={`absolute top-full left-0 w-full bg-white border-b-4 border-fun-dark shadow-hard p-6 flex flex-col gap-6 lg:hidden transition duration-300 origin-top ${mobileMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={handleLinkClick}
                className="font-sans font-bold text-2xl text-fun-dark text-center py-2 border-b-2 border-dashed border-zinc-200 active:text-fun-pink"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2">
              <Button text="Falar no WhatsApp" variant="secondary" fullWidth={true} onClick={handleLinkClick} dataTracking="navbar-mobile-betocarrero" />
            </div>
          </div>

        </div>
      </nav>

      <main className="flex-grow">
        <div id="hero"><Hero /></div>
        {/* Added scroll-mt (scroll margin top) to offset the fixed header */}
        <div id="problem" className="scroll-mt-32 md:scroll-mt-48"><Problem /></div>
        <div id="solution" className="scroll-mt-32 md:scroll-mt-48"><Solution /></div>
        <div id="attractions" className="scroll-mt-32 md:scroll-mt-48"><Attractions /></div>
        <Features />
        <div id="testimonials" className="scroll-mt-32 md:scroll-mt-48"><Testimonials /></div>
        <div id="faq" className="scroll-mt-32 md:scroll-mt-48"><BetoCarreroFaq /></div>
      </main>

      <Footer />

      {/* Mobile/Sticky CTA */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t-4 border-fun-dark transition-transform duration-300 z-50 md:hidden ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <Button text="Quero meu Pacote" fullWidth={true} tooltip="Clique para iniciar" variant="secondary" dataTracking="sticky-mobile-betocarrero" />
      </div>

      {/* Desktop Sticky Bubble */}
      <div className={`fixed bottom-8 right-8 transition duration-500 z-50 hidden xl:block ${showSticky ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <Button text="Orçamento Rápido" tooltip="Receba em poucos minutos" dataTracking="sticky-desktop-betocarrero" />
      </div>

    </div>
  );
};

export default App;
