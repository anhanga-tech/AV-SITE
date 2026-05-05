import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { List, X, Phone } from '@phosphor-icons/react';
import { openAiChat } from '../../utils/aiChat';
import { DesktopNavigation, MobileNavigationMenu } from './HeaderNavigation';
import { SITE_URL } from './headerConfig';
import { BRAND_LOGO_BLUE_URL, BRAND_LOGO_WHITE_URL } from '../../lib/media-assets';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const isHome = location.pathname === '/';
  const isInternalPage = !isHome;
  const useSolidHeader = isScrolled || isInternalPage;

  const headerToneClass = useSolidHeader
    ? 'bg-white/90 text-brand-dark backdrop-blur-md shadow-lg'
    : 'bg-transparent text-white';

  const headerSizeClass = isInternalPage
    ? 'py-2 md:py-2.5'
    : isScrolled
      ? 'py-3'
      : 'py-6';

  const logoHeightClass = isInternalPage ? 'h-12 md:h-16' : 'h-24';
  const navGapClass = isInternalPage ? 'gap-6' : 'gap-8';
  const actionGapClass = isInternalPage ? 'gap-5' : 'gap-8';
  const ctaPaddingClass = isInternalPage ? 'px-4 py-2' : 'px-5 py-2.5';

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openAiChat({
      message: 'Olá! Gostaria de falar com um especialista.'
    });
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isHome) {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsMobileMenuOpen(false);
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  const logoSrc = useSolidHeader
    ? BRAND_LOGO_BLUE_URL
    : BRAND_LOGO_WHITE_URL;

  const navTextClass = useSolidHeader ? 'text-gray-600 hover:text-brand-vibrant' : 'text-white/90 hover:text-white';
  const buttonClass = useSolidHeader
    ? 'bg-brand-vibrant hover:bg-brand-blue text-white'
    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30';
  const mobileToggleClass = useSolidHeader ? 'text-gray-700' : 'text-white';

  return (
    <header
      data-testid="site-header"
      data-header-variant={isInternalPage ? 'internal' : 'home'}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${headerToneClass} ${headerSizeClass}`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-brand-vibrant text-white px-4 py-2 rounded-md z-[70] font-bold shadow-lg"
      >
        Pular para o conteúdo
      </a>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a
          href={`${SITE_URL}/`}
          className="flex items-center gap-2 group rounded-lg p-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
          aria-label="Anhangá Viagens - Ir para o topo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img
            src={logoSrc}
            alt="Anhangá Viagens"
            data-testid="header-logo"
            fetchPriority="high"
            width="185"
            height="96"
            className={`w-auto transition-all duration-300 object-contain ${logoHeightClass}`}
          />
        </a>

        <div className={`flex items-center ${actionGapClass}`}>
          <DesktopNavigation
            isHome={isHome}
            navGapClass={navGapClass}
            navTextClass={navTextClass}
            onNavClick={handleNavClick}
          />

          <div className="hidden md:block">
            <a
              href="#contato"
              aria-label="Fale Conosco"
              data-testid="desktop-fale-conosco-btn"
              data-tracking="navbar-desktop"
              onClick={(e) => handleNavClick(e, 'contato')}
              className={`btn-whatsapp btn-specialist rounded-full font-medium text-sm transition-all duration-500 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-vibrant ${ctaPaddingClass} ${buttonClass}`}
            >
              <Phone className="w-4 h-4" weight="fill" />
              Fale Conosco
            </a>
          </div>

          <button
            className={`md:hidden p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow transition-colors duration-500 ${mobileToggleClass}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" weight="bold" /> : <List className="w-6 h-6" weight="bold" />}
          </button>
        </div>
      </div>

      <MobileNavigationMenu
        isHome={isHome}
        isOpen={isMobileMenuOpen}
        navTextClass={navTextClass}
        onCloseMenu={() => setIsMobileMenuOpen(false)}
        onNavClick={handleNavClick}
        contactButton={(
          <button
            type="button"
            data-testid="mobile-fale-conosco-btn"
            data-tracking="navbar-mobile"
            className="btn-whatsapp btn-specialist bg-brand-vibrant text-center text-white px-5 py-3 rounded-lg font-bold mt-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark focus:outline-none flex justify-center items-center gap-2"
            onClick={handleContactClick}
          >
            Fale Conosco
          </button>
        )}
      />
    </header>
  );
};

export default Header;
