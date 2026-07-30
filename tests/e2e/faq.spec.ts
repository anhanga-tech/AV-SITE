import { test, expect } from '@playwright/test';

test.describe('Landing Page FAQ Suite', () => {
  const landingPages = [
    {
      path: '/orlando',
      title: 'Dúvidas Frequentes',
      firstQuestion: 'Qual a melhor época para viajar para Orlando?',
      firstAnswerFragment: 'maio, setembro'
    },
    {
      // Pele fun-yellow própria (BetoCarreroFaq.tsx), não a genérica LandingFAQ.
      path: '/beto-carrero',
      title: 'Dúvidas? Relaxa.',
      firstQuestion: 'Quanto custa em média um pacote para o Beto Carrero?',
      firstAnswerFragment: 'R$ 1.200'
    },
    {
      path: '/lollapalooza',
      title: 'Dúvidas Frequentes',
      firstQuestion: 'Os pacotes para o Lollapalooza 2026 estão esgotados?',
      firstAnswerFragment: 'campanha de pacotes 2026 foi encerrada'
    },
    {
      path: '/melhor-idade',
      title: 'Dúvidas Frequentes',
      firstQuestion: 'O que define uma viagem para a melhor idade na Anhangá?',
      firstAnswerFragment: 'curadoria de experiências que valorizam a cultura'
    },
  ];

  for (const landing of landingPages) {
    test(`should display FAQ correctly on ${landing.path}`, async ({ page }) => {
      await page.goto(landing.path);

      // Check if FAQ section title is visible
      await expect(page.getByText(landing.title, { exact: true })).toBeVisible();

      // Check if the first question is visible
      const question = page.getByText(landing.firstQuestion);
      await expect(question).toBeVisible();

      // By default the first item is open (openIndex = 0 in useFaqAccordion.ts)
      // Verify the answer panel is expanded and its text is visible
      await expect(page.getByText(landing.firstAnswerFragment, { exact: false })).toBeVisible();

      // Check for Schema.org JSON-LD
      const script = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts =>
        scripts.find(s => s.innerHTML.includes('FAQPage'))
      );
      expect(script).toBeTruthy();
    });
  }

  /*
    Guards da unificação do FAQ (useFaqAccordion.ts): a PR #1352 corrigiu o
    aria-hidden só em OrlandoFAQ.tsx (coberto por orlando-a11y.spec.ts) e o
    bug nunca chegou em LandingFAQ.tsx, usada por estas outras páginas. Com o
    hook compartilhado, a amarração ARIA vem de um lugar só — este teste prova
    isso para uma página que usa a pele padrão (Melhor Idade) e uma que usa a
    pele fun-yellow própria (Beto Carrero — BetoCarreroFaq.tsx).

    Seleciona a aba pelo texto da pergunta e resolve o painel via
    aria-controls, em vez de um id fixo: useFaqAccordion.ts prefixa os ids
    com useId() (review do Codex na #1363) para não colidir se uma página
    futura montar dois accordions ao mesmo tempo — um id fixo aqui quebraria
    a cada mudança no prefixo gerado.
  */
  const landingFaqPages = [
    { path: '/melhor-idade', secondQuestion: 'A agência oferece acompanhamento durante a viagem?' },
    { path: '/beto-carrero', secondQuestion: 'Qual a idade recomendada para visitar o parque?' },
  ];

  for (const { path, secondQuestion } of landingFaqPages) {
    test(`a resposta fechada do FAQ sai da árvore de acessibilidade em ${path}`, async ({ page }) => {
      await page.goto(path);

      // O primeiro item vem aberto por padrão — testa o segundo, que começa fechado.
      const abaFechada = page.getByRole('button', { name: secondQuestion });
      await expect(abaFechada).toHaveAttribute('aria-expanded', 'false');

      // useId() gera ids com ":" (ex.: ":r0:-faq-panel-1"), que quebram como
      // seletor CSS de id sem escapar — [id="..."] trata o valor como string
      // literal, sem esse problema.
      const panelId = await abaFechada.getAttribute('aria-controls');
      const painelFechado = page.locator(`[id="${panelId}"]`);
      await expect(painelFechado).toHaveAttribute('aria-hidden', 'true');

      await abaFechada.click();
      await expect(painelFechado).toHaveAttribute('aria-hidden', 'false');
      await expect(abaFechada).toHaveAttribute('aria-expanded', 'true');
    });
  }

  /*
    Antes da unificação, BetoCarreroApp renderizava um accordion interno
    próprio (Faq.tsx, com perguntas sobre ingresso/datas/Balneário/
    cancelamento) e BetoCarreroLanding.tsx renderizava um SEGUNDO LandingFAQ
    depois do rodapé, com um conjunto de perguntas totalmente diferente
    (custo/idade/estacionamento/duração) — só esse segundo era descrito pelo
    FAQPageSchema. As duas listas de perguntas foram mescladas numa só
    (betoFaqItems.ts): prova que sobra um FAQ só, com as 8 perguntas, e que o
    schema agora descreve todas — não só metade.
  */
  test('/beto-carrero renderiza um FAQ só, com as perguntas mescladas cobertas pelo schema', async ({ page }) => {
    await page.goto('/beto-carrero');

    await expect(page.getByRole('heading', { name: 'Dúvidas? Relaxa.' })).toHaveCount(1);

    // Uma pergunta de cada conjunto original — prova que os dois foram
    // mesclados num accordion só, não que um substituiu o outro.
    await expect(page.getByText('Qual a idade recomendada para visitar o parque?')).toHaveCount(1);
    await expect(page.getByText('Os pacotes incluem ingresso do Beto Carrero?')).toHaveCount(1);

    const faqSchema = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
      const match = scripts.find((s) => s.innerHTML.includes('FAQPage'));
      return match ? JSON.parse(match.innerHTML) : null;
    });
    expect(faqSchema?.mainEntity).toHaveLength(8);

    const schemaQuestions = faqSchema.mainEntity.map((entry: { name: string }) => entry.name);
    expect(schemaQuestions).toContain('Qual a idade recomendada para visitar o parque?');
    expect(schemaQuestions).toContain('Os pacotes incluem ingresso do Beto Carrero?');
  });
});
