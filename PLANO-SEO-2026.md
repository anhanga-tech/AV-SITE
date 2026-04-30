# Plano de Melhoria SEO — Anhangá Viagens

**Data:** 3 de março de 2026
**Baseado em:** Relatório Ahrefs (02/03/2026) + Semrush On-Page SEO Checker (03/03/2026) + Análise do código-fonte

---

## Diagnóstico: O que os relatórios dizem vs. o que o código já tem

A análise cruzada entre os relatórios e o código-fonte revelou uma **causa raiz** que explica a maioria dos problemas detectados pelo Ahrefs. Os relatórios identificaram 189 issues (Health Score 66/100), mas muitas delas derivam de um único problema técnico.

---

## 🚨 CAUSA RAIZ — Componente SEO.tsx não está injetando metatags

**O que acontece:** O componente `SEO.tsx` usa `<Helmet>` do `react-helmet-async`, porém **não importa** o `Helmet` e **não existe `HelmetProvider`** envolvendo o App. Isso significa que o `<Helmet>` silenciosamente falha e **nenhuma metatag é renderizada** no HTML final que os crawlers veem.

**Evidência no código:**
- `SEO.tsx` linha 1: `import React from 'react';` — só importa React, nenhum Helmet
- `SEO.tsx` linha 60: `<Helmet defer={false}>` — usado sem import
- Nenhum arquivo contém `HelmetProvider`
- O `react-helmet-async` está instalado no `node_modules` mas não está sendo utilizado corretamente

**Evidência nos relatórios:**
- Ahrefs: 8 páginas com "hash de conteúdo idêntico" (todas retornam o mesmo HTML sem diferenciação via metatags)
- Ahrefs: 8 páginas sem `<title>`, 14 sem H1 (na visão do crawler), 18 sem meta description
- Ahrefs: 8 páginas sem tag canonical, OG tags e Twitter Cards
- Semrush: recomenda "usar palavras-chave alvo na tag `<title>`" e "`<h1>`" para homepage e landing do Lollapalooza

**Isso já está implementado no código?** SIM — todas as páginas já possuem o componente `<SEO>` com title, description, canonical, keywords, OG e Twitter Cards configurados. O conteúdo está lá, só não está sendo injetado no DOM.

### Correção necessária (Prioridade MÁXIMA)

**Opção A — Migrar para React 19 native metadata (recomendada):**

O `index.html` já tem o comentário `<!-- SEO managed via React 19 native metadata in SEO.tsx -->`. O React 19 suporta `<title>`, `<meta>`, e `<link>` nativamente no JSX — eles são automaticamente hoistados para o `<head>`. Basta substituir o wrapper `<Helmet>` por um `<>` (Fragment):

```tsx
// ANTES (quebrado)
<Helmet defer={false}>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  ...
</Helmet>

// DEPOIS (React 19 nativo)
<>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={currentUrl} />
  <meta property="og:type" content={type} />
  ...
</>
```

**Opção B — Corrigir o uso do react-helmet-async:**

Adicionar o import no `SEO.tsx` e o Provider no `index.tsx`:

```tsx
// SEO.tsx - adicionar import
import { Helmet } from 'react-helmet-async';

// index.tsx - envolver o App
import { HelmetProvider } from 'react-helmet-async';
root.render(<HelmetProvider><App /></HelmetProvider>);
```

**Impacto estimado:** Corrigir este único item resolve automaticamente **~70% dos erros reportados** — titles, metas, canonicals, OG tags e Twitter Cards passam a funcionar em todas as páginas.

---

## Análise Detalhada: O que já está implementado vs. o que precisa de ação

### ✅ Já implementado (não captado pelos relatórios)

| Item | Status no código | Por que o relatório não captou |
|------|-----------------|-------------------------------|
| Title tags em todas as páginas | Presente em Home, Orlando, Beto Carrero, Lollapalooza, SiteMap, Privacy, Terms | O `<Helmet>` não injeta no DOM |
| Meta descriptions únicas | Presente em cada página com descrições específicas | Mesmo motivo |
| Canonical URLs | Definidas com lógica de normalização (trailing slash no blog, sem trailing slash no site) | Mesmo motivo |
| Open Graph tags (og:title, og:description, og:image, og:url) | Implementadas no componente SEO.tsx | Mesmo motivo |
| Twitter Card tags | Implementadas (summary_large_image) | Mesmo motivo |
| Keywords meta tag | Definidas por página | Mesmo motivo |
| Robots meta tag | `index, follow` por padrão | Mesmo motivo |
| Schema.org - Organization | `OrganizationSchema.tsx` com dados completos | Validação pode ter campos faltando |
| Schema.org - Service | Em cada landing page (Orlando, Beto Carrero, Lollapalooza) | Pode ter erros de validação |
| Schema.org - FAQPage | Em cada landing page com perguntas/respostas | Funcionando |
| Schema.org - BreadcrumbSchema | Em Home, landings, Terms | Funcionando |
| Schema.org - TravelAgency | No `index.html` (JSON-LD estático) | Pode conflitar com Organization |
| XML Sitemap | `public/sitemap.xml` com 6 URLs, lastmod 2026-02-27 | Funcionando |
| robots.txt | Configurado com Allow/Disallow, AI crawlers permitidos, Crawl-delay para bots agressivos | Funcionando |
| Lazy loading de imagens | `LazyImage.tsx` com IntersectionObserver + otimização via wsrv.nl | Funcionando |
| Otimização de imagens remotas | `optimizeRemoteImageUrl()` converte para WebP via wsrv.nl/Pexels params | Parcial — não resolve imagens de 9MB |
| Preconnect para CDN | Cloudinary, Google Fonts, grainy-gradients | Funcionando |
| Preload de imagem LCP | Imagem hero precarregada no `index.html` | Funcionando |
| Links internos no Footer | Todas as 7 páginas linkadas no footer menu | Funcionando |
| Redirect naked domain → www | `vercel.json` com `anhanga.tur.br → www.anhanga.tur.br` | Funcionando |
| SPA rewrite | `vercel.json` com `/(.*) → /index.html` | Funcionando |
| Defer de scripts 3rd-party | GTM, HubSpot carregados on-demand (scroll/click intent) | Performance otimizada |
| FAQ component com microdata | `FAQ.tsx` usa `itemScope` e `itemType` do schema.org inline | Funcionando |
| H1 em todas as páginas | Privacy tem H1, Terms tem H1, SiteMap tem H1, landings têm headers | Depende de renderização JS |

---

### 🔧 Ações necessárias (em ordem de prioridade)

#### FASE 1 — Crítico (resolver esta semana)

**1.1 Corrigir o componente SEO.tsx** ⭐ PRIORIDADE MÁXIMA
- Migrar para React 19 native metadata OU corrigir imports do react-helmet-async
- Testar com `curl` ou ferramenta de SSR para confirmar que metatags aparecem no HTML
- Verificar com Google Rich Results Test após deploy
- **Resolve:** Title tags (8 páginas), Meta descriptions (18 páginas), Canonicals (8 páginas), OG tags (8 páginas), Twitter Cards (8 páginas)

**1.2 Corrigir conflito de Schema.org (TravelAgency vs Organization)**
- O `index.html` tem um JSON-LD estático com `@type: "TravelAgency"`
- O `OrganizationSchema.tsx` renderiza outro JSON-LD com `@type: "Organization"`
- Ambos aparecem em toda página que usa `OrganizationSchema`
- **Solução:** Unificar em um único schema usando `@type: ["TravelAgency", "Organization"]` ou remover o estático do index.html e manter apenas o componente React (mais fácil de manter)
- O Ahrefs reportou erros de validação em 14 páginas

**1.3 Otimizar as 3 imagens pesadas do blog**
- `pexels-photo-35584616.jpeg` — **9,02 MB** (!!!)
- `pexels-photo-1306791.jpeg` — 2,32 MB
- `pexels-photo-9185786.jpeg` — 1,84 MB
- Essas URLs estão em `blogData.ts` e já passam pelo `optimizeRemoteImageUrl()` que aplica `?auto=compress&w=1200`, mas o Pexels original ainda é servido como fallback antes da otimização e o crawler baixa a URL original
- **Solução:** Migrar essas 3 imagens para Cloudinary (já usado para heroes) com transformações automáticas `f_auto,q_auto,w_800` — ficam abaixo de 100KB

**1.4 Corrigir link 404 no blog: `/tag/dicas/`**
- 4 páginas do blog apontam para `https://blog.anhanga.tur.br/tag/dicas/` que retorna 404
- **Solução:** Criar a tag "dicas" no blog (WordPress/Ghost?) ou redirecionar para `/tag/dicas-de-expert/` que existe

---

#### FASE 2 — Importante (resolver em 1-2 semanas)

**2.1 Adicionar links internos para páginas órfãs**
- O Footer já linka TODAS as 7 páginas internas, mas o Ahrefs marca como "órfãs" as landings e páginas institucionais
- **Causa provável:** As landings (Beto Carrero, Lollapalooza) são renderizadas fora do `MainSiteShell` (sem Header/Footer), então o Ahrefs pode não estar vendo os links no Footer dessas páginas
- **Solução:**
  - Adicionar links contextuais no conteúdo da homepage para cada landing (seção Destinations, Categories ou CTA)
  - Na SiteMap page, os links já existem — confirmar que estão como `<Link>` (React Router) e não apenas texto
  - Adicionar um mini-header ou breadcrumb navegável nas landings apontando de volta ao site principal

**2.2 Melhorar SEO de conteúdo para keywords-alvo (Semrush)**
- O Semrush recomenda para `www.anhanga.tur.br` (keywords: viagem, agência de viagem, pacotes de viagem, anhangá, anjaga):
  - Usar palavras-chave no `<h1>` — ✅ já está no código (`Agência de viagens em São Paulo...`), mas não renderiza por causa do bug do Helmet
  - Usar palavras-chave no `<body>` — precisa enriquecer conteúdo textual visível na homepage
  - Criar conteúdo mais informativo e legível
  - Enriquecer conteúdo com termos semânticos relacionados
- Para `lolla.anhanga.tur.br` (keywords: lollapalooza pacotes viagem):
  - Insira marcação de classificação agregada (AggregateRating) — adicionar ao schema da landing
  - Links internos apontando para a landing
  - Conteúdo mais informativo e legível

**2.3 Adicionar `hreflang` para clareza de idioma**
- O site é em português brasileiro, mas não tem `hreflang`
- Adicionar ao SEO.tsx: `<link rel="alternate" hreflang="pt-BR" href={currentUrl} />`
- Adicionar `<link rel="alternate" hreflang="x-default" href={currentUrl} />`

**2.4 Melhorar o sitemap.xml**
- Adicionar a rota `/orcamento` se existir como página real
- Considerar gerar sitemap dinâmicamente no build para sempre refletir as rotas do App.tsx
- Adicionar `<image:image>` tags para imagens principais de cada página (melhora Google Images)

---

#### FASE 3 — Otimizações (resolver em 2-4 semanas)

**3.1 Corrigir links para redirects (18 páginas)**
- O Ahrefs detectou 18 páginas linkando para URLs que fazem redirect
- Provável causa: links `http://` → `https://`, ou `anhanga.tur.br` → `www.anhanga.tur.br`
- **Solução:** Auditar todos os links nos componentes e data files para usar URLs canônicas diretas (com `www` e `https`)

**3.2 Implementar SSR/SSG ou Pre-rendering para SEO**
- Como SPA React, o conteúdo depende de JavaScript para renderizar
- Crawlers modernos (Google, Bing) executam JS, mas Ahrefs e outros não
- **Opções:**
  - **Prerender.io** ou plugin de Vercel para pre-rendering de páginas estáticas
  - **React Snap** para gerar HTML estático no build
  - **Migrar para Next.js** (mais trabalhoso, mas melhor resultado a longo prazo)
  - No mínimo: garantir que o `index.html` tenha título e meta description padrão como fallback

**3.3 Adicionar fallback de metatags no index.html**
- Atualmente o `<head>` do `index.html` não tem `<title>` nem `<meta description>`
- Crawlers que não executam JS veem uma página sem título
- **Solução rápida:** Adicionar no `index.html`:
```html
<title>Anhangá Viagens | Agência de Viagens Personalizadas em São Paulo</title>
<meta name="description" content="Agência de viagens em São Paulo com roteiros personalizados, experiências no Brasil e no mundo e suporte especializado.">
```
- O React 19 / Helmet sobrescreverá essas tags nas rotas específicas

**3.4 Melhorar Core Web Vitals**
- O site já implementa lazy loading, defer de scripts e preload de LCP
- **Possíveis melhorias adicionais:**
  - Adicionar `width` e `height` explícitos em todas as imagens para evitar CLS
  - Considerar `fetchpriority="high"` na imagem hero
  - Reduzir font variants carregados (atualmente carrega 6 pesos de Poppins + 4 de Inter + 4 de Merriweather)

**3.5 Implementar GEO (Generative Engine Optimization)**
- O `robots.txt` já permite crawlers de IA (GPTBot, PerplexityBot, Claude-Web) — ótimo
- **Melhorias para citação em IA:**
  - Adicionar seção "Sobre a Anhangá" com dados factuais (ano de fundação, certificações, números)
  - Adicionar atributos de autor/expertise nos blog posts
  - Incluir estatísticas únicas e dados originais no conteúdo
  - Manter timestamps "Última atualização" visíveis (já existe em Privacy e Terms)
  - Adicionar uma página `/sobre` com informações de E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

**3.6 Backlinks (Semrush)**
- O Semrush recomenda "Consiga links de mais fontes" tanto para homepage quanto para Lollapalooza landing
- **Estratégias:**
  - Registrar em diretórios de turismo (Cadastur já tem, divulgar)
  - Parcerias com blogs de viagem para guest posts
  - Produzir conteúdo linkável (guias definitivos, infográficos de destinos)
  - Responder em fóruns e comunidades de viagem com links relevantes

---

## Resumo Executivo

| Fase | Ação | Impacto | Esforço |
|------|------|---------|---------|
| 🚨 1.1 | Corrigir SEO.tsx (Helmet) | **ENORME** — resolve ~70% dos erros | Baixo (1-2h) |
| 🚨 1.2 | Unificar Schema.org | Alto — elimina erros de validação | Baixo (1h) |
| 🚨 1.3 | Otimizar 3 imagens pesadas | Alto — melhora Core Web Vitals | Baixo (30min) |
| 🚨 1.4 | Corrigir 404 `/tag/dicas/` | Médio — elimina links quebrados | Baixo (15min) |
| 🔧 2.1 | Links internos para páginas órfãs | Médio — melhora crawlability | Médio (2-3h) |
| 🔧 2.2 | Enriquecer conteúdo para keywords | Alto — melhora ranking | Alto (4-6h) |
| 🔧 2.3 | Adicionar hreflang | Baixo — clareza de idioma | Baixo (15min) |
| 🔧 2.4 | Melhorar sitemap.xml | Médio — cobertura completa | Baixo (30min) |
| ⚡ 3.1 | Corrigir links para redirects | Baixo — link equity | Médio (2h) |
| ⚡ 3.2 | Pre-rendering ou SSR | **ENORME** — SEO para crawlers sem JS | Alto (8-16h) |
| ⚡ 3.3 | Fallback metatags no index.html | Alto — proteção básica | Baixo (15min) |
| ⚡ 3.4 | Core Web Vitals | Médio — performance | Médio (2-3h) |
| ⚡ 3.5 | GEO para IA | Médio-Alto — futuro do search | Alto (ongoing) |
| ⚡ 3.6 | Estratégia de backlinks | Alto — autoridade de domínio | Alto (ongoing) |

**Prognóstico:** Implementando apenas as Fases 1 e 2, o Health Score do Ahrefs deve saltar de **66 para ~85+**, e o site passará a aparecer corretamente nos resultados do Google com títulos, descrições e rich snippets.
