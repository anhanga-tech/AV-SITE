# Design: Colapsar "Tipo de Viagem" no SearchForm do Hero

**Data:** 2026-07-07
**Status:** Aprovado — aguardando implementação
**Origem:** Análise de psicologia de marketing (Hick's Law / Paradox of Choice) sobre o funil de conversão do Hero

---

## 1. Contexto e problema

`components/SearchForm.tsx` (formulário de busca do Hero, desktop-only — `MobileHeroForm.tsx` já não inclui esse campo) exibe 5 painéis simultâneos antes do usuário conseguir abrir o chat com IA: Destino, Data, Hóspedes, Tipo de Viagem e Orçamento. O chat que abre em seguida já faz qualificação BANT completa, incluindo tipo de viagem.

O campo "Tipo de Viagem" já é logicamente opcional na lógica existente — nem `handleSearch` (`SearchForm.tsx`) nem `buildSearchMessage` (`components/search/helpers.ts`) o exigem; a mensagem só inclui a linha `🎭 *Tipo de Viagem:*` se o valor estiver preenchido. O que pesa hoje é puramente visual: o painel ocupa uma posição fixa na grade, aumentando a carga de decisão simultânea antes do primeiro compromisso (Hick's Law / Paradox of Choice), sem ganho funcional correspondente — o dado é opcional e o chat já recolhe a mesma informação depois.

## 2. Decisão de design

| Decisão | Escolha | Justificativa |
|---|---|---|
| Campo a colapsar | "Tipo de Viagem" | Menor sinal de intenção direta comparado a destino/data/orçamento; escolhido pelo usuário entre as 4 opções apresentadas |
| Padrão de UI | Progressive disclosure (mesmo padrão de `components/cta/CtaBody.tsx`) | Consistência com padrão já usado no site; evita nova convenção visual |
| Estado por padrão | Oculto — o slot do campo (mesma posição na grade) mostra só um link leve "+ Tipo de viagem" até o clique | Reduz o peso visual da 2ª linha sem mudar a estrutura de 3 slots, e sem remover a opção para quem já sabe o tipo de viagem |
| Alternativa descartada A | Remover o campo do Hero por completo | Perde sinal de intenção de quem já sabe o tipo de viagem e quer adiantar — sem necessidade, já que o custo é só visual |
| Alternativa descartada B | Apenas de-enfatizar visualmente (cinza/menor) sem esconder | Não reduz a contagem de decisões simultâneas; o ganho de Hick's Law vem de esconder, não de estilizar |

## 3. Arquitetura

### 3.1 Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `components/SearchForm.tsx` | Novo `useState<boolean>` (`showTripType`) controlando a renderização condicional de `<TripTypeField />` na 2ª linha do form; adiciona botão/link de toggle com `aria-expanded` |
| `tests/e2e/hero_ux.spec.ts` | Novo teste: campo "Tipo de Viagem" oculto por padrão no desktop → clique no toggle → campo visível e selecionável → segue fluxo normal até abrir o chat |

### 3.2 Arquivos explicitamente NÃO modificados

- `components/search/TripTypeField.tsx` — componente reaproveitado sem alteração
- `components/search/helpers.ts` (`buildSearchMessage`) — já trata `tripType` como opcional
- `components/MobileHeroForm.tsx` — não possui esse campo hoje, sem mudança
- Nenhum schema, endpoint ou dado persistido é afetado — mudança é puramente de estado de UI local ao componente

### 3.3 Comportamento

- **Layout:** o toggle ocupa o mesmo slot flex (`w-full md:flex-1`) hoje ocupado por `TripTypeField` dentro do container `flex ... divide-x` da 2ª linha. Isso preserva os 3 slots e o ritmo visual dos divisores — nada reflui de largura em `BudgetField` ou no botão Buscar. Só o **conteúdo** do slot muda: colapsado, mostra um link/botão leve "+ Tipo de viagem"; expandido, mostra o `TripTypeField` completo (mesmo componente/props de hoje) no lugar do link.
- **Direção única (reveal, não accordion):** estado inicial `showTripType = false`. Ao clicar no toggle, `showTripType = true` e o slot passa a renderizar `TripTypeField` permanentemente pelo resto da sessão do formulário — não há botão para recolher de novo. Simplifica a interação e evita um segundo estado de "− Tipo de viagem" sem necessidade real.
- `data-testid="trip-type-filter-btn"` é preservado no botão do campo revelado — só passa a existir depois do clique no toggle. Não quebra o locator já definido em `tests/e2e/pages/HomePage.ts` (confirmado: não referenciado por `hero_ux.spec.ts`, `smoke.spec.ts` nem `chaos.spec.ts` hoje).
- **Acessibilidade — padrão disclosure, não popup-menu:** o precedente citado originalmente (`aria-haspopup`+`aria-expanded` em `TripTypeField`/`BudgetField`) é de botão-que-abre-popup, não se aplica aqui — o toggle revela um campo irmão permanente, não um menu flutuante. `CtaBody.tsx` (progressive disclosure já usado no site) também não usa `aria-expanded`/`aria-controls`. Padrão correto a implementar: `<button type="button" aria-expanded={showTripType} aria-controls="hero-trip-type-panel">` no link/botão "+ Tipo de viagem". O `id="hero-trip-type-panel"` vai num **wrapper novo** criado em `SearchForm.tsx` — `<div id="hero-trip-type-panel" className="w-full md:flex-1">{showTripType ? <TripTypeField ... /> : <button ...>+ Tipo de viagem</button>}</div>` — e não dentro de `TripTypeField.tsx`, que continua sem alteração (3.2 permanece válido). O wrapper herda o `w-full md:flex-1` que hoje vive no `<div>` raiz de `TripTypeField.tsx`; a classe correspondente dentro de `TripTypeField.tsx` fica redundante mas inofensiva (não é container flex, então `md:flex-1` ali não tem efeito, só `w-full` — sem mudança visual).
- **Foco de teclado:** clicar no link "+ Tipo de viagem" desmonta esse botão e monta o botão interno de `TripTypeField` (`data-testid="trip-type-filter-btn"`) no lugar — são dois nós DOM diferentes, então o foco **não** se mantém automaticamente (o navegador reverteria para `document.body`). Resolução: após `setShowTripType(true)`, mover o foco programaticamente para o botão interno revelado via o `tripTypeRef` que `SearchForm.tsx` já mantém (`tripTypeRef.current?.querySelector('button')?.focus()`, num `useEffect` disparado por `showTripType`). Isso é uma escolha deliberada, não um efeito colateral: o próximo passo natural do usuário após revelar o campo é abrir o dropdown de opções, então mover o foco para esse botão evita que ele se perca em `document.body` e poupa um Tab desnecessário. Não requer nenhuma mudança em `TripTypeField.tsx` (usa a ref já existente na wrapper div).
- `prefers-reduced-motion`: se houver transição de entrada do campo revelado, respeitar a mesma guarda já usada em outras animações do Hero.

## 4. Testes

- **E2E (`tests/e2e/hero_ux.spec.ts`):** adicionar caso cobrindo oculto-por-padrão → expandir → selecionar tipo → buscar. Reaproveitar o padrão de `test.skip(isMobile, ...)` já usado nos outros testes desse arquivo, já que a interação é desktop-only.
- Não são necessários testes de regressão (`tests/*.test.ts`) — não há lógica de validação, normalização ou contrato de API envolvida; a mudança é de estado de UI local.

## 5. Fora de escopo

- Qualquer mudança em `BudgetField`, `DestinationField`, `DateField` ou `GuestsField`.
- Qualquer mudança na mensagem enviada ao chat (`buildSearchMessage`) — comportamento de dados já é o correto hoje.
