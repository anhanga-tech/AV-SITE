# Baseline Cloudflare — 2026-05-23

Data da medição: **2026-05-23 05:03 UTC** (02:03 BRT)  
PoP respondendo: **GRU** (Guarulhos, São Paulo)  
Sprint: Cloudflare Optimization Sprint · Issue [#619](https://github.com/felipewilliam2/AV-SITE/issues/619)

---

## 1. Status de cache (evidência dos headers)

Coleta via `curl -sSI` sem cache local, da rede do operador.

### www.anhanga.tur.br/ (Home)

```
HTTP/2 200
cf-cache-status: DYNAMIC
cache-control: public, max-age=0, must-revalidate
speculation-rules: "/cdn-cgi/speculation"
cf-ray: a001833a7800d7d7-GRU
```

**Diagnóstico:** Cloudflare trata o HTML como DYNAMIC porque o origin envia `max-age=0`. Comportamento padrão do Cloudflare Pages para SPA — a borda não armazena, cada request vai ao origin. Nenhuma cache rule sobrescrevendo hoje.

### www.anhanga.tur.br/lollapalooza

```
HTTP/2 308 → /lollapalooza/
cf-cache-status: DYNAMIC
cf-ray: a001833aeb2bf17d-GRU
```

**Diagnóstico:** Redirect 308 não está cacheado. Cloudflare não cacheia redirects por padrão sem cache rule explícita.

### media.anhanga.tur.br/videos/hero/rio.mp4

```
HTTP/2 200
cf-cache-status: DYNAMIC
content-length: 19190897   (~18,3 MB)
etag: "e97891569d3951faec749f387f69bc2e"
last-modified: Tue, 31 Mar 2026 19:34:28 GMT
speculation-rules: "/cdn-cgi/speculation"
cf-ray: a001833b5b64864b-GRU
```

**Diagnóstico:** Vídeo de 18,3 MB servido como DYNAMIC. R2 não envia `Cache-Control` por padrão — Cloudflare não cacheia sem cache rule. Cada request baixa o vídeo completo da origem. Este é o maior impacto de cache identificado no baseline.

---

## 2. Speed Brain

**Status: ATIVO** — confirmado pelo header `speculation-rules: "/cdn-cgi/speculation"` presente em todas as respostas HTML e no vídeo.

Não há dados de impacto ainda (requer RUM com volume suficiente para comparar navegações). Critério para avaliar: queda no LCP p75 em navegações subsequentes vs. primeira navegação.

---

## 3. Core Web Vitals (RUM — Cloudflare Web Analytics)

Fonte: Cloudflare Web Analytics · filtro `Site is in anhanga.tur.br` · 2026-05-16 a 2026-05-23 · bots excluídos.

> **Atenção — escopo dos dados:** O Web Analytics está configurado para o zone `anhanga.tur.br` inteiro. As URLs com maior volume de sessões neste período são ferramentas internas (`n8n.anhanga.tur.br`, `mkt.anhanga.tur.br`, `cal.anhanga.tur.br`). O site público `www.anhanga.tur.br` **não aparece no top 5 de nenhuma métrica**, indicando volume de tráfego real insuficiente para dados por rota. As métricas abaixo representam o aggregado do zone e são dominadas pelo tráfego interno.

### LCP (Largest Contentful Paint) — zone aggregado

| Percentil | Valor | Classificação |
|---|---|---|
| P50 | 1.860 ms | Good (<2.500 ms) |
| P75 | 2.872 ms | Needs Improvement (2.500–4.000 ms) |
| P90 | 4.528 ms | Poor (>4.000 ms) |
| P99 | 8.530 ms | Poor |

Distribuição: **68% Good · 19% Needs Improvement · 13% Poor**

Top URLs por volume: `n8n.anhanga.tur.br/workflows/demo`, `mkt.anhanga.tur.br/s/dashboard`, `cal.anhanga.tur.br/felipe` — todas internas.  
`www.anhanga.tur.br` ausente do ranking.

### INP (Interaction to Next Paint) — zone aggregado

Distribuição: **96% Good · 4% Needs Improvement · 0% Poor**

Debug elements (domínio interno):
- `div._nodeIconWrapper...` → 216 ms (n8n)
- `#username` → 312 ms (mkt login)

### CLS (Cumulative Layout Shift) — zone aggregado

Distribuição: **95% Good · 2% Needs Improvement · 3% Poor**

Debug elements com CLS alto (domínio interno — n8n/cal):
- `main._main_1jvrf...` → CLS 0.48 (Poor)
- `div.flex.flex-1...` → CLS 0.406 (Poor) e 0.358 (Poor)

> Os CLS ruins são de interfaces internas (n8n, cal.anhanga.tur.br), não do site público.

### Métricas específicas de `www.anhanga.tur.br`

Dados por rota não disponíveis neste baseline — volume insuficiente para segmentação. A ser coletado após aumento de tráfego ou com filtro de host específico em período futuro.

| Rota | LCP p75 | INP p75 | CLS p75 | Data |
|---|---|---|---|---|
| `/` | n/d | n/d | n/d | 2026-05-23 |
| `/lollapalooza` | n/d | n/d | n/d | 2026-05-23 |
| `/beto-carrero` | n/d | n/d | n/d | 2026-05-23 |
| `/orlando` | n/d | n/d | n/d | 2026-05-23 |

---

## 4. Cache Analytics

Cache Analytics **não disponível** — requer plano pago (Pro ou superior). O baseline de cache é feito via headers HTTP (seção 1), que evidenciam `cf-cache-status: DYNAMIC` em todos os assets testados.

---

## 5. Achados do baseline (evidência dos headers)

| Item | Status hoje | Alvo pós-sprint |
|---|---|---|
| Cache HTML (home) | DYNAMIC | DYNAMIC (aceitável para SPA — sem mudança planejada) |
| Cache redirect `/lollapalooza` | DYNAMIC | HIT (via cache rule) |
| Cache vídeo hero (18,3 MB) | DYNAMIC | HIT com TTL 1 ano (cache rule em `docs/ops/cloudflare-cache-rules.md`) |
| Speed Brain | ATIVO | ATIVO — avaliar impacto via RUM |
| Cache Hit Ratio geral | ~0% (estimado) | >60% (meta da sprint) |

---

## 6. Critérios de sucesso da sprint

A sprint será declarada bem-sucedida quando, na medição pós-mudanças:

1. **Vídeo hero** — `cf-cache-status: HIT` no segundo request ao mesmo PoP.
2. **Cache Hit Ratio** — aumento mensurável via amostragem de headers HTTP (`cf-cache-status: HIT` vs `DYNAMIC`) em requests repetidos ao mesmo PoP (alvo: >60% de requests em HIT ou REVALIDATED para `media.anhanga.tur.br`). Cache Analytics não disponível no plano atual.
3. **LCP p75** (zone) — manutenção ou melhora em relação ao baseline de 2.872 ms (P75 atual, dominado por tráfego interno).
4. **Speed Brain** — permanecer ativo; sem regressão nos dados de navegação.

---

## 7. Próximas issues da sprint (referência)

- Implementar cache rule para vídeos: `docs/ops/cloudflare-cache-rules.md` já documenta a regra.
- Avaliar cache rule para redirect `/lollapalooza → /lollapalooza/`.
- Após mudanças, repetir os curls e preencher seção de comparação abaixo.

---

## Comparação pós-sprint (a preencher)

| Rota / Asset | cf-cache-status antes | cf-cache-status depois | Data depois |
|---|---|---|---|
| `/` | DYNAMIC | — | — |
| `/lollapalooza` (redirect) | DYNAMIC | — | — |
| `media.../videos/hero/rio.mp4` | DYNAMIC | — | — |
| LCP p75 (zone aggregado) | 2.872 ms | — | — |
| Cache Hit Ratio media zone | ~0% | — | — |
