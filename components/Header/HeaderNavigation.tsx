import React from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { getBlogHomeUrl } from '@/utils/blog';

import { NAV_LINKS, SITE_URL } from './headerConfig';

type NavClickHandler = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;

interface SharedNavigationProps {
  isHome: boolean;
  navTextClass: string;
  onNavClick: NavClickHandler;
}

interface DesktopNavigationProps extends SharedNavigationProps {
  navGapClass: string;
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
  return isHome ? `#${href}` : `${SITE_URL}/#${href}`;
}

export function DesktopNavigation({
  isHome,
  navGapClass,
  navTextClass,
  onNavClick,
}: DesktopNavigationProps) {
  return (
    <nav className={`hidden md:flex items-center ${navGapClass}`} aria-label="Menu Principal">
      {NAV_LINKS.map((link) => (
        <div key={link.name} className="relative group">
          {link.subLinks ? (
            <>
              <button type="button" className={`flex items-center gap-1 cursor-pointer font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}>
                {link.name}
                <CaretDown className="size-4 transition-transform duration-300 group-hover:rotate-180" weight="bold" />
              </button>

              <div className="absolute top-full z-10 w-48 translate-y-2 pt-4 opacity-0 invisible transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:visible focus-within:translate-y-0 focus-within:opacity-100 focus-within:visible">
                <div className="rounded-md border border-zinc-100 bg-white py-2 shadow-lg">
                  {link.subLinks.map((subLink) => {
                    const href = isPageLink(subLink.href)
                      ? `${SITE_URL}${subLink.href}`
                      : buildSectionHref(subLink.href, isHome);

                    return (
                      <a
                        key={subLink.name}
                        href={href}
                        onClick={(event) => {
                          if (!isPageLink(subLink.href) && isHome) {
                            onNavClick(event, subLink.href);
                          }
                        }}
                        className="block px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        {subLink.name}
                      </a>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <a
              href={buildSectionHref(link.href!, isHome)}
              onClick={(event) => {
                if (isHome) {
                  onNavClick(event, link.href!);
                }
              }}
              className={`cursor-pointer font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}
            >
              {link.name}
            </a>
          )}
        </div>
      ))}

      <a
        href={getBlogHomeUrl()}
        className={`font-medium text-sm transition-colors duration-500 hover:opacity-80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 rounded ${navTextClass}`}
      >
        Blog de Viagens
      </a>
    </nav>
  );
}

export function MobileNavigationMenu({
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
              ? `${SITE_URL}${subLink.href}`
              : buildSectionHref(subLink.href, isHome);

            return (
              <a
                key={subLink.name}
                href={href}
                className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
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
            className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
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
        className="text-zinc-700 font-medium py-3 border-b border-zinc-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-vibrant focus-visible:outline-offset-1 rounded"
        onClick={onCloseMenu}
      >
        Blog de Viagens
      </a>

      {contactButton}
    </div>
  );
}
