# Webhook de lead novo para a agente Lis (OpenBot)

Quando `/api/submit-lead` ou `/api/submit-contact` cria um `crm.lead` **novo** no Odoo, o site avisa a agente Lis · Novos leads (OpenBot) por um webhook assinado. A Lis lê a oportunidade no Odoo pelo id, prepara o registro e propõe a resposta.

Código: `lib/lead-created-webhook.ts` (envio e assinatura), chamado por `lib/odoo-submit-handler.ts` no `onCreated` de `createLead` (`services/odoo.ts`). Testes: `tests/lead-created-webhook.test.ts`.

## Quando dispara

- Só quando `createLead` **criou** o registro. Um replay idempotente (mesmo `event_id`, retry do cliente, entrega duplicada) que resolve para um lead já existente (`lib/odoo-lead-idempotency.ts`) não dispara de novo.
- Formulários partner-only (quiz, waitlist, NPS) não criam `crm.lead` e não disparam.
- Em `waitUntil`, depois da resposta ao formulário: o aviso nunca atrasa nem quebra o envio. Até 3 tentativas (3 s de timeout cada, espera de 1 s e 3 s) em erro de rede, 429 ou 5xx (incluindo o 503 "tentar depois"). Um 4xx (ex.: 401 de assinatura) não é repetido. Sem fila durável: se as 3 falharem, o aviso se perde (fica o log `LEAD_CREATED_WEBHOOK` `failed`) e o lead continua no Odoo normalmente.
- **Pula sem chamar** (log `LEAD_CREATED_WEBHOOK` `not_configured`, nível warn): sem `OPENBOT_LEAD_WEBHOOK_URL` ou `OPENBOT_LEAD_WEBHOOK_SECRET`, ou URL que não seja `https`.

## Requisição

```http
POST <OPENBOT_LEAD_WEBHOOK_URL>
Content-Type: application/json
x-openbot-timestamp: <segundos Unix do envio>
x-openbot-delivery-id: lead-<lead_id>
x-openbot-signature: sha256=<hex>

{"type":"crm.lead.created","occurredAt":"<ISO 8601>","data":{"lead_id":<id>,"source":"site","form":"submit-lead"|"submit-contact"}}
```

- Assinatura: `sha256=` + hex do HMAC-SHA256 de `` `${timestamp}.${deliveryId}.${corpo}` `` com `OPENBOT_LEAD_WEBHOOK_SECRET`, sobre os bytes exatos do corpo enviado. O receptor aceita até 300 s de diferença no timestamp; cada tentativa assina de novo com o horário dela.
- `x-openbot-delivery-id` é estável por lead (`lead-<id>`): o receptor conta uma segunda entrega como duplicada (200), o que também protege contra disparo duplo.
- Respostas do receptor: 202 aceito, 200 duplicado, 401 assinatura ruim, 503 tentar depois.
- **Sem dado pessoal no corpo**: nem nome, nem telefone, nem e-mail. Só o id do `crm.lead`.
- Os logs nunca levam a URL, o segredo, a assinatura nem o corpo: só `stage`, `form`, `status`/`errorName` e a tentativa.

## Variáveis (Cloudflare Pages → av-site → Settings → Variables and Secrets, ambiente Production)

| Variável | Tipo | Valor |
|---|---|---|
| `OPENBOT_LEAD_WEBHOOK_URL` | Secret | o endereço `https` do webhook da Lis no OpenBot |
| `OPENBOT_LEAD_WEBHOOK_SECRET` | Secret | a chave de assinatura desse webhook no OpenBot (o mesmo valor do receptor) |

A URL também fica como Secret: o repositório é público e o endereço do receptor não entra no código nem na documentação. Depois de salvar, um novo deploy de produção aplica as variáveis (variáveis do Pages só valem para deploys feitos depois da mudança).

## Como desligar

Apagar `OPENBOT_LEAD_WEBHOOK_SECRET` (ou `OPENBOT_LEAD_WEBHOOK_URL`) no Pages e fazer um novo deploy. O formulário segue igual; cada lead novo só registra `not_configured` no log.

## Como trocar o segredo

Gerar a chave nova no OpenBot, atualizar `OPENBOT_LEAD_WEBHOOK_SECRET` no Pages e fazer deploy. Entre a troca no receptor e o deploy, os avisos voltam 401 e não são repetidos.
