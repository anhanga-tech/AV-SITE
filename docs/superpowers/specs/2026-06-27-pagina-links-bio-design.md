# Página de Links na Bio (`/links`)

Issue: [#956](https://github.com/felipewilliam2/AV-SITE/issues/956) — *Página própria de links na bio (/links) com rastreio first-party + Pixel*

## Objetivo

Criar uma página first-party `/links`, na identidade da marca e mobile-first, que substitui o Linktree como destino único da bio do Instagram (@anhangaviagens). O Linktree quebra o rastreio (lead não chega ao GA4/CRM com a origem certa) e descarta dados que poderiam virar público de retargeting. A `/links` resolve isso: rastreia cada clique no GA4, faz UTM passthrough para destinos internos, roteia o WhatsApp pelo utilitário de tracking existente e alimenta o público de retargeting do Meta via GTM.

## Escopo e não-escopo

**No escopo:**
- Rota `/links` standalone (sem Header/Footer/AIChat), lazy-loaded.
- Arquivo de dados `data/linksPage.ts` que define banner + lista de links (editável sem mexer em componente).
- Componente `LinkButton` que resolve comportamento e tracking por tipo de link.
- Eventos GA4 por clique e PageView de retargeting via `dataLayer`.
- Selos de confiança no rodapé.
- Testes (`node:test` para dados/helper + 1 spec Playwright leve).

**Fora do escopo:**
- Criação de páginas internas de Seguro Viagem ou Chip/eSIM (decisão: Seguro vai por link de afiliado; Chip/eSIM vai por WhatsApp).
- Configuração da tag no GTM que mapeia os eventos para o Meta Pixel (config externa ao repositório — documentada como passo de operação abaixo).
- Atualização da bio do Instagram (passo manual, fora do código).

## Abordagem

Página enxuta orientada a dados. `pages/LinksPage.tsx` lê `data/linksPage.ts`, mapeia os links e renderiza. Um único componente reutilizável `LinkButton` resolve o destino e o tracking conforme o `type` de cada link. A configurabilidade vem do arquivo de dados, não de uma árvore de componentes — alinhado ao requisito de "trocar promo/lead magnet sem deploy de código".

Alternativas descartadas:
- **Landing totalmente componentizada** (pasta `components/landings/links/` com 5+ subcomponentes, padrão Corporativo): overkill para uma lista de botões; mais superfície sem ganho.
- **Estender uma landing existente:** nenhuma é parecida o suficiente; forçaria acoplamento.

## Rota e posicionamento

- `/links` registrada no `AppLayout` de `App.tsx`, dentro do bloco de rotas standalone (fora do `MainSiteShell`), lazy-loaded como as demais landings:
  ```tsx
  const LinksPage = lazy(() => import('./pages/LinksPage'));
  // ...
  <Route path="/links" element={<LinksPage />} />
  ```
- Página standalone: **sem Header, Footer, AIChat**.
- `<Seo robots="noindex, follow">` — é destino de bio, não página de conteúdo para busca; evita thin content. (O componente `Seo` expõe `robots?: string`, default `'index, follow'`; mesmo padrão da `QuizAnhangaLanding`.) Sem `BreadcrumbSchema`.
- O `<CookieConsentBanner>` continua aparecendo (é global no `AppLayout` via `ClientOnly`), necessário para o consentimento de marketing.

## Arquivo de dados — `data/linksPage.ts`

Define os tipos e o conteúdo. O Felipe edita este arquivo para trocar banner e links.

```ts
export type LinkType = 'internal' | 'external' | 'whatsapp';

export interface LinkItem {
  id: string;            // único, usado como key e no tracking (label do evento)
  label: string;         // texto principal do botão
  sublabel?: string;     // linha de apoio opcional
  type: LinkType;
  href?: string;         // obrigatório para 'internal' (path relativo) e 'external' (URL absoluta)
  whatsappMessage?: string; // obrigatório para 'whatsapp'
  icon?: string;         // nome do ícone Phosphor (opcional)
  visible: boolean;      // controla exibição sem remover do arquivo
  highlight?: boolean;   // CTA destacado (ex.: WhatsApp em amarelo)
}

export interface BannerConfig {
  visible: boolean;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  href: string;          // destino interno (UTM passthrough aplicado)
}

export interface LinksPageConfig {
  banner: BannerConfig;
  links: LinkItem[];
}
```

### Conteúdo inicial

**Banner** (visível no lançamento → aponta para o Quiz):
- `title`: "Descubra sua próxima viagem"
- `subtitle`: breve chamada para o quiz
- `ctaLabel`: "Fazer o quiz"
- `href`: `/quiz`

**Links** (ordem do mais quente ao mais frio, conforme a issue):

| # | id | label | type | destino |
|---|---|---|---|---|
| 1 | `whatsapp` | Falar no WhatsApp | `whatsapp` | mensagem geral, `highlight: true` |
| 2 | `quiz` | Planejar minha viagem | `internal` | `/quiz` |
| 3 | `site` | Site oficial | `internal` | `/` |
| 4 | `seguro-viagem` | Seguro viagem | `external` | `https://go.nuvembr.com/anhanga_seguroviagem` |
| 5 | `chip-esim` | Chip / eSIM internacional | `whatsapp` | mensagem pedindo infos sobre chip/eSIM |
| 6 | `orlando` | Orlando | `internal` | `/orlando` |
| 7 | `beto-carrero` | Beto Carrero | `internal` | `/beto-carrero` |
| 8 | `melhor-idade` | Viagens Melhor Idade | `internal` | `/melhor-idade` |
| 9 | `consultoria-de-viagem` | Consultoria de Viagem | `internal` | `/consultoria-de-viagem` |
| 10 | `corporativo` | Viagens Corporativas | `internal` | `/corporativo` |
| 11 | `curadoria-cruzeiros-brasil` | Cruzeiros pelo Brasil | `internal` | `/curadoria-cruzeiros-brasil` |
| 12 | `lollapalooza` | Lollapalooza | `internal` | `/lollapalooza` |

Todas as 7 landings entram com `visible: true`.

Mensagens de WhatsApp iniciais (texto base; o `getWhatsAppLink` anexa os dados de tracking automaticamente). Ajustáveis no arquivo de dados:
- **Geral**: "Olá! Vim pelo Instagram e gostaria de falar com a Anhangá Viagens."
- **Chip/eSIM**: "Olá! Vim pelo Instagram e quero informações sobre chip / eSIM internacional para minha viagem."

## Componentes

### `pages/LinksPage.tsx`
- Importa `linksPageConfig` de `data/linksPage.ts`.
- Layout (de cima para baixo): logo da marca → banner (se `visible`) → lista de `LinkButton` filtrada por `visible` → selos de confiança.
- No mount (`useEffect`), dispara o PageView de retargeting (ver Tracking).
- `<Seo robots="noindex, follow">`.

### `LinkButton` (componente reutilizável)
Localização: `components/links/LinkButton.tsx` (pasta nova e enxuta para esta feature).

Resolve o destino conforme `type`:
- **`internal`** → `<Link to={withTrackingParams(href)}>` (React Router) — UTM passthrough.
- **`external`** → `<a href={href} target="_blank" rel="noopener noreferrer">`.
- **`whatsapp`** → `<a href={getWhatsAppLink(whatsappMessage, { appendTrackingRef: true })}>` — herda UTM/clientId via `utils/whatsapp.ts`.

`onClick` dispara `links_page_click` (ver Tracking) antes/junto da navegação. Estilo: botão grande, full-width, mobile-first; variante `highlight` em amarelo `#FFD600` para o WhatsApp, demais em branco/translúcido sobre o fundo da marca.

**Interface (props):** recebe um `LinkItem`. Sem estado interno além do necessário para render. Pode ser entendido e testado isoladamente: dado um `LinkItem`, produz o elemento de link correto e dispara o evento certo.

### Selos de confiança (rodapé)
Bloco compacto, somente texto/links (sem imagens de selo):
- **Cadastur** — CNPJ/Cadastur `37.036.732/0001-41`, link para `cadastur.turismo.gov.br/hotsite/`. Fonte: mesmos dados de `components/Footer.tsx`.
- **Membro ABAV** — link para `abav.com.br`. Fonte: `components/Footer.tsx`.
- **Nota 5.0 Google** — a nota **não** está no `Footer`; deriva dos reviews em `data/googleReviews.json` (via `data/reviewsAdapter.ts`). Confirmar o valor agregado vigente na implementação antes de fixar "5.0".

Pode ser inline em `LinksPage.tsx` ou um pequeno `components/links/TrustSeals.tsx`. Decisão de implementação.

## Tracking (ponto central)

Arquitetura confirmada: o site **não carrega o Meta Pixel direto** (`fbq` não existe). Tudo passa por `window.dataLayer` → GTM server-side (Stape sGTM, container `GTM-T2KGS86G`), carregado globalmente no `index.html`. O GTM é injetado por `loadAnalytics()`/`triggerAnalytics()` na primeira interação (listeners `scroll`/`pointerdown`/`keydown`/`touchstart`) ou após ~12s de idle — **independente de consentimento** —, então `/links` herda o pipeline sem qualquer infra adicional na página.

Helper de tracking (novo, pequeno): `utils/linksTracking.ts` (ou inline em `LinkButton`/`LinksPage`), com guarda SSR (`typeof window`).

- **PageView de retargeting** — no mount de `LinksPage`:
  ```ts
  window.dataLayer?.push({ event: 'links_page_view' });
  ```
- **Clique** — em cada `LinkButton`:
  ```ts
  window.dataLayer?.push({
    event: 'links_page_click',
    label: item.id,
    link_type: item.type,
    destination: resolvedHref,
  });
  ```
- **WhatsApp**: `getWhatsAppLink(message, { appendTrackingRef: true })` — já anexa UTMs/clientId à mensagem. Resolve o ponto cego do `wa.me` direto.
- **Internos (UTM passthrough)**: helper `withTrackingParams(path)` lê `window.location.search` atual (UTMs vindos da bio) e os anexa ao path de destino, sem duplicar params já presentes.

**Pixel via GTM (config externa ao repo):** o código apenas empurra os eventos. Mapear `links_page_view → PageView` (e opcionalmente `links_page_click → ViewContent`) é configuração de tag no GTM container `GTM-T2KGS86G`. Documentado aqui como passo de operação; não é entregável de código.

**Limitação honesta (LGPD / Consent Mode):** o Consent Mode do Google começa `denied` e vira `granted` quando o visitante aceita marketing no banner. A cobertura "todo visitante vira público de retargeting" é, portanto, governada pelo consentimento — o código fica correto, mas a taxa de captura depende do aceite. Não prometer 100%.

## Identidade visual

- Mobile-first (100% do tráfego vem do app do Instagram).
- Poppins (já é a `font-sans` no `tailwind.config.mjs`).
- Fundo no gradiente da marca usando tokens `anhanga-*` reais: `anhanga-blue` (`#0056D2`) → `anhanga-action` (`#0ea5e9`). Logo branca (`BRAND_LOGO_WHITE_URL` de `lib/media-assets.ts`) no topo.
- Botão WhatsApp em amarelo `#FFD600` (token `anhanga-yellow`; CTA mais quente); demais em branco/translúcido.
- Botões grandes, full-width, com hierarquia clara por intenção.
- Usar namespace de cor canônico `anhanga-*` (tokens em `lib/design-tokens.ts`); `brand-*` é legado e congelado por teste. Nota: `#003B8E` é o legado `brand-actionDark` e **não** tem equivalente `anhanga-*` — não usar.

## Testes

- **`tests/links-page-data.test.ts`** (`node:test` + `assert/strict`): valida o shape de `linksPageConfig`:
  - ids únicos entre os links;
  - todo link `whatsapp` tem `whatsappMessage` não vazio;
  - todo link `external` tem `href` com URL absoluta (`https://`);
  - todo link `internal` tem `href` com path relativo (começa com `/`);
  - `banner` bem-formado quando `visible` (title, ctaLabel, href internos preenchidos).
- **Helper `withTrackingParams`** (`node:test`): preserva UTMs da query atual, não duplica params, lida com path sem query e com query existente.
- **1 spec Playwright leve** (`tests/e2e/links-page.spec.ts`): render mobile; clicar num botão empurra o evento `links_page_click` no `dataLayer`; o link do WhatsApp contém os dados de tracking. (O GTM não carrega em localhost pelo gate de host, mas `dataLayer.push` funciona — asserir sobre `window.dataLayer`.)

Comandos de verificação antes de fechar a implementação:
- `pnpm test:regression`
- `pnpm test:e2e` (para o spec da `/links`)
- `pnpm typecheck`

## Critérios de aceite (da issue)

- [ ] Rota `/links` registrada no `App.tsx`, renderizando mobile-first na identidade da marca.
- [ ] Botões: WhatsApp (tracking via `utils/whatsapp.ts`), Quiz, Site, Seguro viagem (afiliado), Chip/eSIM (WhatsApp), landings, banner editável.
- [ ] Evento GA4 (`links_page_click`) dispara em cada clique (validar no DebugView).
- [ ] Pixel alimentado via GTM (`links_page_view` → PageView; validar no Events Manager / Pixel Helper após config de tag).
- [ ] Banner e lista de links editáveis por `data/linksPage.ts`.
- [ ] Selos de confiança no rodapé.
- [ ] (Manual, fora do código) Bio do Instagram atualizada para apontar para `/links`.

## Passos de operação (fora do código)

1. No GTM container `GTM-T2KGS86G`: criar trigger para `links_page_view` → tag Meta Pixel `PageView`; opcionalmente `links_page_click` → `ViewContent`.
2. Validar no Meta Events Manager / Pixel Helper e no GA4 DebugView.
3. Trocar a URL da bio do Instagram do Linktree para `https://www.anhanga.tur.br/links`.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `App.tsx` | Registrar rota `/links` (lazy) no `AppLayout` |
| `data/linksPage.ts` | Novo — tipos + conteúdo configurável |
| `pages/LinksPage.tsx` | Novo — página standalone |
| `components/links/LinkButton.tsx` | Novo — botão por tipo + tracking |
| `components/links/TrustSeals.tsx` | Novo (opcional) — selos no rodapé |
| `utils/linksTracking.ts` | Novo (opcional) — `withTrackingParams` + push de eventos |
| `tests/links-page-data.test.ts` | Novo — validação de dados |
| `tests/e2e/links-page.spec.ts` | Novo — fluxo de clique/tracking |
