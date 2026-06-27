# Página de Links na Bio (`/links`) — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a rota `/links` first-party, mobile-first, na identidade da marca, que substitui o Linktree como destino único da bio do Instagram, com rastreio completo (GA4 por clique, UTM passthrough, WhatsApp rastreado, PageView de retargeting via GTM).

**Architecture:** Página standalone orientada a dados. `data/linksPage.ts` define banner + lista de links tipados (`internal`/`external`/`whatsapp`). `pages/LinksPage.tsx` lê o config e renderiza logo → banner → lista de `LinkButton` → selos. `LinkButton` resolve destino e tracking por tipo. A lógica pura (validação de dados, UTM passthrough, push de eventos) é coberta por `node:test`; a UI é coberta por um spec Playwright. O Pixel é alimentado por eventos no `dataLayer` (sem `fbq` direto) — config de tag no GTM é externa ao repo.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind (`anhanga-*` tokens) + React Router + `@phosphor-icons/react`; testes em `node:test` (via `tsx`) e Playwright.

**Spec:** `docs/superpowers/specs/2026-06-27-pagina-links-bio-design.md`

---

## File Structure

| Arquivo | Responsabilidade | Criar/Modificar |
|---|---|---|
| `data/linksPage.ts` | Tipos (`LinkType`, `LinkItem`, `BannerConfig`, `LinksPageConfig`) + conteúdo `linksPageConfig` | Criar |
| `utils/linksTracking.ts` | `withTrackingParams()` (UTM passthrough) + `pushLinksPageView()` + `pushLinksPageClick()` | Criar |
| `components/links/LinkButton.tsx` | Renderiza um `LinkItem` resolvendo destino/tracking por tipo | Criar |
| `components/links/TrustSeals.tsx` | Rodapé com selos Cadastur · ABAV · nota Google | Criar |
| `pages/LinksPage.tsx` | Página standalone: Seo `noindex`, layout, dispara `links_page_view` | Criar |
| `App.tsx` | Registrar `/links` (lazy) no `AppLayout` | Modificar |
| `tests/links-page-data.test.ts` | Valida shape/invariantes de `linksPageConfig` | Criar |
| `tests/links-tracking.test.ts` | Valida `withTrackingParams` | Criar |
| `tests/e2e/links-page.spec.ts` | Render mobile + clique dispara evento + WhatsApp com tracking | Criar |

**Convenções confirmadas no repo (seguir exatamente):**
- Import de JSON: `import googleReviewsRaw from '../data/googleReviews.json'` + `as GoogleReviewsData` (padrão em `pages/Home.tsx:12-14`).
- `Seo` expõe `robots?: string` e `noHreflang?: boolean` (`components/Seo.tsx`). Landing single-locale usa `noHreflang`.
- WhatsApp: `getWhatsAppLink(message, { appendTrackingRef: true })` (`utils/whatsapp.ts`).
- `window.dataLayer?: Array<Record<string, unknown>>` já tipado em `types/analytics.d.ts`.
- Tokens: `anhanga-blue` (#0056D2), `anhanga-action` (#0ea5e9), `anhanga-yellow` (#FFD600).
- Teste: `node:test` + `node:assert/strict`, rodado com `tsx --test` (ver `tests/submit-lead.test.ts`).

---

## Chunk 1: Dados e tracking (lógica pura, TDD)

### Task 1: Arquivo de dados `data/linksPage.ts`

**Files:**
- Create: `data/linksPage.ts`
- Test: `tests/links-page-data.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/links-page-data.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { linksPageConfig, type LinkItem } from '../data/linksPage.ts';

test('ids dos links são únicos', () => {
    const ids = linksPageConfig.links.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length);
});

test('todo link whatsapp tem whatsappMessage não vazio', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'whatsapp')) {
        assert.ok(link.whatsappMessage && link.whatsappMessage.trim().length > 0, `${link.id} sem mensagem`);
    }
});

test('todo link external tem href absoluto https', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'external')) {
        assert.match(link.href ?? '', /^https:\/\//, `${link.id} href inválido`);
    }
});

test('todo link internal tem href relativo (começa com /)', () => {
    for (const link of linksPageConfig.links.filter((l) => l.type === 'internal')) {
        assert.match(link.href ?? '', /^\//, `${link.id} href inválido`);
    }
});

test('banner visível está bem-formado', () => {
    const { banner } = linksPageConfig;
    if (banner.visible) {
        assert.ok(banner.title.trim().length > 0);
        assert.ok(banner.ctaLabel.trim().length > 0);
        assert.match(banner.href, /^\//);
    }
});

test('todo link tem label e visible booleano', () => {
    for (const link of linksPageConfig.links as LinkItem[]) {
        assert.ok(link.label.trim().length > 0, `${link.id} sem label`);
        assert.equal(typeof link.visible, 'boolean');
    }
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec tsx --test tests/links-page-data.test.ts`
Expected: FAIL (módulo `../data/linksPage.ts` não existe).

- [ ] **Step 3: Implementar `data/linksPage.ts`**

Create `data/linksPage.ts`:

```ts
export type LinkType = 'internal' | 'external' | 'whatsapp';

export interface LinkItem {
    /** único; usado como React key e como `label` do evento GA4 */
    id: string;
    label: string;
    sublabel?: string;
    type: LinkType;
    /** obrigatório para 'internal' (path relativo) e 'external' (URL absoluta) */
    href?: string;
    /** obrigatório para 'whatsapp' */
    whatsappMessage?: string;
    /** nome de ícone Phosphor; só renderiza se estiver no ICON_MAP do LinkButton */
    icon?: string;
    /** controla exibição sem remover do arquivo */
    visible: boolean;
    /** CTA destacado (ex.: WhatsApp em amarelo) */
    highlight?: boolean;
}

export interface BannerConfig {
    visible: boolean;
    title: string;
    subtitle?: string;
    ctaLabel: string;
    /** destino interno; UTM passthrough é aplicado na navegação */
    href: string;
}

export interface LinksPageConfig {
    banner: BannerConfig;
    links: LinkItem[];
}

// ⚙️ EDITÁVEL: Felipe troca banner e links aqui sem mexer em componente.
export const linksPageConfig: LinksPageConfig = {
    banner: {
        visible: true,
        title: 'Descubra sua próxima viagem',
        subtitle: 'Responda 6 perguntas rápidas e receba ideias de roteiro personalizadas.',
        ctaLabel: 'Fazer o quiz',
        href: '/quiz',
    },
    links: [
        { id: 'whatsapp', label: 'Falar no WhatsApp', sublabel: 'Atendimento humano e rápido', type: 'whatsapp', whatsappMessage: 'Olá! Vim pelo Instagram e gostaria de falar com a Anhangá Viagens.', icon: 'WhatsappLogo', visible: true, highlight: true },
        { id: 'quiz', label: 'Planejar minha viagem', sublabel: 'Quiz de perfil de viagem', type: 'internal', href: '/quiz', icon: 'Compass', visible: true },
        { id: 'site', label: 'Site oficial', type: 'internal', href: '/', icon: 'Globe', visible: true },
        { id: 'seguro-viagem', label: 'Seguro viagem', sublabel: 'Cotação com nosso parceiro', type: 'external', href: 'https://go.nuvembr.com/anhanga_seguroviagem', icon: 'ShieldCheck', visible: true },
        { id: 'chip-esim', label: 'Chip / eSIM internacional', sublabel: 'Tire dúvidas no WhatsApp', type: 'whatsapp', whatsappMessage: 'Olá! Vim pelo Instagram e quero informações sobre chip / eSIM internacional para minha viagem.', icon: 'SimCard', visible: true },
        { id: 'orlando', label: 'Orlando', type: 'internal', href: '/orlando', visible: true },
        { id: 'beto-carrero', label: 'Beto Carrero', type: 'internal', href: '/beto-carrero', visible: true },
        { id: 'melhor-idade', label: 'Viagens Melhor Idade', type: 'internal', href: '/melhor-idade', visible: true },
        { id: 'consultoria-de-viagem', label: 'Consultoria de Viagem', type: 'internal', href: '/consultoria-de-viagem', visible: true },
        { id: 'corporativo', label: 'Viagens Corporativas', type: 'internal', href: '/corporativo', visible: true },
        { id: 'curadoria-cruzeiros-brasil', label: 'Cruzeiros pelo Brasil', type: 'internal', href: '/curadoria-cruzeiros-brasil', visible: true },
        { id: 'lollapalooza', label: 'Lollapalooza', type: 'internal', href: '/lollapalooza', visible: true },
    ],
};
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `pnpm exec tsx --test tests/links-page-data.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add data/linksPage.ts tests/links-page-data.test.ts
git commit -m "feat(links): arquivo de dados configurável da página /links

Refs #956"
```

---

### Task 2: Helper de tracking `utils/linksTracking.ts`

**Files:**
- Create: `utils/linksTracking.ts`
- Test: `tests/links-tracking.test.ts`

`withTrackingParams` recebe um segundo argumento `search` opcional para ser testável fora do browser (em `node:test`). No componente, é chamado sem o 2º argumento e lê `window.location.search`.

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/links-tracking.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { withTrackingParams } from '../utils/linksTracking.ts';

test('anexa UTMs da query atual a um path sem query', () => {
    const out = withTrackingParams('/quiz', '?utm_source=instagram&utm_medium=bio');
    assert.match(out, /^\/quiz\?/);
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('utm_source'), 'instagram');
    assert.equal(params.get('utm_medium'), 'bio');
});

test('preserva params existentes no destino e não os sobrescreve', () => {
    const out = withTrackingParams('/quiz?utm_source=site', '?utm_source=instagram');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('utm_source'), 'site');
});

test('ignora params que não são de rastreio', () => {
    const out = withTrackingParams('/quiz', '?random=1&utm_campaign=verao');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('random'), null);
    assert.equal(params.get('utm_campaign'), 'verao');
});

test('retorna o path inalterado quando não há query atual', () => {
    assert.equal(withTrackingParams('/quiz', ''), '/quiz');
});

test('captura click IDs (gclid, fbclid)', () => {
    const out = withTrackingParams('/', '?gclid=abc&fbclid=def');
    const params = new URLSearchParams(out.split('?')[1]);
    assert.equal(params.get('gclid'), 'abc');
    assert.equal(params.get('fbclid'), 'def');
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm exec tsx --test tests/links-tracking.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar `utils/linksTracking.ts`**

Create `utils/linksTracking.ts`:

```ts
import type { LinkItem } from '../data/linksPage';

const TRACKED_PARAM_PREFIXES = ['utm_', 'hsa_'];
const TRACKED_PARAMS = ['gclid', 'fbclid', 'ttclid', 'wbraid', 'gbraid', 'msclkid'];

function isTrackedParam(key: string): boolean {
    return TRACKED_PARAMS.includes(key) || TRACKED_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Anexa os parâmetros de rastreio da URL atual (UTMs/click IDs vindos da bio)
 * a um path interno. Não sobrescreve params já presentes no destino.
 * @param search query atual; default = window.location.search (parametrizável para teste).
 */
export function withTrackingParams(path: string, search?: string): string {
    const currentSearch = search ?? (typeof window !== 'undefined' ? window.location.search : '');
    if (!currentSearch) return path;

    const incoming = new URLSearchParams(currentSearch);
    const [basePath, existingQuery = ''] = path.split('?');
    const target = new URLSearchParams(existingQuery);

    incoming.forEach((value, key) => {
        if (!isTrackedParam(key)) return;
        if (target.has(key)) return;
        target.set(key, value);
    });

    const query = target.toString();
    return query ? `${basePath}?${query}` : basePath;
}

/** PageView que alimenta o público de retargeting via GTM. */
export function pushLinksPageView(): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;
    window.dataLayer.push({ event: 'links_page_view' });
}

/** Evento GA4 por clique de botão. */
export function pushLinksPageClick(item: LinkItem, destination: string): void {
    if (typeof window === 'undefined' || !window.dataLayer) return;
    window.dataLayer.push({
        event: 'links_page_click',
        label: item.id,
        link_type: item.type,
        destination,
    });
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `pnpm exec tsx --test tests/links-tracking.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add utils/linksTracking.ts tests/links-tracking.test.ts
git commit -m "feat(links): UTM passthrough e eventos de tracking da página /links

Refs #956"
```

---

## Chunk 2: UI e rota

> Componentes React são cobertos pelo spec Playwright do Chunk 3 (o repo não faz unit test de render; `node:test` é para lógica pura). Aqui a verificação por task é `pnpm typecheck`.

### Task 3: Componente `LinkButton`

**Files:**
- Create: `components/links/LinkButton.tsx`

- [ ] **Step 1: Implementar `components/links/LinkButton.tsx`**

`ICON_MAP` é um allowlist estático: resolve a advertência do revisor (nome de ícone inválido renderiza nada) — só renderiza ícones conhecidos; nome ausente do mapa simplesmente não exibe ícone.

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { WhatsappLogo, Compass, Globe, ShieldCheck, SimCard, type Icon } from '@phosphor-icons/react';
import { getWhatsAppLink } from '../../utils/whatsapp';
import { withTrackingParams, pushLinksPageClick } from '../../utils/linksTracking';
import type { LinkItem } from '../../data/linksPage';

const ICON_MAP: Record<string, Icon> = {
    WhatsappLogo,
    Compass,
    Globe,
    ShieldCheck,
    SimCard,
};

interface LinkButtonProps {
    item: LinkItem;
}

const baseClasses =
    'flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold shadow-sm transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-anhanga-blue';

function variantClasses(highlight?: boolean): string {
    return highlight
        ? 'bg-anhanga-yellow text-anhanga-blue hover:brightness-95'
        : 'bg-white/95 text-anhanga-blue hover:bg-white';
}

export const LinkButton: React.FC<LinkButtonProps> = ({ item }) => {
    const className = `${baseClasses} ${variantClasses(item.highlight)}`;
    const IconComponent = item.icon ? ICON_MAP[item.icon] : undefined;

    const content = (
        <>
            {IconComponent ? <IconComponent size={22} weight="fill" aria-hidden="true" /> : null}
            <span className="flex flex-col text-left">
                <span>{item.label}</span>
                {item.sublabel ? <span className="text-xs font-normal opacity-70">{item.sublabel}</span> : null}
            </span>
        </>
    );

    if (item.type === 'whatsapp') {
        const href = getWhatsAppLink(item.whatsappMessage ?? '', { appendTrackingRef: true });
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`} onClick={() => pushLinksPageClick(item, href)}>
                {content}
            </a>
        );
    }

    if (item.type === 'external') {
        const href = item.href ?? '#';
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}
               data-testid={`link-${item.id}`} onClick={() => pushLinksPageClick(item, href)}>
                {content}
            </a>
        );
    }

    const to = withTrackingParams(item.href ?? '/');
    return (
        <Link to={to} className={className} data-testid={`link-${item.id}`}
              onClick={() => pushLinksPageClick(item, to)}>
            {content}
        </Link>
    );
};

export default LinkButton;
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm typecheck`
Expected: sem erros novos. (Se `type Icon` não for exportado por `@phosphor-icons/react` na versão instalada, usar `import type { Icon } from '@phosphor-icons/react'` separado ou `React.ComponentType<{ size?: number; weight?: string }>` como fallback — confirmar com `grep "export" node_modules/@phosphor-icons/react/dist/index.d.ts | grep -i icon`.)

- [ ] **Step 3: Commit**

```bash
git add components/links/LinkButton.tsx
git commit -m "feat(links): componente LinkButton com tracking por tipo

Refs #956"
```

---

### Task 4: Componente `TrustSeals`

**Files:**
- Create: `components/links/TrustSeals.tsx`

- [ ] **Step 1: Implementar `components/links/TrustSeals.tsx`**

Segue o padrão de import de JSON de `pages/Home.tsx:12-14`. Cadastur/ABAV idênticos ao `components/Footer.tsx`.

```tsx
import React from 'react';
import googleReviewsRaw from '../../data/googleReviews.json';
import type { GoogleReviewsData } from '../../types/reviews';

const CADASTUR = '37.036.732/0001-41';
const googleReviews = googleReviewsRaw as GoogleReviewsData;

export const TrustSeals: React.FC = () => {
    const rating = googleReviews.averageRating ? googleReviews.averageRating.toFixed(1) : '5.0';

    return (
        <footer className="mt-10 flex flex-col items-center gap-1 text-center text-xs text-white/80">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <a href="https://cadastur.turismo.gov.br/hotsite/" target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-anhanga-yellow transition-colors">
                    Cadastur {CADASTUR}
                </a>
                <span aria-hidden="true">·</span>
                <a href="https://abav.com.br/" target="_blank" rel="noopener noreferrer"
                   className="underline underline-offset-2 hover:text-anhanga-yellow transition-colors">
                    Membro ABAV
                </a>
                <span aria-hidden="true">·</span>
                <span>Nota {rating} no Google</span>
            </div>
            <p className="mt-1 opacity-70">ANHANGA TURISMO LTDA</p>
        </footer>
    );
};

export default TrustSeals;
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm typecheck`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add components/links/TrustSeals.tsx
git commit -m "feat(links): selos de confiança no rodapé da página /links

Refs #956"
```

---

### Task 5: Página `LinksPage`

**Files:**
- Create: `pages/LinksPage.tsx`

- [ ] **Step 1: Implementar `pages/LinksPage.tsx`**

```tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { BRAND_LOGO_WHITE_URL } from '../lib/media-assets';
import { linksPageConfig } from '../data/linksPage';
import { withTrackingParams, pushLinksPageView } from '../utils/linksTracking';
import LinkButton from '../components/links/LinkButton';
import TrustSeals from '../components/links/TrustSeals';

const LinksPage: React.FC = () => {
    useEffect(() => {
        pushLinksPageView();
    }, []);

    const { banner, links } = linksPageConfig;
    const visibleLinks = links.filter((link) => link.visible);

    return (
        <>
            <Seo
                title="Links | Anhangá Viagens"
                description="Fale com a Anhangá Viagens, planeje sua viagem e acesse nossos destinos."
                canonical="https://www.anhanga.tur.br/links"
                robots="noindex, follow"
                noHreflang
            />
            <main className="min-h-screen bg-gradient-to-b from-anhanga-blue to-anhanga-action px-5 py-10 font-sans">
                <div className="mx-auto flex w-full max-w-md flex-col items-center">
                    <img
                        src={BRAND_LOGO_WHITE_URL}
                        alt="Anhangá Viagens"
                        width={180}
                        height={48}
                        className="h-12 w-auto object-contain"
                    />

                    {banner.visible ? (
                        <Link
                            to={withTrackingParams(banner.href)}
                            className="mt-8 w-full rounded-2xl bg-anhanga-yellow/15 p-5 text-center ring-1 ring-anhanga-yellow/40 transition-colors hover:bg-anhanga-yellow/25"
                            data-testid="links-banner"
                        >
                            <p className="text-lg font-bold text-white">{banner.title}</p>
                            {banner.subtitle ? <p className="mt-1 text-sm text-white/80">{banner.subtitle}</p> : null}
                            <span className="mt-3 inline-block rounded-full bg-anhanga-yellow px-4 py-1.5 text-sm font-semibold text-anhanga-blue">
                                {banner.ctaLabel}
                            </span>
                        </Link>
                    ) : null}

                    <nav aria-label="Links Anhangá Viagens" className="mt-6 flex w-full flex-col gap-3">
                        {visibleLinks.map((link) => (
                            <LinkButton key={link.id} item={link} />
                        ))}
                    </nav>

                    <TrustSeals />
                </div>
            </main>
        </>
    );
};

export default LinksPage;
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm typecheck`
Expected: sem erros novos.

- [ ] **Step 3: Commit**

```bash
git add pages/LinksPage.tsx
git commit -m "feat(links): página /links standalone mobile-first

Refs #956"
```

---

### Task 6: Registrar a rota `/links` em `App.tsx`

**Files:**
- Modify: `App.tsx` (bloco de imports lazy ~linha 26-35; bloco de `<Route>` standalone ~linha 83-94)

- [ ] **Step 1: Adicionar o import lazy**

Em `App.tsx`, junto aos demais imports lazy de landings (após a linha do `QuizAnhangaLanding`, ~linha 35), adicionar:

```tsx
const LinksPage = lazy(() => import('./pages/LinksPage'));
```

- [ ] **Step 2: Adicionar a rota**

Em `App.tsx`, dentro do `<Routes>` do `AppLayout` (junto às rotas standalone, antes de `<Route path="/*" element={<MainSiteShell />} />`, ~linha 94), adicionar:

```tsx
<Route path="/links" element={<LinksPage />} />
```

- [ ] **Step 3: Verificar tipos**

Run: `pnpm typecheck`
Expected: sem erros.

- [ ] **Step 4: Verificação visual rápida (manual, opcional)**

Run: `pnpm dev` e abrir `http://localhost:3000/links`.
Expected: página renderiza com logo, banner, botões e selos; sem Header/Footer/AIChat.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat(links): registrar rota /links no AppLayout

Refs #956"
```

---

## Chunk 3: E2E e verificação final

### Task 7: Spec Playwright `tests/e2e/links-page.spec.ts`

**Files:**
- Create: `tests/e2e/links-page.spec.ts`

Antes de escrever, abrir 1-2 specs existentes em `tests/e2e/` para confirmar `baseURL`, viewport mobile e helpers (ex.: `tests/e2e/chatbot-lead-submit.spec.ts`). O GTM **não** carrega em localhost (gate de host no `index.html`), mas `window.dataLayer.push` funciona — então asserir sobre `window.dataLayer` é válido. O teste injeta um `dataLayer` vazio via `addInitScript` para garantir captura determinística.

- [ ] **Step 1: Escrever o spec**

```ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12-ish, mobile-first

test.beforeEach(async ({ page }) => {
    // dataLayer determinístico (GTM não carrega em localhost pelo gate de host).
    await page.addInitScript(() => {
        (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    });
});

test('renderiza a página /links com banner, botões e selos', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByRole('img', { name: 'Anhangá Viagens' })).toBeVisible();
    await expect(page.getByTestId('links-banner')).toBeVisible();
    await expect(page.getByTestId('link-whatsapp')).toBeVisible();
    await expect(page.getByText('Membro ABAV')).toBeVisible();
});

test('links_page_view é empurrado no dataLayer no load', async ({ page }) => {
    await page.goto('/links');
    const events = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_view'),
    );
    expect(events.length).toBeGreaterThanOrEqual(1);
});

test('clique dispara links_page_click com o label correto', async ({ page }) => {
    await page.goto('/links');
    // Seguro viagem (external) abre em nova aba; previne navegação para asserir o evento.
    await page.getByTestId('link-seguro-viagem').evaluate((el) => el.setAttribute('target', '_self'));
    await page.getByTestId('link-seguro-viagem').click({ noWaitAfter: true });
    const clicks = await page.evaluate(() =>
        (window as unknown as { dataLayer: Array<{ event?: string; label?: string }> }).dataLayer
            .filter((e) => e.event === 'links_page_click'),
    );
    expect(clicks.some((c) => c.label === 'seguro-viagem')).toBe(true);
});

test('botão WhatsApp aponta para wa.me com texto', async ({ page }) => {
    await page.goto('/links');
    const href = await page.getByTestId('link-whatsapp').getAttribute('href');
    expect(href).toContain('wa.me/551152833309');
    expect(href).toContain('text=');
});
```

- [ ] **Step 2: Rodar o spec**

Run: `pnpm test:e2e tests/e2e/links-page.spec.ts`
Expected: PASS (4 testes). Se o seletor de `baseURL` exigir prefixo, ajustar conforme `playwright.config`. Se algum teste falhar por timing do `dataLayer`, adicionar `await page.waitForFunction(() => (window as any).dataLayer?.some((e: any) => e.event === 'links_page_view'))`.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/links-page.spec.ts
git commit -m "test(links): cobertura e2e de render e tracking da página /links

Refs #956"
```

---

### Task 8: Verificação final e fechamento

**Files:** nenhum (verificação).

- [ ] **Step 1: Rodar a suíte de regressão**

Run: `pnpm test:regression`
Expected: PASS, incluindo `tests/links-page-data.test.ts` e `tests/links-tracking.test.ts`. Confere também `tests/tailwind-brand-namespace-guard.test.ts` (garante que só usamos `anhanga-*`).

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: sem erros.

- [ ] **Step 3: E2E completo da página**

Run: `pnpm test:e2e tests/e2e/links-page.spec.ts`
Expected: PASS.

- [ ] **Step 4: Revisar critérios de aceite da issue #956**

Confirmar no spec (`docs/superpowers/specs/2026-06-27-pagina-links-bio-design.md`, seção "Critérios de aceite"):
- [ ] Rota `/links` registrada e mobile-first na identidade.
- [ ] Botões: WhatsApp (tracking), Quiz, Site, Seguro (afiliado), Chip/eSIM (WhatsApp), landings, banner.
- [ ] `links_page_click` por clique (validado no e2e; DebugView é validação manual pós-deploy).
- [ ] Banner e links editáveis por `data/linksPage.ts`.
- [ ] Selos no rodapé.

- [ ] **Step 5: Abrir PR**

```bash
git push -u origin worktree-feat-pagina-links
gh pr create --title "feat(links): página própria de links na bio (/links) — #956" \
  --body "$(cat <<'EOF'
## Resumo
Cria a rota `/links` first-party, mobile-first, que substitui o Linktree como destino da bio do Instagram, com rastreio completo.

- Página standalone (`pages/LinksPage.tsx`) — sem Header/Footer/AIChat, `noindex`.
- Conteúdo configurável em `data/linksPage.ts` (banner + links tipados `internal`/`external`/`whatsapp`).
- Tracking: `links_page_view` (retargeting via GTM) + `links_page_click` por clique; WhatsApp herda UTM/clientId via `utils/whatsapp.ts`; UTM passthrough nos internos.
- Seguro viagem por afiliado; Chip/eSIM por WhatsApp.
- Selos: Cadastur · ABAV · nota Google.

## Passos de operação (fora do código)
1. GTM `GTM-T2KGS86G`: mapear `links_page_view → PageView` (e opcional `links_page_click → ViewContent`).
2. Validar no Events Manager / GA4 DebugView.
3. Trocar a URL da bio do Instagram para `https://www.anhanga.tur.br/links`.

## Testes
- `pnpm test:regression` (dados + tracking)
- `pnpm test:e2e tests/e2e/links-page.spec.ts`
- `pnpm typecheck`

Closes #956

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Notas de implementação

- **Pixel sem `fbq`:** não injetar Pixel na página. O mapeamento de `links_page_view`/`links_page_click` para tags do Meta é config no GTM (externa ao repo) — está nos "Passos de operação".
- **Consent Mode / LGPD:** o retargeting só captura visitantes que aceitam marketing no banner de cookies (global, já presente). Comportamento esperado; não é bug.
- **Ícones:** `ICON_MAP` é allowlist — nome de ícone fora do mapa simplesmente não renderiza (sem erro). Para adicionar um ícone novo, importar no `LinkButton` e registrar no mapa.
- **Não usar `#003B8E`** (legado `brand-actionDark`): gradiente usa `anhanga-blue` → `anhanga-action`.
