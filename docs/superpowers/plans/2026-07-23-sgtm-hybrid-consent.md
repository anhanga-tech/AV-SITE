# sGTM Hybrid Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manter GA4 via sGTM, bloquear Meta/TikTok sem consentimento, preservar Meta Pixel + CAPI após opt-in e adicionar TikTok Events API sem carregar marketing no navegador antes da escolha.

**Architecture:** O site expõe uma API de assinatura somente-leitura para o estado de consentimento. Um template sandboxed no GTM web converte essa escolha em `updateConsentState`, cuja atualização precede eventos enfileirados; Meta/TikTok web usam consent checks adicionais. O sGTM bloqueia marketing pelo `x-ga-gcs`, mantém Meta CAPI para `generate_lead` e adiciona TikTok Events API `Lead`.

**Tech Stack:** HTML/JavaScript, TypeScript `node:test`, Playwright, Google Tag Manager web e server, Stape, Meta Pixel/CAPI, TikTok Pixel/Events API, Consent Mode v2.

## Global Constraints

- A branch de trabalho é `codex/issue-1261-sgtm-hybrid-consent`.
- Não tocar nem incluir em commit a alteração do usuário em `.Jules/palette.md`.
- `analytics_storage` permanece `granted`; `ad_storage`, `ad_user_data` e `ad_personalization` permanecem fail-closed.
- Meta/TikTok não podem carregar script, criar cookie ou emitir beacon antes do opt-in nem depois de recusa/revogação.
- A atualização consumida pelo GTM deve usar `updateConsentState`; Custom HTML e `gtag('consent', 'update')` isolado não são gates suficientes.
- Meta browser e Meta server preservam o mesmo `event_id` para `Lead`.
- TikTok web envia apenas PageView; TikTok server envia apenas `Lead` nesta fase.
- Não habilitar Meta/TikTok PageView server-side.
- Nenhum access token, test event code ou PII pode entrar no Git, no chat, em screenshots ou em comentários da issue/PR.
- O usuário digita tokens diretamente nos campos do GTM. O agente não copia, lê em voz alta nem registra esses valores.
- Um evento sintético no `dataLayer` deve anteceder qualquer lead real. Lead real exige confirmação específica porque cria registro no Odoo.
- Salvar alterações em workspace é permitido durante a execução; **Enviar/Publicar** exige evidência de Preview e autorização explícita.
- Ordem de corte: deploy do repositório → publicar server → publicar web → auditoria pública.
- Rollback nunca restaura tracking de marketing após recusa.
- Referência aprovada: `docs/superpowers/specs/2026-07-23-sgtm-hybrid-consent-design.md`.

---

## File and Configuration Map

| Superfície | Responsabilidade |
|---|---|
| `index.html` | Estado inicial, API `addAnhangaConsentListener`, notificação de aceite/revogação e evento `marketing_consent_granted` |
| `tests/index-third-party-scripts.test.ts` | Contrato estático de presença e ordem da ponte |
| `tests/e2e/cookie-consent.spec.ts` | Contrato comportamental do callback e do `dataLayer` |
| `docs/compliance/ripd-legitimo-interesse.md` | Descrição factual da arquitetura híbrida e do gate de consentimento |
| GTM web workspace operacional | Template de consentimento, variável DLV, triggers e tags Meta/TikTok |
| sGTM workspace operacional | Variável `x-ga-gcs`, gate server, Meta CAPI e TikTok Events API |
| GitHub issue `#1261` | Evidências antes/depois, links de versões e monitoramento |

---

### Task 1: Implementar a ponte de consentimento no site

**Files:**
- Modify: `index.html:97-205`
- Modify: `tests/index-third-party-scripts.test.ts:171-180`
- Modify: `tests/e2e/cookie-consent.spec.ts:40-74`

**Interfaces:**
- Consumes: `localStorage['anhanga_cookie_consent']`, eventos DOM `anhanga:marketing-consent` e `anhanga:revoke-consent`, `window.dataLayer`.
- Produces: `window.addAnhangaConsentListener(callback: (choice: string | null) => void): void`, `anhanga_marketing_consent: boolean`, evento `marketing_consent_granted`.

- [ ] **Step 1: Adicionar os testes estáticos que descrevem a ponte**

Depois do teste `index.html tem listener anhanga:marketing-consent`, adicionar:

```ts
test('index.html expõe ponte fail-closed para o template de consentimento do GTM', () => {
  assert.match(indexHtml, /window\.addAnhangaConsentListener\s*=\s*function/);
  assert.match(
    indexHtml,
    /callConsentListener\(callback,\s*_consentChoice\)/,
    'assinante recebe imediatamente a escolha persistida com isolamento de falha'
  );
  assert.match(
    indexHtml,
    /anhanga_marketing_consent:\s*_consentChoice\s*===\s*'marketing'/,
    'estado inicial deve ser publicado no dataLayer'
  );
});

test('aceite notifica a ponte antes do evento marketing_consent_granted', () => {
  const acceptStart = indexHtml.indexOf("window.addEventListener('anhanga:marketing-consent'");
  const revokeStart = indexHtml.indexOf("window.addEventListener('anhanga:revoke-consent'");
  const acceptBlock = indexHtml.slice(acceptStart, revokeStart);
  const notifyIndex = acceptBlock.indexOf("notifyConsentListeners('marketing')");
  const eventIndex = acceptBlock.indexOf("event: 'marketing_consent_granted'");

  assert.ok(acceptStart > -1 && revokeStart > acceptStart);
  assert.ok(notifyIndex > -1, 'aceite deve notificar os assinantes');
  assert.ok(eventIndex > notifyIndex, 'updateConsentState deve ser solicitado antes do evento GTM');
  assert.match(acceptBlock, /anhanga_marketing_consent:\s*true/);
});

test('revogação notifica denied antes do reload', () => {
  const revokeStart = indexHtml.indexOf("window.addEventListener('anhanga:revoke-consent'");
  const revokeBlock = indexHtml.slice(revokeStart);
  const notifyIndex = revokeBlock.indexOf("notifyConsentListeners('essential')");
  const deniedIndex = revokeBlock.indexOf('anhanga_marketing_consent: false');
  const reloadIndex = revokeBlock.indexOf('window.location.reload()');

  assert.ok(notifyIndex > -1);
  assert.ok(deniedIndex > notifyIndex);
  assert.ok(reloadIndex > deniedIndex);
});
```

- [ ] **Step 2: Adicionar o teste Playwright da ordem observável**

Depois do teste `após aceitar, metadados são gravados com timestamp e version`, adicionar:

```ts
test('ponte notifica aceite antes de enfileirar marketing_consent_granted', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    type ConsentChoice = string | null;
    type DataLayerEntry = { event?: string; anhanga_marketing_consent?: boolean };
    type TestWindow = Window & {
      dataLayer: DataLayerEntry[];
      addAnhangaConsentListener: (callback: (choice: ConsentChoice) => void) => void;
      __consentBridgeCalls: Array<{ choice: ConsentChoice; eventAlreadyQueued: boolean }>;
    };

    const testWindow = window as unknown as TestWindow;
    testWindow.__consentBridgeCalls = [];
    testWindow.addAnhangaConsentListener((choice) => {
      testWindow.__consentBridgeCalls.push({
        choice,
        eventAlreadyQueued: testWindow.dataLayer.some(
          (entry) => entry.event === 'marketing_consent_granted'
        ),
      });
    });

    // Um assinante defeituoso não pode impedir o restante do fluxo.
    testWindow.addAnhangaConsentListener(() => {
      throw new Error('synthetic listener failure');
    });
  });

  await page.getByRole('button', { name: 'Aceitar' }).click();

  const result = await page.evaluate(() => {
    type DataLayerEntry = { event?: string; anhanga_marketing_consent?: boolean };
    type TestWindow = Window & {
      dataLayer: DataLayerEntry[];
      __consentBridgeCalls: Array<{ choice: string | null; eventAlreadyQueued: boolean }>;
    };
    const testWindow = window as unknown as TestWindow;
    return {
      calls: testWindow.__consentBridgeCalls,
      consentEvent: testWindow.dataLayer.find(
        (entry) => entry.event === 'marketing_consent_granted'
      ),
    };
  });

  expect(result.calls).toEqual([
    { choice: null, eventAlreadyQueued: false },
    { choice: 'marketing', eventAlreadyQueued: false },
  ]);
  expect(result.consentEvent).toEqual({
    event: 'marketing_consent_granted',
    anhanga_marketing_consent: true,
  });
});
```

- [ ] **Step 3: Executar os testes e confirmar a falha esperada**

Run:

```bash
pnpm exec tsx --test tests/index-third-party-scripts.test.ts
pnpm exec playwright test tests/e2e/cookie-consent.spec.ts --grep "ponte notifica"
```

Expected:

- o teste estático falha porque `addAnhangaConsentListener` não existe;
- o Playwright falha com `testWindow.addAnhangaConsentListener is not a function`.

- [ ] **Step 4: Implementar o registro e a notificação isolada dos callbacks**

Logo depois de `var mauticLoaded = false;`, adicionar:

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

      var notifyConsentListeners = function (choice) {
        consentListeners.slice().forEach(function (callback) {
          callConsentListener(callback, choice);
        });
      };

      window.dataLayer.push({
        anhanga_marketing_consent: _consentChoice === 'marketing'
      });
```

- [ ] **Step 5: Atualizar os listeners de aceite e revogação**

Substituir os dois listeners atuais por:

```js
      window.addEventListener('anhanga:marketing-consent', function () {
        _consentChoice = 'marketing';
        loadMautic();
        if (typeof gtag === 'function') {
          gtag('consent', 'update', { ad_storage: 'granted', ad_personalization: 'granted', ad_user_data: 'granted' });
        }
        notifyConsentListeners('marketing');
        window.dataLayer.push({
          event: 'marketing_consent_granted',
          anhanga_marketing_consent: true
        });
      }, { once: true });

      window.addEventListener('anhanga:revoke-consent', function () {
        _consentChoice = 'essential';
        if (typeof gtag === 'function') {
          gtag('consent', 'update', { ad_storage: 'denied', ad_personalization: 'denied', ad_user_data: 'denied' });
        }
        notifyConsentListeners('essential');
        window.dataLayer.push({
          anhanga_marketing_consent: false
        });
        window.location.reload();
      }, { once: true });
```

- [ ] **Step 6: Executar os testes focados**

Run:

```bash
pnpm exec tsx --test tests/index-third-party-scripts.test.ts
pnpm exec playwright test tests/e2e/cookie-consent.spec.ts --grep "ponte notifica"
```

Expected: ambos terminam com PASS. O erro sintético pode aparecer no console do navegador, mas não interrompe o teste nem impede o evento.

- [ ] **Step 7: Revisar o diff da entrega**

Run:

```bash
git diff --check
git diff -- index.html tests/index-third-party-scripts.test.ts tests/e2e/cookie-consent.spec.ts
```

Expected: nenhum erro de whitespace; somente a ponte e seus testes.

- [ ] **Step 8: Commitar a ponte**

```bash
git add index.html tests/index-third-party-scripts.test.ts tests/e2e/cookie-consent.spec.ts
git commit -m "fix(analytics): bridge marketing consent into GTM"
```

Expected: `.Jules/palette.md` não aparece no commit.

---

### Task 2: Corrigir a descrição factual do RIPD

**Files:**
- Modify: `docs/compliance/ripd-legitimo-interesse.md:110-167`

**Interfaces:**
- Consumes: arquitetura híbrida aprovada e gates de consentimento.
- Produces: descrição auditável que diferencia coleta first-party, Pixel após opt-in e conversão server-side.

- [ ] **Step 1: Registrar as afirmações absolutas que precisam desaparecer**

Run:

```bash
rg -n "integralmente server-side|sem pixel JS de terceiros|dados não saem do navegador" docs/compliance/ripd-legitimo-interesse.md
```

Expected: encontra as afirmações antigas na Atividade 2.

- [ ] **Step 2: Atualizar operadores e transferência**

Usar estas linhas na tabela de `3.1 Descrição do tratamento`:

```markdown
| **Operadores** | Anhangá Turismo (armazenamento first-party); Stape OÜ/sGTM (repasse de conversões ao Google Ads, Meta CAPI e TikTok Events API; destinos de marketing somente após consentimento) |
| **Transferência internacional** | Click IDs permanecem first-party antes do consentimento. Após opt-in de marketing, sinais necessários podem ser enviados ao Google, Meta e TikTok pelo sGTM e pelos pixels consentidos, conforme a finalidade de atribuição/conversão. |
```

Substituir a nota arquitetural por:

```markdown
> **Arquitetura híbrida (issue #1261):** UTMs e click IDs são armazenados first-party para atribuição. GA4 continua via sGTM sob a premissa de legítimo interesse do projeto. Meta e TikTok permanecem bloqueados antes do consentimento e após recusa; depois do opt-in, os pixels podem medir PageView/Lead no navegador e as conversões server-side seguem por Meta CAPI e TikTok Events API.
```

- [ ] **Step 3: Atualizar impacto, risco e salvaguardas sem reescrever a base legal**

Na tabela `3.4 Balancing test`, usar:

```markdown
| Impacto sobre o titular | Antes do opt-in, os identificadores permanecem first-party e não há script/beacon Meta ou TikTok. Após consentimento, pixels e APIs recebem somente os sinais necessários às finalidades informadas. |
| Salvaguardas | Cookie first-party; expiração de 30 dias; opt-in para marketing; gates no GTM web e server; nenhuma re-identificação fora das plataformas autorizadas. |
```

Na tabela `3.5 Riscos identificados`, substituir a linha de click IDs por:

```markdown
| Coleta de click IDs antes do consentimento (client-side) | Baixa (pós issues #782/#1261) | Baixo | `initializeTracking()` armazena atribuição first-party sob a premissa documentada de legítimo interesse; GTM web e sGTM bloqueiam Meta/TikTok até `ad_storage=granted`; titular pode exercer oposição via `privacidade@anhanga.tur.br` |
```

Em `3.6 Salvaguardas implementadas`, usar:

```markdown
- [x] Conversões enviadas server-side via sGTM Stape; pixels Meta/TikTok só carregam após opt-in de marketing
- [x] Antes do consentimento e após recusa, Meta/TikTok não carregam script, criam cookie ou emitem beacon
```

- [ ] **Step 4: Confirmar que o documento não mantém as afirmações falsas**

Run:

```bash
! rg -n "integralmente server-side|sem pixel JS de terceiros|dados não saem do navegador" docs/compliance/ripd-legitimo-interesse.md
git diff --check
```

Expected: `rg` retorna zero ocorrências e `git diff --check` não aponta erros.

- [ ] **Step 5: Commitar a correção documental**

```bash
git add docs/compliance/ripd-legitimo-interesse.md
git commit -m "docs(compliance): describe consent-gated hybrid tracking"
```

---

### Task 3: Validar, publicar o PR e implantar a ponte inerte

**Files:**
- Verify: `index.html`
- Verify: `tests/index-third-party-scripts.test.ts`
- Verify: `tests/e2e/cookie-consent.spec.ts`
- Verify: `docs/compliance/ripd-legitimo-interesse.md`

**Interfaces:**
- Consumes: commits das Tasks 1–2.
- Produces: HTML em produção com `addAnhangaConsentListener`, ainda inerte para containers antigos.

- [ ] **Step 1: Executar a validação focada e a regressão completa**

Run:

```bash
git fetch origin main
pnpm exec tsx --test tests/index-third-party-scripts.test.ts
pnpm exec playwright test tests/e2e/cookie-consent.spec.ts
pnpm typecheck
pnpm test:regression
pnpm lint:changed
pnpm run build
```

Expected: todos os comandos terminam com exit code 0.

- [ ] **Step 2: Executar React Doctor conforme o contrato do repositório**

Na execução, invocar a skill `react-doctor` e rodar o comando fixado no projeto:

```bash
pnpm exec react-doctor --verbose --scope changed --base main
```

Expected: nenhuma nova finding acionável causada pela branch. Achados preexistentes fora do diff são registrados, não corrigidos nesta issue.

- [ ] **Step 3: Confirmar escopo e ausência de segredos**

Run:

```bash
git diff --stat main...HEAD
git diff --name-only main...HEAD
! git diff main...HEAD | rg -n "Access-Token|access_token|Bearer |EA[A-Za-z0-9]{20,}"
git status --short
```

Expected:

- diff contém apenas design, plano, `index.html`, dois testes e RIPD;
- busca de segredo retorna zero ocorrências;
- `.Jules/palette.md` continua modificada, mas não staged.

- [ ] **Step 4: Fazer push e abrir PR**

```bash
git push -u origin codex/issue-1261-sgtm-hybrid-consent
gh pr create \
  --base main \
  --head codex/issue-1261-sgtm-hybrid-consent \
  --title "fix(analytics): gate Meta and TikTok tracking on consent" \
  --body "## Summary
- bridge the site consent choice into GTM updateConsentState
- queue marketing_consent_granted only after the consent bridge
- align the RIPD with consent-gated hybrid tracking

## Validation
- focused node:test and Playwright consent tests
- typecheck, regression suite, lint:changed and build
- React Doctor on changed scope

Refs #1261"
```

Expected: PR criada contra `main`, sem auto-merge.

- [ ] **Step 5: Aguardar CI/revisão e obter autorização de merge**

Run:

```bash
gh pr checks --watch
```

Expected: checks obrigatórios verdes. Resolver apenas feedback verificável e dentro do escopo. Não fazer merge sem autorização explícita do usuário.

- [ ] **Step 6: Confirmar deploy da ponte**

Depois do merge autorizado e deploy concluído, abrir `https://www.anhanga.tur.br/` e verificar no HTML carregado:

```js
typeof window.addAnhangaConsentListener === 'function'
```

Expected: `true`. Os containers antigos continuam funcionando porque a API ainda não possui assinante publicado.

---

### Task 4: Configurar a ponte e os pixels no GTM web

**Files:**
- Configure: conta, container e workspace do GTM web conforme o inventário operacional local

**Interfaces:**
- Consumes: `window.addAnhangaConsentListener`, `anhanga_marketing_consent`, evento `marketing_consent_granted`.
- Produces: consent state nativo do GTM, `DLV - anhanga_marketing_consent`, trigger `CE - marketing_consent_granted`, Meta/TikTok consent-gated.

- [ ] **Step 1: Confirmar workspace limpo e registrar baseline**

Abrir o workspace web indicado no inventário operacional local. Confirmar que não há mudanças alheias. Registrar:

- versão publicada atual;
- tags `50`, `51`, `5`;
- triggers atuais da tag `50`;
- screenshot do Consent Overview antes da mudança.

Expected: nenhum item inesperado. Se houver mudança de outra pessoa, parar e criar um workspace novo chamado `issue-1261-hybrid-consent` em vez de misturar alterações.

- [ ] **Step 2: Criar o template `Anhangá Consent Bridge`**

Em **Templates → Tag Templates → New**, usar este Sandboxed JavaScript:

```js
const callInWindow = require('callInWindow');
const updateConsentState = require('updateConsentState');

const syncConsent = (choice) => {
  const marketingState = choice === 'marketing' ? 'granted' : 'denied';
  updateConsentState({
    analytics_storage: 'granted',
    ad_storage: marketingState,
    ad_user_data: marketingState,
    ad_personalization: marketingState
  });
};

callInWindow('addAnhangaConsentListener', syncConsent);
data.gtmOnSuccess();
```

Permissões:

- **Accesses global variables:** somente `addAnhangaConsentListener`, apenas **Execute**;
- **Accesses consent state:** Write em `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`;
- nenhuma permissão de rede, cookie, leitura do DOM ou escrita genérica no `dataLayer`.

- [ ] **Step 3: Criar e executar os testes do template**

Teste `marketing grants ad consent`:

```js
mock('callInWindow', (name, callback) => {
  assertThat(name).isEqualTo('addAnhangaConsentListener');
  callback('marketing');
});

runCode({ gtmOnSuccess: () => {} });

assertApi('updateConsentState').wasCalledWith({
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted'
});
```

Teste `unknown choice denies ad consent`:

```js
mock('callInWindow', (name, callback) => {
  assertThat(name).isEqualTo('addAnhangaConsentListener');
  callback(null);
});

runCode({ gtmOnSuccess: () => {} });

assertApi('updateConsentState').wasCalledWith({
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
```

Expected: os dois testes passam.

- [ ] **Step 4: Criar a tag de Consent Initialization**

Criar tag:

- Name: `CONSENT - Anhangá Consent Bridge`
- Tag type: `Anhangá Consent Bridge`
- Trigger: `Consent Initialization - All Pages`
- Firing option: `Once per page`

Salvar no workspace, sem enviar/publicar.

- [ ] **Step 5: Criar a variável e o trigger de aceite**

Criar variável:

- Name: `DLV - anhanga_marketing_consent`
- Type: Data Layer Variable
- Data Layer Variable Name: `anhanga_marketing_consent`
- Data Layer Version: Version 2
- Default Value: `false`

Criar trigger:

- Name: `CE - marketing_consent_granted`
- Type: Custom Event
- Event name: `marketing_consent_granted`
- Fires on: All Custom Events

- [ ] **Step 6: Reativar e restringir a Meta PageView tag `51`**

Configurar `Meta - PageView` (`51`):

- remover estado Paused;
- standard event `PageView`;
- manter o Pixel ID atual;
- triggers: `All Pages` e `CE - marketing_consent_granted`;
- Tag firing options: `Once per page`;
- Additional Consent Checks: Require `ad_storage`, `ad_user_data`, `ad_personalization`.

Expected: visita com consentimento persistido usa All Pages; aceite na página usa o custom event; a firing option evita duplicação.

- [ ] **Step 7: Restringir a Meta Lead tag `50` e remover o builder**

Na tag Meta web atual (`50`):

- remover somente o trigger DOM Ready;
- manter o trigger de eventos customizados/conversão;
- manter `generate_lead → Lead`;
- `Consent Granted (GDPR)`: `{{DLV - anhanga_marketing_consent}}`;
- desmarcar `Opt in to a Meta-enabled Conversions API integration`;
- manter Pixel ID e a variável atual de `event_id`;
- Tag firing options: `Once per event`;
- Additional Consent Checks: Require `ad_storage`, `ad_user_data`, `ad_personalization`.

Expected: não existe caminho DOM Ready e a configuração não solicita `capiParamBuilder`.

- [ ] **Step 8: Restringir a TikTok PageView tag `5`**

Na tag TikTok web atual (`5`):

- manter o snippet e `ttq.page()` existentes;
- triggers: `All Pages` e `CE - marketing_consent_granted`;
- Tag firing options: `Once per page`;
- Additional Consent Checks: Require `ad_storage`, `ad_user_data`, `ad_personalization`.

Não adicionar `ttq.track('Lead')` nesta fase.

- [ ] **Step 9: Revisar Consent Overview e mudanças do workspace**

Habilitar Consent Overview em **Admin → Container Settings** se ainda estiver desligado.

Expected:

- Meta `50` e `51`, TikTok `5`: três consent checks;
- Google tag/GA4: apenas checks nativos, sem bloqueio adicional;
- nenhuma tag ativa de marketing em `Consent Not Configured`;
- nenhuma mudança publicada.

---

### Task 5: Aplicar o gate server e limpar Meta CAPI

**Files:**
- Configure: conta, container e workspace do GTM server conforme o inventário operacional local

**Interfaces:**
- Consumes: event data `x-ga-gcs`, `generate_lead`, `event_id`.
- Produces: trigger `CE - generate_lead` consent-gated e Meta CAPI sem trigger morto.

- [ ] **Step 1: Confirmar workspace limpo e registrar baseline**

Abrir o workspace server indicado no inventário operacional local. Registrar versão publicada atual, tag Meta `14`, trigger `16`, trigger legado `13` e tag GA4 server `10`.

Expected: nenhuma mudança alheia. Se houver, criar workspace `issue-1261-server-consent` para isolar a issue.

- [ ] **Step 2: Criar a variável Event Data**

Criar:

- Name: `ED - x-ga-gcs`
- Variable Type: Event Data
- Key Path: `x-ga-gcs`

O gate permitido é:

```regex
^G11[01]$
```

Assim, `G110` e `G111` permitem marketing; ausente, `G100`, `G101` e valores inválidos bloqueiam.

- [ ] **Step 3: Restringir o trigger dedicado `16`**

Editar `CE - generate_lead` (`16`):

- Event Name: `generate_lead`
- Fires on: Some Custom Events
- Condition: `{{ED - x-ga-gcs}} matches RegEx ^G11[01]$`

Expected: o evento e o consentimento precisam ser verdadeiros simultaneamente.

- [ ] **Step 4: Limpar a tag Meta CAPI `14`**

Na tag Meta CAPI (`14`):

- manter apenas trigger `CE - generate_lead` (`16`);
- remover a referência ao trigger legado `13`;
- manter `generate_lead → Lead`;
- manter auto-map/event data e `event_id`;
- não habilitar PageView;
- manter Event Enhancement e extensão de cookies desligados.

Depois de confirmar zero referências, excluir trigger `13`, cuja combinação de cinco nomes de evento é impossível.

- [ ] **Step 5: Rotacionar o token Meta sem expô-lo**

No Meta Events Manager, o usuário gera um novo token CAPI e o digita diretamente no campo da tag `14`.

Regras:

- o agente não seleciona, copia ou lê o valor;
- o token antigo deixa de ser usado na versão candidata;
- nenhum screenshot inclui o campo aberto;
- se o usuário não puder gerar o token, a publicação server fica bloqueada, mas o restante do workspace pode ser validado.

- [ ] **Step 6: Validar a tag no Preview server**

Usar eventos observados no Preview:

| Evento | `x-ga-gcs` | Meta CAPI |
|---|---|---|
| `page_view` | `G101` | não dispara |
| `generate_lead` sintético | `G101` | não dispara |
| `generate_lead` sintético | `G111` | dispara uma vez |

Expected: tag GA4 server `10` continua em todos os eventos GA4; Meta respeita o gate.

---

### Task 6: Adicionar TikTok Events API server-side

**Files:**
- Configure: workspace sGTM conforme o inventário operacional local
- Template source: `stape-io/tiktok-tag` da Community Template Gallery

**Interfaces:**
- Consumes: `generate_lead`, `x-ga-gcs`, page data, IP/user-agent, `ttclid`, `_ttp`, `event_id`.
- Produces: TikTok Events API standard event `Lead`, somente com consentimento.

- [ ] **Step 1: Instalar o template oficial da Stape**

Em **Templates → Search Gallery**, instalar:

- `TikTok Events API Tag for Google Tag Manager Server Side`
- Publisher/source: Stape, repositório `stape-io/tiktok-tag`

Revisar permissões antes de adicionar. Não instalar template com publisher ou repositório diferente.

- [ ] **Step 2: Obter o token TikTok sem registrá-lo**

No TikTok Events Manager, o usuário abre a data source web ligada ao Pixel existente, gera o Events API Access Token e o digita diretamente no GTM.

O Pixel ID deve ser conferido contra o argumento do `ttq.load(...)` da tag web `5` e contra o inventário operacional local. Se os valores divergirem, parar e reconciliar a data source antes de salvar a tag.

Se o valor exibido no snippet não for exatamente esse, parar e reconciliar a data source antes de salvar a tag.

- [ ] **Step 3: Criar a tag `TIKTOK - Events API - Lead`**

Configuração:

- Event Name Setup Method: `Standard`
- Event Name: `Lead`
- Event Source: `Web`
- Access Token: digitado diretamente pelo usuário
- TikTok Pixel ID: o mesmo confirmado no passo anterior
- Test Event Code: usar somente durante Preview
- Generate Browser ID (`_ttp`) cookie if not exist: desmarcado
- Enable Event Enhancement: desmarcado
- Tag Execution Consent Settings: `Send data in case marketing consent given`
- auto-map common event data: manter habilitado para `event_time` e `event_id`
- auto-map page/user data: manter habilitado para URL, referrer, IP, user-agent, `ttclid` e `_ttp` quando presentes
- Trigger: `CE - generate_lead` (`16`)

Não adicionar propriedades de viagem, e-mail ou telefone manualmente nesta primeira fase.

- [ ] **Step 4: Confirmar a defesa em profundidade**

A tag deve ter dois gates:

1. trigger `16` exige `{{ED - x-ga-gcs}} matches RegEx ^G11[01]$`;
2. Tag Execution Consent Settings exige marketing consent.

Expected: ausência/valor inválido falha fechado mesmo se uma das camadas mudar no futuro.

- [ ] **Step 5: Validar o payload no Preview**

Para `generate_lead` com `G111`, inspecionar a requisição:

```json
{
  "event_source": "web",
  "data": [
    {
      "event": "Lead",
      "event_id": "issue-1261-granted-synthetic"
    }
  ]
}
```

Expected:

- HTTP 2xx/3xx tratado como sucesso pela tag;
- nenhum campo sensível inesperado;
- Test Event Code aparece somente na sessão de Preview;
- nenhuma chamada ocorre com `G101`.

- [ ] **Step 6: Remover Test Event Code antes da versão candidata**

Limpar o campo Test Event Code e salvar novamente.

Expected: diff do workspace não contém código de teste persistente.

---

### Task 7: Executar Preview integrado sem criar lead real

**Files:**
- Preview: workspace GTM web indicado no inventário operacional local
- Preview: workspace sGTM indicado no inventário operacional local
- Browser routes:
  - `https://www.anhanga.tur.br/`
  - `https://www.anhanga.tur.br/blog/agencia-de-viagens-confiavel-cadastur/`
  - `https://www.anhanga.tur.br/beto-carrero/`

**Interfaces:**
- Consumes: deploy da Task 3 e workspaces das Tasks 4–6.
- Produces: evidência de recusa, aceite, evento sintético, deduplicação e ausência do builder.

- [ ] **Step 1: Testar sessão sem escolha**

Em contexto limpo, sem `anhanga_cookie_consent`:

- conectar Tag Assistant ao web e server Preview;
- aguardar o fallback de analytics;
- confirmar Consent Overview: ads denied, analytics granted;
- confirmar `x-ga-gcs = G101`;
- confirmar GA4 via `sst.anhanga.tur.br`.

No Network, filtrar e confirmar zero requests para:

```text
connect.facebook.net
facebook.com/tr
analytics.tiktok.com
capi-automation.s3.us-east-2.amazonaws.com
```

- [ ] **Step 2: Testar recusa persistida**

Clicar **Recusar**, recarregar e repetir o inventário.

Expected:

- Meta/TikTok web: zero scripts/beacons;
- Meta/TikTok server: zero disparos;
- `capiParamBuilder.bundle.js`: ausente;
- GA4 continua.

- [ ] **Step 3: Testar generate_lead sintético com consentimento negado**

No console da página recusada:

```js
window.dataLayer.push({
  event: 'generate_lead',
  event_id: 'issue-1261-denied-synthetic'
});
```

Expected:

- nenhum registro no Odoo, pois não houve submit da aplicação;
- Meta web bloqueada;
- server recebe o evento via pipeline GA4, mas Meta CAPI/TikTok Events API ficam bloqueados por `G101`.

- [ ] **Step 4: Testar aceite na mesma página**

Em nova sessão limpa, clicar **Aceitar** sem reload manual.

Expected order no Tag Assistant:

1. `Anhangá Consent Bridge` recebe `marketing`;
2. `updateConsentState` concede os três tipos de ads;
3. `marketing_consent_granted`;
4. Meta PageView uma vez;
5. TikTok PageView uma vez.

No Network:

- Meta/TikTok carregam após o clique;
- `capiParamBuilder.bundle.js` continua ausente;
- nenhum PageView duplicado.

- [ ] **Step 5: Testar generate_lead sintético com consentimento**

No console:

```js
window.dataLayer.push({
  event: 'generate_lead',
  event_id: 'issue-1261-granted-synthetic'
});
```

Expected:

- Meta browser Lead e Meta CAPI Lead compartilham `issue-1261-granted-synthetic`;
- TikTok Events API envia um `Lead`;
- TikTok browser não envia `Lead`;
- nenhum registro é criado no Odoo.

- [ ] **Step 6: Apresentar a evidência e pedir autorização para lead real**

Apresentar:

- screenshots/redação sem tokens;
- matriz denied/granted;
- payloads redigidos;
- ausência do builder;
- contagem de PageView e Lead.

Pergunta obrigatória: autorização para submeter um lead claramente marcado como teste, sabendo que será criado no Odoo.

- [ ] **Step 7: Se autorizado, executar um lead real e reconciliar Odoo**

Usar identidade de teste explícita autorizada pelo usuário. Confirmar:

- `generate_lead` web/server;
- mesmo `event_id` em Meta browser e CAPI;
- TikTok Events API `Lead` único;
- respostas de sucesso;
- registro correspondente no Odoo.

Não excluir nem arquivar o registro sem instrução operacional explícita do usuário.

---

### Task 8: Publicar server e web em sequência controlada

**Files:**
- Publish: workspace sGTM indicado no inventário operacional local
- Publish: workspace GTM web indicado no inventário operacional local

**Interfaces:**
- Consumes: Preview aprovado da Task 7.
- Produces: duas versões independentes e reversíveis.

- [ ] **Step 1: Apresentar o diff final dos dois containers**

Server:

- `ED - x-ga-gcs`;
- trigger `16` consent-gated;
- trigger `13` removido;
- Meta tag `14` com token rotacionado;
- TikTok `Lead` tag;
- Test Event Code vazio.

Web:

- template/tag Consent Bridge;
- DLV e custom event;
- Meta `51` ativa e gated;
- Meta `50` sem DOM Ready e sem Meta-enabled CAPI;
- TikTok `5` gated;
- Consent Overview completo.

Obter autorização explícita para cada publicação. Uma autorização pode cobrir a sequência, mas os cliques de publicação permanecem separados.

- [ ] **Step 2: Publicar a versão server**

Nome:

```text
issue-1261-server-consent-tiktok-capi
```

Descrição:

```text
Gate Meta/TikTok server tags on x-ga-gcs, remove dead Meta trigger, rotate Meta token, and add consent-gated TikTok Events API Lead.
```

Registrar version ID e timestamp.

- [ ] **Step 3: Fazer smoke test server**

Imediatamente após a publicação:

- GA4 server continua;
- `G101` bloqueia marketing;
- `G111` permite apenas `generate_lead`;
- nenhum PageView Meta/TikTok server.

Se falhar, reverter somente a versão server e não publicar web.

- [ ] **Step 4: Publicar a versão web**

Nome:

```text
issue-1261-web-consent-pixels
```

Descrição:

```text
Bridge site consent via updateConsentState, gate Meta/TikTok pixels, and remove Meta CAPI browser builder.
```

Registrar version ID e timestamp.

- [ ] **Step 5: Executar auditoria pública fora do Preview**

Repetir nas três rotas:

- sem escolha;
- recusa;
- aceite;
- navegação SPA depois do aceite.

Expected:

- denied: zero Meta/TikTok;
- granted: um PageView por plataforma por página;
- `capiParamBuilder`: sempre ausente;
- GA4 contínuo.

- [ ] **Step 6: Aplicar rollback seletivo se necessário**

Regras:

- falha server: reverter versão server;
- falha de um pixel após aceite: pausar somente a tag afetada em nova versão web;
- nunca reativar tags sem consent checks;
- preservar a ponte do repositório, que é compatível e inerte sem assinante.

---

### Task 9: Medir performance, monitorar plataformas e fechar a issue

**Files:**
- Update: GitHub issue `#1261`
- Observe: Meta Events Manager, TikTok Events Manager, GA4, Odoo

**Interfaces:**
- Consumes: versões publicadas e baseline da auditoria.
- Produces: evidência de aceite por 3–7 dias e decisão de encerramento.

- [ ] **Step 1: Medir o corte imediato de terceiros**

Baseline auditado em 23/07/2026:

```text
Meta/TikTok/capiParamBuilder raw JS observado: 1,303,104 bytes
```

Para cada rota, registrar:

- total de JS de terceiros sem interação;
- hosts presentes;
- main-thread/TBT atribuível a terceiros;
- ausência/presença do builder.

Expected: no carregamento inicial sem opt-in, os ~1,3 MB auditados desses fornecedores caem para zero.

- [ ] **Step 2: Rodar PageSpeed Insights mobile**

URLs:

```text
https://www.anhanga.tur.br/
https://www.anhanga.tur.br/blog/agencia-de-viagens-confiavel-cadastur/
https://www.anhanga.tur.br/beto-carrero/
```

Executar ao menos três medições por URL e usar a mediana de Performance, TBT e Third-party code.

Expected: nenhuma regressão material; registrar variância, não escolher apenas a melhor execução.

- [ ] **Step 3: Monitorar por 3–7 dias**

Meta Events Manager:

- Lead browser + server;
- deduplicação pelo mesmo `event_id`;
- nenhum crescimento anômalo.

TikTok Events Manager:

- `Lead` server-side;
- nenhuma duplicação browser/server;
- match quality disponível.

GA4:

- continuidade de pageviews e `generate_lead`.

Odoo:

- volume de leads consistente com eventos, descontando o teste autorizado.

- [ ] **Step 4: Comparar com a linha de base**

Criar tabela na issue:

```markdown
| Métrica | Antes | Depois | Resultado |
|---|---:|---:|---|
| JS Meta/TikTok/builder sem opt-in | 1,303,104 B | valor medido | redução |
| Meta Lead browser | baseline | janela 3–7 dias | contínuo |
| Meta Lead server | baseline | janela 3–7 dias | contínuo |
| Meta deduplicação | baseline | janela 3–7 dias | válida |
| TikTok Lead server | inexistente | janela 3–7 dias | ativo |
| GA4 pageviews | baseline | janela 3–7 dias | contínuo |
```

- [ ] **Step 5: Encerrar apenas com todos os critérios satisfeitos**

Checklist final:

- denied não carrega/envia Meta/TikTok;
- GA4 permanece via sGTM;
- builder ausente;
- aceite funciona sem reload;
- Meta `event_id` deduplica;
- TikTok `Lead` é server-only;
- tokens/PII ausentes do Git e evidências;
- performance melhora nas três rotas;
- versões server/web registradas e reversíveis;
- monitoramento de 3–7 dias sem regressão.

Se qualquer item falhar, manter a issue aberta com o item e a evidência objetiva; não declarar conclusão parcial como resolvida.

- [ ] **Step 6: Publicar a evidência final e fechar manualmente**

Usar como comentário a tabela preenchida no Step 4, os IDs das duas versões GTM,
o link da PR e o resultado do checklist do Step 5. Não usar texto-modelo com
campos vazios.

Depois que os valores concretos existirem, criar
`/tmp/issue-1261-final-evidence.md` com `apply_patch`, copiando exatamente a
tabela medida e os links/IDs verificados.

Run:

```bash
gh issue comment 1261 --body-file /tmp/issue-1261-final-evidence.md
gh issue close 1261 --reason completed
```

Expected: a issue só é fechada depois que o arquivo contém valores medidos e a
janela de monitoramento terminou. Se qualquer critério continuar aberto, publicar
o comentário de status, mas não executar `gh issue close`.

---

## Execution References

- [Google: The data layer](https://developers.google.com/tag-platform/tag-manager/datalayer)
- [Google: Create a consent mode template](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis)
- [Google: Custom template APIs](https://developers.google.com/tag-platform/tag-manager/templates/api)
- [Google: Tag Manager consent support](https://support.google.com/tagmanager/answer/10718549)
- [Google: Server-side internal parameters](https://developers.google.com/tag-platform/tag-manager/server-side/internal-parameters)
- [Stape: TikTok server tag](https://github.com/stape-io/tiktok-tag)
- [TikTok: Events API](https://ads.tiktok.com/help/article/events-api)
- [TikTok: Updated standard events](https://ads.tiktok.com/help/article/how-to-adopt-tiktoks-updated-standard-events)
