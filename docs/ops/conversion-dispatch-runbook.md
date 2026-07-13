# Runbook: Conversion dispatch (Odoo → Google/Meta)

This runbook covers operating `/api/purchase-dispatch` once the Odoo → Ads
conversion loop is active. See `docs/product/odoo-ads-conversion-decision.md`
for the full architecture decision; this document only transcribes the
operational rules from that decision (§§5–6, 8) plus the activation
checklist.

## Reconciliação semanal

Comparar semanalmente a contagem e o valor de `crm.lead` marcado como Ganho no
Odoo contra os eventos `Purchase` registrados no Meta Events Manager e as
conversões correspondentes no GA4. Variância aceitável: **≤5%**. Acima disso,
investigar oportunidades com `x_conversion_dispatch_status = 'failed'` no
Odoo — cada uma representa uma conversão que nunca chegou ao Google/Meta.

## Retry

- Reprocessar automaticamente registros com `status = 'failed' AND attempts < 5`,
  com backoff: 1h, 4h, 12h, 24h.
- `attempts >= 5` → não reprocessar automaticamente; abrir investigação manual.
  O reenvio manual é feito chamando `/api/purchase-dispatch` diretamente com o
  `dealId` da oportunidade (mesmo payload que a automação do Odoo enviaria).

## Kill switch / rollback

- Definir `PURCHASE_DISPATCH_ENABLED=false` no dashboard do Cloudflare Pages
  desliga o endpoint imediatamente (retorna 503, `code: 'DISPATCH_DISABLED'`)
  sem expor o estado da flag a chamadores não autenticados (o gate roda depois
  da checagem de `X-Webhook-Secret`).
- Enquanto desligado, a automação do Odoo continua tentando e gravando
  `status = 'failed'` — nenhum evento é perdido silenciosamente.
- Ao religar (removendo a env ou setando um valor diferente de `'false'`/`'0'`),
  o ciclo de reconciliação/retry acima reprocessa o backlog acumulado.

## Fase de sombra

Antes de qualquer disparo real com significado de negócio, rodar em modo
sombra:

- Configurar `META_TEST_EVENT_CODE` para que os eventos apareçam no Events
  Manager em modo teste, sem impactar o algoritmo de lance de produção.
- Acompanhar o GA4 DebugView para os mesmos eventos.
- Critério de saída da fase de sombra: **10 oportunidades Ganhas consecutivas**
  processadas com `mode: 'full'` (GA4 e Meta ambos com sucesso) antes de
  remover `META_TEST_EVENT_CODE` e considerar o disparo ativo em produção.

## Checklist de ativação (gates externos)

Transcrito da seção "Gates externos" de `plans/019-odoo-ads-conversion-loop.md`.
Nenhum destes itens é resolvido pelo código deste plano — todos bloqueiam a
**ativação**, não a implementação:

- [ ] Campos custom criados no Odoo (`x_gclid`, `x_fbclid`, `x_fbc`, `x_fbp`,
      `x_ga_client_id`, `x_ga_session_id`, `x_event_id`,
      `x_conversion_dispatch_status`, `x_conversion_dispatch_attempts`) via
      acesso Studio/admin. Só depois disso `ODOO_CONVERSION_FIELDS_ENABLED=true`.
- [ ] RIPD atualizado + confirmação do DPO sobre a base legal do reenvio de PII
      hasheada e identificadores de clique (§7 do doc de decisão). Nenhum
      disparo real antes disso.
- [ ] Automated Action no Odoo validada (Server Action com HTTP custom, ou
      "Send Webhook Notification" nativo; fallback: polling n8n) — §2 do doc.
- [ ] Fase de sombra concluída (ver seção acima).
- [ ] Campo de valor monetário da oportunidade Ganha confirmado, e link
      GA4↔Ads ativo com o evento marcado como conversão — §§3 e 5 do doc.
