# Design: Tracking híbrido com consentimento no GTM/sGTM

- **Data:** 2026-07-23
- **Issue:** [#1261](https://github.com/felipewilliam2/AV-SITE/issues/1261)
- **Status:** Proposta consolidada — aguardando revisão do usuário
- **Containers:** web e server identificados somente no inventário operacional local
- **Premissa de consentimento vigente no projeto:** analytics por legítimo
  interesse; publicidade e marketing condicionados a consentimento. Esta
  especificação não substitui validação jurídica.

---

## 1. Contexto

A produção carrega o container web por um loader first-party da Stape e encaminha
GA4 ao container server em `sst.anhanga.tur.br`. O carregamento foi retirado do
caminho crítico pela #1259/#1260, mas o container ainda injeta scripts pesados no
navegador:

- Meta Pixel (`fbevents.js` e configuração do pixel);
- TikTok Pixel (`events.js` e bundles auxiliares);
- `capiParamBuilder.bundle.js`, ativado pela integração Meta-enabled CAPI da tag web.

A auditoria de 23/07/2026 reproduziu um problema mais grave que o custo de
performance: os scripts e beacons Meta/TikTok aparecem tanto com o banner ainda
sem escolha quanto depois de uma recusa persistida. O Consent Mode enviado pelo
site está correto (`ad_storage`, `ad_user_data` e `ad_personalization` negados),
mas as tags do container não o respeitam.

O desenho anterior do projeto afirma que a ausência de consentimento é
fail-closed. A configuração observada contradiz essa garantia e precisa ser
corrigida nos dois containers.

## 2. Objetivos

1. Manter GA4 via sGTM disponível sob legítimo interesse.
2. Impedir qualquer carregamento ou beacon Meta/TikTok antes do consentimento e
   após uma recusa.
3. Preservar o modelo híbrido após o aceite:
   - Meta Pixel + Meta CAPI para `Lead`, com deduplicação;
   - TikTok Pixel para PageView e TikTok Events API para a conversão de lead.
4. Remover o `capiParamBuilder` do navegador sem interromper o CAPI já existente.
5. Reduzir de forma determinística o JavaScript de terceiros no carregamento
   inicial usado por Lighthouse/PageSpeed.
6. Publicar cada superfície de forma independente, com Preview, evidência e
   rollback restrito.

## 3. Fora de escopo

- Migração de GA4 para outra propriedade ou outro container.
- Criação de eventos de funil originados no Odoo.
- Alteração do modelo de atribuição das plataformas.
- Envio de PageView do TikTok pela Events API.
- Envio de PageView do Meta pela CAPI nesta primeira fase.
- Reestruturação de `lib/conversions/` ou reativação do dispatch Meta direto do
  Cloudflare.
- Mudança na base legal documentada para GA4/UTM.

## 4. Estado auditado

### 4.1 Container web

| Item | Estado encontrado | Consequência |
|---|---|---|
| Tag Meta `50` | `Consent Granted (GDPR) = True` fixo | Tag ignora a escolha real |
| Tag Meta `50` | Meta-enabled CAPI habilitado | Injeta `capiParamBuilder` |
| Tag Meta `50` | DOM Ready + eventos customizados | Inicializa Pixel sem opt-in |
| Tag Meta PageView `51` | Pausada | PageView sai atualmente pela tag dinâmica |
| TikTok tag `5` | HTML personalizado em All Pages | Pixel carrega sem opt-in |
| TikTok tag `5` | Sem consent checks | Recusa não bloqueia execução |
| Tag Meta antiga `31` | Pausada | Não participa do fluxo |

O workspace web auditado não tinha alterações pendentes durante a
auditoria.

### 4.2 Container server

| Item | Estado encontrado | Consequência |
|---|---|---|
| Meta CAPI tag `14` | Ativa | CAPI disponível |
| Trigger `CE - generate_lead` (`16`) | Evento `generate_lead` | Mantém o Lead server-side |
| Trigger legado `13` | Cinco nomes de evento como filtros simultâneos | Condição impossível; código morto |
| Consent gate do Meta | Ausente | Pode enviar marketing com `ad_storage=denied` |
| TikTok Events API | Inexistente | Nenhuma conversão TikTok server-side |
| GA4 server tag `10` | All GA4 Events | Deve permanecer |

O workspace server auditado não tinha alterações pendentes durante a
auditoria.

### 4.3 Segurança

O token da Meta está armazenado de forma visível na configuração da tag server e
já havia sido exposto em diagnóstico anterior. O valor não pode aparecer em
commits, documentação, screenshots ou comentários. Um token novo deve substituir
o atual imediatamente antes do corte final.

## 5. Arquitetura aprovada

### 5.1 Fluxo sem consentimento de marketing

```text
Browser
  ├─ Consent Mode: analytics_storage=granted
  ├─ Consent Mode: ad_storage/ad_user_data/ad_personalization=denied
  ├─ GA4 → sst.anhanga.tur.br → GA4
  ├─ Meta Pixel: bloqueado
  └─ TikTok Pixel: bloqueado

sGTM
  ├─ x-ga-gcs = G101
  ├─ GA4 server tag: permitido
  ├─ Meta CAPI: bloqueado
  └─ TikTok Events API: bloqueado
```

Ausência de `x-ga-gcs`, valor inválido ou qualquer estado que não conceda
`ad_storage` deve bloquear as tags de marketing.

### 5.2 Fluxo após aceite

```text
setConsent('marketing')
  → evento DOM anhanga:marketing-consent
  → gtag consent update (granted)
  → dataLayer.push({ event: 'marketing_consent_granted' })

Web GTM
  ├─ Meta PageView inicia o Pixel
  ├─ TikTok PageView inicia o Pixel
  └─ generate_lead mantém o Lead browser da Meta

sGTM (x-ga-gcs = G111)
  ├─ GA4 continua normalmente
  ├─ generate_lead → Meta CAPI Lead
  └─ generate_lead → TikTok Events API SubmitForm
```

O evento explícito no `dataLayer` permite iniciar os pixels na mesma página em
que o usuário aceita. Sem ele, tags bloqueadas em DOM Ready/All Pages poderiam
esperar até o próximo reload.

### 5.3 Deduplicação e sobreposição

- Meta browser e Meta server continuam recebendo o mesmo `event_id` gerado pelo
  pipeline GTM existente. A mudança de consentimento não altera essa origem.
- TikTok browser envia PageView; TikTok server envia `SubmitForm`. Não há o mesmo
  evento nos dois canais nesta fase, portanto não há cópia para deduplicar.
- A introdução futura de `SubmitForm` também no browser exigirá o mesmo
  `event_id` nos dois canais antes de ser publicada.

## 6. Mudança no repositório

### 6.1 `index.html`

No listener existente de `anhanga:marketing-consent`, após o `gtag('consent',
'update', ...)`, adicionar:

```js
window.dataLayer.push({ event: 'marketing_consent_granted' });
```

O push ocorre uma vez por aceite na sessão. O listener já usa `{ once: true }`.
Revogação continua atualizando o Consent Mode para denied e recarregando a
página.

### 6.2 Testes

`tests/index-third-party-scripts.test.ts` deve verificar:

- presença de `marketing_consent_granted`;
- ordem: consent update antes do push;
- listener continua registrado com `{ once: true }`;
- revogação continua fail-closed com reload.

Não será adicionado SDK Meta/TikTok ao bundle da aplicação.

## 7. Mudanças no container web

### 7.1 Variável de consentimento

Criar uma variável de estado de consentimento para `ad_storage` e uma variável
booleana `Marketing Consent Granted`:

- `granted` → `true`;
- qualquer outro valor, inclusive ausente → `false`.

Como o site atualiza `ad_storage`, `ad_user_data` e `ad_personalization` em
conjunto, `ad_storage` é o sinal canônico do gate. As tags também terão consent
checks adicionais para os três tipos.

### 7.2 Meta PageView

Reutilizar a tag pausada `Meta - PageView` (`51`) em vez de criar uma terceira
tag Meta:

- evento standard: `PageView`;
- triggers:
  - All Pages, somente com consentimento concedido;
  - `marketing_consent_granted`, para aceite após o carregamento;
- firing option: uma vez por página;
- consent checks: `ad_storage`, `ad_user_data`, `ad_personalization`.

### 7.3 Meta Lead

Na tag dinâmica Meta (`50`):

- remover o trigger DOM Ready;
- manter somente os eventos de conversão já mapeados, incluindo
  `generate_lead → Lead`;
- trocar `Consent Granted (GDPR) = True` pela variável
  `Marketing Consent Granted`;
- exigir `ad_storage`, `ad_user_data` e `ad_personalization`;
- desmarcar **Opt in to a Meta-enabled Conversions API integration**;
- manter o mesmo Pixel ID e a mesma variável de `event_id`;
- firing option: uma vez por evento.

Desmarcar a integração remove a justificativa para o
`capiParamBuilder.bundle.js`; a ausência do bundle deve ser confirmada no
Preview antes de publicação.

### 7.4 TikTok PageView

Na tag HTML TikTok (`5`):

- manter o snippet oficial existente;
- manter `ttq.page()`;
- triggers:
  - All Pages com consentimento concedido;
  - `marketing_consent_granted`;
- firing option: uma vez por página;
- consent checks: `ad_storage`, `ad_user_data`, `ad_personalization`.

O HTML não será reescrito para implementar um consent manager paralelo. O GTM é
o único gate.

## 8. Mudanças no container server

### 8.1 Variável `x-ga-gcs`

Criar uma variável do tipo **Event Data** com key path `x-ga-gcs`.

Estados aceitos para marketing:

| Valor | Ad storage | Analytics storage | Marketing server-side |
|---|---:|---:|---:|
| `G100` | denied | denied | bloquear |
| `G101` | denied | granted | bloquear |
| `G110` | granted | denied | permitir |
| `G111` | granted | granted | permitir |
| ausente/outro | desconhecido | desconhecido | bloquear |

O filtro permitido é `^G11[01]$`.

### 8.2 Meta CAPI

Na tag Meta CAPI (`14`):

- manter o trigger dedicado `CE - generate_lead` (`16`);
- adicionar ao trigger a condição `x-ga-gcs matches RegEx ^G11[01]$`;
- remover a referência ao trigger legado impossível (`13`);
- manter `generate_lead → Lead`;
- manter o mesmo `event_id` recebido do stream web;
- não habilitar PageView server-side nesta fase;
- substituir o token antigo pelo token rotacionado sem registrá-lo fora do GTM.

O trigger legado `13` pode ser excluído depois que nenhuma referência restar.

### 8.3 TikTok Events API

Instalar a tag TikTok Events API da Stape no server container:

- Pixel ID: o mesmo da conexão web atual;
- Access Token: gerado no TikTok Events Manager e inserido diretamente no GTM;
- evento de entrada: `generate_lead`;
- evento TikTok: `SubmitForm`;
- trigger adicional: `x-ga-gcs matches RegEx ^G11[01]$`;
- URL/referrer/IP/user-agent/`ttclid`: obtidos do event data suportado pela tag;
- test event code: somente durante Preview e removido antes da versão publicada.

O token TikTok segue a mesma regra do Meta: nunca copiar para repositório,
documentação ou comentários.

## 9. Validação

### 9.1 Checks automatizados do repositório

- teste focado de `tests/index-third-party-scripts.test.ts`;
- `pnpm typecheck`;
- `pnpm test:regression`;
- `pnpm lint:changed`.

### 9.2 Preview — recusa

Em uma sessão limpa:

1. abrir a Home sem escolha persistida;
2. aguardar o fallback de analytics;
3. confirmar GA4 em `sst.anhanga.tur.br`;
4. confirmar `x-ga-gcs = G101`;
5. confirmar ausência de:
   - `connect.facebook.net`;
   - `facebook.com/tr`;
   - `analytics.tiktok.com`;
   - `capi-automation.s3.us-east-2.amazonaws.com`;
6. clicar em Recusar, recarregar e repetir;
7. confirmar que Meta CAPI e TikTok Events API não disparam no server Preview.

### 9.3 Preview — aceite

1. em sessão limpa, clicar em Aceitar;
2. confirmar `marketing_consent_granted`;
3. confirmar carga imediata de Meta/TikTok sem reload;
4. confirmar `x-ga-gcs = G111`;
5. confirmar ausência permanente do `capiParamBuilder`;
6. confirmar um único PageView por plataforma e por página.

### 9.4 Conversão

Um submit real de teste cria registro no Odoo e exige autorização específica no
momento do teste. Com essa autorização:

- usar identidade claramente marcada como teste;
- confirmar `generate_lead` no web e server Preview;
- Meta: Pixel e CAPI com o mesmo `event_id`;
- TikTok: uma chamada Events API `SubmitForm`;
- confirmar resposta de sucesso das duas APIs;
- remover ou arquivar o registro de teste no Odoo pelo procedimento operacional
  aprovado pelo usuário.

## 10. Publicação

Nenhum clique em **Enviar/Publicar** ocorre sem apresentação prévia da evidência
do Preview e autorização do usuário.

Ordem:

1. merge/deploy da mudança pequena no repositório;
2. publicar versão server com gates e TikTok Events API;
3. publicar versão web com gates e remoção do Meta-enabled CAPI;
4. repetir a auditoria pública fora do Preview.

Cada versão deve ter nome e descrição específicos da issue #1261. Os containers
não serão publicados na mesma ação.

## 11. Rollback

- Falha Meta/TikTok server: reverter somente a versão server.
- Falha dos pixels após consentimento: pausar a tag afetada e corrigir em novo
  workspace.
- Não restaurar tags que disparam após recusa.
- A mudança do repositório é compatível com containers antigos; o evento extra no
  `dataLayer` é inerte até possuir trigger.
- O comportamento fail-closed tem prioridade sobre continuidade de remarketing.

## 12. Verificação pós-corte

### Imediata

- inventário público de recursos antes da escolha e após Recusar;
- inventário após Aceitar;
- Home, um post de blog e `/beto-carrero/`;
- PageSpeed Insights mobile nas mesmas três URLs;
- registrar bytes de JavaScript de terceiros e contribuição de main thread/TBT.

### Janela de 3–7 dias

- Meta Events Manager:
  - presença de Lead browser + server;
  - deduplicação;
  - ausência de eventos sem consentimento;
- TikTok Events Manager:
  - `SubmitForm` server-side;
  - ausência de duplicação;
- GA4:
  - continuidade de pageviews e eventos;
- comparar volume de conversões com a linha de base anterior ao corte.

## 13. Critérios de aceite

- Sessão sem consentimento e sessão recusada não carregam nem enviam Meta/TikTok.
- GA4 continua via sGTM com `analytics_storage=granted`.
- `capiParamBuilder.bundle.js` não aparece em nenhuma condição.
- Após aceite, Meta e TikTok carregam sem reload.
- Meta Lead browser/server preserva o mesmo `event_id`.
- TikTok recebe `SubmitForm` apenas server-side.
- Nenhum token ou PII aparece no Git.
- O JavaScript de terceiros do carregamento inicial cai de forma mensurável nas
  três rotas da issue.
- As versões podem ser revertidas independentemente sem reabrir o furo de
  consentimento.
