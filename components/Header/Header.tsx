import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, X, Phone, CaretDown } from '@phosphor-icons/react';
import { getBlogHomeUrl } from '@/utils/blog';
import { openAiChat } from '../../utils/aiChat';

const NAV_LINKS = [
  { name: 'Destinos', href: 'destinos' },
  {
    name: 'Sobre Nós',
    subLinks: [
      { name: 'A Anhangá', href: '/sobre/' },
      { name: 'Nossa História', href: '/sobre/#nossa-historia' },
      { name: 'Como Funciona', href: 'como-funciona' },
      { name: 'Depoimentos', href: 'depoimentos' },
    ],
  },
  { name: 'Contato', href: 'contato' },
];

const SITE_URL = 'https://www.anhanga.tur.br';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const location = useLocation();
  const isHome = location.pathname === '/';

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

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
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

  const forceWhiteHeader = !isHome;
  const headerClass = isScrolled || forceWhiteHeader
    ? 'bg-white/90 backdrop-blur-md shadow-lg py-3 text-brand-dark'
    : 'bg-transparent py-6 text-white';

  const baseUrl = import.meta.env.BASE_URL;
  const logoSrc = isScrolled || forceWhiteHeader
    ? `${baseUrl}assets/LOGO ANHANGA VIAGENS - AZUL.svg`
    : `${baseUrl}assets/LOGO ANHANGA VIAGENS - BRANCO.svg`;

  const navTextClass = isScrolled || forceWhiteHeader ? 'text-gray-600 hover:text-brand-vibrant' : 'text-white/90 hover:text-white';
  const buttonClass = isScrolled || forceWhiteHeader
    ? 'bg-brand-vibrant hover:bg-brand-blue text-white'
    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30';
  const mobileToggleClass = isScrolled || forceWhiteHeader ? 'text-gray-700' : 'text-white';

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${headerClass}`}
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
          className="flex items-center gap-2 group focus:outline-none rounded-lg p-1"
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
            className="h-24 w-auto transition-all duration-300 object-contain"
          />
        </a>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8" aria-label="Menu Principal">
            {NAV_LINKS.map((link) => (
              <div
                key={link.name}
                className="relative"
                onMouseEnter={() => link.subLinks && setActiveDropdown(link.name)}
                onMouseLeave={() => link.subLinks && setActiveDropdown(null)}
              >
                {link.subLinks ? (
                  <button className={`flex items-center gap-1 font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus:underline decoration-2 underline-offset-4 cursor-pointer ${navTextClass}`}>
                    {link.name}
                    <CaretDown className="w-4 h-4" weight="bold" />
                  </button>
                ) : (
                  isHome ? (
                    <a
                      href={`#${link.href}`}
                      onClick={(e) => handleNavClick(e, link.href!)}
                      className={`font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus:underline decoration-2 underline-offset-4 cursor-pointer ${navTextClass}`}
                    >
                      {link.name}
                    </a>
                  ) : (
                    <a
                      href={`${SITE_URL}/#${link.href}`}
                      className={`font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus:underline decoration-2 underline-offset-4 cursor-pointer ${navTextClass}`}
                    >
                      {link.name}
                    </a>
                  )
                )}

                {link.subLinks && activeDropdown === link.name && (
                  <div className="absolute top-full pt-4 w-48 z-10">
                    <div className="bg-white rounded-md shadow-lg py-2 animate-fade-in-down">
                      {link.subLinks.map((subLink) => {
                        const isPage = subLink.href.startsWith('/');
                        const href = isPage ? `${SITE_URL}${subLink.href}` : (isHome ? `#${subLink.href}` : `${SITE_URL}/#${subLink.href}`);
                        return (
                          <a
                            key={subLink.name}
                            href={href}
                            onClick={(e) => {
                              if (!isPage && isHome) {
                                handleNavClick(e, subLink.href);
                              }
                              setActiveDropdown(null);
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {subLink.name}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <a
              href={getBlogHomeUrl()}
              className={`font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus:underline decoration-2 underline-offset-4 ${navTextClass}`}
            >
              Blog de Viagens
            </a>
          </nav>

          <div className="hidden md:block">
            <button
              type="button"
              aria-label="Fale Conosco"
              data-testid="desktop-fale-conosco-btn"
              data-tracking="navbar-desktop"
              onClick={handleContactClick}
              className={`btn-whatsapp btn-specialist px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-500 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-vibrant ${buttonClass}`}
            >
              <Phone className="w-4 h-4" weight="fill" />
              Fale Conosco
            </button>
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

      {isMobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-6 flex flex-col gap-4 border-t border-gray-100 text-gray-800 animate-fade-in-down">
          {NAV_LINKS.map((link) => {
            if (link.subLinks) {
              return link.subLinks.map((subLink) => {
                const isPage = subLink.href.startsWith('/');
                const href = isPage ? `${SITE_URL}${subLink.href}` : (isHome ? `#${subLink.href}` : `${SITE_URL}/#${subLink.href}`);
                return (
                  <a
                    key={subLink.name}
                    href={href}
                    className="text-gray-700 font-medium py-2 border-b border-gray-50 focus:text-brand-vibrant focus:outline-none"
                    onClick={(e) => {
                      if (!isPage && isHome) {
                        handleNavClick(e, subLink.href);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {subLink.name}
                  </a>
                );
              });
            }

            return isHome ? (
              <a
                key={link.name}
                href={`#${link.href}`}
                className="text-gray-700 font-medium py-2 border-b border-gray-50 focus:text-brand-vibrant focus:outline-none"
                onClick={(e) => handleNavClick(e, link.href!)}
              >
                {link.name}
              </a>
            ) : (
              <a
                key={link.name}
                href={`${SITE_URL}/#${link.href}`}
                className="text-gray-700 font-medium py-2 border-b border-gray-50 focus:text-brand-vibrant focus:outline-none"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            );
          })}
          <a
            href={getBlogHomeUrl()}
            className="text-gray-700 font-medium py-2 border-b border-gray-50 focus:text-brand-vibrant focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Blog de Viagens
          </a>
          <button
            type="button"
            data-testid="mobile-fale-conosco-btn"
            data-tracking="navbar-mobile"
            className="btn-whatsapp btn-specialist bg-brand-vibrant text-center text-white px-5 py-3 rounded-lg font-bold mt-2 focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark focus:outline-none flex justify-center items-center gap-2"
            onClick={handleContactClick}
          >
            Fale Conosco
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
