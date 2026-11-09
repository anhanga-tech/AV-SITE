const SITE_ORIGIN = 'https://www.anhanga.tur.br';

// Política de `lastmod` (issue #1981):
// - Rotas estáticas: data à mão, atualizada no mesmo PR que muda o conteúdo renderizado
//   da rota (texto, headings, seções, metas). Refactor, lint, perf e fontes não contam.
//   Não derivar do git no build: CI e Cloudflare Pages clonam raso (fetch-depth 1), e aí
//   toda rota sairia com a data do build.
// - Páginas legais/LGPD (termos, privacidade, exclusão de dados) seguem o próprio ciclo
//   de revisão jurídica; não entram em atualizações em lote.
// - Posts do blog: `dateModified ?? date` do manifest. scripts/update-post-dates.mjs só
//   bumpa `dateModified` quando o corpo do MDX muda (scripts/post-date-diff.mjs). As datas
//   históricas infladas até set/2026 ficaram como estão (sem reescrita em massa).
export const STATIC_SITEMAP_ENTRIES = [
  {
    route: '/',
    lastmod: '2026-11-03',
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
    lastmod: '2026-11-05',
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
    route: '/hopi-hari',
    lastmod: '2026-11-05',
    changefreq: 'monthly',
    priority: '0.9'
  },
  {
    route: '/lollapalooza',
    lastmod: '2026-11-05',
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
    lastmod: '2026-11-05',
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
    lastmod: '2026-11-03',
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
    route: '/melhor-idade/pacotes-pastore',
    lastmod: '2026-11-03',
    changefreq: 'monthly',
    priority: '0.7'
  },
  {
    route: '/consultoria-de-viagem',
    lastmod: '2026-11-05',
    changefreq: 'monthly',
    priority: '0.9'
  },
  {
    route: '/cruzeiros',
    lastmod: '2026-11-03',
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
    lastmod: '2026-11-03',
    changefreq: 'monthly',
    priority: '0.7'
  },
  {
    route: '/sobre',
    lastmod: '2026-11-03',
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
    route: '/contato',
    lastmod: '2026-11-03',
    changefreq: 'yearly',
    priority: '0.6'
  },
  {
    route: '/parques-brasil',
    lastmod: '2026-10-13',
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
    route: '/creditos-de-imagens',
    lastmod: '2026-09-22',
    changefreq: 'monthly',
    priority: '0.3'
  },
  {
    route: '/mapa-do-site',
    lastmod: '2026-11-03',
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
