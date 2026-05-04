import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readRepoFile = async (relativePath: string): Promise<string> =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

function assertMissingHosts(content: string, hosts: string[], label: string): void {
  for (const host of hosts) {
    assert.equal(
      content.includes(host),
      false,
      `${label} should not reference ${host}`,
    );
  }
}

test('core static image sources should not rely on external image CDNs', async () => {
  const [mediaConfig, destinations, aboutPage, highlights, sitemap] = await Promise.all([
    readRepoFile('data/mediaConfig.ts'),
    readRepoFile('components/Destinations.tsx'),
    readRepoFile('pages/About.tsx'),
    readRepoFile('components/Highlights.tsx'),
    readRepoFile('public/sitemap.xml'),
  ]);

  assertMissingHosts(
    mediaConfig,
    ['images.pexels.com', 'res.cloudinary.com'],
    'data/mediaConfig.ts',
  );
  assert.match(mediaConfig, /images\/destinations\/orlando\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    destinations,
    ['images.pexels.com', 'res.cloudinary.com'],
    'components/Destinations.tsx',
  );
  assert.match(destinations, /getDestinationImage\("Beto Carrero"\)/);

  assertMissingHosts(
    aboutPage,
    ['images.pexels.com'],
    'pages/About.tsx',
  );
  assert.match(aboutPage, /images\/about\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    highlights,
    ['images.pexels.com'],
    'components/Highlights.tsx',
  );
  assert.match(highlights, /images\/highlights\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    sitemap,
    ['res.cloudinary.com'],
    'public/sitemap.xml',
  );
  assert.match(sitemap, /https:\/\/media\.anhanga\.tur\.br\/images\/about\/.+\.(jpg|jpeg|webp)/);
});

test('blog imagery should use the managed media origin', async () => {
  const [blogData, blogManifest, disney, europa, maldivas, carnaval] = await Promise.all([
    readRepoFile('data/blogData.ts'),
    readRepoFile('data/blogManifest.ts'),
    readRepoFile('content/blog/5-segredos-da-disney-que-ninguem-conta.mdx'),
    readRepoFile('content/blog/europa-gastronomica-roteiro-italia.mdx'),
    readRepoFile('content/blog/lua-de-mel-nas-maldivas.mdx'),
    readRepoFile('content/blog/destinos-carnaval-2026-brasil.mdx'),
  ]);

  assertMissingHosts(
    blogData,
    ['images.unsplash.com'],
    'data/blogData.ts',
  );
  assert.match(blogData, /images\/authors\/ana-souza\.(jpg|jpeg|webp)/);
  assert.match(blogData, /images\/authors\/rafa-tech\.(jpg|jpeg|webp)/);
  assert.match(blogData, /images\/authors\/mariana-s\.(jpg|jpeg|webp)/);
  assert.match(blogData, /images\/authors\/carlos-viajante\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    blogManifest,
    ['cdn1.parksmedia.wdprapps.disney.com', 'images.unsplash.com', 'blog.anhanga.tur.br'],
    'data/blogManifest.ts',
  );
  assert.match(blogManifest, /https:\/\/media\.anhanga\.tur\.br\/images\/blog\/5-segredos-disney\.(jpg|jpeg|webp)/);
  assert.match(blogManifest, /https:\/\/media\.anhanga\.tur\.br\/images\/blog\/europa-gastronomica-italia\.(jpg|jpeg|webp)/);
  assert.match(blogManifest, /https:\/\/media\.anhanga\.tur\.br\/images\/blog\/lua-de-mel-maldivas\.(jpg|jpeg|webp)/);
  assert.match(blogManifest, /https:\/\/media\.anhanga\.tur\.br\/images\/blog\/destinos-carnaval-2026\.(jpg|jpeg|webp)/);

  for (const [label, content] of [
    ['disney post', disney],
    ['europa post', europa],
    ['maldivas post', maldivas],
    ['carnaval post', carnaval],
  ] as const) {
    assertMissingHosts(
      content,
      ['cdn1.parksmedia.wdprapps.disney.com', 'images.unsplash.com', 'blog.anhanga.tur.br'],
      label,
    );
    assert.match(content, /image: "images\/blog\/.+\.(jpg|jpeg|webp)"/);
  }
});

test('orlando landing should not hotlink static images from partner websites', async () => {
  const orlandoApp = await readRepoFile('components/landings/orlando/OrlandoApp.tsx');

  assertMissingHosts(
    orlandoApp,
    [
      'seaworld.com/orlando',
      'images.unsplash.com',
      'visittheusa.com',
      'campinas.com.br',
      'encrypted-tbn0.gstatic.com',
      'cdn-imgix.headout.com',
      'cdn1.parksmedia.wdprapps.disney.com',
      'familytripmagazine.com.br',
      'frontdoormagicbreaks-huaycyfnhbh0e8h4.z03.azurefd.net',
      'upload.wikimedia.org',
      'universalorlando.com/webdata',
      'brasilturis.com.br',
      'static.wikia.nocookie.net',
      'images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com',
      's2-oglobo.glbimg.com',
      'bearsdenorlando.com',
    ],
    'components/landings/orlando/OrlandoApp.tsx',
  );
  assert.match(orlandoApp, /images\/orlando\/cards\/.+\.(jpg|jpeg|webp)/);
  assert.match(orlandoApp, /images\/orlando\/parks\/.+\.(jpg|jpeg|webp)/);
  assert.match(orlandoApp, /images\/orlando\/logos\/.+\.(png|svg|webp)/);
});

test('festival landings should use managed static imagery', async () => {
  const [hero, packageFeatures, lineup, venueMap, audience, whyUs, betoTestimonials] =
    await Promise.all([
      readRepoFile('components/landings/lollapalooza/Hero.tsx'),
      readRepoFile('components/landings/lollapalooza/PackageFeatures.tsx'),
      readRepoFile('components/landings/lollapalooza/LineupSection.tsx'),
      readRepoFile('components/landings/lollapalooza/VenueMap.tsx'),
      readRepoFile('components/landings/lollapalooza/Audience.tsx'),
      readRepoFile('components/landings/lollapalooza/WhyUs.tsx'),
      readRepoFile('components/landings/beto-carrero/Testimonials.tsx'),
    ]);

  assertMissingHosts(
    hero,
    ['images.pexels.com', 'logodownload.org'],
    'components/landings/lollapalooza/Hero.tsx',
  );
  assert.match(hero, /images\/lollapalooza\/hero\/.+\.(jpg|jpeg|webp)/);
  assert.match(hero, /images\/lollapalooza\/logos\/.+\.(png|svg|webp)/);

  assertMissingHosts(
    packageFeatures,
    ['mobilidade.estadao.com.br', 'images.unsplash.com', 'guiaviajarmelhor.com.br'],
    'components/landings/lollapalooza/PackageFeatures.tsx',
  );
  assert.match(packageFeatures, /images\/lollapalooza\/package\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    lineup,
    [
      'wsrv.nl',
      'images.unsplash.com',
      'upload.wikimedia.org',
      'rbsdirect.com.br',
      'jpimg.com.br',
      'monkeybuzz.com.br',
      'uploads.tenhomaisdiscosqueamigos.com',
      'conectageek.com.br',
      'akamai.sscdn.co',
      'gerenciador.popload.com.br',
    ],
    'components/landings/lollapalooza/LineupSection.tsx',
  );
  assert.match(lineup, /images\/lollapalooza\/lineup\/.+\.(jpg|jpeg|png|webp)/);

  assertMissingHosts(
    venueMap,
    ['wsrv.nl', 'images.unsplash.com'],
    'components/landings/lollapalooza/VenueMap.tsx',
  );
  assert.match(venueMap, /images\/lollapalooza\/venue\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    audience,
    ['picsum.photos'],
    'components/landings/lollapalooza/Audience.tsx',
  );
  assert.match(audience, /images\/lollapalooza\/audience\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    whyUs,
    ['eletrovibez.com'],
    'components/landings/lollapalooza/WhyUs.tsx',
  );
  assert.match(whyUs, /images\/lollapalooza\/why-us\/.+\.(jpg|jpeg|webp)/);

  assertMissingHosts(
    betoTestimonials,
    ['picsum.photos'],
    'components/landings/beto-carrero/Testimonials.tsx',
  );
  assert.match(betoTestimonials, /images\/beto-carrero\/testimonials\/.+\.(jpg|jpeg|webp)/);
});

test('home decorative textures should not hotlink grain overlays from third-party hosts', async () => {
  const [hero, destinations, indexHtml] = await Promise.all([
    readRepoFile('components/Hero.tsx'),
    readRepoFile('components/Destinations.tsx'),
    readRepoFile('index.html'),
  ]);

  assertMissingHosts(
    hero,
    ['grainy-gradients.vercel.app'],
    'components/Hero.tsx',
  );
  assert.match(hero, /assets\/noise\.svg|NOISE_TEXTURE_URL/);

  assertMissingHosts(
    destinations,
    ['grainy-gradients.vercel.app'],
    'components/Destinations.tsx',
  );
  assert.match(destinations, /assets\/noise\.svg|NOISE_TEXTURE_URL/);

  assertMissingHosts(
    indexHtml,
    ['grainy-gradients.vercel.app'],
    'index.html',
  );
});

test('remaining runtime media dependencies should use managed Cloudflare assets', async () => {
  const [testimonials, orlandoCss, lollapaloozaHero, seo, blogData, header, footer, lollaFooter, lollaNavbar, organizationSchema, articleSchema, sitemap, blogPost] = await Promise.all([
    readRepoFile('data/testimonialsData.ts'),
    readRepoFile('pages/landings/orlando.css'),
    readRepoFile('components/landings/lollapalooza/Hero.tsx'),
    readRepoFile('components/SEO.tsx'),
    readRepoFile('data/blogData.ts'),
    readRepoFile('components/Header/Header.tsx'),
    readRepoFile('components/Footer.tsx'),
    readRepoFile('components/landings/lollapalooza/Footer.tsx'),
    readRepoFile('components/landings/lollapalooza/Navbar.tsx'),
    readRepoFile('components/schemas/OrganizationSchema.tsx'),
    readRepoFile('components/schemas/ArticleSchema.tsx'),
    readRepoFile('public/sitemap.xml'),
    readRepoFile('content/blog/viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line.mdx'),
  ]);

  assertMissingHosts(
    testimonials,
    ['api.dicebear.com'],
    'data/testimonialsData.ts',
  );
  assert.match(testimonials, /getMediaUrl\('images\/testimonials\/daryw-m\.(svg|png|webp)'\)/);
  assert.match(testimonials, /getMediaUrl\('images\/testimonials\/rafa-gabi\.(svg|png|webp)'\)/);
  assert.match(testimonials, /getMediaUrl\('images\/testimonials\/william-s\.(svg|png|webp)'\)/);

  assertMissingHosts(
    orlandoCss,
    ['transparenttextures.com'],
    'pages/landings/orlando.css',
  );
  assert.match(orlandoCss, /https:\/\/media\.anhanga\.tur\.br\/images\/textures\/felt\.(png|webp)/);

  assertMissingHosts(
    lollapaloozaHero,
    ['videos.pexels.com'],
    'components/landings/lollapalooza/Hero.tsx',
  );
  assert.match(lollapaloozaHero, /videos\/lollapalooza\/hero\/crowd-background\.mp4/);

  for (const [label, content] of [
    ['components/SEO.tsx', seo],
    ['data/blogData.ts', blogData],
    ['components/Header/Header.tsx', header],
    ['components/Footer.tsx', footer],
    ['components/landings/lollapalooza/Footer.tsx', lollaFooter],
    ['components/landings/lollapalooza/Navbar.tsx', lollaNavbar],
    ['components/schemas/OrganizationSchema.tsx', organizationSchema],
    ['components/schemas/ArticleSchema.tsx', articleSchema],
    ['public/sitemap.xml', sitemap],
  ] as const) {
    assertMissingHosts(
      content,
      ['https://www.anhanga.tur.br/og-image-1200x630.jpg', 'https://www.anhanga.tur.br/logo.png', 'assets/LOGO ANHANGA VIAGENS', 'landing/beto-carrero/hero.jpg'],
      label,
    );
  }

  assert.match(seo, /DEFAULT_OG_IMAGE_URL/);
  assert.match(blogData, /BRAND_LOGO_PNG_URL/);
  assert.match(header, /BRAND_LOGO_(BLUE|WHITE)_URL/);
  assert.match(footer, /BRAND_LOGO_WHITE_URL/);
  assert.match(lollaFooter, /BRAND_LOGO_WHITE_URL/);
  assert.match(lollaNavbar, /BRAND_LOGO_BLUE_URL/);
  assert.match(organizationSchema, /BRAND_LOGO_BLUE_URL/);
  assert.match(articleSchema, /BRAND_LOGO_BLUE_URL/);
  assert.match(sitemap, /https:\/\/media\.anhanga\.tur\.br\/images\/og\/og-image-1200x630\.jpg/);
  assert.match(sitemap, /https:\/\/media\.anhanga\.tur\.br\/images\/beto-carrero\/landing\/firewhip\.jpg/);
  assert.match(blogPost, /image: "images\/blog\/blog-viagem-solo-feminina\.png"/);
});
