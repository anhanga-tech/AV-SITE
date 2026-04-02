import React, { useState, useEffect } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';
import { NAVIGATION_LINKS } from './constants';
import { WAITLIST_SECTION_ID } from './constants';
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';

const SITE_URL = 'https://www.anhanga.tur.br';

/**
 * Navbar com links de WhatsApp incluindo parâmetros de tracking.
 * Usa getWhatsAppLink() para capturar automaticamente UTMs, gclid, fbclid, ttclid, cid.
 */
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logoUrl = BRAND_LOGO_BLUE_URL;

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`} role="navigation" aria-label="Menu principal">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <a href={`${SITE_URL}/`} className="flex items-center" aria-label="Anhangá Viagens - Página Inicial">
          <img
            src={logoUrl}
            alt="Anhangá Viagens"
            width="154"
            height="80"
            className={`h-16 md:h-20 w-auto transition-all duration-300 ${!scrolled ? 'brightness-0 invert' : ''}`}
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAVIGATION_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`font-bold text-sm uppercase tracking-wide hover:text-anhanga-yellow transition-colors focus:outline-none focus:ring-2 focus:ring-anhanga-yellow rounded-sm px-2 ${scrolled ? 'text-gray-700' : 'text-white'}`}
            >
              {link.name}
            </a>
          ))}
          <a
            href={`#${WAITLIST_SECTION_ID}`}
            className="btn-whatsapp btn-specialist bg-anhanga-yellow text-anhanga-darkBlue px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-anhanga-yellowHover transition-colors shadow-md focus:outline-none focus:ring-4 focus:ring-anhanga-yellow/50"
            aria-label="Ir para a lista de espera"
            id="btn-lolla-waitlist-header"
            data-tracking="navbar-desktop-lolla-waitlist"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Lista de Espera
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-anhanga-yellow focus:outline-none focus:ring-2 focus:ring-anhanga-blue rounded p-1"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        >
          {isOpen ? <X size={32} className="text-gray-800" /> : <Menu size={32} color={scrolled ? '#0056D2' : '#FFD600'} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-xl py-6 flex flex-col items-center gap-6 md:hidden">
          {NAVIGATION_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-anhanga-darkBlue font-bold text-lg focus:outline-none focus:text-anhanga-yellow"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <a
            href={`#${WAITLIST_SECTION_ID}`}
            onClick={() => setIsOpen(false)}
            className="btn-whatsapp btn-specialist bg-anhanga-yellow text-anhanga-darkBlue px-8 py-3 rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-anhanga-yellow/50"
            id="btn-lolla-waitlist-mobile"
            data-tracking="navbar-mobile-lolla-waitlist"
          >
            Entrar na Lista
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
