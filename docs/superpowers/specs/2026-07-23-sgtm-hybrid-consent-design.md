# Design: Tracking híbrido com consentimento no GTM/sGTM

- **Data:** 2026-07-23
- **Issue:** [#1261](https://github.com/felipewilliam2/AV-SITE/issues/1261)
- **Status:** Aprovado — plano de implementação pronto
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
  → notifica a ponte de consentimento registrada pelo GTM
  → template GTM chama updateConsentState(granted)
  → dataLayer.push({ event: 'marketing_consent_granted' })

Web GTM
  ├─ Meta PageView inicia o Pixel
  ├─ TikTok PageView inicia o Pixel
  └─ generate_lead mantém o Lead browser da Meta

sGTM (x-ga-gcs = G111)
  ├─ GA4 continua normalmente
  ├─ generate_lead → Meta CAPI Lead
  └─ generate_lead → TikTok Events API Lead
```

O evento explícito no `dataLayer` permite iniciar os pixels na mesma página em
que o usuário aceita. Sem ele, tags bloqueadas em DOM Ready/All Pages poderiam
esperar até o próximo reload.

O evento só é empurrado depois que os callbacks da ponte foram notificados. A
ponte usa `updateConsentState`, não uma tag Custom HTML nem apenas
`gtag('consent', 'update')`. A API do GTM garante que a atualização seja
processada antes dos itens já enfileirados no `dataLayer`; `gtag` isoladamente
não oferece essa garantia para o evento seguinte.

### 5.3 Deduplicação e sobreposição

- Meta browser e Meta server continuam recebendo o mesmo `event_id` gerado pelo
  pipeline GTM existente. A mudança de consentimento não altera essa origem.
- TikTok browser envia PageView; TikTok server envia `Lead`. Não há o mesmo
  evento nos dois canais nesta fase, portanto não há cópia para deduplicar.
- A introdução futura de `Lead` também no browser exigirá o mesmo
  `event_id` nos dois canais antes de ser publicada.

## 6. Mudança no repositório

### 6.1 `index.html`

Adicionar uma API de assinatura restrita a callbacks — sem expor função pública
capaz de conceder consentimento:

```js
var consentListeners = [];
var callConsentListener = function (callback, choice) {
  try {
    callback(choice);
  } catch (error) {
    console.error('Anhangá consent listener failed', error);
  }
};
window.addAnhangaConsentListener = function (callback) {
  if (typeof callback !== 'function') return;
  consentListeners.push(callback);
  callConsentListener(callback, _consentChoice);
};
```

No listener existente de `anhanga:marketing-consent`:

1. notificar cada callback com `marketing`; o Consent Bridge é o único
   responsável por chamar `updateConsentState`, evitando transições duplicadas;
2. somente depois empurrar:

```js
window.dataLayer.push({
  event: 'marketing_consent_granted',
  anhanga_marketing_consent: true
});
```

Na inicialização da IIFE, empurrar
`anhanga_marketing_consent: _consentChoice === 'marketing'` para que as tags
tenham o valor persistido também em visitas posteriores. Na revogação, notificar
os callbacks com `essential`, empurrar o valor `false`, manter o update para
`denied` e então recarregar a página.

O evento de aceite ocorre uma vez por sessão. O listener DOM já usa
`{ once: true }`; a ponte aceita vários assinantes para não acoplar o site a uma
única tag.

### 6.2 Testes

`tests/index-third-party-scripts.test.ts` deve verificar:

- presença de `addAnhangaConsentListener`;
- callback imediato com o estado persistido;
- notificação dos callbacks antes de `marketing_consent_granted`;
- presença de `marketing_consent_granted`;
- payload `anhanga_marketing_consent: true`;
- listener continua registrado com `{ once: true }`;
- revogação notifica `essential`, registra `false` e continua fail-closed com
  reload.

Não será adicionado SDK Meta/TikTok ao bundle da aplicação.

### 6.3 `docs/compliance/ripd-legitimo-interesse.md`

Corrigir somente as afirmações factualmente incompatíveis com a arquitetura
híbrida:

- click IDs continuam first-party e só são repassados às plataformas após
  consentimento de marketing;
- conversões são enviadas server-side, mas Meta/TikTok também podem carregar
  pixels no browser depois do opt-in;
- antes do consentimento e após recusa não há cookie, script ou beacon desses
  fornecedores.

A base legal e o balancing test não serão reescritos nesta issue. A correção
remove afirmações absolutas como “sem pixel JS de terceiros no browser”, que já
não descrevem a configuração real.

## 7. Mudanças no container web

### 7.1 Template `Anhangá Consent Bridge`

Criar um template sandboxed do GTM que:

- usa `callInWindow('addAnhangaConsentListener', callback)` para assinar a API
  do site;
- transforma `marketing` em `granted` para `ad_storage`, `ad_user_data` e
  `ad_personalization`;
- transforma qualquer outro valor, inclusive ausente, em `denied`;
- mantém `analytics_storage: granted`;
- aplica a mudança com `updateConsentState`;
- possui permissão de escrita somente para esses quatro consent types e permissão
  de chamada somente para `addAnhangaConsentListener`.

Criar uma tag a partir desse template e dispará-la em **Consent Initialization —
All Pages**. O callback imediato do site sincroniza a escolha persistida; os
callbacks posteriores tratam o aceite e aplicam a revogação antes do reload
controlado.

Não usar Custom HTML para escrever consentimento.

### 7.2 Variável de consentimento

Criar uma variável Data Layer v2 `DLV - anhanga_marketing_consent`, com nome
`anhanga_marketing_consent` e default `false`. Usá-la no campo
`Consent Granted (GDPR)` da tag Meta:

- `true` somente após escolha `marketing`;
- `false` para ausência, recusa ou revogação.

Os consent checks adicionais do GTM continuam sendo o gate autoritativo. A
variável existe porque o template Meta também possui o campo próprio
`Consent Granted (GDPR)`.

### 7.3 Meta PageView

Reutilizar a tag pausada `Meta - PageView` (`51`) em vez de criar uma terceira
tag Meta:

- evento standard: `PageView`;
- triggers:
  - All Pages, somente com consentimento concedido;
  - `marketing_consent_granted`, para aceite após o carregamento;
- firing option: uma vez por página;
- consent checks: `ad_storage`, `ad_user_data`, `ad_personalization`.

### 7.4 Meta Lead

Na tag dinâmica Meta (`50`):

- remover o trigger DOM Ready;
- manter somente os eventos de conversão já mapeados, incluindo
  `generate_lead → Lead`;
- trocar `Consent Granted (GDPR) = True` por
  `DLV - anhanga_marketing_consent`;
- exigir `ad_storage`, `ad_user_data` e `ad_personalization`;
- desmarcar **Opt in to a Meta-enabled Conversions API integration**;
- manter o mesmo Pixel ID e a mesma variável de `event_id`;
- firing option: uma vez por evento.

Desmarcar a integração remove a justificativa para o
`capiParamBuilder.bundle.js`; a ausência do bundle deve ser confirmada no
Preview antes de publicação.

### 7.5 TikTok PageView

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

### 7.6 Consent Overview

Habilitar o Consent Overview do container e confirmar:

- Meta e TikTok exigem `ad_storage`, `ad_user_data` e `ad_personalization`;
- Google/GA4 continuam usando os checks nativos, sem bloqueio adicional;
- nenhuma tag de marketing permanece em **Consent Not Configured**.

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
- evento TikTok: `Lead` (nome atual recomendado; `SubmitForm` é legado);
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
2. confirmar que `Anhangá Consent Bridge` chama `updateConsentState`;
3. confirmar que o estado concedido é aplicado antes de
   `marketing_consent_granted`;
4. confirmar carga imediata de Meta/TikTok sem reload;
5. confirmar `x-ga-gcs = G111`;
6. confirmar ausência permanente do `capiParamBuilder`;
7. confirmar um único PageView por plataforma e por página.

### 9.4 Conversão

Um submit real de teste cria registro no Odoo e exige autorização específica no
momento do teste. Com essa autorização:

- usar identidade claramente marcada como teste;
- confirmar `generate_lead` no web e server Preview;
- Meta: Pixel e CAPI com o mesmo `event_id`;
- TikTok: uma chamada Events API `Lead`;
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
  - `Lead` server-side;
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
- TikTok recebe `Lead` apenas server-side.
- Nenhum token ou PII aparece no Git.
- O JavaScript de terceiros do carregamento inicial cai de forma mensurável nas
  três rotas da issue.
- As versões podem ser revertidas independentemente sem reabrir o furo de
  consentimento.

## 14. Referências técnicas

- [Google — The data layer](https://developers.google.com/tag-platform/tag-manager/datalayer):
  ordem de processamento e garantia das Consent APIs.
- [Google — Create a consent mode template](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis):
  `updateConsentState`, listener e permissões do template.
- [Google — Tag Manager consent mode support](https://support.google.com/tagmanager/answer/10718549):
  Consent Initialization, consent checks adicionais e Consent Overview.
- [Google — Server-side internal parameters](https://developers.google.com/tag-platform/tag-manager/server-side/internal-parameters):
  propagação de `x-ga-gcs`.
- [TikTok — Events API](https://ads.tiktok.com/help/article/events-api):
  envio server-side e deduplicação quando o mesmo evento existir nos dois
  canais.
