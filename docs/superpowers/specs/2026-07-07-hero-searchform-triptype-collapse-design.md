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
| Estado por padrão | Oculto — mostra só Orçamento + botão Buscar na 2ª linha, com link "+ Tipo de viagem" ao lado | Reduz de 2 para 1 decisão visível na 2ª linha, sem remover a opção para quem já sabe o tipo de viagem |
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

- Estado inicial: `showTripType = false`. 2ª linha do form mostra `BudgetField` + botão Buscar + link/botão "+ Tipo de viagem".
- Ao clicar no toggle: `showTripType = true`, `TripTypeField` some ao layout (mesmo componente/props já usados hoje), toggle vira algo como "− Tipo de viagem" ou o próprio campo substitui o link.
- Uma vez expandido, o campo permanece visível pelo resto da sessão do formulário (não há necessidade de recolher de novo).
- `data-testid="trip-type-filter-btn"` é preservado no botão do campo — só passa a existir dentro da área revelada. Não quebra o locator já definido em `tests/e2e/pages/HomePage.ts` (hoje não referenciado por nenhum teste ativo).
- Acessibilidade: toggle é um `<button type="button" aria-expanded={showTripType}>`, seguindo o padrão dos demais painéis do form (`aria-haspopup`, `aria-expanded` já usados em `TripTypeField.tsx` e `BudgetField.tsx`).
- `prefers-reduced-motion`: se houver transição de entrada do campo revelado, respeitar a mesma guarda já usada em outras animações do Hero.

## 4. Testes

- **E2E (`tests/e2e/hero_ux.spec.ts`):** adicionar caso cobrindo oculto-por-padrão → expandir → selecionar tipo → buscar. Reaproveitar o padrão de `test.skip(isMobile, ...)` já usado nos outros testes desse arquivo, já que a interação é desktop-only.
- Não são necessários testes de regressão (`tests/*.test.ts`) — não há lógica de validação, normalização ou contrato de API envolvida; a mudança é de estado de UI local.

## 5. Fora de escopo

- Qualquer mudança em `BudgetField`, `DestinationField`, `DateField` ou `GuestsField`.
- Qualquer mudança na mensagem enviada ao chat (`buildSearchMessage`) — comportamento de dados já é o correto hoje.
