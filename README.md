[![React Doctor](https://www.react.doctor/share/badge?p=anhanga-viagens&s=92&e=1&w=33&f=23)](https://www.react.doctor/share?p=anhanga-viagens&s=92&e=1&w=33&f=23)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/felipewilliam2/AV-SITE)


## Anhangá Viagens — Site Institucional

Site institucional da **Anhangá Viagens**, uma agência de viagens boutique brasileira. A plataforma combina vitrine de destinos, blog de turismo e um chatbot com IA (Google Gemini) que qualifica leads em tempo real e os encaminha para o CRM. Roda em React 19 sobre Cloudflare Pages, com handlers de API edge-style e prerender estático das rotas no build.


## ✨ Features

- **🤖 Chat com IA Gemini:** Assistente de viagens que responde dúvidas, sugere roteiros e conduz uma qualificação BANT (Need, Authority, Budget, Timeline) com handoff para atendimento humano em reservas de curto prazo.
- **🎯 Captura de Leads Inteligente:** Leads do chatbot e dos formulários fluem direto para o **Odoo** (CRM ativo, via JSON-RPC), com atribuição de UTMs/click IDs preservada.
- **🏝️ Landing Pages Especializadas:** Páginas de alta conversão sem o shell do site (Orlando, Beto Carrero, Lollapalooza, Melhor Idade, Corporativo, Cruzeiros, NPS, Quiz).
- **📊 Rastreamento e Performance:** GTM/sGTM (Stape) com persistência de UTMs/GCLID e conversões server-side (Meta CAPI) com deduplicação por `event_id`.
- **📝 Blog de Viagens:** Posts em MDX, manifest gerado no build e CMS headless (Decap) em `/admin` via OAuth do GitHub.
- **📈 SEO de Alta Performance:** Prerender estático por rota, metadados dinâmicos SSR-safe e componentes Schema.org (LocalBusiness, FAQ, Breadcrumb).
- **🗺️ Mapas Interativos:** Visualização geográfica de destinos e hotéis com Leaflet.
- **📱 Design Responsivo:** Interface Mobile-First com design tokens compartilhados entre CSS e TS.


## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| UI | React 19, React Router 7, Tailwind CSS, Lucide React, Leaflet |
| Build | Vite, TypeScript, prerender via `MemoryRouter` |
| IA | Google Gemini + Cloudflare AI Gateway (proxy opcional para observabilidade) |
| API | Cloudflare Pages Functions (handlers edge-style em `api/`, adaptados em `functions/`) |
| CRM / Automação | Odoo (External API JSON-RPC) — n8n restrito a purchase-dispatch (inbound) e ao anúncio social do blog (outbound) |
| Infra | Cloudflare Pages (deploy), Upstash Redis (rate limiting), R2 (mídia) |
| Conteúdo | MDX, Decap CMS |
| Testes | `node:test` (regressão) + Playwright (e2e) |


## 🏗️ Arquitetura

**Dois tiers de layout** resolvidos no `App.tsx`:
- **Landing pages** — sem Header/Footer/AIChat, para campanhas de conversão.
- **Shell principal** (`MainSiteShell`) — Header + AIChat + Footer, para o restante do site (home, blog, páginas legais, etc.).

**Fluxo do chatbot:** `AIChat.tsx` → `services/geminiService.ts` → `api/generate.ts`, que valida a entrada, aplica rate limit, chama o Gemini com o prompt de `lib/ai/`, extrai a tool call de orçamento quando a qualificação BANT está completa e roda o handoff em `lib/ai/handoff.ts`.

**Fluxo de leads:** `hooks/useLeadCapture.ts` → `api/submit-lead.ts` (valida + normaliza via `lib/lead-logic.ts` e schemas Zod) → `services/odoo.ts` (JSON-RPC) → `res.partner` + `crm.lead` no Odoo. Os outros 4 formulários (contato, quiz, waitlist, NPS) seguem o mesmo padrão via `createOdooSubmitHandler`; quiz/waitlist/NPS só criam `res.partner` (sem oportunidade). HubSpot e Salesforce são legado — HubSpot mantém só o webhook inbound de deals Closed-Won, Salesforce está aposentado.

**Build:** os scripts de `scripts/` geram o manifest do blog, sitemap e feeds; o Vite empacota; e `scripts/prerender.mjs` renderiza cada rota em HTML estático.

> A fonte de verdade de engenharia é **`docs/standards/`** — leia antes de alterar código (code style, testes, convenções de API, segurança).


## 🚀 Pré-requisitos

- Node.js 24.x
- pnpm (o repo usa `node-linker=hoisted`, configurado em `pnpm-workspace.yaml`)
- Chave da API do Google Gemini no ambiente server-side
- Para produção: secrets configurados no dashboard do **Cloudflare Pages** (ver `.env.example`)


## 📦 Instalação

```bash
git clone https://github.com/felipewilliam2/AV-SITE.git
cd AV-SITE
pnpm install
cp .env.example .env   # preencha GEMINI_API_KEY (mínimo para o chatbot rodar localmente)
pnpm dev
```

O site sobe em `http://localhost:3000`. Consulte `.env.example` para a lista completa de variáveis (IA, Odoo, n8n, Upstash, OAuth do Decap, mídia R2 etc.).

> **Nota:** `pnpm preview` serve apenas estáticos — não há servidor de API. Para testar o chatbot localmente use `pnpm dev` com `GEMINI_API_KEY` no `.env`.


## 📝 Scripts

| Script | Descrição |
|---|---|
| `pnpm dev` | Gera manifest/sitemap/feeds e sobe o Vite em `:3000` |
| `pnpm build` | Gera artefatos, builda e prerendeza as rotas estáticas |
| `pnpm preview` | Serve o build de produção em `:4173` (sem API) |
| `pnpm typecheck` | Type-check sem emitir |
| `pnpm test:regression` | Testes unitários/regressão (`node:test` via tsx) |
| `pnpm test:e2e` | Testes e2e Playwright (`:ui` para modo interativo) |
| `pnpm test:size` | Verifica limites de bundle (bundlesize) |
| `pnpm doctor` | Diagnósticos react-doctor |
| `pnpm cms:proxy` | Proxy local do Decap CMS para `/admin` |

Rodar um teste isolado: `tsx --test tests/submit-lead.test.ts`


## 🚢 Deploy

Deploy primário em **Cloudflare Pages**. Vercel e Netlify são legados (configs mantidas no repo para compatibilidade, mas não são a plataforma ativa).

**Cloudflare Pages:**
1. Conecte o repositório no dashboard do Cloudflare Pages.
2. Build command `pnpm build` · Output `dist` · Node 24 (pinado via `.node-version` e `wrangler.toml`).
3. Configure os secrets em Settings → Environment Variables (`GEMINI_API_KEY`, Odoo, n8n, Upstash Redis, GitHub OAuth — ver `.env.example`).
4. Deploy automático a cada push em `main`.

`pnpm deploy` publica uma versão **estática (sem API)** no GitHub Pages, usado apenas para previews/mirror.


## 📁 Estrutura

Código organizado de forma flat no top-level (não há `/src` de aplicação — `src/` contém apenas `index.css`):

```
api/          15 handlers edge-style (chatbot, leads, webhooks, OAuth, health)
functions/    Adaptadores das Pages Functions + _middleware.ts
lib/          Helpers server-side (44 arquivos)
  ai/         Config do Gemini, prompt BANT, tools, handoff
  schemas/    Validadores Zod por endpoint
  conversions/  Helpers de pixels Google + Meta
services/     Integrações de provider (gemini, odoo, hubspot [legado])
hooks/        Hooks de formulário (useLeadCapture, useContactForm, ...)
components/   UI React (118) — /ui, /schemas, /landings, /blog
pages/        Componentes de rota (19) — /landings para eventos
utils/        Utilitários de browser (UTM, share, blog)
data/         Dados estáticos e manifests gerados
scripts/      Geradores de build (manifest, sitemap, feeds, prerender)
tests/        Testes node:test + Playwright (/tests/e2e) — 84 arquivos
docs/         Documentação por domínio (standards, ops, seo, ...)
content/      Posts MDX do blog
```


## 📄 Licença

Projeto de propriedade privada da Anhangá Viagens.

---

<p align="center">
  Desenvolvido com ❤️ por <a href="https://anhanga.tech" target="_blank">anhangá.tech</a>
</p>
