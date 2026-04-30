# Plano de Ação SEO — Anhangá Viagens
**Data:** Março 2026
**Baseado em:** Análise competitiva (Western Skies Travel, Digital Travel Expert, Travel Market Report, MAYA Travel, Trip Design, OWT Travel) + auditoria do código-fonte do site.

---

## Diagnóstico do Site

### O que está bem implementado

- Blog completamente migrado para `/blog` e `/blog/:slug`, com redirects `/old-blog/*`
- `BlogPost.tsx` emite `ArticleSchema` + `PersonSchema` + `BreadcrumbSchema` por post
- `FAQ.tsx` usa microdata `schema.org/FAQPage` na Home
- `SEO.tsx` robusto: hreflang pt-BR + x-default, canonical normalizado, OG 1200×630, Twitter cards
- Keystatic CMS instalado para edição sem código
- Vercel Analytics + Speed Insights ativos

### Gaps identificados

- 8 artigos no blog — volume muito baixo para ranqueamento orgânico consistente
- Sem artigo posicionando a Anhangá como agência de viagens personalizadas em São Paulo.
- Sem `/sitemap.xml` dinâmico em XML (existe `SiteMap.tsx` como página HTML, não consumível pelo Google)
- Uma imagem de artigo ainda aponta para `blog.anhanga.tur.br` (domínio antigo do Ghost)
- Alguns posts sem arquivo `.mdx` correspondente (exibem "Conteúdo completo em breve…")

---

## Resumo da Análise Competitiva

| Competidor | Conteúdo | Schemas | Plataforma | Ameaça |
|---|---|---|---|---|
| Digital Travel Expert | 2.500+ palavras | FAQPage + 5 tipos | Custom/WP | Médio (EN) |
| MAYA Travel | **334 palavras** | Article + Org | WordPress | **Alta (PT-BR)** |
| OWT Travel | Institucional | Org + WebPage | WordPress | Alta (autoridade 20 anos) |
| Trip Design | Desconhecido | Nenhum | **Wix** | Baixa |
| Western Skies Travel | 404 | N/A | N/A | Nenhuma |
| Travel Market Report | Removido | N/A | N/A | Nenhuma |

**Maior oportunidade:** Reposicionar a Anhangá para "agência de viagens personalizadas em São Paulo" com conteúdo de 1.200+ palavras e FAQPage schema.

---

## Prioridade 1 — Imediato (esta semana)

### 1.1 Criar artigo "Como escolher uma agência de viagens personalizadas?"

**Arquivo:** `/content/blog/como-escolher-agencia-viagens-personalizadas.mdx`
**Meta:** Capturar buscas comerciais por planejamento de viagem sob medida em São Paulo.

Estrutura mínima (1.200 palavras):

```
H1 → Como escolher uma agência de viagens personalizadas?
H2 → Diferença entre pacote pronto e viagem sob medida
H2 → O que faz a Anhangá trabalhar com atendimento consultivo
H2 → Para quem é ideal uma viagem personalizada?
H2 → Como começar sua viagem personalizada
H2 → Perguntas frequentes (5 perguntas → FAQPage schema)
```

Referências de concorrentes para bater:
- Páginas comerciais de agências personalizadas em São Paulo
- Guias de consultoria de viagem e planejamento sob medida

### 1.2 Corrigir imagem com URL do domínio antigo

No `data/blogManifest.ts`, o artigo "Melhores destinos para o Carnaval 2026" usa uma URL de imagem apontando para `blog.anhanga.tur.br`. Migrar para Cloudinary ou substituir por URL estável antes de desativar o domínio antigo.

---

## Prioridade 2 — Curto Prazo (2–3 semanas)

### 2.1 Gerar `/sitemap.xml` dinâmico

**Criar:** `api/sitemap.ts`
Gerar XML com:
- Rotas estáticas: `/`, `/sobre`, `/blog`, `/melhor-idade`, `/orlando`, `/beto-carrero`, `/lollapalooza`
- Cada entrada do `BLOG_POST_MANIFEST` como `/blog/:slug`
- `<lastmod>` a partir da `date` do post
- Prioridades: home=1.0, landings=0.9, blog posts=0.8

Adicionar `<link rel="sitemap" href="/sitemap.xml">` no `index.html`.

### 2.2 Completar MDX dos posts sem conteúdo

Posts que exibem "Conteúdo completo em breve…" não contribuem para SEO. Prioridades por potencial de busca:

1. "Lua de Mel nas Maldivas" (`lua-de-mel-nas-maldivas`)
2. "Nova York no Natal" (`nova-york-no-natal`)
3. "Europa Gastronômica: Roteiro Itália" (`europa-gastronomica-roteiro-italia`)

### 2.3 Criar artigo "Viagens para Melhor Idade / Turismo 50+"

A landing `/melhor-idade` existe mas não há conteúdo de blog apoiando a keyword.

Keywords alvo:
- "viagens para melhor idade"
- "turismo 50 anos"
- "pacotes de viagem para idosos"

O artigo deve linkar para `/melhor-idade`.

---

## Prioridade 3 — Médio Prazo (1–2 meses)

### 3.1 Cadência mínima: 2 artigos/mês

Volume de conteúdo é o maior gap: 8 artigos em 5 meses é insuficiente para autoridade orgânica.

Calendário editorial sugerido:

| Artigo | Keyword alvo | Landing interna |
|---|---|---|
| "Quanto custa uma viagem para Orlando?" | viagem orlando preço | /orlando |
| "Melhores parques da Disney em 2026" | disney parques 2026 | /orlando |
| "Roteiro Itália 15 dias" | roteiro itália | — |
| "Viagem lua de mel Maldivas: vale a pena?" | lua de mel maldivas | — |
| "Beto Carrero World: guia completo" | beto carrero world ingresso | /beto-carrero |
| "Como planejar uma viagem em grupo" | viagem em grupo | — |

### 3.2 OG Images por categoria

Criar imagens 1200×630 com branding Anhangá para as categorias principais (Cruzeiros, Romance, Festivais) como fallback quando a imagem do post for de baixa qualidade ou external.

### 3.3 Adicionar `dateModified` nos posts

`ArticleSchema.tsx` emite `datePublished` mas não `dateModified`. Atualizar posts antigos com data de revisão melhora sinal de frescor.

---

## Prioridade 4 — Longo Prazo (2–4 meses)

### 4.1 Páginas de destino SEO por cidade

O banco de 110+ destinos em `data/destinations.tsx` não está gerando páginas indexáveis. Começar pelos de maior volume de busca:

- `/destinos/orlando` (merge com `/orlando`)
- `/destinos/maldivas`
- `/destinos/cancun`
- `/destinos/europa`
- `/destinos/bali`

Cada página: `ServiceSchema` + `FAQPageSchema` + `BreadcrumbSchema`.

### 4.2 Página de credenciais / E-E-A-T

O FAQ menciona CADASTUR (37.036.792/0001-41) e credenciamentos (Beto Carrero World, Hopi Hari). Criar `/sobre/credenciais` ou seção expandida em `/sobre` exibindo isso visualmente melhora o sinal E-E-A-T no algoritmo do Google.

---

## Tabela-Resumo

| # | Ação | Impacto | Esforço | Prazo |
|---|---|---|---|---|
| 1.1 | Artigo "agência de viagens personalizadas" | Alto | Baixo | Esta semana |
| 1.2 | Corrigir imagem do domínio antigo | Médio | Muito baixo | Esta semana |
| 2.1 | Sitemap XML dinâmico | Alto | Médio | 2 semanas |
| 2.2 | Completar MDX dos posts incompletos | Médio | Baixo | 2 semanas |
| 2.3 | Artigo "Viagens Melhor Idade" | Alto | Baixo | 3 semanas |
| 3.1 | Cadência 2 artigos/mês | Alto | Contínuo | Mês 1+ |
| 3.2 | OG Images por categoria | Baixo | Baixo | Mês 2 |
| 3.3 | `dateModified` nos posts | Baixo | Muito baixo | Mês 2 |
| 4.1 | Páginas de destino por cidade | Alto | Alto | Mês 2–4 |
| 4.2 | Página de credenciais / E-E-A-T | Médio | Baixo | Mês 3 |
