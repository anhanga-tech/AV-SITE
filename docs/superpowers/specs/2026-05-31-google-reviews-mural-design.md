# Google Reviews → Mural do Amor

**Data**: 2026-05-31
**Status**: Design aprovado, aguardando implementação
**Mockups**: `.superpowers/brainstorm/21960-1780251604/carousel-polished.html`

## Objetivo

Conectar automaticamente as avaliações do Google Meu Negócio com a seção "Mural do Amor" na Home. Reviews de 4-5 estrelas aparecem no carrossel existente, com foto de perfil real e indicação visual de origem Google. Um mecanismo de blocklist permite excluir reviews indesejados sem intervenção no código.

## Decisões de design

| Decisão | Escolha | Alternativas descartadas |
|---|---|---|
| Fonte de dados | Outscraper (scraping service) | Google Places API (limite de 5 reviews), webhook via n8n, semi-automático |
| Frequência de atualização | Build-time (JSON estático) | Cron diário, tempo real via edge function |
| Moderação | Blocklist de IDs | Automático puro, allowlist |
| Layout | Carrossel evoluído (estilo mural atual) | Grid masonry, wall of love (ticker) |
| Fotos de perfil | Cloudflare R2 CDN com fallback de iniciais | URL do Google direto, salvar no repo |
| Dados existentes | Fallback (usados se JSON do Google estiver vazio) | Substituir tudo, mesclar ambos |

## Arquitetura

### Pipeline de dados

```
Outscraper API
  │
  ▼
scripts/fetch-google-reviews.ts  (build-time, manual ou CI)
  │
  ├─► data/googleReviews.json    (commitado no repo)
  │
  └─► Cloudflare R2              (fotos de perfil)
        │
        ▼
    URL CDN salva no JSON
```

### Fluxo do componente

```
data/googleReviews.json ──► Testimonials.tsx ──► Carrossel
                              │
data/testimonialsData.ts ─────┘ (fallback se JSON vazio)
```

## Estrutura de dados

### `data/googleReviews.json`

```typescript
interface GoogleReview {
  id: string;
  authorName: string;
  rating: number;          // 4 ou 5
  text: string;
  date: string;            // ISO "2025-12-15"
  photoUrl: string;        // URL do R2 CDN
  destination?: string;    // Opcional, manual
}

interface GoogleReviewsData {
  placeId: string;
  averageRating: number;   // Não filtrado (todas as avaliações)
  totalReviews: number;    // Não filtrado (todas as avaliações)
  lastFetched: string;     // ISO timestamp
  reviews: GoogleReview[]; // Filtrado: apenas ≥ 4 estrelas, sem blocklist
}
```

### `data/reviewsBlocklist.json`

```json
{
  "blockedIds": [],
  "lastUpdated": "2026-05-31"
}
```

### `data/reviewAnnotations.json`

Anotações manuais por review (sobrevivem ao re-fetch). Keyed pelo review ID:

```json
{
  "abc123": { "destination": "Finlândia" },
  "def456": { "destination": "Paraty" }
}
```

O script de fetch faz merge: dados do Outscraper + anotações manuais. Anotações nunca são sobrescritas pelo fetch.

## Script: `scripts/fetch-google-reviews.ts`

### Responsabilidades

1. Chamar Outscraper API com Place ID da Anhangá Viagens
2. Filtrar reviews com rating < 4
3. Remover reviews cujos IDs estejam no blocklist
4. Para cada review com foto de perfil:
   - Baixar a imagem
   - Fazer upload para Cloudflare R2 (bucket de mídia existente)
   - Salvar URL do CDN no campo `photoUrl`
5. Calcular `averageRating` e `totalReviews` do conjunto filtrado
6. Salvar `data/googleReviews.json`
7. Log estruturado: total encontrado, filtrados por nota, bloqueados, fotos processadas

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `OUTSCRAPER_API_KEY` | Autenticação Outscraper |
| `R2_ACCESS_KEY_ID` | Credencial Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Credencial Cloudflare R2 |
| `R2_BUCKET_NAME` | Bucket de mídia |
| `R2_ENDPOINT` | Endpoint S3-compatible do R2 |
| `GOOGLE_PLACE_ID` | Place ID do Google Meu Negócio da Anhangá |

**Pendência**: revisar se as credenciais R2 já existem no ambiente de build ou precisam ser criadas.

### Comando npm

```json
{
  "reviews:fetch": "tsx scripts/fetch-google-reviews.ts"
}
```

## Componente: Testimonials.tsx (evolução)

### Mudanças em relação ao atual

**Adições:**
- Summary bar acima do carrossel: ícone oficial do Google + nota média + estrelas + total de avaliações
- Foto de perfil real (via R2 CDN) com fallback de iniciais em gradient via `onError`
- Badge "Google" no avatar: fundo branco + ícone G oficial (não usar Âmbar, reservado para CTA)
- Meta line: estrelas reais + dot separator + data relativa ("há 3 meses")
- Schema.org `aggregateRating` no `LocalBusiness` existente

**Ajustes de design (polish):**
- Card shadow: `shadow-float` em vez de hard-offset (card é passivo, não interativo)
- Dots com 44px de área clicável (visual continua 8px)
- Transições com `cubic-bezier(0.16, 1, 0.3, 1)` (curva spring do design system)
- `prefers-reduced-motion`: animação float do avatar desativada
- aria-labels em botões, aria-current nos dots

**Mantido:**
- Estilo mural com pin, rotação, hover que alinha
- Auto-play com 6s de intervalo
- Pause on hover/focus
- Estrutura de `SectionHeader` com badge "Love Notes"

### Lógica de dados

O componente trabalha com um tipo unificado `DisplayReview` que normaliza as duas fontes:

```typescript
interface DisplayReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;           // ISO date
  photoUrl: string | null; // null → renderiza iniciais
  destination?: string;
  source: 'google' | 'manual';
}
```

O módulo `data/reviewsAdapter.ts` converte ambas as fontes para `DisplayReview`:
- `GoogleReview` → mapeia direto, `source: 'google'`
- `TestimonialItem` (fallback) → mapeia `image` para `photoUrl`, `ratingValue` para `rating`, `source: 'manual'`

```typescript
const googleReviews = import('data/googleReviews.json');
const fallbackReviews = import('data/testimonialsData.ts');

const reviews: DisplayReview[] = googleReviews.reviews.length > 0
  ? toDisplayReviews(googleReviews.reviews, 'google')
  : toDisplayReviews(fallbackReviews, 'manual');
```

O campo `source` controla se o badge do Google aparece no avatar (só em `'google'`).

### Avatar com fallback

```tsx
<img
  src={review.photoUrl}
  onError={(e) => {
    // Esconder img, mostrar div com iniciais
  }}
/>
```

Iniciais extraídas do `authorName`: primeira letra do primeiro e último nome, em gradient `linear-gradient(135deg, #0ea5e9, #0284c7)`.

### Ícone do Google

Usar o asset oficial do Google "G" multicolorido conforme brand guidelines do Google. O SVG do mockup é uma aproximação e deve ser substituído pelo asset correto na implementação.

## Schema.org

Adicionar `aggregateRating` ao `LocalBusiness` existente em `Home.tsx`:

```json
{
  "@type": "LocalBusiness",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "47",
    "bestRating": "5"
  }
}
```

**Importante**: `ratingValue` e `reviewCount` devem refletir os totais **não filtrados** do Google (todas as avaliações, não só 4-5 estrelas). O script salva esses valores brutos no campo de metadados do JSON. Usar valores filtrados violaria as guidelines do Google para structured data e pode gerar uma manual action no Search Console.

## Testes

| Cenário | Tipo | Arquivo |
|---|---|---|
| Script filtra reviews < 4 estrelas | node:test | `tests/fetch-google-reviews.test.ts` |
| Script aplica blocklist | node:test | `tests/fetch-google-reviews.test.ts` |
| Script trata resposta vazia da API | node:test | `tests/fetch-google-reviews.test.ts` |
| Script faz merge com reviewAnnotations | node:test | `tests/fetch-google-reviews.test.ts` |
| Adapter normaliza GoogleReview → DisplayReview | node:test | `tests/reviews-adapter.test.ts` |
| Adapter normaliza TestimonialItem → DisplayReview | node:test | `tests/reviews-adapter.test.ts` |
| Componente usa fallback quando JSON vazio | node:test | `tests/reviews-adapter.test.ts` |
| Schema aggregateRating usa totais não filtrados | node:test | `tests/reviews-adapter.test.ts` |
| Avatar fallback de iniciais quando foto falha | Playwright | `tests/e2e/testimonials-google.spec.ts` |
| Summary bar renderiza nota e total | Playwright | `tests/e2e/testimonials-google.spec.ts` |

## Segurança

- **Review text é untrusted input.** O componente renderiza `authorName` e `text` como texto puro via JSX (`{review.text}`), nunca via `dangerouslySetInnerHTML`. O script de fetch aplica `cleanString` (de `lib/`) nos campos de texto antes de salvar no JSON.
- **Datas relativas calculadas em runtime.** O campo `date` é armazenado como ISO date; a string "há X meses" é computada no render, não no build, para não ficar stale.
- **IDs de review do Outscraper.** Verificar na documentação do Outscraper se os IDs são estáveis entre fetches. Se não forem, a blocklist deve usar um hash do `authorName + date + text` como identificador alternativo.

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Outscraper free tier insuficiente | Volume atual (~50 reviews) cabe nos 100/mês. Monitorar. |
| URLs de foto do Google expiram | Fotos salvas no R2; URL do Google nunca é referenciada no frontend |
| Outscraper fora do ar no build | JSON anterior permanece commitado; build não falha |
| Review ofensivo com 5 estrelas | Blocklist permite excluir sem deploy de código |
| Credenciais R2 não configuradas | Script valida env vars antes de executar e falha com mensagem clara |
| Outscraper usa modelo async (job + poll) | Verificar modelo da API; se async, implementar polling com timeout |
| IDs de review instáveis entre fetches | Fallback para hash determinístico como ID alternativo |

## Fora de escopo

- Responder reviews pelo site
- Exibir reviews de 1-3 estrelas
- Atualização em tempo real (sempre build-time)
- Integração com outras fontes de review (TripAdvisor, Booking)
- CTA para "Deixe sua avaliação" (pode ser adicionado depois)
