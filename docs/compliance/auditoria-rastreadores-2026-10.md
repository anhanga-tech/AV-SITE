# Auditoria de rastreadores — 13/10/2026

Issues [#1543](https://github.com/anhanga-tech/AV-SITE/issues/1543) e [#1545](https://github.com/anhanga-tech/AV-SITE/issues/1545). Leitura do código em `main` e da migração documentada em `docs/superpowers/plans/2026-09-01-zaraz-tag-migration.md`. Não houve captura de rede no domínio de produção nem aprovação do Encarregado: as duas ficam pendentes de propósito, porque esta mudança não vai para produção por este PR.

## O que não está mais no site

| Peça | Estado | Evidência no repositório |
|---|---|---|
| GTM `GTM-T2KGS86G` e o iframe `<noscript>` | Removidos | `index.html` não referencia `googletagmanager.com` nem `ns.html?id=GTM` |
| sGTM Stape (`sst.anhanga.tur.br`) | Desligado pela Stape em 31/08/2026 | Plano de migração Zaraz, Task 7; `index.html` não carrega o loader |
| Google Tag Gateway | Desligado em 01/09/2026 | Mesmo plano; não há tag de gateway no HTML |
| Mautic (`mtc.js`) e HubSpot | Descontinuados | `index.html` não injeta os scripts; RIPD v1.8 |
| Pixels de Meta/TikTok no navegador | Não injetados | Zaraz em CAPI-only; a ponte em `index.html` só chama `zaraz.consent.set` com o ID da purpose |
| Customer Match / upload de públicos | Inativo | RIPD Atividade 4. Não foi reintroduzido |

Não existe export versionado do container GTM/sGTM neste repositório: os loaders saíram do código e o container da Stape não responde. A matriz abaixo descreve o que o código dispara hoje.

## Matriz — o que dispara, quando, e a base legal

| Tag / coletor | Quando dispara | Identificadores de campanha | Consentimento |
|---|---|---|---|
| Cloudflare Zaraz — GA4 `G-QDBT5PM4KP` | No carregamento, em qualquer visita. Sem purpose no Zaraz (`hideOriginalIP`) | A URL que o Zaraz vê. Se o script inline rodar antes, a query de campanha já foi removida quando não há recibo | Legítimo interesse (Art. 7º, IX). Oposição por e-mail, política §9.4. Não é bloqueado pelo banner |
| Zaraz — Meta CAPI e TikTok Events API | Só depois que a purpose `marketing` é concedida. O ID da purpose é resolvido em runtime; o nome `"marketing"` não é chave de `consent.set` | Click IDs que ainda estejam na página ou no evento | Consentimento (Art. 7º, I). A ponte só trata a escolha como `marketing` se `anhanga_cookie_consent_meta.registered === true` |
| Traks `analytics-collect.anhanga.tur.br/t.js` | `DOMContentLoaded` em host de produção. Não carrega em localhost, `127.0.0.1`, `.local`, `.test` | Não vê UTM/click ID na query quando o strip inline rodou antes | Script analítico em legítimo interesse. Os parâmetros de campanha não entram sem consentimento registrado |
| `public/utm-tracking.js` | Após interação ou fallback ocioso (`loadAnalytics` em `index.html`) | Grava UTM/click ID no `sessionStorage` só com recibo. Cliques de WhatsApp/especialista seguem sem esses parâmetros. `page_location` sai sem query | Medição de campanha exige recibo. O evento de clique em si não leva a query |
| `utils/whatsapp.ts` (`initializeTracking`) | No import do módulo, em toda página que o carrega | Sem recibo, descarta UTM, click IDs, `fbc`/`fbp` e `hsa_*` do objeto, do cookie `tracking_data` e do `sessionStorage`. Mantém `cid`/`sid` e `ref` | Mesma regra. O corpo da mensagem de WhatsApp continua sem esses identificadores |
| Cookie `anhanga_ga_cid` e cookie `_ga` | Quando não há `_ga` legado, o coletor gera um cid próprio (até 2 anos) | Não é click ID | Legítimo interesse. Pode seguir no cookie `tracking_data` junto com o cid |
| Cloudflare Web Analytics (`/cdn-cgi/rum`) | Beacon da zona, fora deste repositório | Sem cookie persistente entre visitas, conforme a matriz de transferências | Legítimo interesse. Opt-out durável continua na issue #1663 |
| Sentry | Erros e parte dos logs de rate limit | O scrub atual não remove `gclid`/`utm_*` de URLs de erro. Com o strip, a URL vista pelo app já não traz esses parâmetros quando não há consentimento | Legítimo interesse / segurança. Não foi desligado |
| Cal.com (`lib/cal-embed.ts`) | Ao montar o embed de consultoria | Metadados de UTM/click ID só se `getTrackingDataObject()` ainda os tiver, isto é, com recibo | Consentimento de medição para os identificadores de campanha |
| `dataLayer` (`tracking_data_captured`, quiz, formulários) | Quando a captura ou o formulário roda | O objeto empurrado passa pelo mesmo filtro de `getTrackingDataObject()` | Sem recibo, o evento não leva UTM/click ID |
| Odoo (`/api/submit-lead`, contato, quiz, waitlist) | No envio do formulário | `prepareSubmissionConsent` zera UTM/click ID e a nota de atribuição se o recibo não for um grant vigente. `x_gclid` e os campos da #1824 continuam atrás de `ODOO_CONVERSION_FIELDS_ENABLED`, que **não** foi ligado | Consentimento registrado para identificadores de campanha. Opt-in de e-mail é outro ato (`x_lgpd_consent`) |
| Ledger `POST /api/consent` | Aceite/recusa do banner e revogação de e-mail na política | Não recebe click ID. O sujeito anônimo é `anon:<uuid>`; o de e-mail é HMAC | O próprio registro do consentimento |

## Correções deste PR

1. Escolha `marketing` no `localStorage` sem `meta.registered` não esconde o banner, não concede a purpose do Zaraz e não dispara `anhanga:marketing-consent`.
2. O aceite só vira grant depois do `POST /api/consent` responder `effective: "grant"`. Falha do ledger reabre o banner quando a escolha chegou a ser gravada.
3. Recusa grava `essential`, dispara revogação no Zaraz e pede revoke de `ads_measurement`.
4. Sem recibo, um script no `<head>` remove os parâmetros de campanha da URL (`history.replaceState`) e os deixa só em `window.__anhangaPendingAttribution`, até o grant.
5. `utm-tracking.js` e `utils/whatsapp.ts` descartam esses parâmetros do storage quando não há recibo e os recolocam se o grant chegar na mesma página.
6. O CRM só recebe UTM/click ID com grant vigente. A flag da #1824 permanece desligada; com ela ligada e sem recibo, `x_gclid` continua omitido.
7. A política (§9) descreve o cookie e oferece revogação de e-mail marketing. A resposta pública não diz se o endereço existe.

## Residual que o repositório não fecha

- Se a Cloudflare injetar o Zaraz antes do script inline, o Pageview pode observar a URL original da requisição. O HTML não controla essa ordem. O reteste no Preview deve olhar o request do GA4.
- Web Analytics e o opt-out durável de analytics continuam na #1663. Este PR não desliga GA4, Traks, Web Analytics nem Sentry.
- Linhas de descrição já gravadas no Odoo com `gclid` antigo não são reescritas. A revogação impede captura e envio futuros e, no e-mail, força `x_lgpd_consent = false` quando o parceiro já existe. Não cria parceiro vazio.
- Customer Match segue inativo. Não há destino para propagar essa revogação.
- O log de falha de `POST /api/submit-lead` ainda inclui os UTMs que o cliente mandou no JSON, mascarando e-mail e telefone. O Odoo não recebe esses campos sem recibo. O scrub do Sentry não remove `gclid` de URL de erro.
- Reteste no domínio `anhanga.tur.br` e aprovação do Encarregado ficam fora deste PR.

## Como ver no Preview

1. Abrir o Preview com `?gclid=teste&utm_source=google&utm_medium=cpc`.
2. Antes de aceitar, a barra de endereço não deve manter esses parâmetros. No DevTools, `tracking_data` e `sessionStorage.anhanga_tracking_data` não devem ter `gclid` nem `utm_source`.
3. Aceitar. O banner some depois do `POST /api/consent` (201, `registered: true`). Recarregar a página com a query de novo: os parâmetros podem permanecer, porque o recibo existe.
4. Gerenciar cookies → Recusar. A purpose de marketing no Zaraz vai a `false` e o storage perde os parâmetros de campanha.
5. Em `/politica-privacidade/#cookies`, revogar um e-mail. A mensagem de sucesso não confirma se o cadastro existe.
6. Enviar um lead de teste sem ter aceitado: a oportunidade no Odoo (ambiente do Preview) não deve trazer `gclid` na descrição. `ODOO_CONVERSION_FIELDS_ENABLED` não está definido.
