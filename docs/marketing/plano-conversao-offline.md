# Plano — Conversão Offline (Odoo → Ads)

Status: planejamento, nenhuma fase implementada ainda (exceto a fundação parcial descrita na Fase 1).
Origem: discussão sobre atribuição de leads (PR #1113 — CTA source; PR #1114 — campaign_id nativo).

## Objetivo

Quando um lead evolui no Odoo (ex.: qualificado, oportunidade Ganha), reenviar essa conversão pras plataformas de ads (Google, Meta e — se confirmado que rodam campanha — Microsoft/TikTok) usando os click IDs capturados na entrada do lead (`gclid`, `fbclid`, `msclkid`, `ttclid` etc.), para que o algoritmo de lance otimize por quem realmente vira negócio, não só por quem preenche formulário.

## Estado atual (verificado no código, jul/2026)

Existe uma infraestrutura de dispatch **já construída e funcional**, mas **hoje órfã** — nada a aciona em produção:

- `api/purchase-dispatch.ts` — endpoint completo, aceita `eventType` (`lead_qualificado`, `close_convert_lead`, `purchase`), autentica via header `X-Webhook-Secret` contra `N8N_WEBHOOK_SECRET`, e dispara em paralelo:
  - `lib/conversions/google.ts` → **GA4 Measurement Protocol** (não é a API nativa de Offline Conversion Import do Google Ads). Envia `client_id` + `gclid` como evento GA4; para influenciar lances no Google Ads, o evento GA4 precisa estar marcado como conversão *e* a propriedade GA4 precisa estar linkada à conta do Google Ads (configuração fora do repo).
  - `lib/conversions/meta.ts` → Conversions API (CAPI) da Meta, com `em`/`ph`/`fn`/`ln` hasheados em SHA-256 e `fbclid`/`fbc`/`fbp`/IP/UA crus. Dedup pelo mesmo `event_id` usado no evento de browser (dataLayer → GTM server-side/Stape).
- **Esse pipeline foi construído antes do cut-over pro Odoo (jun/2026)**. O workflow do n8n que chamava `purchase-dispatch` observava o CRM antigo (Salesforce/HubSpot) — confirmado que **não foi refeito contra o Odoo**. Hoje nada aciona esse endpoint.
- Os click IDs `gclid`, `fbclid`, `fbp`, `fbc` e GA `cid`/`sid` **só existem como texto solto** dentro da descrição HTML do `crm.lead` (`lib/odoo-lead-mapping.ts`) — não são campos consultáveis, então nenhuma automação do Odoo conseguiria extraí-los hoje mesmo se o gatilho existisse. `msclkid`, `ttclid`, `wbraid` e `gbraid` são capturados no cliente mas **sequer chegam a esse texto** — não são mapeados em lugar nenhum hoje.
- Só há módulo de dispatch para **Google e Meta**. Não existe `lib/conversions/microsoft.ts` nem `tiktok.ts`.
- Não há evidência de que a Anhangá rode campanhas pagas em Microsoft Ads ou TikTok Ads hoje — as env vars de produção (Cloudflare Pages) só incluem `GOOGLE_ADS_CONVERSION_ID` (`AW-17331979537`, em `wrangler.toml` — não lido por nenhum código do repo hoje, distinto do par `GA4_MEASUREMENT_ID`/`GA4_API_SECRET` que `lib/conversions/google.ts` usa) e `META_PIXEL_ID`/`META_TEST_EVENT_CODE`, nada de Microsoft/TikTok. Capturar `msclkid`/`ttclid` no cliente foi provavelmente feito "por segurança"/genérico, não porque há campanha ativa nessas plataformas — **confirmar antes de investir na Fase 4**.

## Fases

### Fase 1 — Tornar os click IDs consultáveis no Odoo (fundação)
Promover `gclid`, `fbclid`, `fbc`, `fbp`, `cid` (GA client id), `sid` (GA session id) de texto livre pra campos dedicados no `crm.lead` (ex. `x_gclid`, `x_fbclid`, `x_fbc`, `x_fbp`, `x_ga_client_id`, `x_ga_session_id`), mesmo raciocínio do `ctaSource`/`campaign_id` já feito (PRs #1113/#1114) — só que sem find-or-create, são valores gravados verbatim por lead.

**Pré-requisito fora do código do site:** os campos custom precisam existir no Odoo primeiro (Studio ou um módulo dedicado — quem administra a instância Odoo precisa criar/aprovar isso; não é algo que eu resolvo só editando este repo).

Depois que os campos existirem: estender `OdooLeadInput`/`buildLeadFields` (mesmo padrão do `ctaSource`) pra escrever neles, e parar de duplicar essas linhas na descrição.

### Fase 2 — Reconstruir o gatilho (Odoo → dispatch)
Decisão em aberto, não vou escolher sozinho:

- **Opção A — Automação nativa do Odoo** (Automated Action / Server Action no `crm.lead`, disparada em mudança de `stage_id` para "Ganho"/qualificado) chamando `/api/purchase-dispatch` diretamente com o header `X-Webhook-Secret`.
- **Opção B — n8n como orquestrador**, do jeito que era antes: n8n observa o Odoo (poll agendado ou webhook) e chama `purchase-dispatch`. Precisaria de um campo flag (`x_conversion_dispatched`) no `crm.lead` pra não disparar duas vezes o mesmo lead.

Recomendação inicial: Opção A é mais direta (evento real, sem polling), mas depende de quem administra o Odoo confirmar que dá pra fazer HTTP request customizado numa Automated Action. Se a equipe já tem conforto operando via n8n (dashboards, retry, logs), Opção B reaproveita know-how.

### Fase 3 — Confirmar/ajustar a extremidade Google e Meta
- Confirmar se GA4 MP → Google Ads (via link de conta) é suficiente, ou se vale migrar pra API nativa de Offline Conversion Import do Google Ads (mais precisa, mas exige developer token + OAuth — integração bem mais pesada).
- Meta CAPI já parece completo (memória do projeto confirma implementação na issue #861/PR #862) — só validar que os `event_id` de dedup continuam batendo com o fluxo atual do dataLayer/GTM depois de tanto tempo sem uso real.

### Fase 4 — Microsoft Ads / TikTok Ads (condicional)
**Só entra no roadmap se confirmado que há campanha ativa nessas plataformas.** Se sim:
- `lib/conversions/microsoft.ts` — pesquisar o caminho mais leve de offline conversion import da Microsoft Advertising (UET + API própria, developer token).
- `lib/conversions/tiktok.ts` — TikTok Events API (server-side, formato parecido com Meta CAPI), usando `ttclid`.
- Estender `purchase-dispatch.ts` pra incluir os dois no `Promise.all`/no cálculo de `mode` (hoje binário full/partial/failed entre 2 provedores — generalizar pra N).

## Ordem sugerida de execução

1. Fase 1 (dados estruturados no Odoo) — bloqueia tudo o resto, é o menor passo isolado.
2. Fase 2 (gatilho) — sem isso, nada dispara, não importa quão boa a Fase 1 fique.
3. Fase 3 (validar Google/Meta) — reaproveita código existente, é a entrega de maior valor imediato (2 plataformas já rodando hoje).
4. Fase 4 (Microsoft/TikTok) — só depois de confirmado que há budget rodando lá.

## Decisões que precisam de alguém fora do código

- Criar os campos custom no Odoo (Fase 1) — acesso Studio/admin do Odoo.
- Escolher Opção A vs B do gatilho (Fase 2) — quem administra Odoo + n8n.
- Confirmar se há campanha ativa em Microsoft/TikTok (Fase 4) — time de mídia paga.
- Decidir se vale migrar Google de GA4 MP pra API nativa do Google Ads (Fase 3) — trade-off custo de integração vs precisão de atribuição.
