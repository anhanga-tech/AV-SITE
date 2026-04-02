import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', title: 'Agência de Viagens em São Paulo | Roteiros Feitos do Zero', description: 'Agência boutique em São Paulo. Não trabalhamos com pacote pronto — cada roteiro começa do zero, pensado pro seu jeito de viajar. Orlando, Beto Carrero, Europa e muito mais. Orçamento gratuito.' },
  { path: '/orlando/', title: 'Pacotes para Orlando 2026: Roteiro Disney e Universal', description: 'Planeje sua viagem para Orlando 2026 com roteiro personalizado, ingressos e hospedagem. Atendimento especializado por agência boutique em São Paulo.' },
  { path: '/beto-carrero/', title: 'Pacote Beto Carrero 2026 | Diversão para toda a Família', description: 'Planeje sua viagem para o Beto Carrero World 2026 com hotel, ingressos e transporte inclusos. Suporte especializado da Anhangá Viagens para uma experiência em família inesquecível.' },
  { path: '/lollapalooza/', title: 'Lollapalooza Brasil: 2026 Esgotado, Lista de Espera 2027', description: 'A campanha do Lollapalooza 2026 foi encerrada com sucesso. Entre na lista de espera 2027 para receber prioridade quando os próximos pacotes abrirem.' },
  { path: '/termos-de-uso/', title: 'Termos e Condições de Uso', description: 'Termos e Condições de Uso da Anhangá Turismo: intermediação, simulações, responsabilidade e privacidade.' },
  { path: '/politica-privacidade/', title: 'Política de Privacidade', description: 'Política de Privacidade e Proteção de Dados da Anhangá Turismo: coleta, tratamento, armazenamento e direitos dos titulares.' },
  { path: '/mapa-do-site/', title: 'Mapa do Site', description: 'Navegue pelas principais páginas da Anhangá Viagens, incluindo landings, blog e páginas institucionais.' },
  { path: '/blog/', title: 'Blog de Viagens e Dicas Práticas', description: 'Roteiros práticos, dicas de insider e destinos que valem cada centavo. Planejamento de viagem do jeito que deveria ser. Leia no blog da Anhangá!' }
];

test.describe('SEO Smoke Check', () => {
  for (const route of routes) {
    test(`Checking SEO for ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      const siteName = "Anhangá Viagens";
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const expectedTitle = normalize(route.title).includes(normalize(siteName)) ? route.title : route.title + " | " + siteName;

      // Title
      await expect(page).toHaveTitle(expectedTitle);

      // Description
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBe(route.description);

      // Canonical
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      const expectedCanonical = `https://www.anhanga.tur.br${route.path}`;
      expect(canonical).toBe(expectedCanonical);

      // H1 Count
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // H1 Visibility
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Robots
      const robots = await page.locator('meta[name="robots"]').count();
      if (robots > 0) {
        const robotsContent = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robotsContent).not.toContain('noindex');
      }
    });
  }
});
