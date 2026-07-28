const SITE_ORIGIN = 'https://www.anhanga.tur.br';

export const STATIC_SITEMAP_ENTRIES = [
  {
    route: '/',
    lastmod: '2026-05-24',
    changefreq: 'weekly',
    priority: '1.0',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/og/og-image-1200x630.jpg',
        caption: 'Anhangá Viagens - Agência de Viagens Personalizadas em São Paulo'
      }
    ]
  },
  {
    route: '/beto-carrero',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.9',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/categories/beto-carrero-world.jpg',
        caption: 'Pacotes para o Beto Carrero World - Anhangá Viagens'
      },
      {
        loc: 'https://media.anhanga.tur.br/images/beto-carrero/landing/firewhip.jpg',
        caption: 'Montanha-russa FireWhip no Beto Carrero World'
      }
    ]
  },
  {
    route: '/lollapalooza',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.9',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/categories/lollapalooza-2026.webp',
        caption: 'Lollapalooza Brasil 2027 - Lista de Espera | Anhangá Viagens'
      }
    ]
  },
  {
    route: '/orlando',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.9',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/orlando/universal-studios-orlando.jpg',
        caption: 'Pacotes para Orlando e Disney World - Anhangá Viagens'
      }
    ]
  },
  {
    route: '/melhor-idade',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.9',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/og/og-image-1200x630.jpg',
        caption: 'Pacotes de Viagem para Melhor Idade 50+ - Anhangá Viagens'
      }
    ]
  },
  {
    route: '/consultoria-de-viagem',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.9'
  },
  {
    route: '/cruzeiros',
    lastmod: '2026-07-16',
    changefreq: 'monthly',
    priority: '0.8'
  },
  {
    // noindex: página de conversão com conteúdo fino (auditoria SEO jun/2026).
    // Mantida aqui para continuar no prerender; excluída do sitemap.xml.
    route: '/quiz',
    lastmod: '2026-05-21',
    changefreq: 'monthly',
    priority: '0.6',
    noindex: true
  },
  {
    route: '/corporativo',
    lastmod: '2026-05-29',
    changefreq: 'monthly',
    priority: '0.7'
  },
  {
    route: '/sobre',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.7',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/about/equipe-anhanga.jpg',
        caption: 'Equipe da Anhangá Viagens - Agência de Viagens em São Paulo'
      }
    ]
  },
  {
    route: '/parques-brasil',
    lastmod: '2026-07-28',
    changefreq: 'monthly',
    priority: '0.8',
    images: [
      {
        loc: 'https://media.anhanga.tur.br/images/categories/beto-carrero-world.jpg',
        caption: 'Parques do Brasil - Beto Carrero, Hopi Hari e parques aquáticos | Anhangá Viagens'
      }
    ]
  },
  {
    route: '/termos-de-uso',
    lastmod: '2026-05-18',
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    route: '/politica-privacidade',
    lastmod: '2026-05-18',
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    route: '/exclusao-de-dados',
    lastmod: '2026-06-03',
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    route: '/mapa-do-site',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.4'
  },
  {
    route: '/blog',
    lastmod: '2026-05-24',
    changefreq: 'weekly',
    priority: '0.8'
  }
];

export const NOINDEX_ROUTES = ['/nps', '/quiz'];

export function routeToCanonicalUrl(route) {
  const normalizedRoute = route === '/' ? '/' : `/${route.replace(/^\/+|\/+$/g, '')}/`;
  return `${SITE_ORIGIN}${normalizedRoute}`;
}
