# Colapsar "Tipo de Viagem" no SearchForm do Hero — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Esconder o campo "Tipo de Viagem" do `SearchForm.tsx` (Hero, desktop) atrás de um toggle de progressive disclosure, reduzindo de 2 para 1 decisão visível na 2ª linha do form, sem alterar dados, validação ou o componente `TripTypeField.tsx`.

**Architecture:** Um novo `useState<boolean>` (`showTripType`) em `SearchForm.tsx` controla um wrapper novo (`<div id="hero-trip-type-panel">`) que substitui o slot hoje ocupado diretamente por `<TripTypeField />`. Colapsado, o wrapper renderiza um botão leve "+ Tipo de viagem" (`aria-expanded`, `aria-controls`); expandido, renderiza `TripTypeField` sem alterações. Foco é movido programaticamente para o botão interno de `TripTypeField` via a `tripTypeRef` já existente, num `useEffect` disparado por `showTripType`.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS, Playwright (e2e). Nenhuma dependência nova.

**Spec de referência:** `docs/superpowers/specs/2026-07-07-hero-searchform-triptype-collapse-design.md` (aprovado após 2 rodadas de spec-review).

---

## Chunk 1: Toggle de progressive disclosure

### Task 1: Teste e2e (falhando) do comportamento de reveal

**Files:**
- Modify: `tests/e2e/hero_ux.spec.ts`

- [ ] **Step 1: Escrever o teste falhando**

Adicionar ao final do `test.describe('Hero UX and Accessibility', ...)` em `tests/e2e/hero_ux.spec.ts` (depois do último teste existente, antes do `});` de fechamento do describe):

```ts
  test('should reveal Trip Type field only after activating its toggle', async ({ page, isMobile }) => {
    test.skip(isMobile, 'SearchForm complex interactions are desktop-only');

    const tripTypeReveal = page.getByTestId('trip-type-reveal-btn');
    const tripTypeField = page.getByTestId('trip-type-filter-btn');

    // Colapsado por padrão
    await expect(tripTypeReveal).toBeVisible();
    await expect(tripTypeField).not.toBeVisible();
    await expect(tripTypeReveal).toHaveAttribute('aria-expanded', 'false');
    await expect(tripTypeReveal).toHaveAttribute('aria-controls', 'hero-trip-type-panel');

    // Ativa o toggle
    await tripTypeReveal.click();

    // Campo revelado, toggle não existe mais (reveal unidirecional)
    await expect(tripTypeField).toBeVisible();
    await expect(tripTypeReveal).not.toBeVisible();

    // Foco move para o botão do campo revelado
    await expect(tripTypeField).toBeFocused();

    // Fluxo normal de seleção continua funcionando
    await tripTypeField.click();
    await page.getByRole('button', { name: 'Férias / Lazer' }).click();
    await expect(tripTypeField).toContainText('Férias / Lazer');
  });
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npx playwright test tests/e2e/hero_ux.spec.ts -g "should reveal Trip Type field"`
Expected: FAIL — `getByTestId('trip-type-reveal-btn')` não encontra nada (o botão ainda não existe; hoje `trip-type-filter-btn` está sempre visível).

- [ ] **Step 3: Commit do teste falhando**

```bash
git add tests/e2e/hero_ux.spec.ts
git commit -m "test: cobre reveal do campo Tipo de Viagem no SearchForm do Hero"
```

---

### Task 2: Implementar o toggle em SearchForm.tsx

**Files:**
- Modify: `components/SearchForm.tsx:36-43` (novo estado), `components/SearchForm.tsx:391-399` (JSX do slot)

- [ ] **Step 1: Adicionar o novo estado, junto aos demais `useState` do formulário**

Em `components/SearchForm.tsx`, logo após a linha `const [budget, setBudget] = useState('');` (linha 38):

```tsx
  const [budget, setBudget] = useState('');
  const [showTripType, setShowTripType] = useState(false);
```

- [ ] **Step 2: Adicionar o `useEffect` de foco, logo após o bloco de `useRef` de painéis**

`tripTypeRef` só é declarado na linha 86, dentro do bloco de refs (linhas 82-87). Inserir o novo efeito **imediatamente depois da última linha desse bloco** — `const budgetRef = useRef<HTMLDivElement>(null);` (linha 87) — e **antes** de `const closePanel = useCallback(...)` (linha 89):

```tsx
  const budgetRef = useRef<HTMLDivElement>(null);

  // Move o foco pro botão do TripTypeField assim que ele é revelado —
  // o próximo passo natural do usuário é abrir o dropdown de opções.
  useEffect(() => {
    if (showTripType) {
      tripTypeRef.current?.querySelector('button')?.focus();
    }
  }, [showTripType]);

  const closePanel = useCallback((panel: ActivePanel) => {
```

Essa é a única âncora válida: é o primeiro ponto do arquivo onde `tripTypeRef` já existe.

- [ ] **Step 3: Adicionar o handler do toggle, junto aos demais `useCallback` de UI**

Logo após `handleTripTypeSelect` (linhas 259-262), adicionar:

```tsx
  const revealTripType = useCallback(() => {
    setShowTripType(true);
  }, []);
```

- [ ] **Step 4: Substituir o slot de `TripTypeField` no JSX**

Em `components/SearchForm.tsx`, dentro do container `<div className="flex flex-col md:flex-row items-stretch w-full divide-y md:divide-y-0 md:divide-x divide-zinc-100">` (linha 391), substituir:

```tsx
        <TripTypeField
          tripTypeRef={tripTypeRef}
          isOpen={openPanel === 'trip'}
          tripType={tripType}
          selectedTripObj={selectedTripObj}
          onToggle={toggleTripTypeDropdown}
          onSelect={handleTripTypeSelect}
        />
```

por:

```tsx
        <div id="hero-trip-type-panel" className="w-full md:flex-1 flex">
          {showTripType ? (
            <TripTypeField
              tripTypeRef={tripTypeRef}
              isOpen={openPanel === 'trip'}
              tripType={tripType}
              selectedTripObj={selectedTripObj}
              onToggle={toggleTripTypeDropdown}
              onSelect={handleTripTypeSelect}
            />
          ) : (
            <button
              type="button"
              onClick={revealTripType}
              aria-expanded={showTripType}
              aria-controls="hero-trip-type-panel"
              data-testid="trip-type-reveal-btn"
              className="w-full p-3 md:p-6 text-left hover:bg-zinc-50/80 transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan flex items-center"
            >
              <span className="text-zinc-400 font-bold text-sm">+ Tipo de viagem</span>
            </button>
          )}
        </div>
```

Por que `className="w-full md:flex-1 flex"` no wrapper (e não só `w-full md:flex-1` como o spec descreve literalmente): o wrapper precisa esticar seu único filho (o botão colapsado ou o `<div>` raiz de `TripTypeField`) para ocupar toda a altura da linha, replicando o `items-stretch` que hoje se aplica a `TripTypeField` diretamente como filho do container flex pai. Ao virar um wrapper intermediário, `TripTypeField` deixa de ser filho direto desse container — sem `flex` no wrapper, o `items-stretch` do pai só estica o *wrapper*, não o conteúdo dentro dele, o que criaria um descompasso visual de altura entre os 3 slots da linha. Marcar o wrapper como `flex` faz seu próprio `align-items: stretch` (padrão de flexbox) esticar o filho automaticamente, sem precisar tocar em `TripTypeField.tsx`.

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx playwright test tests/e2e/hero_ux.spec.ts -g "should reveal Trip Type field"`
Expected: PASS

- [ ] **Step 6: Rodar a suíte completa de `hero_ux.spec.ts` para garantir que nada quebrou**

Run: `npx playwright test tests/e2e/hero_ux.spec.ts`
Expected: todos os testes (os 3 pré-existentes + o novo) PASS.

- [ ] **Step 7: Typecheck**

Run: `pnpm typecheck`
Expected: sem erros novos.

- [ ] **Step 8: Commit**

```bash
git add components/SearchForm.tsx
git commit -m "feat: colapsa Tipo de Viagem no SearchForm do Hero atrás de um toggle"
```

---

### Task 3: Verificação manual visual (não automatizável por teste)

- [ ] **Step 1:** Rodar `pnpm dev`, abrir a Home no desktop (viewport ≥768px), e confirmar visualmente:
  - A 2ª linha do form mostra só "+ Tipo de viagem" (leve, cinza) + Orçamento + botão Buscar, com a mesma altura entre os 3 slots (sem "degrau" visual).
  - Clicar em "+ Tipo de viagem" revela o campo completo (ícone, label, chevron) ocupando o mesmo espaço, sem reflow do restante da linha.
  - O dropdown de opções do campo revelado abre corretamente ao clicar nele.
- [ ] **Step 2:** Confirmar que `MobileHeroForm` (viewport mobile) está inalterado — não deve haver nenhum "+ Tipo de viagem" em mobile (esse formulário nunca teve esse campo).
- [ ] **Step 3:** Testar navegação por teclado: `Tab` até o botão "+ Tipo de viagem", `Enter`/`Space` para ativar, confirmar que o foco visível aparece no botão do campo revelado (não em `document.body`).

Isso não vira um passo de teste automatizado porque é uma verificação visual/qualitativa de layout (altura dos slots, ausência de reflow) — o teste e2e da Task 1 já cobre o contrato funcional (visibilidade, atributos ARIA, foco, seleção).

---

## Fora de escopo (confirmado pelo spec, seção 5)

Não tocar em: `BudgetField.tsx`, `DestinationField.tsx`, `DateField.tsx`, `GuestsField.tsx`, `TripTypeField.tsx`, `components/search/helpers.ts`, `components/MobileHeroForm.tsx`.
