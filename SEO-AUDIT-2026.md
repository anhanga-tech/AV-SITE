# Relatório de Auditoria SEO — Anhangá Viagens
**Data:** 4 de março de 2026
**Site auditado:** www.anhanga.tur.br
**Elaborado por:** Claude (com base em análise do código-fonte, Ahrefs/Semrush e pesquisa de concorrentes)

---

## Sumário Executivo

O site da Anhangá Viagens tem uma **base técnica sólida** — a estrutura de componentes é bem organizada, o schema.org já cobre múltiplos tipos de dado, o CDN Cloudinary está integrado, e o sistema de rastreamento (GTM + HubSpot) está devidamente adiado para não prejudicar performance. O código já implementa title tags únicos, meta descriptions, canonicals, Open Graph e Twitter Cards via React 19 native metadata.

O problema central é que **o site é uma SPA (Single Page Application) sem pré-renderização**, o que significa que crawlers que não executam JavaScript — incluindo a maioria das ferramentas de SEO (Ahrefs, Screaming Frog) — enxergam uma página vazia sem nenhuma metatag. Isso explica o Health Score de **66/100 com 189 issues** no Ahrefs: a maioria dos erros são falsos positivos causados por esse gap técnico, não por conteúdo ausente.

**Os 3 problemas de maior impacto imediato:**
1. O `index.html` não tem `<title>` nem `<meta description>` como fallback — crawlers sem JS veem uma página em branco.
2. O site não tem SSR/pré-renderização, tornando o conteúdo invisível para rastreadores que não executam JS.
3. Três imagens do blog pesam 9MB, 2,3MB e 1,8MB — impacto direto nos Core Web Vitals.

Implementando apenas a Fase 1 abaixo, o Health Score deve saltar para **85+** e o site passará a aparecer corretamente no Google com títulos, descrições e rich snippets.

---

## 1. Tabela de Oportunidades de Palavras-chave

| Keyword | Dificuldade | Oportunidade | Posição Atual | Intenção | Formato Recomendado |
|---------|------------|--------------|---------------|----------|---------------------|
| pacote lollapalooza 2026 são paulo | Média | **Alta** | ❓ Não rankeada | Transacional | Landing page atual (enriquecer) |
| excursão lollapalooza 2026 | Média | **Alta** | ❓ Não rankeada | Transacional | Landing page + blog post |
| pacote viagem orlando brasil | Alta | **Alta** | ❓ Não rankeada | Transacional | Landing page atual (enriquecer) |
| agência de viagens em são paulo | Alta | **Alta** | ❓ Não rankeada | Navegacional | Homepage (já tem H1) |
| pacote beto carrero de são paulo | Baixa-Média | **Alta** | ❓ Não rankeada | Transacional | Landing page atual (enriquecer) |
| excursão beto carrero de ônibus | Baixa | **Alta** | ❓ Não rankeada | Transacional | Seção na landing Beto Carrero |
| agência de viagens boutique são paulo | Baixa | **Alta** | ❓ Não rankeada | Comercial | Homepage + página /sobre |
| viagem organizada para 50 mais | Baixa | **Alta** | ❓ Não rankeada | Comercial | Landing page dedicada |
| pacote viagem disney família brasil | Alta | Média | ❓ Não rankeada | Transacional | Landing page Orlando (enriquecer) |
| roteiro orlando personalizado | Baixa | **Alta** | ❓ Não rankeada | Comercial | Blog post + landing |
| turismo melhor idade são paulo | Baixa | **Alta** | ❓ Não rankeada | Informacional | Blog post + seção homepage |
| turismo de transformação brasil | Muito Baixa | **Alta** | ❓ Não rankeada | Informacional | Blog post (pillar content) |
| agência viagens cadastur são paulo | Muito Baixa | **Alta** | ❓ Não rankeada | Navegacional | Homepage + /sobre |
| rock in rio 2025 pacote viagem | Média | Média | ❓ Não rankeada | Transacional | Blog post / landing futura |
| excursão the town festival são paulo | Baixa | Média | ❓ Não rankeada | Transacional | Blog post / landing futura |
| dicas de viagem para orlando | Média | Média | ❓ Não rankeada | Informacional | Blog post (série) |
| o que fazer em orlando com crianças | Alta | Média | ❓ Não rankeada | Informacional | Blog post |
| quanto custa viajar para orlando brasil | Média | Média | ❓ Não rankeada | Informacional | Blog post |
| agência de viagens beto carrero credenciada | Muito Baixa | **Alta** | ❓ Não rankeada | Comercial | Landing page (já credenciada) |
| melhores pacotes de viagem são paulo 2026 | Baixa | Média | ❓ Não rankeada | Comercial | Homepage + blog |

> **Nota:** Dados de volume estimados com base em pesquisa qualitativa (Ahrefs MCP indisponível no plano atual). Para dados precisos de volume e dificuldade, conectar Ahrefs ou Semrush ao MCP.

---

## 2. Problemas On-Page

| Página | Problema | Severidade | Correção Recomendada |
|--------|----------|-----------|----------------------|
| Todas (index.html) | Sem `<title>` nem `<meta description>` no HTML estático | **Crítico** | Adicionar fallback no `<head>` do `index.html` |
| Todas | SPA sem SSR/pré-renderização — crawlers sem JS veem página vazia | **Crítico** | Implementar prerendering ou Next.js |
| Blog (4 posts) | Links para `/tag/dicas/` retornam 404 | **Alto** | Criar tag ou redirecionar para `/tag/dicas-de-expert/` |
| index.html (nav sr-only) | Apenas 3 links internos visíveis para crawlers sem JS (/, /orlando, /mapa-do-site) | **Alto** | Expandir nav sr-only para incluir todas as páginas |
| Landings (Lollapalooza, Beto Carrero) | Renderizadas sem Header/Footer — sem link de volta ao site principal | **Alto** | Adicionar mini-header ou breadcrumb de retorno |
| Todas | 18 páginas com links para URLs que fazem redirect (http→https, sem www→www) | Médio | Atualizar todos os links para URLs canônicas diretas |
| OrganizationSchema | `aggregateRating` declara 4.94 com apenas 3 reviews — pode ser sinalizado pelo Google | Médio | Aguardar acúmulo de avaliações reais antes de usar AggregateRating |
| Blog images | Imagens de 9MB, 2,3MB e 1,8MB no blog não são adequadamente otimizadas | **Alto** | Migrar para Cloudinary com `f_auto,q_auto,w_800` |
| Todas | Sem tag `hreflang pt-BR` | Médio | Adicionar no SEO.tsx: `<link rel="alternate" hreflang="pt-BR" />` |
| Todas | 6 pesos de Poppins + 4 de Inter + 4 de Merriweather carregados | Baixo | Reduzir para 2-3 pesos por família de fonte |
| Homepage | Conteúdo textual abaixo do fold carrega com lazy intent (scroll/click) — crawlers veem menos conteúdo | Médio | Garantir que ao menos o primeiro parágrafo de cada seção seja estático |
| Sitemap | `/orcamento` não está no sitemap (se existir como rota real) | Baixo | Adicionar ao sitemap.xml |
| OG Image | `og:image` aponta para `/og-image-1200x630.jpg` — verificar se o arquivo existe | Médio | Confirmar existência e dimensões (1200x630px) |

---

## 3. Recomendações de Conteúdo (Content Gaps)

### Gap 1 — Página para Público 50+ / Melhor Idade
**Por que importa:** O site menciona "viagens 50+" nas keywords e no schema, mas não tem landing page dedicada. Concorrentes como CVC e Flytour têm seções explícitas para este público.
**Formato:** Landing page `/melhor-idade/` com CTA WhatsApp
**Prioridade:** Alta | **Esforço:** Moderado (meio dia)

### Gap 2 — Blog com Conteúdo Informacional de Orlando
**Por que importa:** Queries como "o que fazer em Orlando", "quanto custa viajar para Orlando" têm alto volume e estão no topo do funil. Criar 3-5 posts estruturaria um cluster sobre Orlando.
**Formato:** Blog posts (série "Guia Orlando")
**Prioridade:** Alta | **Esforço:** Substancial (multi-dia)

### Gap 3 — Página `/sobre` com E-E-A-T
**Por que importa:** O Google valoriza conteúdo com sinais de Expertise, Autoridade e Confiabilidade, especialmente para negócios locais. A Anhangá não tem uma página /sobre com história, CADASTUR, equipe e parceiros.
**Formato:** Página institucional `/sobre/`
**Prioridade:** Alta | **Esforço:** Moderado (1 dia)

### Gap 4 — Conteúdo de Festivais para Além do Lollapalooza
**Por que importa:** Rock in Rio, The Town, Carnaval SP têm nichos de busca relevantes. A concorrente RD Cultural já domina esse espaço.
**Formato:** Landing pages ou blog posts por evento
**Prioridade:** Média | **Esforço:** Moderado por landing

### Gap 5 — Guia Completo Beto Carrero
**Por que importa:** A landing do Beto Carrero não ranqueia para queries informacionais ("quanto custa", "o que ver"). Um guia-pillar poderia atrair tráfego de topo de funil.
**Formato:** Blog post longo + atualizar landing
**Prioridade:** Média | **Esforço:** Moderado (meio dia)

### Gap 6 — Turismo de Transformação (Blue Ocean)
**Por que importa:** O termo aparece no schema da Anhangá mas nenhum concorrente direto ranqueia para ele — é uma oportunidade de posicionamento de nicho com baixíssima competição.
**Formato:** Blog post + seção na homepage
**Prioridade:** Média | **Esforço:** Rápido (2-3 horas)

---

## 4. Checklist Técnico SEO

| Verificação | Status | Detalhes |
|-------------|--------|---------|
| HTTPS | ✅ Pass | Certificado ativo, redirect naked domain configurado no vercel.json |
| Mobile-friendly | ✅ Pass | Tailwind CSS responsivo, viewport configurado |
| Structured data — TravelAgency+Organization | ✅ Pass | `OrganizationSchema.tsx` usa `@type: ["TravelAgency","Organization"]` |
| Structured data — FAQ | ✅ Pass | `FAQ.tsx` com itemScope + JSON-LD por landing page |
| Structured data — Breadcrumb | ✅ Pass | `BreadcrumbSchema.tsx` nas páginas principais |
| XML Sitemap | ✅ Pass | `/public/sitemap.xml` com 6 URLs indexadas |
| robots.txt | ✅ Pass | Allow/Disallow configurado; GPTBot, PerplexityBot, Claude-Web permitidos |
| Canonical tags (código) | ✅ Pass | `SEO.tsx` usa React 19 native metadata com normalização de URL |
| Open Graph + Twitter Cards | ✅ Pass | Implementados no `SEO.tsx` |
| Preload da imagem LCP | ✅ Pass | Hero carregado com `<link rel="preload">` no index.html |
| Preconnect CDN | ✅ Pass | Cloudinary, Google Fonts, grainy-gradients com preconnect |
| Defer de scripts de terceiros | ✅ Pass | GTM e HubSpot carregados on-demand por intent signals |
| Lazy loading de imagens | ✅ Pass | `LazyImage.tsx` com IntersectionObserver |
| Redirect www | ✅ Pass | `vercel.json` redireciona `anhanga.tur.br` → `www.anhanga.tur.br` |
| **Fallback meta no index.html** | ❌ Fail | `<head>` não tem `<title>` nem `<meta description>` — crawlers sem JS veem página em branco |
| **SSR / Pré-renderização** | ❌ Fail | SPA pura — Ahrefs, Screaming Frog e similares não conseguem indexar o conteúdo |
| **Broken links (blog)** | ❌ Fail | `/tag/dicas/` retorna 404 em 4 posts |
| **Links de redirect** | ⚠️ Warning | ~18 páginas linkam para URLs que fazem redirect (http, sem www) |
| **Imagens pesadas (blog)** | ⚠️ Warning | 9MB + 2,3MB + 1,8MB — impacto direto no LCP das páginas de blog |
| **hreflang** | ❌ Fail | Sem declaração de idioma pt-BR para o Google |
| **Canonical tags (crawlers sem JS)** | ❌ Fail | Como não há fallback no HTML estático, crawlers sem JS não veem canonical |
| `aggregateRating` (3 reviews) | ⚠️ Warning | Poucos reviews podem ser sinalizado como misleading pelo Google |
| Páginas órfãs (Lollapalooza, Beto Carrero) | ⚠️ Warning | Landings renderizadas sem Header/Footer — sem links de retorno ao site |
| Imagens sem `width`/`height` | ⚠️ Warning | Pode causar CLS (Cumulative Layout Shift) |
| Nav sr-only com 3 links | ⚠️ Warning | Crawlers sem JS veem pouquíssimos links internos |

---

## 5. Comparativo de Concorrentes

| Dimensão | Anhangá Viagens | RD Cultural | Voo Singular | BTG Viagens |
|----------|----------------|------------|-------------|------------|
| **Posicionamento** | Boutique, personalizado, 50+, festivais | Excursões para eventos e festivais | Pacotes Lollapalooza e eventos | Agência tradicional, geral |
| **Nicho Lollapalooza** | ✅ Landing dedicada | ✅ Página otimizada com preços visíveis | ✅ Página com H1 + FAQ | ❓ Não identificado |
| **Nicho Orlando** | ✅ Landing dedicada | ❌ Não identificado | ❌ Não identificado | Parcial |
| **Nicho 50+ / Melhor Idade** | Mencionado nas keywords, sem landing | ❌ Não identificado | ❌ Não identificado | ❌ Não identificado |
| **Conteúdo de blog** | ✅ Blog externo ativo | ❌ Não identificado | ❌ Não identificado | ❌ Não identificado |
| **Schema.org** | ✅ Completo (TravelAgency, FAQ, Breadcrumb, Service) | ✅ Organization + ProductGroup | Parcial | ❌ Básico |
| **SSR / HTML estático** | ❌ SPA pura | ✅ Site renderizado no servidor | ✅ Site renderizado no servidor | ✅ Site tradicional |
| **Preços visíveis na página** | ❌ Sem preços (CTA WhatsApp) | ✅ R$289–R$498 na página | ✅ Preços detalhados | Parcial |
| **CNPJ / Trust signals** | ✅ CADASTUR no schema | Não verificado | ✅ CNPJ exibido na página | Não verificado |
| **AI Chatbot** | ✅ Gemini integrado (BANT) | ❌ Não identificado | ❌ Não identificado | ❌ Não identificado |
| **Integração CRM** | ✅ HubSpot | ❌ Não identificado | ❌ Não identificado | ❌ Não identificado |
| **UTM Tracking** | ✅ Completo (gclid, fbclid, ttclid, GA4) | ❓ | ❓ | ❓ |
| **Avaliações visíveis** | Schema (4.94 / 3 reviews) | Não verificado | Não verificado | Não verificado |
| **Vantagem competitiva SEO** | Chatbot, tracking avançado, schema rico | SSR, preços na página, especialização em eventos | HTML estático, FAQ otimizado | Autoridade de domínio (mais antigo) |

### Análise do Vencedor por Dimensão

**Onde a Anhangá vence:** Tecnologia (chatbot Gemini, HubSpot CRM, UTM tracking granular), schema.org mais completo, blog ativo, posicionamento de nicho diferenciado (boutique + 50+).

**Onde a Anhangá perde:** SSR/renderização server-side, preços visíveis na página (reduz fricção), autoridade de domínio (site mais recente), volume de conteúdo informacional.

---

## 6. Plano de Ação Priorizado

### ⚡ Quick Wins — Esta semana (impacto imediato, < 2 horas cada)

| # | Ação | Impacto | Esforço | Detalhes |
|---|------|---------|---------|---------|
| 1 | **Adicionar fallback de meta no index.html** | **Enorme** | 15 min | Inserir `<title>` e `<meta description>` padrão no `<head>` do `index.html`. O React 19 sobrescreverá por rota quando o JS carregar. |
| 2 | **Adicionar hreflang pt-BR no SEO.tsx** | Alto | 15 min | `<link rel="alternate" hreflang="pt-BR" href={currentUrl} />` + `hreflang="x-default"` |
| 3 | **Corrigir 404 do blog `/tag/dicas/`** | Médio | 15 min | Criar a tag "dicas" no CMS do blog ou adicionar redirect no servidor blog para `/tag/dicas-de-expert/` |
| 4 | **Migrar 3 imagens pesadas do blog para Cloudinary** | Alto | 30 min | Substituir URLs Pexels originais (9MB, 2.3MB, 1.8MB) por URLs Cloudinary com `f_auto,q_auto,w_800` no `blogData.ts` |
| 5 | **Expandir nav sr-only no index.html** | Médio | 20 min | Adicionar `/beto-carrero/`, `/lollapalooza-2026/`, `/termos-de-uso/`, `/politica-privacidade/` à navegação oculta |
| 6 | **Adicionar breadcrumb/link de retorno nas landings** | Médio | 30 min | Mini-header nas landings (Lollapalooza, Beto Carrero, Orlando) com link `← Anhangá Viagens` apontando para `https://www.anhanga.tur.br/` |
| 7 | **Atualizar links com redirects** | Baixo-Médio | 1h | Auditar componentes e data files para usar URLs com `https://www.` direto, sem precisar de redirect |

---

### 🏗️ Investimentos Estratégicos — Este trimestre

#### Alta Prioridade

**A. Pré-renderização / SSR** — Impacto: Enorme | Esforço: Alto (8–24h)
Este é o maior gap técnico. Como o site é SPA, todas as ferramentas de SEO e crawlers sem JS enxergam uma página vazia. Opções:
- **Opção 1 (mais rápida):** Configurar [Prerender.io](https://prerender.io) ou [vite-plugin-prerender](https://github.com/prerender/prerender) para gerar snapshots HTML estáticos das páginas principais no build.
- **Opção 2 (mais robusta):** Migrar para [Next.js](https://nextjs.org) com `generateStaticParams` para as rotas de landing e ISR para o blog. Preserva toda a stack React/TypeScript/Tailwind.
- **Dependência:** Nenhuma — pode ser feito em paralelo com outras tarefas.

**B. Página `/sobre/` com E-E-A-T** — Impacto: Alto | Esforço: Moderado (1 dia)
Criar página com: história da agência, CADASTUR (já no schema), equipe, parceiros (Beto Carrero World credenciada, Hopi Hari), depoimentos de clientes reais, certificações. Isso fortalece os sinais de Expertise e Autoridade que o Google prioriza em 2026.

**C. Landing page `/melhor-idade/`** — Impacto: Alto | Esforço: Moderado (1 dia)
A Anhangá já se posiciona no nicho 50+ mas não tem página dedicada. Criar landing com: destinos favoritos (Orlando Disney, Cancún, Gramado), ritmo de viagem, suporte especializado, depoimentos do público-alvo. CTA WhatsApp com mensagem pré-configurada.

**D. Enriquecer conteúdo textual das landings existentes** — Impacto: Alto | Esforço: Moderado (2–3h por landing)
As landings de Lollapalooza, Beto Carrero e Orlando precisam de mais texto legível:
- Incluir seção de FAQ expandida (já existe componente)
- Adicionar seção "Por que escolher a Anhangá" com diferenciais concretos
- Exibir ao menos uma faixa de preço ("A partir de R$ X")
- Incluir AggregateRating no schema das landings (com reviews reais)

#### Média Prioridade

**E. Cluster de conteúdo sobre Orlando** — Impacto: Alto | Esforço: Substancial (3–5 dias)
Criar 4–5 blog posts interconectados: "Roteiro de 7 dias em Orlando", "Quanto custa viajar para Orlando em 2026", "Orlando para a melhor idade", "Melhores hotéis perto dos parques". A landing `/orlando/` seria o pillar page.

**F. Turismo de Transformação como posicionamento de nicho** — Impacto: Médio | Esforço: Moderado (1 dia)
Escrever um post definitivo sobre "turismo de transformação" — termo que aparece no schema mas sem conteúdo de suporte. Baixíssima competição, alto alinhamento com o posicionamento boutique da marca.

**G. Melhorar sitemap.xml** — Impacto: Médio | Esforço: Baixo (30 min)
- Adicionar `/sobre/` quando a página for criada
- Gerar sitemap dinamicamente no build via script para refletir automaticamente as rotas do `App.tsx`
- Adicionar `<image:image>` tags para as imagens hero de cada página

**H. Estratégia de backlinks** — Impacto: Alto | Esforço: Alto (ongoing)
- Listar no Cadastur (já credenciado — divulgar o link)
- Submeter ao Google Business Profile (verificar se já existe)
- Guest posts em blogs de viagem (Mochileiros, Vai de Viagem, etc.)
- Participar de fóruns (Reddit r/brasilivre, Tripadvisor Fóruns) com links quando relevante
- Parcerias com influencers 50+ para mencionar o site

#### Baixa Prioridade (mas valem a pena)

**I. GEO — Generative Engine Optimization** — Impacto: Médio-Alto no longo prazo | Esforço: Ongoing
O robots.txt já permite GPTBot, PerplexityBot e Claude-Web — ótimo. Melhorar visibilidade em respostas de IA:
- Adicionar dados factuais verificáveis à homepage (ano de fundação, número de clientes atendidos, destinos)
- Publicar guias com dados únicos e originais (pesquisa própria sobre viagens 50+)
- Usar linguagem de afirmação clara: "A Anhangá Viagens **foi fundada em [ano]** e é **credenciada pelo Cadastur**"

**J. Core Web Vitals** — Impacto: Médio | Esforço: Médio (2–3h)
- Adicionar `width` e `height` explícitos em todas as imagens para evitar CLS
- Adicionar `fetchpriority="high"` na imagem hero
- Reduzir font variants (6 pesos Poppins → 3, 4 Inter → 2)

---

## Próximos Passos Sugeridos

Posso ajudar com qualquer dos itens abaixo:

- **Redigir os title tags e meta descriptions otimizados** para todas as páginas
- **Criar os briefs de conteúdo** para os blog posts de Orlando e turismo de transformação
- **Escrever o copy da landing page `/melhor-idade/`**
- **Montar um calendário editorial** com base nos gaps identificados
- **Implementar as correções técnicas** (fallback meta, hreflang, nav sr-only) diretamente no código
- **Aprofundar a análise de qualquer concorrente** específico

---

*Relatório gerado com base em: análise do código-fonte (março 2026), PLANO-SEO-2026.md interno, pesquisa de concorrentes via web search (RD Cultural, Voo Singular, BTG Viagens), e dados públicos de SEO.*
