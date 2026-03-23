# SEO Quick Wins — Correções Pós-Auditoria (Março 2026) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar as correções de alta e média prioridade identificadas na auditoria SEO de 22/03/2026, melhorando indexação e dados estruturados sem alterar arquitetura ou comportamento funcional do site.

**Architecture:** Mudanças pontuais em quatro arquivos existentes (`public/sitemap.xml`, `components/SEO.tsx`, `pages/BlogList.tsx`, `pages/landings/OrlandoLanding.tsx`). Sem novos componentes, sem alterações de rotas.

**Tech Stack:** React 19, TypeScript, Vite, pnpm. Testes com `pnpm test:regression` + `pnpm typecheck`.

---

## Contexto e achados pré-plano

Antes de codificar, foram verificados os arquivos reais. Registros importantes:

| Item do audit | Status real | Ação |
|---|---|---|
| `/melhor-idade/` ausente do sitemap | ✅ Confirmado — ausente | **Corrigir** |
| URL Lollapalooza inconsistente | ❌ Falso alarme — sitemap `/lollapalooza/` bate com rota `/lollapalooza` | Nenhuma ação |
| Blog sem "Leia Também" | ❌ Falso alarme — seção já existe em `BlogPost.tsx:277-299` | Nenhuma ação |
| Title tag Home >60 chars | ❌ Falso alarme — código tem 57 chars; prerender antigo se corrige no próximo deploy | Nenhuma ação |
| `og:image:width/height` ausentes | ✅ Confirmado — ausentes em `SEO.tsx` | **Corrigir** |
| ServiceSchema Orlando "2025/2026" | ✅ Confirmado — `OrlandoLanding.tsx:46` | **Corrigir** |
| Meta description Blog fraca | ✅ Confirmado — `BlogList.tsx:48` | **Corrigir** |

**Ações manuais (fora do escopo de código):**
- Após o deploy, solicitar indexação de todas as URLs do sitemap via Google Search Console > URL Inspection.
- Verificar redirect: `curl -I http://anhanga.tur.br/contato` (esperado: 301 → https://www.anhanga.tur.br/).

---

## Chunk 1: Sitemap e schema fixes

### Task 1: Adicionar `/melhor-idade/` ao sitemap.xml

**Files:**
- Modify: `public/sitemap.xml`

- [ ] **Step 1: Abrir o arquivo e localizar o bloco de Landing Pages**

  Arquivo: `public/sitemap.xml`
  Após a entrada do `/orlando/` (linha ~50), inserir o bloco abaixo.

- [ ] **Step 2: Inserir o novo bloco de URL**

  ```xml
  <url>
    <loc>https://www.anhanga.tur.br/melhor-idade/</loc>
    <lastmod>2026-03-22</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>https://www.anhanga.tur.br/og-image-1200x630.jpg</image:loc>
      <image:caption>Pacotes de Viagem para Melhor Idade 50+ - Anhangá Viagens</image:caption>
    </image:image>
  </url>
  ```

  Inserir entre o bloco do `/orlando/` e o bloco de `<!-- Institutional -->`.

- [ ] **Step 3: Validar XML manualmente**

  Verificar que o arquivo abre sem erros: número de `<url>` deve subir de 17 para 18.
  ```bash
  grep -c "<url>" /Users/felipewilliams/Projetos/Anhangá\ Viagens/AV-SITE/public/sitemap.xml
  # Esperado: 18
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add public/sitemap.xml
  git commit -m "fix(seo): add /melhor-idade/ to sitemap.xml"
  ```

---

### Task 2: Atualizar ServiceSchema da Orlando para 2026

**Files:**
- Modify: `pages/landings/OrlandoLanding.tsx` (linha ~46)

- [ ] **Step 1: Localizar o campo name no ServiceSchema**

  ```bash
  grep -n "2025/2026\|2025" pages/landings/OrlandoLanding.tsx
  ```
  Esperado: linha ~46 com `name="Pacotes para Orlando 2025/2026"`.

- [ ] **Step 2: Atualizar o valor**

  Substituir:
  ```tsx
  name="Pacotes para Orlando 2025/2026"
  ```
  Por:
  ```tsx
  name="Pacotes para Orlando 2026"
  ```

- [ ] **Step 3: Verificar que não há outras ocorrências de "2025" no arquivo**

  ```bash
  grep -n "2025" pages/landings/OrlandoLanding.tsx
  # Esperado: nenhum resultado
  ```

- [ ] **Step 4: Executar typecheck**

  ```bash
  pnpm typecheck
  # Esperado: sem erros
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add pages/landings/OrlandoLanding.tsx
  git commit -m "fix(seo): update Orlando ServiceSchema year to 2026"
  ```

---

## Chunk 2: Meta tags e Open Graph

### Task 3: Melhorar meta description do Blog

**Files:**
- Modify: `pages/BlogList.tsx` (linha ~48)

- [ ] **Step 1: Localizar a descrição atual**

  ```bash
  grep -n "description" pages/BlogList.tsx | head -5
  ```
  Esperado: linha ~48 com `description="Dicas, roteiros e conteúdos para planejar viagens personalizadas com mais segurança, economia e experiência."`.

- [ ] **Step 2: Substituir pela nova descrição**

  Substituir:
  ```tsx
  description="Dicas, roteiros e conteúdos para planejar viagens personalizadas com mais segurança, economia e experiência."
  ```
  Por:
  ```tsx
  description="Roteiros práticos, dicas de insider e destinos que valem cada centavo. Planejamento de viagem do jeito que deveria ser. Leia no blog da Anhangá!"
  ```

  A nova descrição tem 149 chars — dentro do limite de 155 do Google.

- [ ] **Step 3: Executar typecheck**

  ```bash
  pnpm typecheck
  # Esperado: sem erros
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add pages/BlogList.tsx
  git commit -m "fix(seo): improve blog meta description with CTA"
  ```

---

### Task 4: Adicionar og:image:width e og:image:height ao SEO.tsx

**Files:**
- Modify: `components/SEO.tsx` (após linha ~104)

- [ ] **Step 1: Localizar o bloco og:image**

  ```bash
  grep -n "og:image" components/SEO.tsx
  ```
  Esperado: linha ~103-104 com `key: 'meta:og:image'`.

- [ ] **Step 2: Inserir as duas novas meta tags após o bloco og:image**

  Após o objeto com `key: 'meta:og:image'`, inserir:
  ```tsx
  {
    tagName: 'meta',
    key: 'meta:og:image:width',
    attrs: { property: 'og:image:width', content: '1200' }
  },
  {
    tagName: 'meta',
    key: 'meta:og:image:height',
    attrs: { property: 'og:image:height', content: '630' }
  },
  ```

  O bloco resultante fica:
  ```tsx
  {
    tagName: 'meta',
    key: 'meta:og:image',
    attrs: { property: 'og:image', content: image }
  },
  {
    tagName: 'meta',
    key: 'meta:og:image:width',
    attrs: { property: 'og:image:width', content: '1200' }
  },
  {
    tagName: 'meta',
    key: 'meta:og:image:height',
    attrs: { property: 'og:image:height', content: '630' }
  },
  ```

- [ ] **Step 3: Executar typecheck**

  ```bash
  pnpm typecheck
  # Esperado: sem erros
  ```

- [ ] **Step 4: Executar testes de regressão**

  ```bash
  pnpm test:regression
  # Esperado: todos os testes passando
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add components/SEO.tsx
  git commit -m "fix(seo): add og:image:width and og:image:height meta tags"
  ```

---

## Chunk 3: Build, validação e deploy

### Task 5: Build e validação pré-deploy

**Files:** nenhum novo arquivo

- [ ] **Step 1: Rodar o build completo**

  ```bash
  pnpm build
  # Esperado: build termina sem erros; prerender valida todas as rotas
  ```

  Se o prerender falhar em alguma rota, o build sai com código ≠ 0 — investigar o erro antes de prosseguir.

- [ ] **Step 2: Verificar que `/melhor-idade/` foi pré-renderizada**

  ```bash
  ls dist/melhor-idade/
  # Esperado: index.html
  ```

- [ ] **Step 3: Confirmar que o sitemap no dist tem 18 entradas**

  ```bash
  grep -c "<url>" dist/sitemap.xml
  # Esperado: 18
  ```

- [ ] **Step 4: Spot-check do HTML pré-renderizado da home — og:image:width presente**

  ```bash
  grep "og:image:width" dist/index.html
  # Esperado: <meta property="og:image:width" content="1200"/>
  ```

- [ ] **Step 5: Spot-check da meta description do blog no prerender**

  ```bash
  grep "Roteiros práticos" dist/blog/index.html
  # Esperado: linha com a nova descrição
  ```

- [ ] **Step 6: Validar schema da Orlando — sem "2025/2026"**

  ```bash
  grep "2025" dist/orlando/index.html
  # Esperado: nenhum resultado
  ```

### Task 6: Deploy e ações manuais pós-deploy

- [ ] **Step 1: Deploy para produção**

  Via Vercel (push para branch main ou `pnpm deploy` se configurado).

- [ ] **Step 2: Validar og:image ao vivo com Facebook Debugger**

  URL: https://developers.facebook.com/tools/debug/
  Testar: `https://www.anhanga.tur.br/`
  Esperado: campos `og:image:width` e `og:image:height` presentes.

- [ ] **Step 3: Validar schema da Orlando com Rich Results Test**

  URL: https://search.google.com/test/rich-results
  Testar: `https://www.anhanga.tur.br/orlando/`
  Esperado: Service sem erros, nome "Pacotes para Orlando 2026".

- [ ] **Step 4: Verificar redirect naked domain**

  ```bash
  curl -I http://anhanga.tur.br/contato
  # Esperado: HTTP/1.1 301 → Location: https://www.anhanga.tur.br/
  ```

- [ ] **Step 5: Solicitar indexação no Google Search Console**

  - Acesse Search Console > URL Inspection
  - Submeta cada URL do sitemap que ainda não está indexada
  - Prioridade: `/melhor-idade/`, `/orlando/`, `/beto-carrero/`, `/sobre/`, `/blog/`

- [ ] **Step 6: Submeter sitemap atualizado**

  No Search Console > Sitemaps, verificar que `https://www.anhanga.tur.br/sitemap.xml` está submetido.
  Se já estiver, clicar em "Re-enviar" para forçar re-leitura com a nova entrada do `/melhor-idade/`.

---

## Resumo das mudanças

| Arquivo | Mudança |
|---|---|
| `public/sitemap.xml` | +1 entrada: `/melhor-idade/` com image |
| `pages/landings/OrlandoLanding.tsx` | ServiceSchema: "2025/2026" → "2026" |
| `pages/BlogList.tsx` | Meta description com CTA persuasivo |
| `components/SEO.tsx` | +2 meta tags: `og:image:width` e `og:image:height` |

**Impacto esperado:**
- Google descobre `/melhor-idade/` no próximo crawl
- Rich snippet de service na Orlando sem dado desatualizado
- CTR do blog nas SERPs potencialmente melhorado
- Facebook/LinkedIn/WhatsApp preview sem necessidade de inferir dimensões da imagem
