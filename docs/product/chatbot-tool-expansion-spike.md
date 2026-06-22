# Spike: expandir a superfície de tools do chatbot além de `generate_budget_link`

**Data:** 2026-06-21
**Tipo:** Spike de design — nenhuma mudança de comportamento. Verificado em commit `e14a6cd` (HEAD do worktree na criação deste doc; o plano referenciava `ec3029a`, dois commits antes — sem mudanças relevantes em `lib/ai/` ou `api/generate.ts` entre os dois).

## Resumo

O chatbot expõe exatamente UMA tool ao Gemini: `generate_budget_link`. O roteamento da resposta no handler está fortemente acoplado a essa tool por nome — não existe noção de "dispatch por tool" hoje. Este spike mapeia o acoplamento real, propõe um candidato concreto de segunda tool, especifica o custo de generalizar o roteamento, e termina com uma recomendação: **deferir**.

---

## Current architecture

Fluxo de uma chamada de tool, hoje:

1. **Prompt** (`lib/ai/prompt.ts:108`) instrui o modelo a chamar `generate_budget_link` somente quando o BANT estiver completo; `lib/ai/prompt.ts:117` proíbe qualquer handoff textual/manual fora da tool.
2. **Declaração da tool** (`lib/ai/tools.ts:3-35`) — `budgetTool: FunctionDeclaration`, único `FunctionDeclaration` exportado do módulo.
3. **Wiring para o Gemini** (`api/generate.ts:280`) — `requestModelResponse()` monta `config.tools = [{ functionDeclarations: [budgetTool] }]`. É um array literal de um elemento; hoje não há registry, switch ou lookup por nome aqui — é hardcode estrutural (a lista só tem essa tool), não um hardcode de string.
4. **Extração da resposta do modelo** (`api/generate.ts:337-360`, `extractModelOutput`) — lê `functionCall` nativo do SDK Gemini OU cai num fallback de texto via `extractBudgetToolCallFromText` (`lib/ai/utils.ts:67-110`). Esse fallback é **hardcoded ao nome e shape da budget tool**:
   - `lib/ai/utils.ts:70` — só entra no parser se `text.includes('generate_budget_link')`.
   - `lib/ai/utils.ts:98` — descarta qualquer `tool_call` que não seja `generate_budget_link`.
   - `lib/ai/utils.ts:103` — retorna sempre `{ name: 'generate_budget_link', args }` — o tipo de retorno está literal-typed para esse nome (`utils.ts:69`).
   - `lib/ai/utils.ts:114` (`stripToolCallJsonBlock`) — regex de limpeza do bloco JSON também hardcoded a `"tool_call":"generate_budget_link"`.
5. **Normalização** (`api/generate.ts:400-427`, `normalizeBudgetToolResponse`) — `api/generate.ts:403` faz early-return (`if (output.responseFunctionCall?.name !== 'generate_budget_link') return output;`). Se passar, chama `validateBudgetToolArgs` (`lib/ai/validation.ts:237`), que valida/normaliza os campos específicos de `BudgetToolArgs` (`lib/ai/types.ts:10`) e pode disparar `buildSafetyMessage` (`lib/ai/validation.ts:106`, usa `detectBlockedDestination` em `lib/ai/validation.ts:89`) ou `buildRefinementMessage` (`lib/ai/validation.ts:118`) quando faltam campos.
6. **Construção do handoff estruturado** (`api/generate.ts:429-443`, `buildStructuredHandoff`) — `api/generate.ts:433` repete o mesmo guard (`!== 'generate_budget_link'` → `undefined`), e então chama `buildGenerateHandoff(args as BudgetToolArgs, source)` (`lib/ai/handoff.ts:39`), que retorna um `GenerateHandoff` (`lib/ai/handoff.ts:3-11`) — interface fixa com campos só fazem sentido para orçamento (`origin`, `destination`, `dates`, `baggagePreference`, `bantSummary`, `iataCode`, `source`).
7. **Reparo de handoff textual inválido** (`api/generate.ts:445-502`, `repairTextualHandoff`) — reusa os mesmos três pontos hardcoded (`api/generate.ts:470`, `:473`, `:474`) ao tentar re-extrair uma tool call válida depois de um aviso de handoff manual.
8. **Resposta final ao cliente** (`api/generate.ts:504-528`, `buildGenerateSuccessBody`) — monta `{ text, chips, functionCall, handoff }`; o client (`AIChat.tsx` → `geminiService.ts`, fora do escopo lido neste spike) consome `handoff` como union de um único shape.

### Sites hardcoded a `generate_budget_link` (confirmados via grep)

```
api/generate.ts:280   tools: [{ functionDeclarations: [budgetTool] }]
api/generate.ts:403   normalizeBudgetToolResponse — guard de nome
api/generate.ts:423   normalizeBudgetToolResponse — reconstrução do functionCall normalizado
api/generate.ts:433   buildStructuredHandoff — guard de nome
api/generate.ts:470   repairTextualHandoff — guard de nome (revalidação pós-reparo)
lib/ai/utils.ts:69-70 extractBudgetToolCallFromText — assinatura de retorno + guard de texto
lib/ai/utils.ts:98    extractBudgetToolCallFromText — filtro de candidatos
lib/ai/utils.ts:103   extractBudgetToolCallFromText — retorno fixo
lib/ai/utils.ts:114   stripToolCallJsonBlock — regex de limpeza
lib/ai/prompt.ts:63,108,117  instruções do prompt citam o nome da tool literalmente
```

Comando usado para confirmar (saída acima é o resultado real, não memorizado):
```
grep -rn "generate_budget_link\|functionDeclarations\|buildStructuredHandoff\|normalizeBudgetToolResponse" api/generate.ts lib/ai/*.ts
```

**Conclusão da etapa:** a arquitetura não foi generalizada — o STOP condition "tool-routing já generalizado" não se aplica. Seguir com o spike.

---

## Proposed tool

### Candidato escolhido: `check_destination_status`

**Justificativa (um parágrafo):** Hoje, quando o usuário pergunta algo como "vocês vendem pacote pra Rússia?" antes de entrar no funil de qualificação, o modelo precisa decidir sozinho — via texto livre, sem ferramenta — se o destino é bloqueado, e a lógica de bloqueio real (`detectBlockedDestination`, `lib/ai/validation.ts:89-104`) só é invocada hoje **depois** que o usuário já passou pelo BANT completo e chamou `generate_budget_link` (`normalizeBudgetToolResponse`, `api/generate.ts:407-412`). Isso significa que perguntas de triagem precoce ("é bookable?") dependem do modelo aplicar a `SAFETY_POLICY` do prompt (`lib/ai/prompt.ts`, seção `SAFETY_POLICY`) de memória, sem grounding estruturado, criando risco de resposta inconsistente ou alucinada para destinos no limite (ex.: grafias alternativas, países vizinhos a zona de conflito). Expor `detectBlockedDestination` como uma tool de consulta — sem produzir handoff, apenas uma resposta inline — reduz esse risco com baixo acoplamento ao funil de BANT, porque reaproveita uma função pura já testada (`validateBudgetToolArgs` já a invoca; ver `lib/ai/validation.ts`) em vez de criar lógica nova.

### Draft `FunctionDeclaration`

```typescript
// Ilustrativo — NÃO wired em lib/ai/tools.ts. Mirror do estilo de budgetTool.
import { Type, type FunctionDeclaration } from "@google/genai";

export const checkDestinationStatusTool: FunctionDeclaration = {
    name: "check_destination_status",
    description: "Consulta se um destino mencionado pelo usuário está disponível para orçamento ou bloqueado por política de segurança/sanções. Use ANTES de iniciar a qualificação BANT quando o usuário perguntar diretamente sobre viabilidade de um destino sensível (ex.: países em conflito, sob sanções, ou de instabilidade conhecida). Não use para destinos claramente normais (ex.: Orlando, Paris, Maceió) — nesses casos siga o fluxo padrão de qualificação.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            destination_text: {
                type: Type.STRING,
                description: "Texto livre do destino mencionado pelo usuário, como escrito por ele (não normalizado)."
            }
        },
        required: ["destination_text"]
    }
};
```

Resposta esperada do handler (inline, não-handoff):
```typescript
// Shape ilustrativo da resposta — não implementado.
interface DestinationStatusResult {
    bookable: boolean;
    reason?: string;      // preenchido só quando bookable === false
    category?: 'war' | 'sanctions' | 'instability';
}
```

---

## Integration cost

Generalizar de 1 tool para N exige tocar exatamente os mesmos sites mapeados em "Current architecture", convertendo guards de string em dispatch:

1. **`api/generate.ts:280`** — `functionDeclarations` passa a ser um array com as N tools (`[budgetTool, checkDestinationStatusTool]`). Trivial.

2. **`lib/ai/utils.ts` — `extractBudgetToolCallFromText` (linhas 67-110)** — precisa generalizar de "só aceita `generate_budget_link`" para "aceita qualquer nome de tool registrada". Isso implica:
   - Trocar o tipo de retorno literal (`{ name: 'generate_budget_link'; ... }`, `utils.ts:69`) por um union ou `{ name: string; args: Record<string, unknown> }` mais genérico.
   - `utils.ts:70` (`text.includes('generate_budget_link')`) precisa testar contra uma lista de nomes conhecidos.
   - `utils.ts:98` (filtro `toolCall !== 'generate_budget_link'`) precisa de allowlist.
   - `stripToolCallJsonBlock` (`utils.ts:114`) precisa de uma regex parametrizada por nome, ou reescrita para não depender do nome.

3. **`api/generate.ts:400-427` (`normalizeBudgetToolResponse`)** — vira um **dispatcher por nome de tool**: um registry `Record<ToolName, { validate, buildResponse }>` ao invés do guard único. Cada entrada do registry decide se a tool gera handoff (como hoje) ou resposta inline (como `check_destination_status`). Isso é a mudança estrutural central.

4. **`api/generate.ts:429-443` (`buildStructuredHandoff`)** — passa a ser **opcional por tool**: nem toda tool produz um `GenerateHandoff`. `check_destination_status` retorna direto um texto/objeto inline, sem handoff. Isso significa:
   - `GenerateHandoff` (`lib/ai/handoff.ts:3-11`) provavelmente **não** precisa virar union se a segunda tool não usa handoff — mas o tipo de retorno de `buildGenerateSuccessBody` (`api/generate.ts:504-528`) precisa de um campo adicional (`toolResult?` ou similar) para tools que não fazem handoff. Se uma futura terceira tool *também* fizer handoff com shape diferente, aí sim `GenerateHandoff` precisaria virar union — não é necessário para este candidato específico.

5. **`api/generate.ts:445-502` (`repairTextualHandoff`)** — os guards em `:470` e `:473-474` repetem a mesma lógica do item 3; precisam do mesmo dispatcher. Tools que não fazem handoff (como a proposta) provavelmente **não participam** do fluxo de reparo, já que reparo só existe para destravar handoffs textuais inválidos — então este fluxo pode continuar exclusivo de tools com handoff, reduzindo o escopo de generalização aqui.

6. **`lib/ai/prompt.ts`** — `TOOL_CALL_CONTRACT` (seção citada em `:108`) precisa de uma seção paralela explicando quando usar `check_destination_status` vs. `generate_budget_link`, sem violar a disciplina de "uma pergunta por resposta" (`lib/ai/prompt.ts`, regra geral) nem abrir uma segunda via de handoff textual. Risco principal: o modelo pode tentar chamar a tool de status repetidamente como evasão, ou confundir "destino bloqueado" com "destino ainda não qualificado" — precisa de exemplos few-shot explícitos.

### Testes impactados

- **Mudam** (comportamento de extração/normalização generalizado):
  - `tests/tool-call-fallback.test.ts` (32 linhas) — testa `extractBudgetToolCallFromText`; precisa de casos para múltiplos nomes de tool.
  - `tests/api-generate-normalization.test.ts` (194 linhas) — testa `normalizeBudgetToolResponse`/`buildStructuredHandoff`; precisa de casos onde uma tool não-budget é chamada.
  - `tests/ai-handoff.test.ts` (134 linhas) — testa `buildGenerateHandoff`; só muda se `GenerateHandoff` virar union (não necessário para este candidato).
  - `tests/chatbot-regressions.test.ts` (187 linhas) — cobre regressões ponta-a-ponta do handler; precisa de novo cenário "pergunta sobre destino bloqueado antes do BANT".
- **Novos testes necessários:**
  - Unit: `checkDestinationStatusTool` declaration shape (mirror de testes de `budgetTool`, se existirem — não encontrados explicitamente, então seria o primeiro).
  - Unit: dispatcher do registry — roteamento correto por nome, tool desconhecida não quebra o handler.
  - Integration: resposta do Gemini com `functionCall.name === 'check_destination_status'` produz resposta inline sem afetar o handoff de orçamento numa conversa subsequente.
  - Regressão: prompt não permite chamar `check_destination_status` como substituto de handoff (anti-regressão da safety policy).

---

## Open questions

1. **Valor de produto não medido.** Não há dado hoje de quantos usuários perguntam sobre viabilidade de destino *antes* de entrar no funil BANT. Sem esse número, o investimento de engenharia (item "Integration cost" acima, que toca 5 arquivos centrais do subsistema AI) não tem como ser justificado por ROI.
2. **Risco de regressão de prompt.** Adicionar uma segunda tool ao `functionDeclarations` muda o espaço de decisão do modelo em toda chamada — mesmo perguntas não relacionadas a destino bloqueado podem sofrer desvio de comportamento (tool selection é sensível a quantas opções existem). Precisaria de um teste A/B ou observação em staging antes de produção.
3. **Latência adicional.** Uma tool extra no array não deveria adicionar round-trip (é a mesma chamada ao Gemini), mas se a tool gerar uma resposta inline que ainda precisa de um segundo turno (ex.: para retomar o BANT depois de responder sobre o destino), isso adiciona uma chamada extra ao modelo — impacto não medido.
4. **Manutenção do dispatcher.** Uma vez criado o registry (item 3 de "Integration cost"), toda nova tool futura paga o custo de manter esse registry coerente com `lib/ai/prompt.ts`, testes em 4 arquivos, e o shape de resposta do client. Isso é custo recorrente, não só de implementação inicial.
5. **Cobertura do client (`AIChat.tsx`/`geminiService.ts`).** Este spike não leu o código do client (fora do escopo do plano) — não está confirmado se o client já está preparado para um `functionCall`/resposta que não seja um handoff de orçamento, ou se precisaria de mudança de contrato também ali.

## Recommendation

**Defer.** Data: 2026-06-21.

A arquitetura atual é deliberadamente simples — uma tool, um caminho de validação, um shape de handoff — e isso é uma escolha de design defensável dado que o produto tem exatamente um objetivo de conversão (gerar o handoff de orçamento). Generalizar para N tools introduz um dispatcher central (item 3 de "Integration cost") que precisa ser mantido mesmo que só uma segunda tool exista, e o ganho de produto não está quantificado (open question 1). O candidato `check_destination_status` é tecnicamente viável e reaproveita lógica já testada (`detectBlockedDestination`), mas o risco de regressão de prompt (open question 2) e o custo de manutenção recorrente (open question 4) pesam mais do que o problema concreto resolvido — hoje o modelo já tem instrução explícita de `SAFETY_POLICY` no prompt e a `SAFETY_POLICY` é aplicada de qualquer forma no momento do handoff (`normalizeBudgetToolResponse`), então o "buraco" que essa tool tampa é estreito (só conversas que perguntam sobre viabilidade *antes* de chegar ao handoff).

Se o time decidir avançar, recomenda-se primeiro **medir** (não construir): instrumentar quantas conversas hoje mencionam destinos da lista de bloqueio antes do handoff, e só then revisitar este spike com esse dado.
