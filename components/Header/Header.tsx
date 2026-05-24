import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { List, X, Phone } from '@phosphor-icons/react';
import { openContactModal } from '../../utils/contactForm';
import { DesktopNavigation, MobileNavigationMenu } from './HeaderNavigation';
import { SITE_URL } from './headerConfig';
import { BRAND_LOGO_BLUE_URL, BRAND_LOGO_WHITE_URL } from '../../lib/media-assets';
import { useScrolled } from './useScrolled';
import { useHeaderStyles } from './useHeaderStyles';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const isHome = location.pathname === '/';
  const isInternalPage = !isHome;
  const isScrolled = useScrolled();

  const {
    headerToneClass,
    headerSizeClass,
    logoHeightClass,
    navGapClass,
    actionGapClass,
    ctaPaddingClass,
    navTextClass,
    buttonClass,
    mobileToggleClass,
  } = useHeaderStyles(isScrolled, isInternalPage);

  const logoSrc = (isScrolled || isInternalPage) ? BRAND_LOGO_BLUE_URL : BRAND_LOGO_WHITE_URL;

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openContactModal({ source: 'header' });
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

  return (
    <header
      data-testid="site-header"
      data-header-variant={isInternalPage ? 'internal' : 'home'}
      className={`fixed top-0 w-full z-50 transition duration-500 ease-in-out ${headerToneClass} ${headerSizeClass}`}
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
          className="flex items-center gap-2 group rounded-lg p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
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
            className={`w-auto transition duration-300 object-contain ${logoHeightClass}`}
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
              href={isHome ? '#contato' : `${SITE_URL}/#contato`}
              aria-label="Fale Conosco"
              data-testid="desktop-fale-conosco-btn"
              data-tracking="navbar-desktop"
              onClick={handleContactClick}
              className={`btn-whatsapp btn-specialist rounded-full font-medium text-sm transition duration-500 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-vibrant ${ctaPaddingClass} ${buttonClass}`}
            >
              <Phone className="size-4" weight="fill" aria-hidden="true" />
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
            {isMobileMenuOpen ? <X className="size-6" weight="bold" aria-hidden="true" /> : <List className="size-6" weight="bold" aria-hidden="true" />}
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
