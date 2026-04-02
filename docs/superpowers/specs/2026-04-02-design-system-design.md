# Design System — Anhangá Viagens

**Data:** 2026-04-02  
**Status:** Aprovado  
**Abordagem:** Token-first, migração gradual (Abordagem A)

---

## Contexto

O codebase atual tem três grupos de cores coexistindo no Tailwind (`brand.*`, `anhanga.*`, `fun-*`), dois libraries de ícones misturados (Phosphor + Lucide), e praticamente nenhum componente reutilizável em `/components/ui` (apenas `LazyImage` e `PassportStamp`).

O objetivo é consolidar a paleta de cores em `anhanga.*`, criar tokens semânticos documentados, e construir os componentes UI primitivos e compostos mais usados no site.

---

## Decisões de design

### Cor de ação primária

**`#0ea5e9` (sky blue)** — mantida como cor interativa principal (botões, links, foco). Embora `#0056D2` seja a cor da identidade da marca (logo), o sky blue é a cor operacional do site e já está estabelecida em centenas de usos.

### Paleta `fun-*`

Mantida intocada. É usada exclusivamente nos componentes da landing page do Beto Carrero (`components/landings/beto-carrero/`), onde representa um tema visual intencional para o contexto de parque temático.

### Aliases de migração

Os tokens `brand.*` são mantidos como aliases no `tailwind.config.mjs` durante a migração gradual. Quando o número de usos chegar a zero, os aliases são removidos.

---

## Tokens — `lib/design-tokens.ts`

Arquivo de documentação de tokens semânticos. Não gera CSS — exporta constantes que mapeiam papéis semânticos para classes Tailwind canônicas.

```ts
export const tokens = {
  color: {
    action:      'anhanga-action',       // #0ea5e9 — botões, links, foco
    actionDark:  'anhanga-actionDark',   // #0284c7 — hover de ação
    accent:      'anhanga-yellow',       // #FFD600 — CTAs principais
    accentHover: 'anhanga-yellowHover',  // #E5C000
    brand:       'anhanga-blue',         // #0056D2 — identidade (logo, footer)
    surface:     'white',
    surfaceAlt:  'anhanga-light',        // #F4F8FF — fundos de seção
    dark:        'anhanga-dark',         // #0f172a — textos, footer
    muted:       'gray-500',
  },
  shadow: {
    hard:        'shadow-hard',          // 4px 4px 0 #0f172a
    hardYellow:  'shadow-hard-yellow',   // 4px 4px 0 #FFD600 (novo token)
    hardLg:      'shadow-hard-lg',
    float:       'shadow-float',
    floatLg:     'shadow-float-lg',      // novo token para Card variant="float"
    glow:        'shadow-glow',
  },
  radius: {
    sm:   'rounded-lg',
    md:   'rounded-xl',
    lg:   'rounded-2xl',
    full: 'rounded-full',
  },
} as const;
```

---

## `tailwind.config.mjs` — mudanças

### Patch aditivo ao bloco `anhanga` existente

Adicionar apenas as **duas chaves novas** ao bloco `anhanga` já existente no config. Não substituir o bloco inteiro:

```js
// Dentro de theme.extend.colors.anhanga — ADICIONAR estas duas chaves:
action:      '#0ea5e9',   // cor de ação interativa (antigo brand-cyan / brand-vibrant)
actionDark:  '#0284c7',   // hover de ação (antigo brand-cyanDark)
// Nota: dark: '#0f172a' e as demais já existem no bloco anhanga atual
```

### Patch aditivo ao bloco `boxShadow` existente

Adicionar dois novos tokens de sombra ao bloco `boxShadow` já existente:

```js
// Dentro de theme.extend.boxShadow — ADICIONAR:
'hard-yellow': '4px 4px 0px 0px #FFD600',   // hard-shadow amarelo para Button primary
'float-lg':    '0 20px 60px -15px rgba(0,0,0,0.2)', // sombra pronunciada para Card float
```

### Aliases de migração `brand.*` (mantidos temporariamente)

Estes já existem e são mantidos sem alteração durante a migração:

```js
brand: {
  cyan:      '#0ea5e9',   // → anhanga-action
  cyanDark:  '#0284c7',   // → anhanga-actionDark
  vibrant:   '#0ea5e9',   // → anhanga-action
  blue:      '#1e40af',   // → blue-800 (nativo Tailwind)
  yellow:    '#fbbf24',   // ⚠ DIFERENTE de anhanga-yellow — ver aviso abaixo
  dark:      '#0f172a',   // → anhanga-dark
  light:     '#f0f9ff',   // ⚠ DIFERENTE de anhanga-light — ver aviso abaixo
}
```

> **⚠ Atenção — brand.yellow:** `brand.yellow` é `#fbbf24` (Amber 400) e `anhanga.yellow` é `#FFD600`. São cores visualmente diferentes. Fazer passe de verificação visual antes de migrar qualquer uso de `brand-yellow`.

> **⚠ Atenção — brand.light:** `brand.light` é `#f0f9ff` (Sky 50) e `anhanga.light` é `#F4F8FF`. São tons de fundo levemente diferentes. Fazer passe de verificação visual antes de migrar usos de `brand-light`, especialmente em fundos de seção.

---

## Componentes — `components/ui/`

Todos os componentes aceitam `className?: string` como prop passthrough para spacing e posicionamento no callsite, além dos props documentados abaixo.

### Estrutura de arquivos

```
components/ui/
  Button.tsx
  Input.tsx
  Badge.tsx
  Card.tsx
  SectionHeader.tsx
  WaveDivider.tsx
  index.ts
```

### `Button`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **Obrigatório.** Conteúdo do botão |
| `variant` | `'primary' \| 'action' \| 'cta' \| 'ghost'` | `'primary'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `leftIcon` | `React.ReactNode` | — | Ícone à esquerda |
| `rightIcon` | `React.ReactNode` | — | Ícone à direita |
| `isLoading` | `boolean` | `false` | Exibe spinner, desabilita interação |
| `asChild` | `boolean` | `false` | Renderiza como elemento filho (ex: `<a>`) |
| `className` | `string` | — | Classes adicionais |

**Variantes:**

- `primary` — `bg-anhanga-dark text-white rounded-xl shadow-hard-yellow` (hard-shadow **amarelo**, token `shadow-hard-yellow`)
- `action` — `bg-anhanga-action text-white rounded-full`
- `cta` — `bg-anhanga-yellow text-anhanga-dark rounded-2xl shadow-hard` (hard-shadow **dark**, token `shadow-hard`)
- `ghost` — `text-gray-500 hover:text-anhanga-action`

> **Nota:** `primary` usa `shadow-hard-yellow` (novo token — 4px 4px 0 #FFD600). `cta` usa `shadow-hard` existente (4px 4px 0 #0f172a). São sombras distintas.

### `Input`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `label` | `string` | — | Label visível acima do campo |
| `error` | `string` | — | Mensagem de erro (borda vermelha + texto abaixo) |
| `className` | `string` | — | Classes adicionais no wrapper |

Herda todos os props nativos de `<input>`.

**Estilo base:** `border-2 border-gray-200 rounded-xl focus:border-anhanga-action focus:ring-2 focus:ring-anhanga-action/15`

### `Badge`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **Obrigatório.** Conteúdo do badge |
| `color` | `'default' \| 'blue' \| 'yellow'` | `'default'` | Esquema de cor |
| `icon` | `React.ReactNode` | — | Ícone opcional à esquerda |
| `className` | `string` | — | Classes adicionais |

`BadgeColor = 'default' | 'blue' | 'yellow'` — tipo exportado de `Badge.tsx` para reuso em outros componentes (ex: `SectionHeader`).

**Estilo base:** pill, uppercase, tracking-widest, font-black, text-xs

### `Card`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `children` | `React.ReactNode` | — | **Obrigatório.** Conteúdo do card |
| `variant` | `'default' \| 'hard' \| 'float'` | `'default'` | Intensidade da sombra |
| `className` | `string` | — | Classes adicionais |

- `default` — `shadow-float`
- `hard` — `shadow-hard`
- `float` — `shadow-float-lg` (novo token definido em boxShadow)

### `SectionHeader`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `title` | `string` | — | **Obrigatório.** Título principal (h2) |
| `badge` | `string` | — | Texto do badge. Se omitido, badge não é renderizado |
| `badgeIcon` | `React.ReactNode` | — | Ícone do badge |
| `badgeColor` | `BadgeColor` | `'default'` | Cor do badge (importado de `Badge.tsx`) |
| `subtitle` | `string` | — | Subtítulo opcional |
| `align` | `'center' \| 'left'` | `'center'` | Alinhamento |
| `className` | `string` | — | Classes adicionais |

### `WaveDivider`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `fill` | `string` | `'#ffffff'` | Cor de preenchimento da onda (cor da seção abaixo) |
| `direction` | `'down' \| 'up'` | `'down'` | Orientação da onda |
| `height` | `number` | `60` | Altura em px |
| `className` | `string` | — | Classes adicionais |

Encapsula o SVG de onda que hoje está duplicado no `Hero.tsx` e no `Footer.tsx`.

---

## Estratégia de migração — 3 fases

### Fase 1 — Tokens (sem mudança visual)

1. Criar `lib/design-tokens.ts`
2. Aplicar o patch aditivo em `tailwind.config.mjs`: adicionar `anhanga.action`, `anhanga.actionDark`, `shadow-hard-yellow`, `shadow-float-lg`
3. Resultado: zero mudança visual; aliases `brand.*` intocados

### Fase 2 — Componentes UI

1. Criar os 6 componentes em `components/ui/` usando apenas classes `anhanga.*` e os novos tokens de sombra
2. Criar `components/ui/index.ts` com re-exports

### Fase 3 — Migração de consumidores (incremental)

1. Ao tocar um componente existente, substituir padrões inline pelos novos componentes
2. Rastrear contagem de usos de `brand-*` com `grep -r "brand-" --include="*.tsx"`
3. Antes de migrar `brand-yellow` ou `brand-light`, fazer passe visual (ver avisos acima)
4. Quando zero usos restarem, remover os aliases do Tailwind

---

## Testes

### `node:test`

- Verificar que `lib/design-tokens.ts` exporta todas as chaves esperadas (`color`, `shadow`, `radius`) sem erros de importação
- Verificar que `Button` com `isLoading=true` tem `disabled=true` no elemento renderizado

### Playwright

- **Home page (`/`)**: `Button variant="primary"` renderiza com texto visível e `aria-disabled=false`
- **Home page (`/`)**: `Button variant="primary" isLoading=true` renderiza com spinner e `aria-disabled=true`
- **Home page (`/`)**: `SectionHeader` renderiza com `role="heading" level=2`

### Typecheck

- `pnpm typecheck` deve passar sem erros após a implementação

---

## Fora do escopo

- Landing pages do Beto Carrero (`components/landings/beto-carrero/`) — tema próprio, não alterado
- Conversão em massa de `brand.*` — migração incremental
- Página `/styleguide` ou Storybook
- Unificação dos icon libraries (Phosphor vs Lucide) — problema separado
