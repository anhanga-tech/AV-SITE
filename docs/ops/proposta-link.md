# Link de proposta (`/proposta/<id>`)

Épico [#1894](https://github.com/anhanga-tech/AV-SITE/issues/1894). Este documento cobre a rota (P1, #1895), o scrub no Sentry (P4, #1898) o registro de aberturas (P3, #1897) e o redirect rastreado (P2, #1896). As próximas fases acrescentam aqui o que mudarem.

## O que existe

- `functions/proposta/[id].ts` → `lib/proposal-page.ts` (resposta HTML) → `lib/proposal-store.ts` (Upstash Redis).
- O id tem 16 caracteres base62 gerados com `crypto.getRandomValues`. Ele é a única credencial da página: quem tem o link vê a proposta.
- Respostas: 200 ativa (302 se for redirect), 410 expirada, 404 inexistente ou id malformado (sem consultar o Redis), 503 quando o Redis falta ou falha, 405 para métodos que não sejam GET/HEAD.

## Chaves no Redis

| Chave | Conteúdo | TTL |
|---|---|---|
| `proposta:rec:<id>` | Registro da proposta (JSON) | 15 dias (validade, decisão D5) |
| `proposta:exp:<id>` | Só o instante de expiração (tombstone) | 15 dias + 30 dias de carência |
| `proposta:abr:<id>` | Lista de aberturas, um JSON por abertura | 90 dias a partir da 1ª abertura (D5), fixado com `EXPIRE NX` |
| `proposta:sal:<AAAA-MM-DD>` | Sal aleatório do dia para o hash de IP | 2 dias |

O conteúdo some no instante em que o link expira. O tombstone existe só para responder 410 ("Proposta expirada", com botão de WhatsApp) em vez de 404. Depois da carência, o id responde 404 como qualquer id desconhecido. Os TTLs fazem o expurgo; não há rotina de limpeza para estas chaves.

## Aberturas

`lib/proposal-opens.ts` grava cada GET de cliente numa proposta ativa. O tamanho da lista é a contagem.

```json
{"at":"2026-10-22T15:30:00.000Z","device":"mobile","country":"BR","city":"São Paulo","ipHash":"3f9c0a1b2c3d4e5f"}
```

- `at` em UTC; quem exibe converte para o horário de São Paulo.
- País e cidade aproximados vêm do `request.cf` da Cloudflare. Coordenadas e CEP não são gravados.
- O IP nunca é gravado. O `ipHash` usa um sal aleatório que muda a cada dia (UTC) e é apagado em até 2 dias; depois disso o hash não pode mais ser ligado a um IP, nem por quem tem os segredos. O hash também leva o id da proposta: no mesmo dia, a mesma rede gera o mesmo hash dentro de uma proposta (o que separa "o cliente reabriu" de "outra pessoa abriu"), mas hashes sem relação entre propostas diferentes.
- A gravação roda em `waitUntil`, depois da resposta. Falha de gravação não quebra a página e é registrada só pelo nome do erro.

**Não contam:**

- HEAD e requests sem User-Agent.
- Prévias e robôs (`lib/link-preview-agents.ts`): WhatsApp, iMessage (`facebookexternalhit … Twitterbot`), Facebook, Slack, Telegram, Discord, LinkedIn, Google e outros crawlers, bibliotecas HTTP e Chrome headless.
- O link de prévia interna (abaixo).
- Propostas expiradas ou inexistentes.

**Limite conhecido:** verificadores de link de e-mail (Outlook Safe Links, Gmail) usam User-Agent de navegador comum e contam como abertura se a proposta for enviada por e-mail.

### Link de prévia interna

`/proposta/<id>?previa=<assinatura>` mostra a mesma página com o aviso "Prévia interna" e não conta abertura. A assinatura é o HMAC-SHA256 do id com `PROPOSAL_PREVIEW_SECRET` (`lib/proposal-preview.ts`), gerada pelo endpoint de criação (P5, #1899). Assinatura inválida, de outra proposta ou sem o secret configurado: a visita conta normalmente. O parâmetro `previa` é redigido no Sentry.

**Configurar no Cloudflare Pages:** `PROPOSAL_PREVIEW_SECRET` (gerar com `openssl rand -hex 32`), em Production e Preview.

## Redirect rastreado

Uma proposta criada com `redirectUrl` (fallback quando não há adaptador da operadora ou a extração falha) grava a abertura e só então responde **302** para o link da operadora.

- Só passam links `https` de operadoras na allowlist de `lib/proposal-redirect.ts` (hoje: `premium.infotravel.com.br`, caminho `/orcamento-web/`), sem usuário/senha nem porta. O link da Infotravel sai sempre com `shouldShowPay=false` (decisão D7: sem botão de pagamento da operadora); o token é preservado byte a byte. A checagem roda ao salvar e de novo em cada leitura: um registro com host fora da lista responde 503, sem redirecionar.
- Incluir uma operadora é mudança de código revisada (a lista não vem de configuração).
- `Referrer-Policy: no-referrer` no 302: a operadora não recebe a URL da proposta (e o id).
- Prévias de link (WhatsApp etc.) recebem a página da Anhangá, não o 302. O card fica com a nossa marca e o link da operadora, que carrega o token da reserva, não é entregue aos servidores de prévia.
- O link de prévia interna (`?previa=`) segue o 302 sem contar abertura.
- O link da operadora é credencial da reserva: nunca registrar em log.

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
