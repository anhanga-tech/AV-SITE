# Blog MDX + Keystatic — Fase 3 (FEL-96, 97, 98) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir renderização HTML do BlogPost por MDX nativo, criar configuração Keystatic com schema completo e expor a API serverless do Keystatic no Vercel.

**Architecture:** `BlogPost.tsx` carrega arquivos `.mdx` de `/content/blog/` via `import.meta.glob` + `React.lazy`; metadados (cor, imagem, autor) continuam vindo de `BLOG_POSTS`; o `MDXProvider` injeta componentes customizados (`ChatCTA`, tipografia). O `keystatic.config.ts` define o schema do CMS com `storage.kind: 'github'`. A API route em `api/keystatic/[...params].ts` usa `makeHandler` do `@keystatic/core/api` com runtime Node.js e é exposta via rewrite no `vercel.json` antes do catch-all SPA.

**Tech Stack:** React 19, Vite 7, `@mdx-js/react` 3, `@mdx-js/rollup` 3 (já configurado), `@keystatic/core` 0.5.48, TypeScript 5.9, Tailwind CSS 4, `react-router-dom` 7

---

## Chunk 1: ChatCTA + MDX components (FEL-96, parte 1)

### Task 1: Criar componente `ChatCTA`

**Files:**
- Create: `components/blog/ChatCTA.tsx`

**Contexto:** `ChatCTA` é um botão que abre o chat AI interno com uma mensagem pré-preenchida sobre um destino. Referenciado em MDX como `<ChatCTA destino="Orlando" />`. Usa `openAiChat` de `utils/aiChat`.

- [ ] **Step 1: Criar `components/blog/ChatCTA.tsx`**

```tsx
import React from 'react';
import { openAiChat } from '@/utils/aiChat';

interface ChatCTAProps {
  destino?: string;
  mensagem?: string;
  label?: string;
}

const ChatCTA: React.FC<ChatCTAProps> = ({
  destino,
  mensagem,
  label,
}) => {
  const message =
    mensagem ??
    (destino
      ? `Olá! Gostaria de planejar uma viagem para ${destino}.`
      : 'Olá! Gostaria de planejar minha viagem.');

  const buttonLabel = label ?? (destino ? `Planejar viagem para ${destino}` : 'Planejar minha viagem');

  return (
    <div className="not-prose my-8 flex justify-center">
      <button
        onClick={() => openAiChat({ message })}
        className="inline-flex items-center gap-3 bg-brand-cyan text-white text-base font-bold px-8 py-4 rounded-2xl shadow-[4px_4px_0px_#003B8E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default ChatCTA;
```

- [ ] **Step 2: Verificar build TypeScript sem erros**

```bash
cd "/Users/felipewilliams/Projetos/Anhangá Viagens/AV-SITE" && pnpm typecheck
```
Esperado: nenhum erro relacionado ao arquivo novo.

- [ ] **Step 3: Commit**

```bash
git add components/blog/ChatCTA.tsx
git commit -m "feat(blog): criar componente ChatCTA para MDX (FEL-96)"
```

---

### Task 2: Criar mapa de componentes MDX

**Files:**
- Create: `components/blog/mdxComponents.tsx`

**Contexto:** O `MDXProvider` recebe um mapa `components` que substitui elementos HTML padrão por componentes React com as classes Tailwind da Anhangá. O wrapper div do `BlogPost` já tem as classes `prose prose-lg` etc., então aqui mapeamos apenas o que precisa de tratamento especial (ex.: imagens) + os componentes customizados (`ChatCTA`).

- [ ] **Step 4: Criar `components/blog/mdxComponents.tsx`**

```tsx
import React from 'react';
import type { MDXComponents } from 'mdx/types';
import ChatCTA from './ChatCTA';

export const mdxComponents: MDXComponents = {
  // Componentes customizados da Anhangá disponíveis nos posts MDX
  ChatCTA,

  // Imagem: usa lazy loading e arredondamento padrão
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className="rounded-3xl shadow-lg my-10 w-full"
      {...props}
    />
  ),
};
```

- [ ] **Step 5: Verificar TypeScript**

```bash
pnpm typecheck
```
Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add components/blog/mdxComponents.tsx
git commit -m "feat(blog): criar mapa de componentes MDX (FEL-96)"
```

---

## Chunk 2: BlogPost.tsx MDX rendering (FEL-96, parte 2)

### Task 3: Atualizar `BlogPost.tsx` para renderizar MDX

**Files:**
- Modify: `pages/BlogPost.tsx`

**Decisões de design:**
1. `import.meta.glob` fica no topo do módulo (nível de arquivo) — não dentro do componente. Necessário para o Vite processar em build time.
2. Um `lazyComponentCache` evita re-criar o `React.lazy` a cada render (evita flashes ao navegar entre posts).
3. Mantém toda a estrutura visual existente (hero, sidebar, autor, schemas SEO, SocialShare).
4. Remove: `DOMPurify`, o import `dompurify`, o `useRef` de `contentRef`, e o `useEffect` de manipulação de links WA (era específico para HTML do Ghost).
5. Mantém: `useEffect` de `scrollTo(0,0)`, todos os schemas, SocialShare, seção do autor, posts relacionados, CTA final.
6. Para posts sem arquivo `.mdx` correspondente, exibe "Conteúdo em breve…" em vez do HTML antigo.

- [ ] **Step 7: Aplicar as mudanças em `pages/BlogPost.tsx`**

**a) Substituir os imports no topo do arquivo:**

Remover:
```
import { useEffect } from 'react';   // manter apenas se ainda usado
import DOMPurify from 'dompurify';
```

Adicionar:
```tsx
import { Suspense } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { mdxComponents } from '../components/blog/mdxComponents';
```

**b) Adicionar logo após os imports (nível de módulo, fora do componente):**

```tsx
// Deve ficar no nível do módulo para o Vite processar em build time
const mdxModuleMap = import.meta.glob<{ default: React.ComponentType }>(
  '/content/blog/*.mdx'
);

const lazyComponentCache: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {};

function getMdxComponent(
  slug: string
): React.LazyExoticComponent<React.ComponentType> | null {
  const key = `/content/blog/${slug}.mdx`;
  const importFn = mdxModuleMap[key];
  if (!importFn) return null;
  if (!lazyComponentCache[slug]) {
    lazyComponentCache[slug] = React.lazy(importFn);
  }
  return lazyComponentCache[slug];
}
```

**c) Dentro do componente BlogPost — remover:**
- `const contentRef = React.useRef<HTMLDivElement>(null);`
- O `useEffect` inteiro que manipulava links `a[href^="https://wa.me"]`

**d) Substituir o bloco `<div ref={contentRef} ... dangerouslySetInnerHTML={...} />` por:**

```tsx
{(() => {
  const MdxContent = getMdxComponent(slug!);
  if (!MdxContent) {
    return (
      <div className="prose prose-lg md:prose-xl max-w-none prose-p:font-serif prose-p:text-gray-600">
        <p>{post.excerpt}</p>
        <p className="text-gray-400 italic">Conteúdo completo em breve…</p>
      </div>
    );
  }
  return (
    <MDXProvider components={mdxComponents}>
      <div className="
        prose prose-lg md:prose-xl max-w-none
        prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tight prose-headings:text-brand-dark
        prose-p:font-serif prose-p:text-gray-600 prose-p:leading-8 prose-p:mb-6
        prose-a:text-brand-cyan prose-a:font-bold prose-a:no-underline prose-a:border-b-2 prose-a:border-brand-cyan/30 hover:prose-a:border-brand-cyan hover:prose-a:text-brand-cyanDark hover:prose-a:bg-brand-cyan/5 prose-a:transition-all
        prose-strong:text-brand-dark prose-strong:font-black
        prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-brand-yellow
        prose-li:font-serif prose-li:text-gray-600
        prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow prose-blockquote:bg-yellow-50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:font-serif prose-blockquote:text-gray-700
        first-letter:text-5xl first-letter:font-black first-letter:text-brand-dark first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]
      ">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        }>
          <MdxContent />
        </Suspense>
      </div>
    </MDXProvider>
  );
})()}
```

- [ ] **Step 8: Verificar TypeScript + build**

```bash
pnpm typecheck && pnpm build
```
Esperado: build completo sem erros TypeScript.

- [ ] **Step 9: Testar no dev server**

```bash
pnpm dev
```
Verificar em `http://localhost:3000`:
- [ ] `/blog/teste` → renderiza conteúdo do `content/blog/teste.mdx`
- [ ] Adicionar `<ChatCTA destino="Orlando" />` no `teste.mdx` → botão azul aparece
- [ ] `/blog/5-segredos-da-disney-que-ninguem-conta` → mostra "Conteúdo em breve…"
- [ ] `/blog/slug-inexistente` → tela "Artigo não encontrado"

- [ ] **Step 10: Commit**

```bash
git add pages/BlogPost.tsx
git commit -m "feat(blog): renderizar MDX com MDXProvider e React.lazy (FEL-96)"
```

---

## Chunk 3: keystatic.config.ts (FEL-97)

### Task 4: Criar `keystatic.config.ts`

**Files:**
- Create: `keystatic.config.ts` (raiz do projeto)

**Contexto:** Keystatic v0.5.x usa `config()`, `fields`, `collection` de `@keystatic/core`. Com `storage.kind: 'github'`, cada save faz um commit, acionando deploy automático. O `slugField: 'title'` usa `fields.slug()` que gera o slug a partir do título. O campo `content` usa `fields.mdx()` com o componente `ChatCTA` registrado como block.

**Atenção:** Substituir `'SEU_GITHUB_OWNER'` e `'SEU_REPO_NAME'` antes do primeiro deploy (FEL-99 deve cobrir via env vars ou configuração OAuth).

- [ ] **Step 11: Criar `keystatic.config.ts`**

```ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: {
      owner: 'SEU_GITHUB_OWNER',   // TODO: substituir antes do deploy (FEL-99)
      name: 'SEU_REPO_NAME',        // TODO: substituir antes do deploy (FEL-99)
    },
  },

  collections: {
    blogPosts: collection({
      label: 'Posts do Blog',
      slugField: 'title',
      path: 'content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Título',
            validation: { isRequired: true },
          },
        }),

        excerpt: fields.text({
          label: 'Resumo',
          description: 'Máx. 160 caracteres — usado no meta description e nos cards.',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),

        date: fields.date({
          label: 'Data de Publicação',
          validation: { isRequired: true },
        }),

        author: fields.select({
          label: 'Autor',
          options: [
            { label: 'Equipe Anhangá', value: 'equipe-anhanga' },
            { label: 'Ana Souza', value: 'ana-souza' },
            { label: 'Rafa Tech', value: 'rafa-tech' },
            { label: 'Chef Luigi', value: 'luigi' },
            { label: 'Mariana S.', value: 'mariana' },
            { label: 'Carlos Viajante', value: 'carlos' },
          ],
          defaultValue: 'equipe-anhanga',
        }),

        category: fields.select({
          label: 'Categoria',
          options: [
            { label: 'Dicas de Viagem', value: 'Dicas de Viagem' },
            { label: 'Destinos', value: 'Destinos' },
            { label: 'Planejamento', value: 'Planejamento' },
            { label: 'Gastronomia', value: 'Gastronomia' },
            { label: 'Disney', value: 'Disney' },
            { label: 'Europa', value: 'Europa' },
            { label: 'América do Norte', value: 'América do Norte' },
            { label: 'Cruzeiros', value: 'Cruzeiros' },
          ],
          defaultValue: 'Dicas de Viagem',
        }),

        image: fields.text({
          label: 'URL da Imagem de Capa',
          description: 'URL absoluta (https://...). Recomendado: 1200x675px.',
          validation: { isRequired: true },
        }),

        featured: fields.checkbox({
          label: 'Post em Destaque',
          description: 'Se marcado, aparece em destaque no BlogList.',
          defaultValue: false,
        }),

        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: (props) => props.value || 'Tag',
          }
        ),

        seoTitle: fields.text({
          label: 'Título SEO (opcional)',
          description: 'Se preenchido, substitui o título na tag title.',
        }),

        seoDescription: fields.text({
          label: 'Meta Description SEO (opcional)',
          description: 'Se preenchido, substitui o excerpt na meta description.',
          multiline: true,
        }),

        content: fields.mdx({
          label: 'Conteúdo',
          components: {
            ChatCTA: fields.mdx.block({
              label: 'Chat CTA',
              schema: {
                destino: fields.text({
                  label: 'Destino',
                  description: 'Ex.: "Orlando", "Paris". Personaliza a mensagem.',
                }),
                mensagem: fields.text({
                  label: 'Mensagem personalizada (opcional)',
                  multiline: true,
                }),
                label: fields.text({
                  label: 'Texto do botão (opcional)',
                }),
              },
            }),
          },
        }),
      },
    }),
  },
});
```

- [ ] **Step 12: Verificar TypeScript**

```bash
pnpm typecheck
```

Se houver erro em `fields.mdx.block`, a API exata pode diferir na versão instalada.
Verificar em: https://keystatic.com/docs/content-components

- [ ] **Step 13: Commit**

```bash
git add keystatic.config.ts
git commit -m "feat(blog): criar keystatic.config.ts com schema completo (FEL-97)"
```

---

## Chunk 4: Keystatic API route no Vercel (FEL-98)

### Task 5: Criar `api/keystatic/[...params].ts` e atualizar `vercel.json`

**Files:**
- Create: `api/keystatic/[...params].ts`
- Modify: `vercel.json`

**Contexto:** O Keystatic precisa de uma API route para autenticar com GitHub OAuth e ler/escrever arquivos `.mdx`. A função usa `makeHandler` de `@keystatic/core/api`. Deve ser Node.js runtime — o Keystatic usa APIs Node.js. O Vercel roteia funções em `/api/**` com prioridade sobre rewrites, mas adicionamos o rewrite explícito para garantir compatibilidade.

- [ ] **Step 14: Criar `api/keystatic/[...params].ts`**

```ts
import { makeHandler } from '@keystatic/core/api';
import keystatic from '../../keystatic.config';

// Keystatic usa APIs Node.js — NÃO usar Edge Runtime
// Ausência de "export const config = { runtime: 'edge' }" = Node.js por padrão

export default makeHandler({ config: keystatic });
```

- [ ] **Step 15: Verificar TypeScript**

```bash
pnpm typecheck
```

- [ ] **Step 16: Adicionar rewrite no `vercel.json`**

Na seção `"rewrites"`, adicionar o rewrite do Keystatic ANTES do catch-all SPA:

```json
"rewrites": [
  {
    "source": "/api/keystatic/:path*",
    "destination": "/api/keystatic/:path*"
  },
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

- [ ] **Step 17: Verificar build**

```bash
pnpm typecheck && pnpm build
```
Esperado: build sem erros.

- [ ] **Step 18: Commit**

```bash
git add "api/keystatic/[...params].ts" vercel.json
git commit -m "feat(blog): criar API route Keystatic no Vercel (FEL-98)"
```

---

## Verificação Final

- [ ] `pnpm typecheck` — sem erros
- [ ] `pnpm build` — build completo sem warnings críticos
- [ ] Dev server `/blog/teste` — MDX renderizado corretamente
- [ ] Dev server `/blog/teste` com `<ChatCTA destino="Orlando" />` no MDX — botão azul aparece
- [ ] Dev server `/blog/slug-legado` — "Conteúdo em breve…"
- [ ] Dev server `/blog/slug-inexistente` — "Artigo não encontrado"
- [ ] Após deploy: `POST /api/keystatic/github/oauth/callback` retorna status != 404

---

## Notas de Implementação

**`import.meta.glob` e caminhos:** O glob usa caminhos absolutos a partir da raiz do projeto Vite (começando com `/`). Se a resolução falhar em `pages/BlogPost.tsx`, testar com caminho relativo: `'../content/blog/*.mdx'`.

**`fields.mdx.block`:** Em `@keystatic/core` v0.5.x a API pode ser `fields.mdx.block()` inline ou `block()` importado separadamente. Verificar: https://keystatic.com/docs/content-components

**Redirect `/blog/:slug*` no `vercel.json`:** O redirect existente para `blog.anhanga.tur.br` ainda está ativo — em produção Vercel, redirects têm prioridade sobre funções e rewrites. Os posts MDX ficam disponíveis em produção somente após esse redirect ser removido (escopo de issue separada de migração de produção).
