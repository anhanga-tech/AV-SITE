# Decisão — Fechar o ciclo de conversão Odoo → Google e Meta

**Status:** decisão de arquitetura tomada; parte repo implementada (plans/019) atrás de flags — ativação pendente dos gates externos.
**Origem:** issue #1149 (spike), que sucede `docs/marketing/plano-conversao-offline.md` (removido — conteúdo evoluído para este documento, decisões antes em aberto agora resolvidas).
**Autor:** spike de engenharia solo (agente), sem acesso a admin do Odoo/Google Ads/Meta Business — as decisões marcadas **[requer confirmação externa]** são recomendações fundamentadas, não fatos verificados em produção.

## Problema

Quando uma oportunidade evolui no Odoo (qualificada, Ganha), isso precisa reenviar uma conversão pro Google e pro Meta usando os click IDs capturados na entrada do lead (`gclid`, `fbclid` etc.), pro algoritmo de lance otimizar por quem vira negócio — não só por quem preenche formulário.

Existe infraestrutura de dispatch **já construída e funcional, mas órfã**: `api/purchase-dispatch.ts` + `lib/conversions/{google,meta}.ts` foram construídos para o CRM antigo (Salesforce/HubSpot via n8n). O cut-over pro Odoo (jun/2026) não recriou o gatilho — hoje nada aciona esse endpoint quando uma oportunidade Odoo muda de estágio.

## Estado atual verificado no código (jul/2026)

- `api/purchase-dispatch.ts`: aceita `eventType` (`lead_qualificado`, `close_convert_lead`, `purchase`), autentica via `X-Webhook-Secret` (comparação de segredo estático em tempo constante contra `N8N_WEBHOOK_SECRET`, via `timingSafeEqual` — não é uma assinatura HMAC sobre o payload), dispara `sendGoogleConversion` + `sendMetaConversion` em paralelo, retorna `mode: full/partial/failed`.
- `lib/conversions/google.ts`: **GA4 Measurement Protocol** (`client_id` + `gclid` como evento GA4), não é a API nativa de Offline Conversion Import do Google Ads.
- `lib/conversions/meta.ts`: Conversions API da Meta, `em`/`ph`/`fn`/`ln` hasheados SHA-256, `fbclid`/`fbc`/`fbp`/IP/UA crus, dedup por `event_id`.
- `crm.lead` hoje **não tem campos estruturados/consultáveis** para `gclid`, `fbclid`, `fbp`, `fbc`, GA `cid`/`sid` nem `event_id` — só existem como texto dentro do HTML de `description` (`lib/odoo-lead-mapping.ts::buildDescriptionHtml`). Nenhuma automação do Odoo consegue lê-los hoje.
- `msclkid`, `ttclid`, `wbraid`, `gbraid` são capturados no cliente mas não chegam nem à descrição — não são mapeados em lugar nenhum.
- `x_lgpd_consent` é um campo de **`res.partner`** (opt-in de e-mail marketing), não de `crm.lead` — qualquer verificação de consentimento no gatilho precisa atravessar `partner_id.x_lgpd_consent`.
- Só existem módulos de dispatch para Google e Meta. Sem evidência de campanha ativa em Microsoft/TikTok hoje — `wrangler.toml` tem `GOOGLE_ADS_CONVERSION_ID` (`AW-17331979537`) que nenhum código lê.
- Nenhum receiver inbound do Odoo existe no repo hoje (`api/` só tem o legado `hubspot-webhook.ts`), nenhum job agendado em `.github/workflows/` observa o Odoo.

---

## Decisões

### 1. Campos consultáveis exigidos no Odoo **[requer confirmação externa: acesso Studio/admin]**

Promover de texto solto na `description` para campos estruturados em `crm.lead`:

| Campo novo | Tipo | Propósito |
|---|---|---|
| `x_gclid` | Char | Google Ads click ID |
| `x_fbclid` | Char | Meta click ID |
| `x_fbc` / `x_fbp` | Char | Meta browser/click cookies (dedup + Advanced Matching) |
| `x_ga_client_id` / `x_ga_session_id` | Char | GA4 `client_id`/`session_id` |
| `x_event_id` | Char | Identificador estável do evento de origem (ver seção 4) |
| `x_conversion_dispatch_status` | Selection (`pending`/`sent`/`failed`) | Idempotência + observabilidade do disparo |
| `x_conversion_dispatch_attempts` | Integer | Contador para runbook de retry manual |

Sem esses campos, nenhuma automação do Odoo consegue montar o payload do `purchase-dispatch` — isso bloqueia a Fase 2 abaixo e é o primeiro passo de implementação, sem alternativa.

### 2. Ownership do gatilho de mudança de estágio — **decidido: Automação nativa do Odoo (Opção A)**

**Opção A (escolhida):** Automated Action / Server Action no `crm.lead`, disparada em mudança de `stage_id` → "Ganho", chamando `POST /api/purchase-dispatch` diretamente com o header `X-Webhook-Secret`.

**Opção B (rejeitada como padrão, mantida como fallback):** n8n observando o Odoo via polling agendado ou webhook.

**Por quê A:** evento real (sem lag de polling), sem infraestrutura adicional, e o `x_conversion_dispatch_status`/`_attempts` da seção 1 já cobre a idempotência que a Opção B resolveria com um flag separado. A adoção real depende de uma confirmação técnica que este spike não pode verificar sozinho:

> **[requer confirmação externa]** Server Actions no plano contratado (Odoo Online/Odoo.sh) precisam permitir código Python custom com `requests`/`urllib` para chamar um endpoint HTTP externo. Em algumas instâncias Online isso é restrito por segurança. Caso o código Python customizado seja bloqueado, o Odoo também oferece uma ação nativa de **"Send Webhook Notification"** dentro de Automated Actions — dispara o POST HTTP diretamente pela UI, sem código, e vale conferir essa alternativa antes de descartar a Opção A. Se nenhuma das duas vias nativas for viável, cai para a Opção B automaticamente — nesse caso, o n8n faz polling a cada 5–15 min filtrando `crm.lead` com `stage_id = Ganho AND x_conversion_dispatch_status != 'sent'`, o que já é suportado pelos campos da seção 1 sem redesenho.

**Retries e observabilidade (ambas as opções):** no disparo, gravar `x_conversion_dispatch_status = 'pending'`; em sucesso (`mode: full`), `'sent'`; em `mode: partial` ou `failed`, `'failed'` + incrementar `x_conversion_dispatch_attempts`. Um job de reconciliação (seção 5) reprocessa `status = 'failed' AND attempts < 5` com backoff. Logs estruturados em `api/purchase-dispatch.ts` já existem (request ID, `mode`) — adicionar o `dealId`/`x_event_id` a esses logs para correlação ponta a ponta.

### 3. Google — **decidido: manter GA4 Measurement Protocol + conta linkada, por ora**

Duas opções técnicas existem:
- **GA4 MP → Google Ads via conta linkada** (implementado hoje): menor custo de integração, já funcional, mas depende de o evento GA4 estar marcado como conversão *e* a propriedade estar linkada à conta do Google Ads — configuração fora do repo, **[requer confirmação externa]**: confirmar no painel do GA4/Google Ads que o link e a marcação de conversão existem e estão ativos.
- **API nativa de Offline Conversion Import do Google Ads**: sinal de atribuição mais direto e preciso (liga a conversão ao `gclid` sem depender do relacionamento de contas GA4↔Ads), mas exige developer token + fluxo OAuth — integração substancialmente mais pesada, nova credencial a gerenciar.

**Trade-off registrado:** ficar com GA4 MP agora evita adicionar uma segunda integração de credenciais antes de validar que o pipeline volta a funcionar. Migrar para a API nativa é um **follow-up condicional** (seção 6, Fase 3b) — só vale o custo se a reconciliação (seção 5) mostrar que o link de conta não está propagando as conversões de forma confiável para o Google Ads.

### 4. Deduplicação e identificador estável — Meta

- **Identificador da conversão de compra:** `purchase_{crm.lead.id}` — determinístico, não aleatório. Diferente do `event_id` de Lead (gerado no browser, `lead_{uuid}`, já usado para dedup entre pixel de browser e o CAPI do evento de Lead). O evento de Purchase não tem contraparte de pixel no browser (a confirmação de venda acontece no CRM, não numa página que o cliente visita), então o identificador determinístico serve para **idempotência do próprio disparo** — se a automação do Odoo reexecutar por qualquer motivo (edição não relacionada no lead, retry manual), o Meta deduplica a reexecução em vez de contar a mesma venda duas vezes.
- Gravar esse identificador em `x_event_id` (seção 1) no momento do primeiro disparo, para que retries subsequentes reenviem o mesmo valor em vez de gerar um novo.
- `lib/conversions/meta.ts` já usa `deduplicationId` como `event_id` do payload Meta — nenhuma mudança de código necessária ali, só o payload de entrada do `purchase-dispatch` precisa passar `purchase_{dealId}` em vez de reusar o `event_id` de Lead.

### 5. Métricas de reconciliação

- **Cadência:** verificação semanal (job manual ou agendado) comparando: (a) contagem e valor total de `crm.lead` com `stage_id = Ganho` no período vs. (b) eventos `Purchase` no Meta Events Manager e conversões GA4 no mesmo intervalo.
- **Variância aceitável:** até 5% de diferença de contagem sem investigação (falhas transitórias de rede/timeout são esperadas); acima disso, investigar via `x_conversion_dispatch_status = 'failed'` no Odoo.
- **Fonte de verdade para valor monetário:** `crm.lead.expected_revenue` (ou o campo equivalente que a oportunidade Ganha usa) — **[requer confirmação externa]**: confirmar com quem administra o Odoo qual campo carrega o valor final da venda, já que `buildLeadFields` hoje não grava valor nenhum (só cria a oportunidade com estágio "Novo").

### 6. Recuperação de falha

- `mode: partial` (um provedor falhou) ou `failed` (ambos) → `x_conversion_dispatch_status = 'failed'`, incrementa `attempts`.
- Reprocessamento: job de reconciliação (seção 5) tenta novamente `status = 'failed' AND attempts < 5`, com backoff (ex.: 1h, 4h, 12h, 24h, depois marca `attempts >= 5` para investigação manual — runbook simples: reenviar manualmente via chamada direta ao endpoint com o `dealId`).
- **Kill switch:** manter em `api/purchase-dispatch.ts` (código que já controlo) uma checagem de env var (`PURCHASE_DISPATCH_ENABLED`, default `true`) — permite desligar o endpoint inteiro sem depender de mudar a automação do Odoo, útil se um provedor mudar contrato de API e começar a rejeitar todo payload.

### 7. Limites de consentimento **[decisão de compliance — sinalizar para revisão jurídica/DPO]**

- `x_lgpd_consent` vive em `res.partner` (opt-in de e-mail marketing), não em `crm.lead` — o gatilho precisa resolver `partner_id.x_lgpd_consent` antes de montar o payload Meta.
- **Decisão proposta (revisada):** se `x_lgpd_consent` for `false`/ausente, **omitir tanto os campos de PII hasheada** (`em`, `ph`, `fn`, `ln`) **quanto os identificadores de clique/cookie** (`fbclid`, `fbc`, `fbp`) do evento Meta. Identificadores online são tratados como dado pessoal pela LGPD (não só PII cadastral) — a leitura anterior deste documento, que tratava click IDs como "não-PII" e propunha enviá-los mesmo sem consentimento, estava errada e foi corrigida. Vale distinguir o estado de mapeamento: `fbclid` já é processado por `lib/conversions/meta.ts` hoje; `fbc`/`fbp` são capturados no cliente (`utils/whatsapp.ts`) mas **ainda não** chegam a nenhum payload de conversão — a decisão de omissão sob falta de consentimento vale igualmente para os três assim que qualquer um for enviado. O evento GA4 também deve ser omitido (ou disparado sem `gclid`/`client_id`) quando o consentimento não for obtido, a menos que uma base legal alternativa (ex.: legítimo interesse) seja formalmente validada pelo DPO.
- Essa é uma leitura de engenharia, não parecer jurídico — `docs/compliance/ripd-legitimo-interesse.md` cobre consentimento na camada de *coleta* (Atividade 4, Customer Match) mas não referencia `purchase-dispatch.ts` explicitmente. Antes de implementar, o RIPD precisa de uma nova atividade (ou uma seção na Atividade 3) cobrindo especificamente o reenvio de identificadores/PII hasheada para Meta CAPI e GA4 no evento de conversão — **não implementar a Fase 2/3 sem essa atualização do RIPD e sem confirmação do DPO sobre a base legal de cada envio**.

### 8. Critérios de rollout / rollback

- **Fase de sombra:** antes de qualquer disparo real, rodar a automação apontando para `META_TEST_EVENT_CODE` (já suportado por `lib/conversions/meta.ts`) e validar no GA4 DebugView — confirma que o payload monta corretamente sem contaminar métricas de produção.
- **Critério de saída da sombra:** 10 oportunidades Ganhas consecutivas aparecendo corretamente no Test Events do Meta e no DebugView do GA4, com `mode: full` em todas.
- **Rollback:** `PURCHASE_DISPATCH_ENABLED=false` (seção 6) desliga o endpoint imediatamente; a automação do Odoo continua tentando (grava `failed`), sem perda de dados — quando reabilitado, o job de reconciliação (seção 5) reprocessa o backlog.

---

## Fatias de implementação (follow-up, sem questões de arquitetura em aberto)

1. **Fase 1 — Campos estruturados no Odoo.** Bloqueia tudo o resto. Depende de acesso Studio/admin (seção 1). Trabalho no repo: estender `OdooLeadInput`/`buildLeadFields` (mesmo padrão de `x_destino`, PR #1133) para escrever nos novos campos em vez de só na descrição.
2. **Fase 2 — Gatilho (Odoo → dispatch).** Depende da Fase 1. Implementar a Automated Action (Opção A, seção 2) ou o polling n8n (fallback). Trabalho no repo: nenhum, a menos que o `purchase-dispatch.ts` precise de ajuste de payload para o novo `x_event_id`/`dealId` determinístico (seção 4).
3. **Fase 3a — Kill switch + reconciliação.** Independente das Fases 1–2, pode ser feita antes: adicionar `PURCHASE_DISPATCH_ENABLED` ao handler (seção 6) e documentar o runbook de reconciliação (seção 5).
4. **Fase 3b — Migrar Google para Offline Conversion Import nativo.** Condicional — só entra se a reconciliação (seção 5) mostrar que o link GA4↔Ads não é confiável (seção 3).
5. **Fase 4 — Microsoft/TikTok.** Condicional a confirmar campanha ativa nessas plataformas — **[requer confirmação externa: time de mídia paga]**. Sem isso confirmado, não entra no roadmap.

## Decisões que ainda precisam de alguém fora do código

- Criar os campos custom no Odoo (Fase 1) — acesso Studio/admin.
- Confirmar se Server Actions do plano contratado permitem HTTP request customizado (seção 2) — define se a Opção A é viável ou se cai pra Opção B automaticamente.
- Confirmar campo de valor monetário da oportunidade Ganha no Odoo (seção 5).
- Atualizar o RIPD para cobrir o reenvio de PII hasheada no evento de conversão (seção 7) — revisão jurídica/DPO antes de implementar.
- Confirmar campanha ativa em Microsoft/TikTok (Fase 4).
- Confirmar no painel GA4/Google Ads que o link de conta e a marcação de conversão estão ativos (seção 3).
