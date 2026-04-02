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
    hard:   'shadow-hard',
    hardLg: 'shadow-hard-lg',
    float:  'shadow-float',
    glow:   'shadow-glow',
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

## `tailwind.config.mjs` — mudanças de cor

### Adicionar dentro de `anhanga`

```js
anhanga: {
  // Ação/interativo (antigo brand-cyan / brand-vibrant)
  action:       '#0ea5e9',
  actionDark:   '#0284c7',
  // Identidade de marca
  blue:         '#0056D2',
  darkBlue:     '#003B8E',
  // Acento
  yellow:       '#FFD600',
  yellowHover:  '#E5C000',
  // Superfícies
  dark:         '#0f172a',
  light:        '#F4F8FF',
}
```

### Aliases de migração (mantidos temporariamente)

```js
brand: {
  cyan:      '#0ea5e9',   // → anhanga-action
  cyanDark:  '#0284c7',   // → anhanga-actionDark
  vibrant:   '#0ea5e9',   // → anhanga-action
  blue:      '#1e40af',   // → blue-800 (nativo Tailwind)
  yellow:    '#fbbf24',   // → anhanga-yellow (valor diferente — verificar)
  dark:      '#0f172a',   // → anhanga-dark
  light:     '#f0f9ff',   // → anhanga-light (valor levemente diferente — verificar)
}
```

> **Atenção:** `brand.yellow` (#fbbf24 / Amber 400) e `anhanga.yellow` (#FFD600) são valores diferentes. Verificar visualmente antes de migrar usos de `brand-yellow`.

---

## Componentes — `components/ui/`

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
| `variant` | `'primary' \| 'action' \| 'cta' \| 'ghost'` | `'primary'` | Estilo visual |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamanho |
| `leftIcon` | `React.ReactNode` | — | Ícone à esquerda |
| `rightIcon` | `React.ReactNode` | — | Ícone à direita |
| `isLoading` | `boolean` | `false` | Exibe spinner, desabilita |
| `asChild` | `boolean` | `false` | Renderiza como elemento filho (ex: `<a>`) |

**Variantes:**

- `primary` — `bg-anhanga-dark text-white rounded-xl shadow-hard` (hard-shadow amarelo)
- `action` — `bg-anhanga-action text-white rounded-full`
- `cta` — `bg-anhanga-yellow text-anhanga-dark rounded-2xl` (hard-shadow dark)
- `ghost` — `text-gray-500 hover:text-anhanga-action`

### `Input`

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `label` | `string` | Label visível acima do campo |
| `error` | `string` | Mensagem de erro (borda vermelha + texto) |
| `placeholder` | `string` | Placeholder |

Herda todos os props nativos de `<input>`.

**Estilo base:** `border-2 border-gray-200 rounded-xl focus:border-anhanga-action focus:ring-2 focus:ring-anhanga-action/15`

### `Badge`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `color` | `'default' \| 'blue' \| 'yellow'` | `'default'` | Esquema de cor |
| `icon` | `React.ReactNode` | — | Ícone opcional à esquerda |

**Estilo base:** pill, uppercase, tracking-widest, font-black, text-xs

### `Card`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `variant` | `'default' \| 'hard' \| 'float'` | `'default'` | Intensidade da sombra |
| `className` | `string` | — | Classes adicionais |

- `default` — `shadow-float`
- `hard` — `shadow-hard`
- `float` — `shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]`

### `SectionHeader`

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `badge` | `string` | Texto do badge acima do título |
| `badgeIcon` | `React.ReactNode` | Ícone do badge |
| `badgeColor` | `BadgeColor` | Cor do badge (default: `'default'`) |
| `title` | `string` | Título principal (h2) |
| `subtitle` | `string` | Subtítulo opcional |
| `align` | `'center' \| 'left'` | Alinhamento (default: `'center'`) |

### `WaveDivider`

**Props:**

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `fill` | `string` | `'#ffffff'` | Cor de preenchimento da onda (cor da seção abaixo) |
| `direction` | `'down' \| 'up'` | `'down'` | Orientação da onda |
| `height` | `number` | `60` | Altura em px |

Encapsula o SVG de onda que hoje está duplicado no `Hero.tsx` e no `Footer.tsx`.

---

## Estratégia de migração — 3 fases

### Fase 1 — Tokens (sem mudança visual)

1. Criar `lib/design-tokens.ts`
2. Atualizar `tailwind.config.mjs`: adicionar tokens `anhanga.action/actionDark`, manter aliases `brand.*`
3. Resultado: zero mudança visual

### Fase 2 — Componentes UI

1. Criar os 6 componentes em `components/ui/` usando apenas classes `anhanga.*`
2. Criar `components/ui/index.ts` com re-exports

### Fase 3 — Migração de consumidores (incremental)

1. Ao tocar um componente existente, substituir padrões inline pelos novos componentes
2. Rastrear contagem de usos de `brand-*` no codebase
3. Quando zero usos restarem, remover aliases do Tailwind

---

## Testes

- **Sem testes unitários** para os componentes UI (puramente visuais, sem lógica)
- **`pnpm typecheck`** obrigatório após a implementação
- **Playwright smoke** — verificar que os novos componentes renderizam corretamente em pelo menos uma página real (ex: Home)

---

## Fora do escopo

- Landing pages do Beto Carrero (`components/landings/beto-carrero/`) — tema próprio, não alterado
- Conversão em massa de `brand.*` — migração incremental
- Página `/styleguide` ou Storybook
- Unificação dos icon libraries (Phosphor vs Lucide) — problema separado
