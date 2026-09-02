import React, { useCallback, useId, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { getBlogHomeUrl } from '@/utils/blog';

import { NAV_LINKS, type HeaderSubLink } from './headerConfig';

type NavClickHandler = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;

interface SharedNavigationProps {
  isHome: boolean;
  navTextClass: string;
  onNavClick: NavClickHandler;
}

interface DesktopNavigationProps extends SharedNavigationProps {
  navGapClass: string;
}

interface NavDropdownProps extends SharedNavigationProps {
  link: { name: string; subLinks: HeaderSubLink[] };
}

interface MobileNavigationMenuProps extends SharedNavigationProps {
  isOpen: boolean;
  onCloseMenu: () => void;
  contactButton: React.ReactNode;
}

function isPageLink(href: string) {
  return href.startsWith('/');
}

function buildSectionHref(href: string, isHome: boolean) {
  return isHome ? `#${href}` : `/#${href}`;
}

// O submenu abria apenas por `group-hover`/`focus-within`. Como o painel fica
// `invisible` (visibility: hidden) enquanto fechado, seus links não são focáveis —
// logo `focus-within` nunca disparava e o teclado não alcançava nenhum sublink
// (falha de WCAG 2.1.1). Este disclosure dá ao gatilho comportamento de verdade,
// preservando a abertura por hover para quem usa mouse.
function NavDropdown({ link, isHome, navTextClass, onNavClick }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // O ponteiro já abriu o menu no `mouseenter`, então um clique logo em seguida
  // fecharia o que o usuário acabou de abrir. Com o ponteiro dentro, o clique
  // apenas confirma a abertura; sem ponteiro (teclado), alterna normalmente.
  const isPointerInside = useRef(false);
  const submenuId = useId();

  const close = useCallback((refocusTrigger = false) => {
    setIsOpen(false);
    if (refocusTrigger) triggerRef.current?.focus();
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => { isPointerInside.current = true; setIsOpen(true); }}
      // Só o ponteiro saindo não basta para fechar: se o foco está num sublink,
      // fechar o esconde (`visibility: hidden`) e o teclado perde a posição —
      // exatamente a regressão que esta mudança existe para corrigir. Quando o
      // foco sai, o `onBlur` abaixo fecha.
      onMouseLeave={(event) => {
        isPointerInside.current = false;
        if (!event.currentTarget.contains(document.activeElement)) close();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <button
        type="button"
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={submenuId}
        onClick={() => setIsOpen((open) => (isPointerInside.current ? true : !open))}
        onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
        className={`flex items-center gap-1 cursor-pointer font-medium text-sm transition-colors duration-500 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}
      >
        {link.name}
        <CaretDown
          className={`size-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          weight="bold"
        />
      </button>

      <div
        id={submenuId}
        className={`absolute top-full z-10 w-48 pt-4 transition duration-300 ${isOpen ? 'translate-y-0 opacity-100 visible' : 'translate-y-2 opacity-0 invisible'}`}
      >
        <div className="rounded-md border border-zinc-100 bg-white py-2 shadow-lg">
          {link.subLinks.map((subLink) => {
            const href = isPageLink(subLink.href)
              ? subLink.href
              : buildSectionHref(subLink.href, isHome);

            return (
              <a
                key={subLink.name}
                href={href}
                onClick={(event) => {
                  close();
                  if (!isPageLink(subLink.href) && isHome) {
                    onNavClick(event, subLink.href);
                  }
                }}
                onKeyDown={(event) => { if (event.key === 'Escape') close(true); }}
                className="block px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-anhanga-action focus-visible:-outline-offset-2"
              >
                {subLink.name}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const DesktopNavigation = React.memo(function DesktopNavigation({
  isHome,
  navGapClass,
  navTextClass,
  onNavClick,
}: DesktopNavigationProps) {
  return (
    <nav className={`hidden md:flex items-center ${navGapClass}`} aria-label="Menu Principal">
      {NAV_LINKS.map((link) =>
        link.subLinks ? (
          <NavDropdown
            key={link.name}
            link={{ name: link.name, subLinks: link.subLinks }}
            isHome={isHome}
            navTextClass={navTextClass}
            onNavClick={onNavClick}
          />
        ) : (
          <div key={link.name} className="relative">
            <a
              href={buildSectionHref(link.href!, isHome)}
              onClick={(event) => {
                if (isHome) {
                  onNavClick(event, link.href!);
                }
              }}
              className={`cursor-pointer font-medium text-sm transition-colors duration-500 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}
            >
              {link.name}
            </a>
          </div>
        ),
      )}

      <a
        href={getBlogHomeUrl()}
        className={`font-medium text-sm transition-colors duration-500 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}
      >
        Blog de Viagens
      </a>
    </nav>
  );
});

export const MobileNavigationMenu = React.memo(function MobileNavigationMenu({
  isHome,
  isOpen,
  onCloseMenu,
  onNavClick,
  contactButton,
}: MobileNavigationMenuProps) {
  // The element must always be present in the DOM so that the mobile toggle button's
  // aria-controls="mobile-menu" attribute always references a valid element.
  // Visibility is controlled via the hidden attribute instead of conditional rendering.
  return (
    <div
      id="mobile-menu"
      hidden={!isOpen}
      className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-6 flex flex-col gap-4 border-t border-zinc-100 text-zinc-800 animate-fade-in-down"
    >
      {NAV_LINKS.map((link) => {
        if (link.subLinks) {
          return link.subLinks.map((subLink) => {
            const href = isPageLink(subLink.href)
              ? subLink.href
              : buildSectionHref(subLink.href, isHome);

            return (
              <a
                key={subLink.name}
                href={href}
                className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
                onClick={(event) => {
                  if (!isPageLink(subLink.href) && isHome) {
                    onNavClick(event, subLink.href);
                  } else {
                    onCloseMenu();
                  }
                }}
              >
                {subLink.name}
              </a>
            );
          });
        }

        return (
          <a
            key={link.name}
            href={buildSectionHref(link.href!, isHome)}
            className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
            onClick={(event) => {
              if (isHome) {
                onNavClick(event, link.href!);
              } else {
                onCloseMenu();
              }
            }}
          >
            {link.name}
          </a>
        );
      })}

      <a
        href={getBlogHomeUrl()}
        className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
        onClick={onCloseMenu}
      >
        Blog de Viagens
      </a>

      {contactButton}
    </div>
  );
});
