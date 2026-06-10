# Auditoria SEO/GEO — Junho 2026

**Data:** 10/06/2026
**Fontes:** Ahrefs Site Audit (crawl de 08/06/2026, 222 URLs, 13 issues ativos) + análise do código-fonte
**Escopo:** SEO técnico, conteúdo e GEO (Generative Engine Optimization / visibilidade em LLMs)

---

## Sumário executivo

O site está tecnicamente saudável (39 páginas indexáveis, canonical/hreflang/sitemap corretos, prerender funcionando). Os 13 issues do Ahrefs se reduzem a **4 causas-raiz de código** — todas corrigidas nesta rodada — mais ajustes editoriais de titles/metas e ações de dashboard.

| Causa-raiz | Issues do Ahrefs resolvidos | Status |
|---|---|---|
| Links internos sem trailing slash | 3XX redirect (33), links para redirect (31), só 1 dofollow inlink (24) | ✅ Corrigido |
| Propriedades inválidas no JSON-LD | Schema validation error (8 páginas) | ✅ Corrigido |
| /quiz com conteúdo fino | Page has no outgoing links (1) | ✅ noindex, follow |
| Links externos para redirect | External 3XX redirect (3) | ✅ Corrigido |
| Titles/metas fora do tamanho | Title too long (11), meta desc longa/curta (4) | ✅ Corrigido (titles aprovados em 10/06) |

---

## 1. Causa-raiz: trailing slash nos links internos (impacto alto)

O Cloudflare Pages serve páginas prerenderizadas como diretórios (`/blog/slug/index.html`) e responde **308 redirect** para URLs sem a barra final. Os links internos apontavam para `/blog/slug` (sem `/`):

- `getBlogPostUrl()` em `utils/blog.ts` gerava URLs sem trailing slash — usado por related posts (sidebar + mobile), grade do blog na home, mapa do site e compartilhamento social
- Links em markdown dentro dos 24 posts MDX (`content/blog/*.mdx`)

**Consequência:** todo o link equity interno dos posts passava por redirect. O Ahrefs reportava cada um dos 24 posts com apenas 1 inlink dofollow direto — o blog inteiro estava subotimizado para distribuição de autoridade.

**Fix aplicado:** trailing slash em `getBlogPostUrl()`, correção de todos os links MDX, link com âncora do banner de cookies (`/politica-privacidade/#cookies`). Regressão garantida por `tests/internal-link-trailing-slash.test.ts` (escaneia os MDX e o helper).

## 2. Causa-raiz: JSON-LD com propriedades fora do vocabulário schema.org

Exatamente 8 páginas com erro de validação no Ahrefs:

- `keywords` não é propriedade válida do tipo `Service` (só `CreativeWork`/`Event`) — afetava Home + 6 landings (Beto Carrero, Orlando, Lollapalooza, Melhor Idade, Consultoria, Curadoria Cruzeiros)
- `blog` não existe no vocabulário schema.org para `Organization` — afetava Home e Sobre

**Fix aplicado:** prop `keywords` removida de `ServiceSchema.tsx` e das 7 páginas; propriedade `blog` removida de `OrganizationSchema.tsx`. Regressão: `tests/schema-org-properties.test.ts`.

## 3. /quiz: conteúdo fino

87 palavras, zero links internos de saída, indexável. É página de conversão (lead capture), não de ranking.

**Fix aplicado:** `robots="noindex, follow"` + exclusão do sitemap.xml (flag `noindex: true` em `lib/site-routes.js`, mantendo o prerender). Segue o mesmo padrão do `/nps`.

## 4. Links externos para redirect

- `https://www.abav.com.br/` → 301 → `https://abav.com.br/`
- `https://cadastur.turismo.gov.br/` → 301 → `https://cadastur.turismo.gov.br/hotsite/`

**Fix aplicado:** hrefs do Footer atualizados para as URLs finais (verificadas via curl em 10/06/2026).

## 5. Titles e meta descriptions (aplicado em 10/06/2026)

O componente `Seo.tsx` anexa ` | Anhangá Viagens` (+18 chars) ao title. Posts com títulos editoriais longos estouravam os ~60 chars exibidos na SERP.

**Fix aplicado:**
- `pages/BlogPost.tsx` passou a consumir `seoTitle`/`seoDescription` do frontmatter (existiam no tipo `PostMeta` mas eram ignorados — 8 posts tinham valores legados nunca renderizados, e por serem >42 chars foram substituídos)
- `seoTitle` ≤42 chars aplicado em 19 posts; `seoDescription` 110–160 aplicada/ajustada em `lua-de-mel-nas-maldivas`, `nova-york-no-natal` e `ferias-julho-2026-destinos`
- Titles encurtados em Home, Orlando, Lollapalooza, Beto Carrero e Melhor Idade; descriptions de `mapa-do-site` e `termos-de-uso` alongadas para a faixa
- Resultado validado no `dist/`: todas as páginas indexáveis com `<title>` ≤60 chars
- Regressão: `tests/seo-title-length.test.ts` valida title ≤60 e description 110–160 para todos os posts do manifest

Casos corrigidos (comprimento anterior com sufixo):

| Página | Title atual | Chars |
|---|---|---|
| /blog/seguro-viagem-internacional-2026 | Seguro Viagem Internacional: Quando É Obrigatório… | 110 |
| /blog/etias-2026-brasileiros-europa | ETIAS 2026: O Que Mudou para Brasileiros… (P&R) | 92 |
| /blog/jalapao-julho-roteiro-custos | Jalapão em Julho: Roteiro, Custos… | 90 |
| /blog/ferias-julho-2026-destinos | Férias de Julho 2026: 10 Destinos… | 86 |
| /blog/disney-ou-beto-carrero | Disney vs Beto Carrero: Qual Escolher… | 85 |
| /blog/agencia-de-viagens-ou-por-conta-propria | Agência de Viagens ou Por Conta Própria?… | 85 |
| /blog/cancun-punta-cana-aruba-lua-de-mel | Cancún, Punta Cana ou Aruba para Lua de Mel?… | 81 |
| /blog/viagem-corporativa-para-pequenas-empresas… | Viagem Corporativa para Pequenas Empresas… | 74 |
| /blog/copa-do-mundo-2026-as-cidades-sede… | Copa do Mundo 2026: guia das cidades-sede… | 75 |
| / (home) | Agência de Viagens em São Paulo \| Roteiros Sob Medida | 71 |
| Demais posts entre 61–68 chars | — | menor prioridade |

Meta descriptions fora da faixa 110–160: `disney-ou-beto-carrero` (166), `cancun-punta-cana-aruba-lua-de-mel` (167), `lua-de-mel-nas-maldivas` (81), `nova-york-no-natal` (77), `mapa-do-site` (103), `termos-de-uso` (104).

## 6. Falsos positivos do Ahrefs (não corrigir)

- **Missing alt text (2):** `favicon.svg` com `alt="" aria-hidden="true"` nas landings de consultoria e cruzeiros — padrão correto de acessibilidade para ícone decorativo
- **HTTP to HTTPS redirect (2):** redirects apex→www e http→https são o comportamento desejado
- **Links bloqueados por robots (184):** Instagram, LinkedIn share, WhatsApp share e scripts `cdn-cgi` do Cloudflare — bloqueios dos robots.txt de terceiros, sem ação possível
- **Word count changed (3):** informativo, sem ação

---

## GEO (Generative Engine Optimization)

### Infraestrutura existente (boa base)

- `public/llms.txt` com dados da empresa, especialidades e credenciamentos
- `robots.txt` com allow explícito para GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended etc.; bloqueio de bots training-only (CCBot, Bytespider); `Content-Signal: ai-train=no, search=yes, ai-input=yes`
- `/api/markdown` (content negotiation) servindo versões markdown das páginas para agentes
- JSON-LD rico: TravelAgency/Organization, Service, BlogPosting, FAQPage, BreadcrumbList, Person

### Melhorias aplicadas nesta rodada

1. **`/api/markdown` agora cobre o blog inteiro:** índice em `?path=/blog/` e cada post em `?path=/blog/{slug}/` (módulo `data/blogMarkdown.ts` gerado no build a partir dos MDX — separado do manifest para não inflar o bundle do cliente)
2. **RSS feed:** `public/feed.xml` (RSS 2.0) gerado no build por `scripts/generate-feeds.ts` a partir do `blogManifest`; `<link rel="alternate" type="application/rss+xml">` no head
3. **`llms.txt` automatizado:** a seção do blog agora é regenerada no build com todos os 24 posts (com URLs), referência ao feed RSS e à API de markdown

### Recomendações futuras (não implementadas)

- **Conteúdo citável:** posts com dados concretos (preços, datas, comparações) são os mais citados por LLMs — manter o padrão dos posts de seguro viagem/ETIAS
- **FAQPage nos posts do blog:** posts em formato P&R (ex.: ETIAS) se beneficiariam do schema FAQPage além do BlogPosting
- **Monitorar citações:** testar periodicamente consultas como "agência de viagens São Paulo personalizada" no ChatGPT/Perplexity/Gemini e registrar se a Anhangá é citada

---

## Ações de dashboard (fora do código)

1. **IndexNow (34 páginas pendentes no Ahrefs):** ativar a integração nativa do Cloudflare (Dashboard → Websites → anhanga.tur.br → Speed/Crawler Hints) ou submeter via API do IndexNow após cada deploy
2. **Recrawl no Ahrefs** após o deploy destas correções para confirmar a queda dos issues (esperado: de 13 para ~3 issues, restando apenas os editoriais até a aprovação dos titles)
3. **Google Search Console:** re-submeter o sitemap e pedir reindexação das páginas de maior tráfego

## Limpeza de documentação sugerida

Docs SEO antigos supersedidos por esta auditoria (avaliar remoção; movidos da raiz para `docs/seo/` pelo PR #843): `docs/seo/issues-2026.md` e `docs/seo/plan-2026.md` (março/2026, baseados em relatórios anteriores), além do diretório `SEO/` na raiz com CSVs do crawl de maio/2026 (dados brutos, candidatos a `.gitignore` ou exclusão).
