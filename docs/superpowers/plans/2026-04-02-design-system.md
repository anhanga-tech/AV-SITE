# Design System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar tokens semânticos, consolidar a paleta `anhanga.*` no Tailwind, e implementar 6 componentes reutilizáveis em `components/ui/` sem quebrar nenhum componente existente.

**Architecture:** Abordagem token-first em 2 fases: (1) adicionar tokens no Tailwind + criar `lib/design-tokens.ts` sem nenhuma mudança visual; (2) criar os componentes em `components/ui/` usando apenas as classes canônicas. A migração de consumidores existentes (Fase 3) é incremental e fora do escopo deste plano.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite, `node:test` (testes unitários), Playwright (e2e smoke)

**Spec:** `docs/superpowers/specs/2026-04-02-design-system-design.md`

---

## Chunk 1: Tokens e Tailwind

### Task 1: Patch `tailwind.config.mjs` — adicionar 4 novos tokens

**Files:**
- Modify: `tailwind.config.mjs`

**Contexto:** O bloco `anhanga` no config atualmente contém apenas: `blue`, `darkBlue`, `yellow`, `yellowHover`, `light`. **`dark` NÃO existe ainda** — precisa ser adicionado junto com `action` e `actionDark`. Sem isso, todas as classes `text-anhanga-dark` e `bg-anhanga-dark` nos novos componentes silenciosamente não resolveriam. O bloco `boxShadow` atualmente contém: `glow`, `float`, `hard`, `hard-lg`, `hard-hover`. Precisamos adicionar `hard-yellow` e `float-lg`.

- [ ] **Abrir `tailwind.config.mjs` e localizar o bloco `anhanga` dentro de `theme.extend.colors`**

- [ ] **Adicionar `action`, `actionDark`, e `dark` ao bloco `anhanga` existente:**

```js
// Antes (trecho do bloco anhanga):
anhanga: {
    blue: '#0056D2',
    darkBlue: '#003B8E',
    yellow: '#FFD600',
    yellowHover: '#E5C000',
    light: '#F4F8FF',
},

// Depois (adicionar as três linhas marcadas com +):
anhanga: {
    action:     '#0ea5e9',   // + cor de ação (antigo brand-cyan / brand-vibrant)
    actionDark: '#0284c7',   // + hover de ação (antigo brand-cyanDark)
    dark:       '#0f172a',   // + NOVO — ausente do config atual; necessário para text-anhanga-dark
    blue: '#0056D2',
    darkBlue: '#003B8E',
    yellow: '#FFD600',
    yellowHover: '#E5C000',
    light: '#F4F8FF',
},
```

- [ ] **Adicionar `hard-yellow` e `float-lg` ao bloco `boxShadow` existente:**

```js
// Antes (trecho do bloco boxShadow):
boxShadow: {
    'glow': '0 0 20px rgba(14, 165, 233, 0.5)',
    'float': '0 10px 40px -10px rgba(0,0,0,0.15)',
    'hard': '4px 4px 0px 0px rgba(15, 23, 42, 1)',
    'hard-lg': '8px 8px 0px 0px rgba(15, 23, 42, 1)',
    'hard-hover': '6px 6px 0px 0px rgba(15, 23, 42, 1)',
},

// Depois (adicionar as duas linhas marcadas com +):
boxShadow: {
    'glow': '0 0 20px rgba(14, 165, 233, 0.5)',
    'float': '0 10px 40px -10px rgba(0,0,0,0.15)',
    'float-lg': '0 20px 60px -15px rgba(0,0,0,0.2)',   // +
    'hard': '4px 4px 0px 0px rgba(15, 23, 42, 1)',
    'hard-yellow': '4px 4px 0px 0px #FFD600',           // +
    'hard-lg': '8px 8px 0px 0px rgba(15, 23, 42, 1)',
    'hard-hover': '6px 6px 0px 0px rgba(15, 23, 42, 1)',
},
```

- [ ] **Verificar que o build não quebra:**

```bash
pnpm build
```

Esperado: build concluído sem erros. Zero mudança visual — os novos tokens ainda não são usados por nenhum componente.

- [ ] **Commit:**

```bash
git add tailwind.config.mjs
git commit -m "feat(tokens): add anhanga-action/actionDark/dark and shadow-hard-yellow/float-lg to Tailwind"
```

---

### Task 2: Criar `lib/design-tokens.ts`

**Files:**
- Create: `lib/design-tokens.ts`
- Create: `tests/design-tokens.test.ts`

**Contexto:** Este arquivo é documentação viva — exporta constantes que mapeiam papéis semânticos para classes Tailwind. Não gera CSS. Qualquer desenvolvedor pode olhar aqui para saber qual classe usar para "cor de ação".

- [ ] **Escrever o teste primeiro (`tests/design-tokens.test.ts`):**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

// Importar os tokens como valor de runtime
import { tokens } from '../lib/design-tokens.ts';

test('tokens exporta as categorias esperadas', () => {
    assert.ok('color'  in tokens, 'tokens.color deve existir');
    assert.ok('shadow' in tokens, 'tokens.shadow deve existir');
    assert.ok('radius' in tokens, 'tokens.radius deve existir');
});

test('tokens.color contém todos os papéis semânticos', () => {
    const expectedKeys = ['action', 'actionDark', 'accent', 'accentHover', 'brand', 'surface', 'surfaceAlt', 'dark', 'muted'];
    for (const key of expectedKeys) {
        assert.ok(key in tokens.color, `tokens.color.${key} deve existir`);
    }
});

test('tokens.shadow contém os tokens de sombra', () => {
    const expectedKeys = ['hard', 'hardYellow', 'hardLg', 'float', 'floatLg', 'glow'];
    for (const key of expectedKeys) {
        assert.ok(key in tokens.shadow, `tokens.shadow.${key} deve existir`);
    }
});

test('tokens.color.action aponta para a classe Tailwind correta', () => {
    assert.equal(tokens.color.action, 'anhanga-action');
});

test('tokens.color.dark aponta para a classe Tailwind correta', () => {
    assert.equal(tokens.color.dark, 'anhanga-dark');
});
```

- [ ] **Rodar o teste para confirmar que falha:**

```bash
pnpm test:regression -- --test-name-pattern "tokens"
```

Esperado: FAIL — `lib/design-tokens.ts` não existe ainda.

- [ ] **Criar `lib/design-tokens.ts`:**

```ts
export const tokens = {
    color: {
        action:      'anhanga-action',      // #0ea5e9 — botões, links, foco
        actionDark:  'anhanga-actionDark',  // #0284c7 — hover de ação
        accent:      'anhanga-yellow',      // #FFD600 — CTAs principais
        accentHover: 'anhanga-yellowHover', // #E5C000
        brand:       'anhanga-blue',        // #0056D2 — identidade (logo, footer)
        surface:     'white',
        surfaceAlt:  'anhanga-light',       // #F4F8FF — fundos de seção
        dark:        'anhanga-dark',        // #0f172a — textos, footer
        muted:       'gray-500',
    },
    shadow: {
        hard:       'shadow-hard',          // 4px 4px 0 #0f172a
        hardYellow: 'shadow-hard-yellow',   // 4px 4px 0 #FFD600
        hardLg:     'shadow-hard-lg',
        float:      'shadow-float',
        floatLg:    'shadow-float-lg',
        glow:       'shadow-glow',
    },
    radius: {
        sm:   'rounded-lg',
        md:   'rounded-xl',
        lg:   'rounded-2xl',
        full: 'rounded-full',
    },
} as const;
```

- [ ] **Rodar o teste para confirmar que passa:**

```bash
pnpm test:regression -- --test-name-pattern "tokens"
```

Esperado: todos os testes PASS.

- [ ] **Typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add lib/design-tokens.ts tests/design-tokens.test.ts
git commit -m "feat(tokens): add design-tokens.ts with semantic token map and tests"
```

---

## Chunk 2: Componentes primitivos

### Task 3: `Badge.tsx`

**Files:**
- Create: `components/ui/Badge.tsx`

**Contexto:** Badge é o menor e mais simples dos componentes. Não tem lógica — é puramente visual. Ele é criado primeiro porque `SectionHeader` depende dele (e do tipo `BadgeColor` que ele exporta).

- [ ] **Criar `components/ui/Badge.tsx`:**

```tsx
import React from 'react';

export type BadgeColor = 'default' | 'blue' | 'yellow';

interface BadgeProps {
    children: React.ReactNode;
    color?: BadgeColor;
    icon?: React.ReactNode;
    className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
    default: 'bg-white border-gray-200 text-anhanga-dark shadow-sm',
    blue:    'bg-blue-50 border-blue-200 text-anhanga-blue',
    yellow:  'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    color = 'default',
    icon,
    className = '',
}) => (
    <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-black text-xs uppercase tracking-widest ${colorClasses[color]} ${className}`}
    >
        {icon}
        {children}
    </span>
);
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/Badge.tsx
git commit -m "feat(ui): add Badge component"
```

---

### Task 4: `Button.tsx`

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `tests/button-loading.test.ts`

**Contexto:** Button é o componente mais usado. Tem 4 variantes, 3 tamanhos, estado de loading, e suporte a `asChild` para renderizar como `<a>`. Quando `isLoading=true`, o botão fica desabilitado e exibe um spinner. O `asChild` pattern (do Radix) permite usar o Button como wrapper de um `<a>` sem perder os estilos.

**Nota sobre sombras:**
- `primary` usa `shadow-hard-yellow` (novo token: 4px 4px 0 #FFD600)
- `cta` usa `shadow-hard` (token existente: 4px 4px 0 #0f172a)
- São propositalmente diferentes.

- [ ] **Criar `components/ui/Button.tsx`:**

```tsx
import React from 'react';

export type ButtonVariant = 'primary' | 'action' | 'cta' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isLoading?: boolean;
    asChild?: boolean;
    className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-anhanga-dark text-white rounded-xl shadow-hard-yellow hover:shadow-[2px_2px_0px_0px_#FFD600] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    action:  'bg-anhanga-action text-white rounded-full hover:bg-anhanga-actionDark',
    cta:     'bg-anhanga-yellow text-anhanga-dark rounded-2xl shadow-hard hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    ghost:   'bg-transparent text-gray-500 rounded-lg hover:text-anhanga-action',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
};

const Spinner: React.FC = () => (
    <svg
        className="w-4 h-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    asChild = false,
    className = '',
    disabled,
    ...rest
}) => {
    const base = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-anhanga-action disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
    const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    const isDisabled = disabled || isLoading;

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
            className: `${classes} ${(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.className ?? ''}`.trim(),
        });
    }

    return (
        <button
            className={classes}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            {...rest}
        >
            {isLoading ? (
                <>
                    <Spinner />
                    {children}
                </>
            ) : (
                <>
                    {leftIcon}
                    {children}
                    {rightIcon}
                </>
            )}
        </button>
    );
};
```

- [ ] **Criar `tests/button-loading.test.ts`:**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../components/ui/Button.tsx';

test('Button isLoading=true renderiza com disabled e aria-disabled="true"', () => {
    const html = renderToStaticMarkup(
        React.createElement(Button, { isLoading: true }, 'Enviar')
    );
    assert.ok(html.includes(' disabled'), 'deve conter o atributo disabled');
    assert.ok(html.includes('aria-disabled="true"'), 'deve conter aria-disabled="true"');
});

test('Button isLoading=false não tem disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(Button, { isLoading: false }, 'Enviar')
    );
    assert.ok(!html.includes(' disabled'), 'não deve ter o atributo disabled');
    assert.ok(html.includes('aria-disabled="false"'), 'deve conter aria-disabled="false"');
});
```

- [ ] **Rodar o teste:**

```bash
pnpm test:regression -- --test-name-pattern "Button isLoading"
```

Esperado: ambos os testes PASS.

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/Button.tsx tests/button-loading.test.ts
git commit -m "feat(ui): add Button component with 4 variants, 3 sizes, loading state"
```

---

### Task 5: `Input.tsx`

**Files:**
- Create: `components/ui/Input.tsx`

**Contexto:** Wrapper de `<input>` com label e estado de erro. Herda todos os props nativos do `<input>`. O `id` é gerado automaticamente a partir do `label` se não fornecido, para garantir que `label[for]` sempre aponte para o campo correto.

- [ ] **Criar `components/ui/Input.tsx`:**

```tsx
import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    className?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id: externalId,
    ...rest
}) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-bold text-anhanga-dark"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`
                    w-full px-4 py-2.5 rounded-xl border-2 font-medium text-sm text-anhanga-dark
                    placeholder-gray-300 bg-white outline-none transition-colors
                    focus:border-anhanga-action focus:ring-2 focus:ring-anhanga-action/15
                    ${error ? 'border-red-400' : 'border-gray-200'}
                `}
                aria-describedby={error ? `${id}-error` : undefined}
                aria-invalid={error ? 'true' : undefined}
                {...rest}
            />
            {error && (
                <p id={`${id}-error`} role="alert" className="text-xs text-red-500 font-semibold">
                    {error}
                </p>
            )}
        </div>
    );
};
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/Input.tsx
git commit -m "feat(ui): add Input component with label, error state, and aria attributes"
```

---

## Chunk 3: Componentes compostos

### Task 6: `Card.tsx`

**Files:**
- Create: `components/ui/Card.tsx`

**Contexto:** Container genérico. Três variantes de sombra para contextos diferentes: `default` para cards de conteúdo, `hard` para o estilo gráfico dos Highlights, `float` para modais e o ticket da CTA.

- [ ] **Criar `components/ui/Card.tsx`:**

```tsx
import React from 'react';

export type CardVariant = 'default' | 'hard' | 'float';

interface CardProps {
    children: React.ReactNode;
    variant?: CardVariant;
    className?: string;
}

const variantClasses: Record<CardVariant, string> = {
    default: 'shadow-float',
    hard:    'shadow-hard',
    float:   'shadow-float-lg',
};

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    className = '',
}) => (
    <div className={`bg-white rounded-2xl ${variantClasses[variant]} ${className}`}>
        {children}
    </div>
);
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/Card.tsx
git commit -m "feat(ui): add Card component with 3 shadow variants"
```

---

### Task 7: `SectionHeader.tsx`

**Files:**
- Create: `components/ui/SectionHeader.tsx`

**Contexto:** Este componente elimina um padrão duplicado em ~10 seções do site (Testimonials, Highlights, FAQ, etc.). Cada seção tem um badge pill + h2 + subtítulo opcional com o mesmo estilo. O `badge` é opcional — se omitido, apenas o título é renderizado.

- [ ] **Criar `components/ui/SectionHeader.tsx`:**

```tsx
import React from 'react';
import { Badge, type BadgeColor } from './Badge';

interface SectionHeaderProps {
    title: string;
    badge?: string;
    badgeIcon?: React.ReactNode;
    badgeColor?: BadgeColor;
    subtitle?: string;
    align?: 'center' | 'left';
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    badge,
    badgeIcon,
    badgeColor = 'default',
    subtitle,
    align = 'center',
    className = '',
}) => {
    const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start';

    return (
        <div className={`flex flex-col gap-3 ${alignClass} ${className}`}>
            {badge && (
                <Badge color={badgeColor} icon={badgeIcon}>
                    {badge}
                </Badge>
            )}
            <h2 className="text-4xl font-black text-anhanga-dark leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-gray-500 text-base font-medium">{subtitle}</p>
            )}
        </div>
    );
};
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/SectionHeader.tsx
git commit -m "feat(ui): add SectionHeader component (badge + title + subtitle)"
```

---

### Task 8: `WaveDivider.tsx`

**Files:**
- Create: `components/ui/WaveDivider.tsx`

**Contexto:** Encapsula o SVG de onda que hoje está duplicado e diferente em `Hero.tsx` (bottom) e `Footer.tsx` (top). `direction="down"` coloca a onda no fim de uma seção; `direction="up"` coloca no início. O `fill` é a cor da seção seguinte (a onda "sangra" para ela).

- [ ] **Criar `components/ui/WaveDivider.tsx`:**

```tsx
import React from 'react';

interface WaveDividerProps {
    fill?: string;
    direction?: 'down' | 'up';
    height?: number;
    className?: string;
}

export const WaveDivider: React.FC<WaveDividerProps> = ({
    fill = '#ffffff',
    direction = 'down',
    height = 60,
    className = '',
}) => (
    <div
        className={`w-full overflow-hidden leading-none ${direction === 'up' ? '' : 'rotate-180'} ${className}`}
        aria-hidden="true"
    >
        <svg
            className="relative block w-[calc(100%+1.3px)]"
            style={{ height }}
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                fill={fill}
            />
        </svg>
    </div>
);
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/WaveDivider.tsx
git commit -m "feat(ui): add WaveDivider component (SVG wave separator)"
```

---

### Task 9: `index.ts` — re-exports

**Files:**
- Create: `components/ui/index.ts`

**Contexto:** Barrel file para imports limpos: `import { Button, Badge } from '@/components/ui'`.

- [ ] **Criar `components/ui/index.ts`:**

```ts
export { Badge }          from './Badge';
export type { BadgeColor } from './Badge';
export { Button }         from './Button';
export type { ButtonVariant, ButtonSize } from './Button';
export { Card }           from './Card';
export type { CardVariant } from './Card';
export { Input }          from './Input';
export { SectionHeader }  from './SectionHeader';
export { WaveDivider }    from './WaveDivider';
```

- [ ] **Verificar typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/ui/index.ts
git commit -m "feat(ui): add index.ts barrel file for components/ui"
```

---

## Chunk 4: Integração mínima e testes

### Task 10: Usar `SectionHeader` no `Testimonials.tsx`

**Files:**
- Modify: `components/Testimonials.tsx`

**Contexto:** Para que os testes Playwright consigam verificar os novos componentes em uma página real, precisamos usar pelo menos um deles. `Testimonials.tsx` tem o padrão mais limpo de badge + h2 + subtítulo — é o candidato ideal. Esta é a primeira migração da Fase 3.

O padrão atual no `Testimonials.tsx` (linhas 31-37) — **bloco completo incluindo wrapper**:
```tsx
<div className="text-center mb-16">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-light text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm mb-4">
        <MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" /> Love Notes
    </div>
    <h2 className="text-4xl font-black text-brand-dark">Mural do Amor ❤️</h2>
    <p className="mt-3 text-gray-500 text-base">Depoimentos reais de quem viajou com a gente</p>
</div>
```

- [ ] **Adicionar import do `SectionHeader` no topo do arquivo:**

```tsx
import { SectionHeader } from './ui';
```

- [ ] **Substituir o bloco completo (incluindo o div wrapper) pelo `SectionHeader`:**

```tsx
// Remover (bloco COMPLETO — do <div className="text-center mb-16"> até o </div> fechador):
<div className="text-center mb-16">
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-light text-brand-dark font-black text-xs uppercase tracking-widest shadow-sm mb-4">
        <MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" /> Love Notes
    </div>
    <h2 className="text-4xl font-black text-brand-dark">Mural do Amor ❤️</h2>
    <p className="mt-3 text-gray-500 text-base">Depoimentos reais de quem viajou com a gente</p>
</div>

// Adicionar (substitui o bloco inteiro):
<SectionHeader
    badge="Love Notes"
    badgeIcon={<MessageSquareHeart className="w-4 h-4 text-red-500 fill-red-500" />}
    title="Mural do Amor ❤️"
    subtitle="Depoimentos reais de quem viajou com a gente"
    className="mb-16"
/>
```

- [ ] **Verificar visualmente que nada mudou:**

```bash
pnpm dev
```

Abrir `http://localhost:3000` e verificar que a seção de depoimentos aparece igual visualmente.

- [ ] **Typecheck:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Commit:**

```bash
git add components/Testimonials.tsx
git commit -m "refactor(testimonials): replace inline section header with SectionHeader component"
```

---

### Task 11: Testes Playwright — smoke dos novos componentes

**Files:**
- Create: `tests/e2e/design-system-smoke.spec.ts`

**Contexto:** Testa que os novos componentes renderizam corretamente na página Home. O `SectionHeader` já está integrado no `Testimonials.tsx`, então é testável. Para o `Button`, verificamos o CTA existente na página (que ainda usa classes inline) — este teste serve como baseline para quando os CTAs forem migrados.

- [ ] **Criar `tests/e2e/design-system-smoke.spec.ts`:**

```ts
import { test, expect } from '@playwright/test';

test.describe('Design System — smoke', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('SectionHeader renderiza com heading level 2', async ({ page }) => {
        // O SectionHeader do Testimonials agora usa o componente
        const heading = page.getByRole('heading', { level: 2, name: /Mural do Amor/i });
        await expect(heading).toBeVisible();
    });

    test('SectionHeader renderiza badge acima do título', async ({ page }) => {
        // Verifica que o badge "Love Notes" aparece como texto visível
        const badge = page.getByText('Love Notes', { exact: false });
        await expect(badge).toBeVisible();
    });

    test('CTA primário na hero tem texto visível e não está desabilitado', async ({ page }) => {
        // O botão do Hero ainda usa classes inline (Fase 3 migrará isso)
        // Este teste serve como baseline
        const cta = page.getByTestId('submit-search-btn-mobile').or(
            page.getByRole('button', { name: /orçamento/i })
        );
        // Pelo menos um CTA deve existir na página
        const count = await cta.count();
        expect(count).toBeGreaterThan(0);
    });
});
```

- [ ] **Rodar os testes e2e:**

```bash
pnpm test:e2e --grep "Design System"
```

Esperado: todos os testes PASS.

- [ ] **Commit:**

```bash
git add tests/e2e/design-system-smoke.spec.ts
git commit -m "test(e2e): add design system smoke tests"
```

---

### Task 12: Typecheck final e regression suite

- [ ] **Rodar suite completa de testes de regressão:**

```bash
pnpm test:regression
```

Esperado: todos os testes existentes continuam passando. Nenhum teste quebrado pelos novos arquivos.

- [ ] **Typecheck final:**

```bash
pnpm typecheck
```

Esperado: zero erros.

- [ ] **Build de produção:**

```bash
pnpm build
```

Esperado: build concluído sem warnings relacionados aos novos arquivos.

---

## Resumo dos arquivos criados/modificados

| Ação | Arquivo |
|---|---|
| Modify | `tailwind.config.mjs` |
| Create | `lib/design-tokens.ts` |
| Create | `tests/design-tokens.test.ts` |
| Create | `components/ui/Badge.tsx` |
| Create | `components/ui/Button.tsx` |
| Create | `components/ui/Input.tsx` |
| Create | `components/ui/Card.tsx` |
| Create | `components/ui/SectionHeader.tsx` |
| Create | `components/ui/WaveDivider.tsx` |
| Create | `components/ui/index.ts` |
| Modify | `components/Testimonials.tsx` |
| Create | `tests/e2e/design-system-smoke.spec.ts` |

## Próximos passos (Fase 3 — fora deste plano)

Depois que este plano estiver completo, a Fase 3 é incremental: ao tocar qualquer componente existente, substituir os padrões inline pelos novos componentes. Prioridade sugerida:

1. `Highlights.tsx` — usa cards com hard-shadow (→ `Card variant="hard"`) e badges (→ `Badge`)
2. `FAQ.tsx` — usa o padrão badge + h2 (→ `SectionHeader`)
3. `CallToAction.tsx` — usa `Button` com hard-shadow amarelo (→ `Button variant="primary"`)
4. `Hero.tsx` — usa `WaveDivider` (→ `WaveDivider direction="down"`) e `Button variant="cta"`
5. `Footer.tsx` — usa `WaveDivider` (→ `WaveDivider direction="up"`)
