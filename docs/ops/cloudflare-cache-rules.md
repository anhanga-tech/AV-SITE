# Cloudflare Cache Rules — media.anhanga.tur.br

## Visão geral

A media zone (`media.anhanga.tur.br`) serve assets estáticos do R2.
Imagens já passam por Cloudflare Image Transformations e são cacheadas automaticamente.
Vídeos, porém, retornam `cf-cache-status: DYNAMIC` por padrão — sem cache na borda.

Esta regra corrige isso para o path `/videos/*`.

## Regra: Cache de vídeos estáticos

### Expressão

```
(http.host eq "media.anhanga.tur.br" and starts_with(http.request.uri.path, "/videos/"))
```

### Configuração

| Parâmetro | Valor | Motivo |
|---|---|---|
| Cache eligibility | Eligible for cache | Torna vídeos cacheáveis na borda |
| Edge TTL | 1 year (31536000s) | Assets estáticos versionados por nome de arquivo |
| Browser TTL | 1 day (86400s) | Equilíbrio entre performance e capacidade de atualização |
| Respect origin | Override origin | R2 não envia Cache-Control por padrão |

### Onde criar

Cloudflare Dashboard → zona `anhanga.tur.br` → Caching → Cache Rules → Create rule.

### Resultado esperado

Após ativar a regra, requisições GET repetidas devem mostrar progressão:

```
cf-cache-status: REVALIDATED  → primeiro GET (popula o cache; comportamento normal em R2 custom domains)
cf-cache-status: HIT          → GETs subsequentes
```

> R2 custom domains retornam `REVALIDATED` no primeiro GET porque o Cloudflare valida o asset
> contra a origem antes de o escrever na borda — é o comportamento esperado, não um erro.

`Accept-Ranges: bytes` deve continuar presente para suportar range requests (Safari/iOS).

## Vídeos cobertos

Todos os vídeos referenciados em `data/mediaConfig.ts` e landings:

| Arquivo | Tamanho | Uso |
|---|---|---|
| `videos/hero/rio.mp4` | ~19 MB | Hero principal |
| `videos/hero/paris.mp4` | ~4 MB | Hero principal |
| `videos/hero/maldivas.mp4` | ~8 MB | Hero principal |
| `videos/hero/new-york.mp4` | ~40 MB | Hero principal |
| `videos/hero/natureza.mp4` | ~5 MB | Hero principal |
| `videos/lollapalooza/hero/crowd-background.mp4` | ~8 MB | Landing Lollapalooza |

**Total: ~84 MB de vídeo servidos sem cache de borda.**

## Validação

> **Atenção:** use requisições GET, não HEAD (`-I`). Cloudflare não popula nem serve cache
> para HEAD requests — eles sempre retornam `cf-cache-status: DYNAMIC`, independente da regra.
> O flag `-o /dev/null` descarta o body; `Range: bytes=0-1023` evita baixar o arquivo inteiro.

Após criar a regra, verificar com:

```bash
# Primeiro request (espera MISS ou REVALIDATED)
curl -sS -o /dev/null -D - -H "Range: bytes=0-1023" \
  https://media.anhanga.tur.br/videos/hero/rio.mp4 \
  | grep -Ei "cf-cache-status|cache-control|accept-ranges"

# Segundo request (espera HIT)
curl -sS -o /dev/null -D - -H "Range: bytes=0-1023" \
  https://media.anhanga.tur.br/videos/hero/rio.mp4 \
  | grep -Ei "cf-cache-status|cache-control|accept-ranges"

# Verificar todos os vídeos
for v in videos/hero/rio.mp4 videos/hero/paris.mp4 videos/hero/maldivas.mp4 videos/hero/new-york.mp4 videos/hero/natureza.mp4 videos/lollapalooza/hero/crowd-background.mp4; do
  echo "=== $v ==="
  curl -sS -o /dev/null -D - -H "Range: bytes=0-1023" \
    "https://media.anhanga.tur.br/$v" \
    | grep -Ei "cf-cache-status|cache-control|accept-ranges"
done
```

## Política de versionamento

A regra usa Edge TTL de 1 ano. Se um vídeo precisar ser substituído:

1. **Preferido:** Upload com nome de arquivo diferente (ex: `rio-v2.mp4`) e atualizar `data/mediaConfig.ts`.
2. **Alternativa:** Purge manual via Dashboard → Caching → Purge Cache → Custom Purge → URL específica.

Não usar query strings para versionamento — Cloudflare por padrão inclui query string na cache key, mas a configuração pode variar.

## Observação sobre new-york.mp4

O vídeo `new-york.mp4` tem ~40 MB — significativamente maior que os demais.
Considerar reencoding com bitrate menor ou substituição por versão mais leve em tarefa futura.

## Referências

- [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Cloudflare R2 + Custom Domains](https://developers.cloudflare.com/r2/buckets/public-buckets/#custom-domains)
- [Cloudflare Default Cache Behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
