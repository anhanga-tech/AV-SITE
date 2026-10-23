# Link de proposta (`/proposta/<id>`)

Épico [#1894](https://github.com/anhanga-tech/AV-SITE/issues/1894). Este documento cobre a rota (P1, #1895), o scrub no Sentry (P4, #1898) o registro de aberturas (P3, #1897), o redirect rastreado (P2, #1896), a auditoria de retenção (P12, #1902), o endpoint interno de criação (P5, #1899), o webhook de abertura (P6, #1900), o aviso ao Felipe (P7, #1903), as notas no Odoo (P8, #1904), a página da proposta (P9, #1901) e o adaptador Infotravel (P11, #1906). As próximas fases acrescentam aqui o que mudarem.

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

O conteúdo some no instante em que o link expira. O tombstone existe só para responder 410 ("Proposta expirada", com botão de WhatsApp) em vez de 404. Depois da carência, o id responde 404 como qualquer id desconhecido. Os TTLs fazem o expurgo; não há rotina de limpeza para estas chaves.

**Auditoria diária (P12, #1902).** `.github/workflows/proposal-retention-audit.yml` roda às 06:30 (São Paulo) e executa `node scripts/audit-proposal-retention.ts`. O job falha se alguma chave `proposta:*` estiver sem TTL, com TTL acima do limite (`proposta:rec` 15 dias, `proposta:exp` 45, `proposta:abr` 90; `lib/proposal-retention.ts`) ou com prefixo desconhecido, como um `proposta:sal` que tenha sobrado. A saída traz só contagens por prefixo, sem nomes de chave. O job roda com `node` puro, sem `pnpm install`, então nenhum código de terceiros roda ao lado do token. Secrets no environment `proposta-retencao` do GitHub, que só aceita a branch `main` (um workflow disparado de outro branch, inclusive pelo `workflow_dispatch`, não recebe o token): `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_READONLY_TOKEN`, o token somente leitura do console do Upstash. Ele roda `SCAN` e `TTL` e tem a escrita negada (`NOPERM`), conforme conferido em 23/10/2026. A documentação do Upstash diz que o token somente leitura não roda `SCAN`; se um dia passar a falhar por isso, trocar por um token ACL restrito (`ACL SETUSER <usuário> on ><senha> ~proposta:* -@all +scan +ttl` e `ACL RESTTOKEN`). Se falhar: ver qual contagem acusou, achar a chave pelo console do Upstash e aplicar `EXPIRE` ou apagá-la, sem copiar o id para issues ou logs.

## Aberturas

`lib/proposal-opens.ts` grava cada GET de cliente numa proposta ativa. O tamanho da lista é a contagem.

```json
{"at":"2026-10-22T15:30:00.000Z"}
```

- `at` em UTC; quem exibe converte para o horário de São Paulo.
- Só o instante. País, cidade, aparelho e hash do IP eram gravados na primeira versão, mas nada os lia; saíram por minimização (LGPD Art. 6º, III, decisão de 23/10/2026). Um campo novo só volta junto com a funcionalidade que o usa, e com a política (seção 5.10) e o rodapé da página atualizados.
- Limpeza única dos registros antigos: feita em 23/10/2026, depois do deploy da minimização (7 aberturas em 6 propostas reduzidas a objetos só com o campo `at`, TTL mantido; 2 `proposta:sal:*` apagados; conferência com 0 a reduzir e 0 ilegíveis). O script de uso único saiu do repositório depois disso; está no histórico do git (#1930).
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

- `type`: `redirect` (redirect rastreado) ou `infotravel` (página montada a partir da cotação; ver "Adaptador Infotravel"). A proposta aérea (P10, #1905) entra depois.
- `redirectUrl`: link de operadora na allowlist (ver "Redirect rastreado"); fora dela, 400 `REDIRECT_NOT_ALLOWED`.
- `leadId`: id do `crm.lead` no Odoo, gravado no registro para o webhook de abertura (P6, #1900).
- `validityDays`: opcional, de 1 a 15 (padrão 15, decisão D5). O bot pode encurtar, nunca estender.
- `firstName` (só em `infotravel`): nome do cliente, enviado pelo bot. A página mostra só a primeira palavra (D6). O contato da cotação é o agente, nunca o cliente.
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
| 409 | `QUOTATION_EXPIRED` | `type: "infotravel"` e a operadora diz que a cotação já venceu (nada é gravado): pedir cotação nova |
| 429 | `RATE_LIMIT_EXCEEDED` | Mais de 30 pedidos por minuto do mesmo IP |
| 500 | `CONFIG_ERROR` | Falta `PROPOSAL_API_SECRET` ou `PROPOSAL_PREVIEW_SECRET` (nada é gravado) |
| 503 | `STORE_UNAVAILABLE` / `SERVICE_UNAVAILABLE` | Redis fora (gravação ou rate limit) |

**Configurar no Cloudflare Pages:** `PROPOSAL_API_SECRET` (gerar com `openssl rand -hex 32`), em Production e Preview, e o mesmo valor no bot. Sem ele, o endpoint responde 500 e não cria nada.

Os logs (`CREATE_PROPOSAL`) trazem só `requestId`, etapa e tipo. Nunca o corpo, o id, o `leadId` ou o link da operadora; em erro de validação, só o caminho dos campos.

## Webhook de abertura (P6)

Quando o cliente abre a proposta, o site avisa o bot comercial (Clara, decisão D3) para preparar o follow-up. Nenhuma mensagem vai ao cliente sem o OK do Felipe (#1903). Código em `lib/proposal-webhook.ts`.

- **Quando:** na 1ª abertura e em cada reabertura com 30 minutos ou mais desde a abertura anterior. Prévia interna (`?previa=`), prévias de link, prefetch e HEAD não contam abertura e, por isso, nunca disparam o webhook.
- **Como:** em `waitUntil`, depois da resposta ao cliente: o aviso nunca atrasa nem quebra a página. Até 3 tentativas (5 s cada, espera de 1 s e 3 s) em erro de rede, 5xx ou 429. Um 4xx não é repetido. Sem fila durável: se as 3 falharem, o aviso se perde (fica o log `PROPOSAL_WEBHOOK` `failed`) e a abertura continua gravada no Redis.
- **Pula sem chamar:** sem `PROPOSAL_WEBHOOK_URL`, `PROPOSAL_WEBHOOK_KEY` ou `PROPOSAL_WEBHOOK_SECRET`, URL que não seja `https`, ou proposta sem `leadId`.

O receptor é uma automação da Clara: ela só recebe o corpo, o `content-type` e o `user-agent`. Por isso a assinatura vai **dentro do corpo**, num envelope; nenhum cabeçalho `X-*` chegaria até ela.

```http
POST <PROPOSAL_WEBHOOK_URL>
Content-Type: application/json
User-Agent: Anhanga-Proposal-Webhook/1
Authorization: Bearer <PROPOSAL_WEBHOOK_KEY>

{ "payload": "<o JSON abaixo, como texto>", "signature": "v1=<hex HMAC-SHA256 de \"<ts>.<payload>\">", "ts": 1792693800 }
```

`payload`, depois do parse:

```json
{ "event": "proposal.opened", "eventId": "<proposalRef>:2", "proposalRef": "<32 hex>", "leadId": 1234,
  "openCount": 2, "isFirstOpen": false, "openedAt": "2026-10-22T18:30:00.000Z", "previousOpenAt": "2026-10-22T15:30:00.000Z" }
```

- `ts`: segundos unix do envio (não da abertura, que é `openedAt`). Entra na assinatura, então não pode ser trocado sem invalidá-la.
- `proposalRef`: SHA-256 de `proposta-ref:v1:<id>`, primeiros 32 hex (`createProposalRef`). Não revela o id; quem criou a proposta (e tem o id) recalcula para correlacionar. O payload não leva o id nem o link: o id abre a proposta, e no redirect leva ao token da reserva.
- `openedAt`/`previousOpenAt` em UTC; o receptor converte para o horário de SP.
- `openCount` é a contagem total de aberturas, inclusive as que não geraram aviso.
- `previousOpenAt` pode vir `null` com `isFirstOpen: false` quando a abertura anterior não pôde ser lida: na dúvida, o site avisa. O receptor deve aceitar essa combinação.
- **Idempotência:** `eventId` é o mesmo em todas as tentativas do mesmo aviso, e distinto entre aberturas (vem do `RPUSH` atômico). O receptor deve ignorar um `eventId` já processado.

**Verificação no receptor** (obrigatória), antes de usar qualquer campo:
1. Recalcular `v1=` + HMAC-SHA256 hex de `` `${ts}.${payload}` ``, com o `payload` **exatamente como texto**, sem parse e sem reformatar, e o `PROPOSAL_WEBHOOK_SECRET`.
2. Comparar com `signature` em tempo constante.
3. Recusar `ts` a mais de 5 minutos do relógio.
4. Só então fazer o parse de `payload` e ignorar um `eventId` já processado.

Em TypeScript, `verifyProposalWebhook` de `lib/proposal-webhook.ts` faz os passos 1 a 3, confere o formato do payload e devolve o payload (ou `null`).

**Configurar no Cloudflare Pages** (Production e Preview):
- `PROPOSAL_WEBHOOK_URL`: o endereço do gatilho da automação da Clara (`https`, sem query string).
- `PROPOSAL_WEBHOOK_KEY`: a chave de envio que o painel da automação mostra. Vai no `Authorization: Bearer`. Só autentica no receptor; não prova que o aviso veio do site.
- `PROPOSAL_WEBHOOK_SECRET`: `openssl rand -hex 32`, o mesmo valor guardado como segredo da Clara. É o que prova a origem.

## Aviso ao Felipe (P7)

A Clara é um agente do Grok Bot (Anysphere/Cursor); a rotina dela é o receptor do webhook. Ao receber um aviso válido, ela lê o lead no Odoo e escreve ao Felipe, no chat do Grok Bot: o lead ligado ao link (o aviso não identifica quem abriu, que pode ser alguém a quem o cliente repassou o link), quantas vezes foi aberto, a hora (horário de São Paulo), a oportunidade e um rascunho curto de retorno, usando só o link da nota "Proposta enviada". Aviso com assinatura inválida, `ts` fora da janela ou sem segredo é descartado em silêncio. A Clara não envia nada ao cliente nem escreve no CRM sem o OK do Felipe no chat. A nota automática de abertura no Odoo (P8) é do site, não da Clara, e não depende desse OK. O lead 60 ("TESTE proposta-link (Otto)") é de teste: aviso marcado como teste, sem rascunho.

Instrução da rotina mantida no painel da Clara, fora deste repositório. Aceite (#1903) pelos testes de 22/10/2026 no lead 60: abertura às 22:47 avisada às 22:48 (horário de São Paulo), com a assinatura conferida, e marcada como teste, sem rascunho. O rascunho para um lead real não foi exercitado: o Felipe dispensou esse teste em 23/10/2026, e ele fica comprovado no primeiro uso real.

## Medidas de privacidade pendentes

Decididas pelo Encarregado em 23/10/2026 (RIPD, Atividade 5). Ficam fora deste repositório. A política (seção 5.10) só passa a descrevê-las depois que estiverem em uso.

- **Leitura do Odoo por lista de campos.** A Clara (Anysphere/Cursor) lê o lead para preparar o retorno. O limite deve ficar nas permissões do usuário ou da chave de API do Odoo que ela usa (grupos e regras de acesso), não só nas instruções da rotina. A lista sai do que o rascunho de fato usa: perguntar à Clara quais campos ela lê.
- **Aviso na mensagem de envio.** No modo redirect o cliente nunca vê o rodapé da página. O Felipe envia o link ao cliente pessoalmente, e a mensagem (qualquer modo) inclui uma linha como: _"Ao abrir o link, registramos só a data e a hora, para acompanhar sua proposta. Saiba mais: www.anhanga.tur.br/politica-privacidade#link-de-proposta"_.

## Notas no Odoo (P8)

Nota interna (`mail.mt_note`) no chatter do `crm.lead` do `leadId`, via `services/odoo.ts` (`postLeadNote`). Código em `lib/proposal-odoo-notes.ts`.

- **Ao criar:** `Proposta enviada: https://www.anhanga.tur.br/proposta/<id> (válida até dd/mm/aaaa)`. Só o link do cliente: nem o de prévia nem o da operadora. É daqui que a Clara pega o link; ele não vai no webhook.
- **A cada abertura relevante** (as mesmas que disparam o webhook: 1ª e reaberturas 30+ min depois): `Proposta aberta em dd/mm/aaaa às hh:mm (horário de São Paulo), Nª vez`, onde N é a contagem total de aberturas. Sem IP, cidade ou aparelho.
- **Nota, não mensagem:** `mail.mt_note` não manda e-mail aos seguidores do lead, então nada chega ao cliente.
- **Nunca quebra:** sem `ODOO_*` configurado, a nota é pulada; se o Odoo falhar, a proposta é criada mesmo assim (a resposta do endpoint traz `crmNote: "recorded" | "skipped" | "failed"`) e a página abre normalmente (a nota roda em `waitUntil`, ao lado do webhook). Falha fica no log `PROPOSAL_ODOO_NOTE` só com o status HTTP, porque a mensagem de erro do Odoo pode repetir o texto da nota.
- **`crmNote: "failed"` na criação:** a proposta existe e o link funciona, mas a Clara não vai achá-lo no lead (ela lê o link da nota de envio). Quem chamou o endpoint deve avisar o Felipe ou registrar a nota à mão no lead com o `url` devolvido; não recriar a proposta (geraria um segundo link). O deadline do Odoo (8 s, autenticação incluída) limita a espera do bot.
- Sem atividade de follow-up agendada para a Clara (opcional na issue): o webhook já cumpre esse papel.

## Página da proposta (P9)

Uma proposta guarda **ou** `redirectUrl` (redirect rastreado) **ou** `content` (página). O conteúdo segue `lib/proposal-content.ts`, revalidado a cada leitura, e é renderizado por `lib/proposal-template.ts`, sem JavaScript.

- **O schema é uma allowlist.** Não há campo para valor por item, comissão, `booking_id`, idades, logo da companhia aérea ou formas de pagamento da operadora. Assim, D2 (só o total) e a regra de não expor dados da RCA valem por construção.
- **Primeiro nome (D6):** `firstName` guarda só a primeira palavra.
- **Fotos (D4):** ficam nos servidores da operadora, só em `https` e só de `media.staticontent.com` e `media.infotravel.com.br`. A CSP libera exatamente esses hosts em `img-src`, e `Referrer-Policy: no-referrer` impede que eles recebam a URL da proposta.
- **Fornecedor local:** o traslado mostra uma linha discreta "Operado por …" (decisão do Felipe, 22/10/2026). Descrições da operadora podem citar o fornecedor.
- **Condições:** texto fixo da Anhangá ("Valores sujeitos a disponibilidade… fale com a gente pelo WhatsApp"), nunca o da operadora (D7). As regras de cancelamento de cada item aparecem junto do item.
- **Datas:** diárias (`2027-03-10T00:00:00`) são tratadas como dia de calendário, e horários de voo como hora local do aeroporto. Nenhuma das duas passa por fuso horário, então não "voltam um dia" no servidor.
- **Prévias de link** (WhatsApp etc.) continuam recebendo a página genérica, sem nome, hotel ou preço. A prévia interna (`?previa=`) mostra a página completa com o aviso.
- **Rodapé:** aviso de que a abertura é registrada só com data e hora (sem IP, localização ou aparelho), com link para `/politica-privacidade` (seção 5.10).
- **Conversão:** `fromInfotravelNormalized` (`lib/proposal-infotravel.ts`) transforma o JSON normalizado da Infotravel (`main.getBooking` + `main.getHotel`) nesse conteúdo. O adaptador que gera o normalizado a partir da API é a P11 (#1906). O fixture em `tests/fixtures/` é a cotação de teste com o roteiro deslocado e números fictícios. Os arquivos brutos da API têm dados reais do cliente e não entram no repositório.

## Adaptador Infotravel (P11)

`type: "infotravel"` com o link do orçamento em `redirectUrl` (`https://premium.infotravel.com.br/orcamento-web/pt/link?token=…`):

1. O token sai da query bruta do link; o `companyCode` sai do próprio token (base64 de `RCA | <reserva> | <hash>`).
2. `services/infotravel.ts` faz os mesmos dois GETs públicos que a página da operadora faz, sem login: `main.getBooking` (`{token, clientUrl}`) e `main.getHotel` (`{companyCode, hotelKey}`), em `https://premium.infotravel.com.br/orcamento-web/api/trpc/…?batch=1&input=…`. Host fixo, prazo total de 6 s.
3. `lib/infotravel-normalize.ts` monta o JSON normalizado e confere: um pacote, um quarto, tudo em BRL, `status: QUOTATION`, nenhuma categoria que a página não mostra (seguro, carro, trem, cruzeiro… no pacote ou na raiz da reserva) e **total = soma de todos os preços ao centavo** (inclui o ajuste de comissão, que nunca aparece).
4. `fromInfotravelNormalized` (P9) gera o conteúdo, e a proposta é salva como página.

Qualquer falha cai no **redirect rastreado** para o mesmo link (P2). A resposta traz `mode: "page" | "redirect"` e, no redirect, `fallbackReason`: `pages_disabled`, `invalid_token`, `timeout`, `http_error`, `unexpected_response`, `unexpected_shape`, `unsupported_quotation`, `total_mismatch` ou `invalid_content`.

Se a cotação informar `expirationDate`, a página nunca vale além dela: a validade é o menor entre o pedido (padrão 15 dias) e o prazo da operadora. Uma cotação já vencida é recusada com 409 `QUOTATION_EXPIRED`, sem redirect: o redirect manteria o token da reserva ativo por 15 dias depois do fim da cotação (#1925).

Nunca copiados da cotação: `contact`/`user` (o agente), `client` (a agência, com CNPJ), `unit` (unidade RCA), localizadores, `textDoc` (formas de pagamento da operadora), observações do fornecedor (telefone de plantão) e logos.

**Liga/desliga:** `PROPOSAL_PAGES_ENABLED=true` libera as páginas; sem ela, todo `infotravel` vira redirect com `fallbackReason: "pages_disabled"`. Ligada em produção em 23/10/2026, depois que a política passou a cobrir a página (#1925).

O token vai duas vezes na URL da API (`input`): ele nunca é logado, e o parâmetro `input` é redigido no Sentry (`lib/error-tracking.ts`).

O endpoint é síncrono: até 6 s na operadora + até 8 s no Odoo. O timeout do bot deve ser de pelo menos 20 s.

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
