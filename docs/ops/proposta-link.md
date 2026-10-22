# Link de proposta (`/proposta/<id>`)

Épico [#1894](https://github.com/anhanga-tech/AV-SITE/issues/1894). Este documento cobre a rota (P1, #1895) e o scrub no Sentry (P4, #1898). As próximas fases acrescentam aqui o que mudarem.

## O que existe

- `functions/proposta/[id].ts` → `lib/proposal-page.ts` (resposta HTML) → `lib/proposal-store.ts` (Upstash Redis).
- O id tem 16 caracteres base62 gerados com `crypto.getRandomValues`. Ele é a única credencial da página: quem tem o link vê a proposta.
- Respostas: 200 ativa, 410 expirada, 404 inexistente ou id malformado (sem consultar o Redis), 503 quando o Redis falta ou falha, 405 para métodos que não sejam GET/HEAD.

## Chaves no Redis

| Chave | Conteúdo | TTL |
|---|---|---|
| `proposta:rec:<id>` | Registro da proposta (JSON) | 15 dias (validade, decisão D5) |
| `proposta:exp:<id>` | Só o instante de expiração (tombstone) | 15 dias + 30 dias de carência |

O conteúdo some no instante em que o link expira. O tombstone existe só para responder 410 ("Proposta expirada", com botão de WhatsApp) em vez de 404. Depois da carência, o id responde 404 como qualquer id desconhecido. Os TTLs fazem o expurgo; não há rotina de limpeza para estas chaves.

## Headers

Respostas de Pages Functions não recebem o `public/_headers`, então `lib/proposal-page.ts` define todos: `X-Robots-Tag: noindex, nofollow`, `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, CSP, `X-Frame-Options`, `nosniff`, HSTS e `Permissions-Policy`. `/proposta/` também está em `Disallow` em todos os grupos do `public/robots.txt` e fora do sitemap.

## Rastreadores injetados pela Cloudflare

O Zaraz (GA4) e o Web Analytics são injetados pela Cloudflare no HTML. O Pageview deles levaria a URL, e portanto o id, para terceiros. A CSP da página não tem `script-src` (cai em `default-src 'none'`), então nenhum script injetado roda.

**Antes de criar a primeira proposta real** (o endpoint de criação é o P5, #1899):

1. Gravar à mão no Upstash um registro de teste (até o P5 existir) e abrir a página **ativa (200)** num hostname da zona `anhanga.tur.br`, com o DevTools aberto. O Zaraz é configurado por zona: num `*.pages.dev` ele pode nem existir, e a ausência de requests ali não prova nada.
2. Confirmar no Console que o script do Zaraz foi bloqueado pela CSP, e na aba Network que não há request para `/cdn-cgi/zaraz/` nem para `cloudflareinsights.com`.
3. Se algum aparecer, criar no dashboard uma Configuration Rule para `/proposta/*` com "Disable Zaraz" (e desligar o Web Analytics para o caminho).
4. Apagar as duas chaves do registro de teste.

## Logs

Nunca registrar o id nem o caminho da proposta. Isso inclui o objeto de erro do Upstash, cuja mensagem traz o comando com a chave (`command was: ["mget","proposta:rec:<id>",…]`); registrar só `error.name`. Os logs `warn`/`error` vão para o Sentry Logs, que os scrubbers de URL de `lib/error-tracking.ts` não cobrem. Os scrubbers redigem `/proposta/<id>` em `request.url`, nome do span, `url.path`/`http.target`, Referer, breadcrumbs e `transaction` dos erros (teste em `tests/sentry-config.test.ts`).
