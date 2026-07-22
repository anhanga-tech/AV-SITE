# Credencial Pastore na Melhor Idade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir a credencial textual `Parceira Pastore Turismo` na seção “Por que planejar sua viagem 50+ com a Anhangá?” sem quebrar o layout mobile.

**Architecture:** A mudança permanece local a `MelhorIdadeLanding.tsx`: uma pill informativa e não interativa será inserida entre o título da seção e o conteúdo editorial, reutilizando as classes visuais da credencial de consultoria. Um teste Playwright dedicado verificará conteúdo, posição, ausência de sombra e overflow em uma viewport móvel estreita.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React e Playwright.

## Global Constraints

- Exibir somente a credencial textual `Parceira Pastore Turismo`.
- Posicionar a credencial imediatamente abaixo do título da seção “Por que planejar sua viagem 50+ com a Anhangá?” e antes do conteúdo editorial.
- Usar pill branca, borda fina, cantos totalmente arredondados, ícone de confirmação e nenhuma sombra.
- Usar tokens Tailwind canônicos `anhanga-*` no novo código.
- Não alterar FAQ, conteúdo editorial, demais parcerias ou criar um componente compartilhado.

---

### Task 1: Credencial Pastore responsiva

**Files:**
- Create: `tests/e2e/melhor-idade-credential.spec.ts`
- Modify: `pages/landings/MelhorIdadeLanding.tsx:8,167-170`

**Interfaces:**
- Consumes: rota pública `/melhor-idade/` e o ícone `CheckCircle` de `lucide-react`.
- Produces: conteúdo informativo visível com o nome acessível `Parceira Pastore Turismo`; não produz nova prop, função ou API compartilhada.

- [ ] **Step 1: Escrever o teste Playwright que descreve a credencial e o layout mobile**

Criar `tests/e2e/melhor-idade-credential.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('credencial Pastore na landing Melhor Idade', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('aparece entre o título e o conteúdo, sem sombra nem overflow horizontal', async ({ page }) => {
    await page.goto('/melhor-idade/');

    const heading = page.getByRole('heading', {
      level: 2,
      name: 'Por que planejar sua viagem 50+ com a Anhangá?',
    });
    const credential = page.getByText('Parceira Pastore Turismo', { exact: true });
    const firstParagraph = page.getByText('Viajar na maturidade exige um olhar diferente.', {
      exact: false,
    });

    await heading.scrollIntoViewIfNeeded();
    await expect(credential).toBeVisible();
    await expect(credential).toHaveCSS('box-shadow', 'none');
    await expect(credential).toHaveCSS('border-top-style', 'solid');

    const headingBox = await heading.boundingBox();
    const credentialBox = await credential.boundingBox();
    const paragraphBox = await firstParagraph.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(credentialBox).not.toBeNull();
    expect(paragraphBox).not.toBeNull();
    expect(credentialBox!.y).toBeGreaterThanOrEqual(headingBox!.y + headingBox!.height);
    expect(paragraphBox!.y).toBeGreaterThanOrEqual(credentialBox!.y + credentialBox!.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
```

- [ ] **Step 2: Executar o teste e confirmar o RED**

Run:

```bash
pnpm exec playwright test tests/e2e/melhor-idade-credential.spec.ts --project=chromium
```

Expected: FAIL porque `getByText('Parceira Pastore Turismo')` não encontra o elemento.

- [ ] **Step 3: Implementar a pill mínima na seção aprovada**

Em `pages/landings/MelhorIdadeLanding.tsx`, ampliar o import do Lucide:

```ts
import { ShieldCheck, Heart, Sparkles, Coffee, CheckCircle } from 'lucide-react';
```

Trocar a margem inferior do título de `mb-12` para `mb-6` e inserir imediatamente depois dele:

```tsx
<div className="flex justify-center mb-12">
  <span className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-200 px-4 py-2 text-sm font-bold text-anhanga-dark">
    <CheckCircle className="size-4 text-anhanga-blue" aria-hidden="true" />
    Parceira Pastore Turismo
  </span>
</div>
```

- [ ] **Step 4: Executar o teste focado e confirmar o GREEN**

Run:

```bash
pnpm exec playwright test tests/e2e/melhor-idade-credential.spec.ts --project=chromium
```

Expected: PASS; a pill fica entre o título e o primeiro parágrafo, tem borda sólida, `box-shadow: none` e não provoca overflow em 320 px.

- [ ] **Step 5: Executar as verificações completas proporcionais à mudança**

Run:

```bash
pnpm test:regression
pnpm typecheck
pnpm lint:changed
pnpm exec react-doctor --verbose --scope changed --base main
```

Expected: todos os comandos passam; o React Doctor não apresenta novos diagnósticos no escopo alterado.

- [ ] **Step 6: Revisar o diff e criar o commit de implementação**

Run:

```bash
git diff --check
git diff -- pages/landings/MelhorIdadeLanding.tsx tests/e2e/melhor-idade-credential.spec.ts
git add pages/landings/MelhorIdadeLanding.tsx tests/e2e/melhor-idade-credential.spec.ts
git commit -m "feat: adiciona credencial Pastore na landing 50+"
```

Expected: diff restrito à importação do ícone, à pill aprovada e ao teste de regressão mobile; commit criado com sucesso.
