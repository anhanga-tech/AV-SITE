# Plano de Issues GitHub — Correções de SEO (anhanga.tur.br)

**Data:** 06/03/2026
**Baseado em:** Relatório SEO It Is (score 58/100)

---

## Análise de Falsos Positivos

O relatório foi gerado por um crawler que faz fetch apenas do HTML estático inicial. Como o site é uma SPA React, quase todo o conteúdo SEO é renderizado via JavaScript no client-side. O código já possui um componente `SEO.tsx` completo (title, description, OG, Twitter, canonical) e schemas JSON-LD — mas o **script de pré-renderização (`prerender.js`) está falhando silenciosamente** na build do Vercel, então nada disso chega ao HTML servido aos crawlers.

### Resumo: o que é falso positivo vs. problema real

| Item do relatório | Falso positivo? | Explicação |
|---|---|---|
| 🔴 Title tag ausente | **Parcial** | Existe em `SEO.tsx`, mas NÃO está no HTML servido. Causa-raiz: prerender quebrado. |
| 🔴 Meta description ausente | **Parcial** | Idem — existe no código, ausente no HTML servido. |
| 🔴 H1 ausente | **Parcial** | Existe em `Hero.tsx` com classe `sr-only`, mas é client-rendered. |
| 🔴 Conteúdo fino (3 palavras) | **Parcial** | Todo o conteúdo é renderizado por JS. O HTML estático é só o shell vazio `<div id="root">`. |
| 🟡 Heading hierarchy vazia | **Parcial** | Consequência direta do prerender quebrado. |
| 🟡 Sem external links | **Real** | Válido — o site não possui links externos para fontes de autoridade. |
| 🟡 Sem imagens | **Parcial** | Imagens existem nos componentes React, mas não no HTML estático. |
| 🟡 Schema markup ausente | **Parcial** | `OrganizationSchema`, `BreadcrumbSchema`, `FAQPageSchema` etc. existem no código. |
| 🟡 OG tags ausentes | **Parcial** | Presentes em `SEO.tsx`, ausentes no HTML estático. |
| 🟡 Twitter cards ausentes | **Parcial** | Presentes em `SEO.tsx`, ausentes no HTML estático. |
| 🟡 Canonical ausente | **Parcial** | Presente em `SEO.tsx`, ausente no HTML estático. |
| 🟡 Social share image ausente | **Parcial** | Configurada em `SEO.tsx` (`og-image-1200x630.jpg`), mas não no HTML. |

**Conclusão:** 11 dos 12 problemas reportados têm a mesma causa-raiz — o prerender não está funcionando. Corrigir o prerender resolve a maioria dos alertas de uma vez.

---

## Issues para Criar no GitHub

### Issue #1 — 🚨 CRÍTICA: Corrigir pré-renderização no Vercel

**Labels:** `bug`, `seo`, `priority: critical`

**Título:** fix: prerender.js failing silently on Vercel — SEO metadata not in static HTML

**Descrição:**

O script `scripts/prerender.js` usa Puppeteer para gerar HTML estático pós-build, mas falha silenciosamente no Vercel (o `catch` faz `process.exit(0)`, mascarando o erro). Como resultado, o Googlebot recebe apenas o shell vazio do SPA sem nenhuma meta tag SEO.

**Impacto:** Todos os meta tags (title, description, OG, Twitter, canonical), schemas JSON-LD, H1 e conteúdo de texto ficam invisíveis para crawlers.

**Tarefas:**

- [ ] Investigar por que Puppeteer falha no ambiente de build do Vercel (provavelmente falta de Chrome headless)
- [ ] Avaliar alternativas: (a) usar `@prerenderer/renderer-puppeteer` com Chrome pré-instalado, (b) migrar para prerender com Playwright, (c) usar um serviço externo como prerender.io, ou (d) inserir meta tags críticas diretamente no `index.html` como fallback estático
- [ ] Implementar a solução escolhida
- [ ] Validar que o HTML servido em produção contém `<title>`, `<meta name="description">`, tags OG/Twitter, canonical e schema JSON-LD
- [ ] Remover o `process.exit(0)` do catch — o build deve falhar se o prerender falhar

**Critério de aceite:** `curl -s https://www.anhanga.tur.br/ | grep '<title>'` retorna o title correto.

---

### Issue #2 — Meta tags SEO como fallback estático no index.html

**Labels:** `enhancement`, `seo`, `priority: high`

**Título:** feat: add static SEO meta tags in index.html as crawler fallback

**Descrição:**

Independente do prerender funcionar, o `index.html` deve conter meta tags básicas como fallback. Atualmente o `<head>` está limpo (conforme comentário no código: "SEO metadata is managed dynamically via React 19 hoisting"). Isso é arriscado: se o prerender falhar, crawlers não veem nada.

**Tarefas:**

- [ ] Adicionar ao `index.html`: `<title>`, `<meta name="description">`, tags OG essenciais (og:title, og:description, og:image, og:type, og:url), Twitter cards, e `<link rel="canonical">`
- [ ] O componente `SEO.tsx` pode sobrescrever esses valores via React 19 hoisting — os defaults do HTML servem como rede de segurança
- [ ] Verificar que não há duplicação de tags no HTML final pré-renderizado

**Critério de aceite:** Mesmo sem prerender, o HTML base tem meta tags SEO válidas.

---

### Issue #3 — H1 visível no Hero

**Labels:** `enhancement`, `seo`, `priority: medium`

**Título:** feat: make H1 visible in Hero component instead of sr-only

**Descrição:**

O `<h1>` atual no `Hero.tsx` tem classe `sr-only` (invisível visualmente). Embora acessível para screen readers e crawlers (quando pré-renderizado), o Google valoriza H1s visíveis que correspondem ao conteúdo visual da página. O título visual atual ("Sua Próxima Aventura") está em um `<p aria-hidden="true">`.

**Tarefas:**

- [ ] Converter o `<p aria-hidden="true">` visual para `<h1>` com o texto atual
- [ ] Remover o H1 sr-only duplicado
- [ ] Ajustar o conteúdo do H1 para incluir keyword principal ("Agência de Viagens" ou "Viagens Personalizadas")
- [ ] Garantir que há apenas um `<h1>` por página

**Critério de aceite:** A página possui um único `<h1>` visível que contém a keyword principal.

---

### Issue #4 — Adicionar links externos para autoridade (E-E-A-T)

**Labels:** `enhancement`, `seo`, `priority: low`

**Título:** feat: add authoritative external links for E-E-A-T signals

**Descrição:**

O site não possui links externos (outbound links). Links para fontes de autoridade demonstram credibilidade e são um sinal de E-E-A-T (Experience, Expertise, Authority, Trust) para o Google.

**Tarefas:**

- [ ] Adicionar links para a Cadastur (registro oficial de turismo) no footer ou seção "Sobre"
- [ ] Adicionar links para ABAV, Embratur ou outros órgãos relevantes
- [ ] Considerar links para fontes de informação de destinos (ex: sites oficiais de turismo dos destinos promovidos)
- [ ] Garantir que links externos abrem em nova aba (`target="_blank" rel="noopener"`)

**Critério de aceite:** Ao menos 3 links externos relevantes para fontes de autoridade no site.

---

### Issue #5 — Verificar imagem de social share (og:image)

**Labels:** `enhancement`, `seo`, `priority: medium`

**Título:** feat: verify og:image file exists and meets specifications

**Descrição:**

O `SEO.tsx` referencia `https://www.anhanga.tur.br/og-image-1200x630.jpg` como imagem de compartilhamento social, mas é preciso confirmar que esse arquivo existe, está acessível e tem as dimensões corretas.

**Tarefas:**

- [ ] Verificar se `/og-image-1200x630.jpg` existe no diretório `public/`
- [ ] Se não existir, criar uma imagem de 1200×630px com branding Anhangá
- [ ] Testar compartilhamento no Facebook Debugger e Twitter Card Validator
- [ ] Adicionar `og:image:width` e `og:image:height` nas meta tags

**Critério de aceite:** Compartilhar URL no WhatsApp/Facebook/Twitter exibe preview com imagem correta.

---

### Issue #6 — Submeter sitemap ao Google Search Console

**Labels:** `seo`, `priority: medium`

**Título:** chore: submit sitemap.xml to Google Search Console and request indexing

**Descrição:**

O sitemap existe e está acessível (`/sitemap.xml`), mas é preciso garantir que foi submetido ao Google Search Console e que as páginas estão sendo indexadas.

**Tarefas:**

- [ ] Acessar Google Search Console e verificar se o sitemap foi submetido
- [ ] Se não, submeter `https://www.anhanga.tur.br/sitemap.xml`
- [ ] Verificar relatório de cobertura e corrigir erros de indexação
- [ ] Solicitar indexação das páginas principais após fix do prerender

**Critério de aceite:** Sitemap submetido e páginas principais aparecendo como "indexadas" no GSC.

---

## Ordem de Execução Recomendada

| Prioridade | Issue | Impacto |
|---|---|---|
| 1º | Issue #1 (prerender) | Resolve ~80% dos problemas de uma vez |
| 2º | Issue #2 (fallback estático) | Rede de segurança caso prerender falhe novamente |
| 3º | Issue #3 (H1 visível) | Melhoria de on-page SEO |
| 4º | Issue #5 (og:image) | Melhoria de CTR em social sharing |
| 5º | Issue #6 (Search Console) | Garantir indexação pós-correções |
| 6º | Issue #4 (external links) | Sinal de E-E-A-T incremental |

---

## Impacto Esperado

Com a Issue #1 resolvida, o score do audit deve subir de **58 para ~85+**, já que a maioria dos problemas reportados são consequência direta do prerender quebrado. As issues #2 a #6 levam o score para próximo de 95+.
