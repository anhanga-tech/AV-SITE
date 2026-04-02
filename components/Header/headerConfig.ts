export type HeaderSubLink = {
  name: string;
  href: string;
};

export type HeaderLink = {
  name: string;
  href?: string;
  subLinks?: HeaderSubLink[];
};

export const NAV_LINKS: HeaderLink[] = [
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

export const SITE_URL = 'https://www.anhanga.tur.br';
