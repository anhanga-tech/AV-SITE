# Link de proposta (`/proposta/<id>`)

Épico [#1894](https://github.com/anhanga-tech/AV-SITE/issues/1894). Este documento cobre a rota (P1, #1895), o scrub no Sentry (P4, #1898) o registro de aberturas (P3, #1897), o redirect rastreado (P2, #1896), o endpoint interno de criação (P5, #1899), o webhook de abertura (P6, #1900) e as notas no Odoo (P8, #1904). As próximas fases acrescentam aqui o que mudarem.

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
- Prévias e robôs (`lib/link-preview-agents.ts`): WhatsApp, iMessage (`facebookexternalhit … Twitterbot`), Facebook, Slack, Telegram, Discord, LinkedIn, Mastodon, Bluesky, Google e outros crawlers, Lighthouse, bibliotecas HTTP e Chrome headless.
- Prefetch e prerender do navegador (`Sec-Purpose`/`Purpose: prefetch`, `X-Moz: prefetch`). Esses pedidos são **recusados com 503**, não servidos: assim o navegador descarta o pré-carregamento e a navegação real chega ao servidor, conta a abertura e recebe o 302 de um redirect. Servir o prefetch com 200 faria o navegador mostrar a cópia guardada depois, sem a abertura nunca ser contada. A prévia de página do Safari (`X-Purpose: preview`) é tratada como prévia de link: recebe a página da Anhangá e não conta. O Google Read Aloud é acionado pelo próprio cliente e conta como abertura.
- O link de prévia interna (abaixo).
- Propostas expiradas ou inexistentes.

**Limite conhecido:** verificadores de link de e-mail (Outlook Safe Links, Gmail) usam User-Agent de navegador comum e contam como abertura se a proposta for enviada por e-mail.

### Link de prévia interna

`/proposta/<id>?previa=<assinatura>` mostra a mesma página com o aviso "Prévia interna" e não conta abertura. A assinatura é o HMAC-SHA256 do id com `PROPOSAL_PREVIEW_SECRET` (`lib/proposal-preview.ts`), gerada pelo endpoint de criação (P5, #1899). Assinatura inválida, de outra proposta ou sem o secret configurado: a visita conta normalmente. O parâmetro `previa` é redigido no Sentry.

**Configurar no Cloudflare Pages:** `PROPOSAL_PREVIEW_SECRET` (gerar com `openssl rand -hex 32`), em Production e Preview.

## Redirect rastreado

Uma proposta criada com `redirectUrl` (fallback quando não há adaptador da operadora ou a extração falha) responde **302** para o link da operadora e grava a abertura em `waitUntil`, como na página: o redirect não espera o Redis, e o runtime mantém a gravação viva até terminar (decisão do Felipe, 22/10/2026).

- Só passam links `https` de operadoras na allowlist de `lib/proposal-redirect.ts` (hoje: `premium.infotravel.com.br`, caminho `/orcamento-web/`), sem usuário/senha nem porta. O link da Infotravel sai sempre com `shouldShowPay=false` (decisão D7: sem botão de pagamento da operadora); o token é preservado byte a byte. A checagem roda ao salvar e de novo em cada leitura: um registro com host fora da lista responde 503, sem redirecionar.
- Incluir uma operadora é mudança de código revisada (a lista não vem de configuração).
- `Referrer-Policy: no-referrer` no 302: a operadora não recebe a URL da proposta (e o id).
- Prévias de link (WhatsApp etc.) recebem a página da Anhangá, não o 302. O card fica com a nossa marca e o link da operadora, que carrega o token da reserva, não é entregue aos servidores de prévia.
- O link de prévia interna (`?previa=`) segue o 302 sem contar abertura.
- O link da operadora é credencial da reserva: nunca registrar em log.

## Criar uma proposta (P5)

`POST /api/create-proposal` é chamado pelo bot comercial, nunca pelo navegador (sem CORS). Código em `api/create-proposal.ts`.

```http
POST /api/create-proposal
Authorization: Bearer <PROPOSAL_API_SECRET>
Content-Type: application/json

{ "type": "redirect", "redirectUrl": "<link da operadora>", "leadId": 1234, "validityDays": 15 }
```

- `type`: na fase 1, só `redirect`. As propostas aérea (P10, #1905) e da Infotravel extraída (P11, #1906) entram com os respectivos templates.
- `redirectUrl`: link de operadora na allowlist (ver "Redirect rastreado"); fora dela, 400 `REDIRECT_NOT_ALLOWED`.
- `leadId`: id do `crm.lead` no Odoo, gravado no registro para o webhook de abertura (P6, #1900).
- `validityDays`: opcional, de 1 a 15 (padrão 15, decisão D5). O bot pode encurtar, nunca estender.
- Campos extras são recusados (400 `VALIDATION_ERROR`).

Resposta 201:

```json
{ "ok": true, "requestId": "…", "data": { "id": "…", "url": "https://www.anhanga.tur.br/proposta/<id>", "previewUrl": "https://www.anhanga.tur.br/proposta/<id>?previa=…", "expiresAt": "2026-11-06T15:30:00.000Z" } }
```

`url` vai para o cliente; `previewUrl` é para conferência interna e não conta abertura. Os dois apontam sempre para produção, mesmo quando o pedido chega num deploy de preview.

| Status | `code` | Quando |
|---|---|---|
| 401 | `UNAUTHORIZED` | `Authorization: Bearer` ausente ou errado |
| 405 | `METHOD_NOT_ALLOWED` | Método diferente de POST |
| 400 | `VALIDATION_ERROR` / `REDIRECT_NOT_ALLOWED` | Corpo inválido / link fora da allowlist |
| 429 | `RATE_LIMIT_EXCEEDED` | Mais de 30 pedidos por minuto do mesmo IP |
| 500 | `CONFIG_ERROR` | Falta `PROPOSAL_API_SECRET` ou `PROPOSAL_PREVIEW_SECRET` (nada é gravado) |
| 503 | `STORE_UNAVAILABLE` / `SERVICE_UNAVAILABLE` | Redis fora (gravação ou rate limit) |

**Configurar no Cloudflare Pages:** `PROPOSAL_API_SECRET` (gerar com `openssl rand -hex 32`), em Production e Preview, e o mesmo valor no bot. Sem ele, o endpoint responde 500 e não cria nada.

Os logs (`CREATE_PROPOSAL`) trazem só `requestId`, etapa e tipo. Nunca o corpo, o id, o `leadId` ou o link da operadora; em erro de validação, só o caminho dos campos.

## Webhook de abertura (P6)

Quando o cliente abre a proposta, o site avisa o bot comercial (Clara, decisão D3) para preparar o follow-up. Nenhuma mensagem vai ao cliente sem o OK do Felipe (#1903). Código em `lib/proposal-webhook.ts`.

- **Quando:** na 1ª abertura e em cada reabertura com 30 minutos ou mais desde a abertura anterior. Prévia interna (`?previa=`), prévias de link, prefetch e HEAD não contam abertura e, por isso, nunca disparam o webhook.
- **Como:** em `waitUntil`, depois da resposta ao cliente: o aviso nunca atrasa nem quebra a página. Até 3 tentativas (5 s cada, espera de 1 s e 3 s) em erro de rede, 5xx ou 429. Um 4xx não é repetido. Sem fila durável: se as 3 falharem, o aviso se perde (fica o log `PROPOSAL_WEBHOOK` `failed`) e a abertura continua gravada no Redis.
- **Pula sem chamar:** sem `PROPOSAL_WEBHOOK_URL` ou `PROPOSAL_WEBHOOK_SECRET`, URL que não seja `https`, ou proposta sem `leadId`.

```http
POST <PROPOSAL_WEBHOOK_URL>
Content-Type: application/json
X-Anhanga-Timestamp: 1792683000
X-Anhanga-Signature: v1=<hex HMAC-SHA256 de "<timestamp>.<corpo bruto>">
X-Anhanga-Event-Id: <proposalRef>:<openCount>

{ "event": "proposal.opened", "eventId": "<proposalRef>:2", "proposalRef": "<32 hex>", "leadId": 1234,
  "openCount": 2, "isFirstOpen": false, "openedAt": "2026-10-22T18:30:00.000Z", "previousOpenAt": "2026-10-22T15:30:00.000Z" }
```

- `proposalRef`: SHA-256 de `proposta-ref:v1:<id>`, primeiros 32 hex (`createProposalRef`). Não revela o id; quem criou a proposta (e tem o id) recalcula para correlacionar. O payload não leva o id nem o link: o id abre a proposta, e no redirect leva ao token da reserva.
- `openedAt`/`previousOpenAt` em UTC; o receptor converte para o horário de SP.
- `openCount` é a contagem total de aberturas, inclusive as que não geraram aviso.
- `previousOpenAt` pode vir `null` com `isFirstOpen: false` quando a abertura anterior não pôde ser lida: na dúvida, o site avisa. O receptor deve aceitar essa combinação.
- **Idempotência:** `eventId` (repetido no header) é o mesmo em todas as tentativas do mesmo aviso, e distinto entre aberturas (vem do `RPUSH` atômico). O receptor deve ignorar um `eventId` já processado.

**Verificação no receptor** (obrigatória): recalcular `v1=` + HMAC-SHA256 hex de `` `${timestamp}.${corpoBruto}` `` com o secret, comparar em tempo constante, e recusar timestamp a mais de 5 minutos do relógio. Em TypeScript, `verifyProposalWebhook` de `lib/proposal-webhook.ts` faz isso. Use o corpo bruto, antes de qualquer parse.

**Configurar no Cloudflare Pages** (Production e Preview): `PROPOSAL_WEBHOOK_URL` (endpoint da Clara, `https`) e `PROPOSAL_WEBHOOK_SECRET` (`openssl rand -hex 32`, o mesmo valor no receptor). A autenticação é o HMAC: a URL não deve carregar segredo no caminho, porque URLs de saída podem aparecer em breadcrumbs do Sentry.

## Notas no Odoo (P8)

Nota interna (`mail.mt_note`) no chatter do `crm.lead` do `leadId`, via `services/odoo.ts` (`postLeadNote`). Código em `lib/proposal-odoo-notes.ts`.

- **Ao criar:** `Proposta enviada: https://www.anhanga.tur.br/proposta/<id> (válida até dd/mm/aaaa)`. Só o link do cliente: nem o de prévia nem o da operadora. É daqui que a Clara pega o link; ele não vai no webhook.
- **A cada abertura relevante** (as mesmas que disparam o webhook: 1ª e reaberturas 30+ min depois): `Proposta aberta em dd/mm/aaaa às hh:mm (horário de São Paulo), Nª vez`, onde N é a contagem total de aberturas. Sem IP, cidade ou aparelho.
- **Nota, não mensagem:** `mail.mt_note` não manda e-mail aos seguidores do lead, então nada chega ao cliente.
- **Nunca quebra:** sem `ODOO_*` configurado, a nota é pulada; se o Odoo falhar, a proposta é criada mesmo assim (a resposta do endpoint traz `crmNote: "recorded" | "skipped" | "failed"`) e a página abre normalmente (a nota roda em `waitUntil`, ao lado do webhook). Falha fica no log `PROPOSAL_ODOO_NOTE` só com o status HTTP, porque a mensagem de erro do Odoo pode repetir o texto da nota.
- Sem atividade de follow-up agendada para a Clara (opcional na issue): o webhook já cumpre esse papel.

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
