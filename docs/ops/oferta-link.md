# Link curto de oferta (`/o/<slug>`)

Canal Anhangá Ofertas. Um link por oferta, só com o slug na URL. O texto do WhatsApp fica no servidor. O destino é sempre o WhatsApp da Anhangá (`5511955021519`, o mesmo número de `utils/whatsapp.ts`). O clique humano não avisa o CRM nem o assistente comercial.

Autorizado pelo Felipe em 09/11/2026: construir e publicar via PR, com deploy ao entrar na `main`.

## O que existe

- `functions/o/[slug].ts` → `lib/offer-link-page.ts` → `lib/offer-link-store.ts` (Upstash Redis, o mesmo já usado pelo site).
- `POST /api/create-offer-link` e `GET /api/offer-link-stats` em `api/`, com adaptadores em `functions/api/`.
- Não há tabela nova, binding novo nem migração. As chaves nascem no Redis que já está em produção (`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`).

## O que o Felipe configura

**Antes de criar a primeira oferta** (pode ser antes ou logo depois do merge; sem isso a API responde 500 e não grava nada):

1. Gerar um segredo novo, separado do `PROPOSAL_API_SECRET`:

   ```bash
   openssl rand -hex 32
   ```

2. No Cloudflare Pages, projeto do site, Settings → Environment variables, criar `OFFER_LINK_SECRET` como segredo (encrypted), em **Production** e em **Preview**.
3. Guardar o mesmo valor só com quem for chamar a API (Operações). Não colocar em chat, legenda, planilha ou no repositório.
4. Não criar banco, não rodar migração e não alterar `wrangler.toml`. O Redis atual já serve.

O deploy da `main` publica a rota. Enquanto o segredo não existir, `POST /api/create-offer-link` responde 500 `CONFIG_ERROR`. `GET /o/<slug>` responde 404 para slug desconhecido — não usar o caminho nas legendas antes de a oferta estar criada e o deploy no ar.

## Chaves no Redis

| Chave | Conteúdo | TTL |
|---|---|---|
| `oferta:rec:<slug>` | Cadastro (mensagem, título, validade) | Até `expiresAt` + 30 dias, ou 366 dias a partir da última gravação quando não há validade |
| `oferta:clk:<slug>` | Lista de cliques, um JSON `{"at":"…"}` por clique humano | 90 dias a partir do primeiro clique (`EXPIRE NX`) |

O TTL faz o expurgo. A auditoria diária das chaves `proposta:*` (`.github/workflows/proposal-retention-audit.yml`) **não** olha `oferta:*`. Estender essa auditoria mexe em workflow e fica para um OK separado do Felipe. Sem isso, a retenção continua valendo pelo TTL gravado em cada escrita.

## Clique

`GET /o/<slug>`:

| Quem | Resposta | Conta? |
|---|---|---|
| Pessoa (GET com User-Agent de navegador) | 302 para `https://wa.me/5511955021519?text=<mensagem guardada>` | Sim |
| Prévia (WhatsApp, Facebook, Telegram e os demais em `lib/link-preview-agents.ts`), `HEAD`, pedido sem User-Agent | 200, HTML leve com o logo, `og:title`, `og:image` e `noindex` | Não |
| Prefetch do navegador | 503 | Não |
| Slug inexistente ou malformado | 404, título "Link inválido" | Não |
| `expiresAt` já passou | 410, "Esta oferta encerrou", com link para `https://wa.me/5511955021519` (sem texto da oferta) | Não |
| Redis fora | 503 | Não |

`expiresAt` é uma data `AAAA-MM-DD`: a oferta vale até 00:00 desse dia no horário de São Paulo (UTC−3). `2027-02-01` encerra na virada de 31 de janeiro para 1º de fevereiro. Depois disso a página de encerramento fica mais 30 dias; então o slug passa a responder 404.

`curl` entra na lista de prévia e **não conta**. Para conferir a contagem, abrir o link num navegador.

O 302 manda `Referrer-Policy: no-referrer` e `Cache-Control: private, no-store`. A página HTML não tem `script-src` na CSP, então o Zaraz e o Web Analytics não rodam nela. Conferir no primeiro uso real, num host `anhanga.tur.br`, que não há request para `/cdn-cgi/zaraz/` nem `cloudflareinsights.com`. Se houver, criar uma Configuration Rule para `/o/*` com "Disable Zaraz".

## Criar ou atualizar

```bash
curl -sS -X POST https://www.anhanga.tur.br/api/create-offer-link \
  -H "Authorization: Bearer $OFFER_LINK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"slug":"gramado-jan-2027","message":"Quero a oferta Gramado janeiro 2027","title":"Gramado — férias janeiro 2027","expiresAt":"2027-02-01"}'
```

Resposta 201:

```json
{ "ok": true, "requestId": "…", "url": "https://www.anhanga.tur.br/o/gramado-jan-2027", "slug": "gramado-jan-2027", "expiresAt": "2027-02-01" }
```

`url` é o que vai na legenda. Sempre aponta para produção, mesmo se o pedido sair de um deploy de preview.

- `slug`: minúsculas, hífens, 3 a 60 caracteres, `[a-z0-9]+(?:-[a-z0-9]+)*`. Preferir destino e data (`gramado-jan-2027`).
- `message`: obrigatória, até 300 caracteres, sem URL.
- `title`: opcional, até 140 caracteres, sem URL. É o título da prévia. Sem ele, a prévia diz "Oferta | Anhangá Viagens".
- `expiresAt`: opcional. Data futura, no máximo cerca de 3 anos à frente.
- Campo extra é recusado (400 `VALIDATION_ERROR`).
- Slug repetido atualiza mensagem, título e validade e devolve a mesma URL. Título ou validade omitidos nessa segunda chamada são apagados. Os cliques já contados permanecem.

| Status | `code` | Quando |
|---|---|---|
| 401 | `UNAUTHORIZED` | `Authorization: Bearer` ausente ou errado (inclusive se for o segredo da proposta) |
| 405 | `METHOD_NOT_ALLOWED` | Método diferente de POST |
| 400 | `VALIDATION_ERROR` | Corpo inválido, slug fora do padrão, mensagem com URL ou validade inválida |
| 429 | `RATE_LIMIT_EXCEEDED` | Mais de 30 pedidos por minuto do mesmo IP, inclusive com segredo errado (o limite vem antes da conferência do Bearer) |
| 500 | `CONFIG_ERROR` | Falta `OFFER_LINK_SECRET` |
| 503 | `STORE_UNAVAILABLE` / `SERVICE_UNAVAILABLE` | Redis fora, ou rate limit sem Redis em produção |

## Aderência

```bash
curl -sS -H "Authorization: Bearer $OFFER_LINK_SECRET" \
  "https://www.anhanga.tur.br/api/offer-link-stats?slug=gramado-jan-2027"
```

```json
{ "ok": true, "requestId": "…", "slug": "gramado-jan-2027", "clicks": 3, "lastClickAt": "2026-11-09T18:44:00.000Z" }
```

`clicks` não inclui prévia. `lastClickAt` é UTC (`null` se ninguém abriu). Slug desconhecido: 404. Oferta encerrada ainda dentro da carência: devolve os cliques que já existiam.

## Privacidade

Mesma linha do link de proposta, sem o aviso ao CRM:

- `noindex` na resposta e `Disallow: /o/` em todos os grupos do `robots.txt` que podem rastrear o site. Fora do sitemap.
- O clique grava só `at`. Sem IP cru e sem hash de IP.
- Retenção dos eventos: 90 dias.
- Nenhum webhook e nenhuma nota no Odoo por clique.
- A política pública descreve isso na seção 5.11 (`/politica-privacidade#link-de-oferta`). O aceite do Encarregado é a revisão desta PR. O RIPD (Atividade 6) e a matriz de operadores (Upstash, 2.6) foram atualizados no mesmo conjunto.

Logs (`CREATE_OFFER_LINK`, `OFFER_LINK`, `OFFER_LINK_STATS`) trazem `requestId`, etapa e, na gravação bem-sucedida, o slug. Nunca a mensagem nem o segredo. Falha do Redis registra só `error.name`, porque a mensagem de erro cita o comando e a chave.
