# Spike: o resultado do quiz deve semear o chatbot em vez de ir direto ao WhatsApp?

**Data:** 2026-06-21
**Tipo:** Spike de produto — não há mudança de comportamento neste documento.
**Estado verificado em:** `ec3029a` (branch `main`)

## Contexto

O site roda dois funis de captação de lead que não se conectam:

1. **Chatbot** — visitante frio conversa com a IA; o backend roda qualificação BANT e faz handoff para humano (`api/generate.ts`, `lib/ai/handoff.ts`).
2. **Quiz** (`/quiz`) — calcula um perfil de viagem + `bantSummary` a partir das respostas, captura o lead, e manda o usuário direto para o WhatsApp.

O quiz já produz o mesmo tipo de sinal estruturado (perfil + BANT) que o chatbot constrói ao longo de uma conversa inteira — mas não passa pelo chatbot. Existe uma costura (seam) pronta para semear o chat: `openAiChat({ message })`. Esta spike decide se vale a pena usá-la.

## Current funnels

### Funil 1 — Chatbot / BANT

- `components/AIChat.tsx` mantém o histórico da conversa, abre via `dialog` (linhas 87–177).
- `submitMessage` (linhas 245–333) envia o histórico para `getTravelAdvice` (`services/geminiService.ts`), que faz `POST /api/generate`.
- `api/generate.ts` orquestra: valida → rate-limit → chama Gemini com `SYSTEM_INSTRUCTION` (`lib/ai/prompt.ts`) → extrai `generate_budget_link` quando a qualificação BANT está completa → roda `lib/ai/handoff.ts`.
- Quando o modelo retorna `response.budgetLink`, o componente injeta um cartão de ação (`isAction: true`, `ChatLeadForm`) que coleta dados de contato e finaliza o lead via `useLeadCapture` (`components/AIChat.tsx:304–324`).

### Funil 2 — Quiz → WhatsApp

- `lib/quiz-scoring.ts:37` — `matchProfile()` soma scores de 5 campos do questionário (`destino`, `cena`, `companhia`, `frustracao`, `ritmo`) e retorna uma `ProfileKey` (`escapista`, `bon-vivant`, `viajante-de-verdade`, `desbravador`, `nomade-de-alma`).
- `hooks/useQuizCapture.ts:87–153` — `submitQuiz()`:
  - dispara `sendLeadToSalesforce()` fire-and-forget (linha 108) com `description` contendo o `bantSummary`;
  - faz `POST /api/submit-quiz` (linha 119) com o payload completo (`profileKey`, `profileName`, `bantSummary`, `destinos`, `tracking`, `utms`);
  - em sucesso, dispara dois eventos de `dataLayer`: `quiz_lead` e `form_submission` (`pushQuizDataLayerEvent`, linhas 59–80).
  - **Nenhuma referência ao chatbot ou a `openAiChat` em todo o arquivo** (confirmado via grep).
- `pages/landings/QuizAnhangaLanding.tsx` — `WhatsAppUpgrade` (componente nas linhas 713–781, renderizado dentro de `ResultScreen` linhas 854–860):
  - CTA primário (`data-tracking="result-quiz-whatsapp"`, linha 738) constrói um link de WhatsApp via `getWhatsAppLink()` (`utils/whatsapp.ts`) com uma mensagem pré-formatada citando `profileName` e `mainDestName` (linhas 720–724);
  - CTA secundário "pular" (`data-tracking="result-quiz-skip"`, linha 775) vai direto ao `baseWaUrl` sem capturar o telefone.
  - **Nenhuma chamada a `openAiChat` em todo o arquivo** (confirmado via grep — apenas `getWhatsAppLink` aparece).

### A costura (seam): `openAiChat` → `toggle-ai-chat` → `AIChat`

- `utils/aiChat.ts:8–21` — `openAiChat(options)`:
  ```ts
  export function openAiChat(options: OpenAiChatOptions = {}): void {
    const { message, haptic = 'light' } = options;
    if (haptic !== 'none') void triggerHaptic(haptic);
    const detail = message ? { message } : undefined;
    window.dispatchEvent(new CustomEvent('toggle-ai-chat', { detail }));
  }
  ```
  Aceita apenas `{ message?: string; haptic?: HapticPattern | 'none' }` — uma string simples, sem suporte a payload estruturado.

- `components/AIChat.tsx:353–399` — `useEffect` que registra o listener:
  ```ts
  const handleToggle = (event: Event) => {
    const customEvent = event as CustomEvent;
    openChatDrawer(false);
    if (customEvent.detail?.message) {
      setTimeout(() => submitMessageRef.current(customEvent.detail.message, false), 400);
    }
  };
  window.addEventListener('toggle-ai-chat', handleToggle);
  ```
  Comportamento exato hoje:
  1. Sempre abre a gaveta do chat (`openChatDrawer(false)` — sem haptic duplicado, já disparado em `openAiChat`).
  2. Se `detail.message` existir, **envia automaticamente** essa string como turno do usuário (`role: 'user'`) 400ms depois (tempo da animação do drawer), via `submitMessageRef.current(message, false)` — que é a mesma função usada para mensagens digitadas manualmente. Não há diferenciação de "mensagem semeada" vs. "mensagem digitada": o texto vira um turno de usuário normal e é enviado à API Gemini como se o visitante tivesse digitado.
  3. Não há suporte a pré-carregar estado BANT (Need/Authority/Budget/Timeline) — apenas texto livre que o modelo precisa reinterpretar do zero a cada chamada, porque o `SYSTEM_INSTRUCTION` e o histórico da conversa (`apiHistory`) são a única fonte de contexto enviada ao Gemini em `api/generate.ts`.

  Existe um segundo seam paralelo no mesmo `useEffect`, por deep-link de URL (`?chat=open&destino=...`, linhas 363–396): mesmo padrão — `setTimeout(() => submitMessageRef.current(message, false), 600)` — e um terceiro por `?chat=1&m=...` (linhas 401–426) que, ao contrário dos outros dois, **pré-preenche o input em vez de auto-enviar**, justamente para evitar prompt injection via parâmetro de URL controlado pelo usuário. Essa é uma assimetria de design relevante: deep-links de URL (não confiáveis) preenchem o input; chamadas internas de `openAiChat` (confiáveis, originadas do próprio app) auto-enviam.

**Conclusão da verificação:** a premissa do plano está correta — o quiz não toca o chatbot hoje, e o seam `openAiChat`/`toggle-ai-chat` existe e funciona exatamente como descrito (auto-envia `detail.message` como turno do usuário 400ms após abrir o drawer). Nenhuma condição de STOP foi encontrada.

## Proposed seed contract

Se uma rota quiz→chat fosse construída, o ponto de chamada seria dentro de `WhatsAppUpgrade` ou como uma terceira opção ao lado do CTA de WhatsApp em `ResultScreen` (`pages/landings/QuizAnhangaLanding.tsx`), chamando algo como:

```ts
openAiChat({
  message: buildQuizSeedMessage({
    firstName,
    profileName: profile.name,      // ex.: "Nômade de Alma"
    bantSummary,                    // já calculado a partir das respostas do quiz
    mainDestName: mainDest.name,    // destino sugerido pelo motor de scoring
  }),
});
```

Forma exata do texto (string única, plain — é tudo que `openAiChat` aceita hoje):

```
Olá! Acabei de fazer o quiz da Anhangá. Meu perfil é "{profileName}" e
meu próximo destino sugerido foi {mainDestName}. {bantSummary}
Pode me ajudar a montar essa viagem?
```

### O que muda em `AIChat`/`openAiChat` — e o que não muda

- **Sem mudança necessária em `utils/aiChat.ts`** — a interface `{ message?: string }` já é suficiente para uma string de texto livre; nenhuma mudança de assinatura é exigida para o caso mínimo.
- **Sem mudança necessária em `components/AIChat.tsx`** para o caso mínimo — o listener de `toggle-ai-chat` já envia `detail.message` como turno do usuário.
- **Limitação real:** como o BANT do quiz vira *texto livre* e não *estado estruturado*, o modelo Gemini precisaria **re-extrair** Need/Authority/Budget/Timeline a partir da frase, em vez de pular direto para checar se a qualificação já está completa. Isso significa que o chatbot provavelmente ainda fará 1–2 perguntas de confirmação antes de gerar o `budgetLink` — o ganho de "pular etapas do BANT" não é automático, é dependente de quão bem o `SYSTEM_INSTRUCTION` (`lib/ai/prompt.ts`) interpreta a mensagem semeada como BANT já qualificado.
- **Mudança real que essa rota exigiria** (fora de escopo desta spike, mas necessária para uma implementação completa): ajustar `lib/ai/prompt.ts` para reconhecer/parsear esse formato de mensagem semeada e pular perguntas já respondidas pelo quiz — caso contrário, o usuário sente que repetiu informação que já deu no quiz, o que é pior UX do que ir direto ao WhatsApp.
- Alternativa mais robusta (maior escopo): estender `OpenAiChatOptions` para aceitar um payload estruturado (`{ seedBant?: { need, authority, budget, timeline } }`) e pré-popular o histórico de mensagens do `AIChat` com uma mensagem de sistema/contexto antes do primeiro turno do usuário, em vez de depender só de texto livre. Isso evitaria a re-extração e garantiria que o modelo já "saiba" o que o quiz aprendeu — mas é uma mudança de contrato em dois arquivos hoje fora de escopo (`utils/aiChat.ts`, `components/AIChat.tsx`).

## Trade-offs & measurement

### Por que o WhatsApp direto pode já ser o caminho certo

- O lead do quiz **já está qualificado e já deu contato** (telefone, nome) antes de chegar ao CTA — diferente do visitante frio do chatbot, que ainda precisa ser qualificado do zero.
- WhatsApp é toque humano imediato; cada etapa adicional (abrir o chat, esperar a IA reconfirmar o que o quiz já sabe) é fricção a mais entre "lead engajado" e "conversa com humano".
- O quiz já tem uma segunda opção de baixo atrito (`result-quiz-skip`, ir direto sem deixar telefone) — ou seja, o funil já foi desenhado para minimizar passos.

### O que semear o chatbot poderia agregar — e para qual público

- Para quem **pulou** o telefone (`result-quiz-skip`) e não converteu no WhatsApp: uma rota alternativa para a IA continuar a conversa, capturar contato via `ChatLeadForm`, e gerar um `budgetLink` sem depender do usuário ter WhatsApp aberto/instalado.
- Para visitantes em desktop sem WhatsApp Web configurado, o chat embutido pode converter onde o link `wa.me` simplesmente não abre nada.
- Risco: substituir um caminho que já funciona (WhatsApp direto) por um caminho não testado, sem dados que comprovem ganho de conversão.

### Como medir antes de mudar

O quiz já instrumenta dois eventos de `dataLayer` em `pushQuizDataLayerEvent` (`hooks/useQuizCapture.ts:59–80`): `quiz_lead` (com `quiz_profile`, `utm_source/medium/campaign`, `ga_client_id/session_id`) e `form_submission` (`form_type: 'quiz_lead'`). Esses dois eventos já são o ponto de instrumentação natural para um A/B test:

1. Adicionar variante de CTA (`data-tracking="result-quiz-chat"` ao lado de `result-quiz-whatsapp`) sem remover o caminho atual.
2. Medir taxa de clique em cada CTA e, mais importante, taxa de conversão downstream — lead avançou para orçamento/reserva — comparando coorte WhatsApp vs. coorte chat, usando os mesmos `ga_client_id`/`ga_session_id` já capturados em `quiz_lead` para linkar com eventos subsequentes no funil (ex.: `generate_budget_link` do lado do chatbot, se instrumentado, ou eventos de Salesforce).
3. Sem um evento de "chegou no orçamento" ou "respondeu no WhatsApp" hoje instrumentado em ambos os lados, a comparação ficaria limitada a "cliques no CTA" — insuficiente para decidir. Isso é uma lacuna de instrumentação a resolver antes de rodar o teste, não depois.

## Recommendation

**Data: 2026-06-21. Recomendação: A/B test instrumentado — não construir a rota completa ainda.**

Razões:
- O caminho atual (WhatsApp direto) tem um motivo de design sólido (lead já qualificado, menor fricção) e nenhuma evidência observada hoje sugere que está com problema de conversão.
- O seam (`openAiChat`) já existe e funciona para o caso mínimo (string simples) — o custo de adicionar um terceiro CTA de teste é baixo (um botão a mais em `WhatsAppUpgrade`, sem mudança em `AIChat.tsx` ou `utils/aiChat.ts`).
- O ganho real (pular perguntas do BANT que o quiz já respondeu) depende de uma mudança em `lib/ai/prompt.ts` que está fora do escopo mínimo — construir isso "às cegas", sem dados de que o público do quiz responde bem ao chat, é risco desnecessário.
- Antes do teste, é preciso fechar a lacuna de instrumentação: nem o funil do quiz nem o do chatbot emitem hoje um evento equivalente de "chegou ao orçamento" / "handoff concluído" que permita comparar as duas coortes ponta a ponta.

### Open questions

1. Qual evento de conversão final (orçamento gerado, lead atribuído no Salesforce, resposta no WhatsApp) será o critério de vitória do A/B, e como instrumentá-lo simetricamente nos dois braços?
2. O CTA de teste deve substituir o `result-quiz-skip` (quem não quis deixar telefone) ou ser uma terceira opção visível para todos? Isso afeta o tamanho da amostra e o tempo até significância estatística.
3. Se o teste mostrar paridade ou leve vantagem do chat, vale o custo de implementar o seed estruturado em `lib/ai/prompt.ts` e `utils/aiChat.ts`, ou a string simples já é suficiente?
4. Quem mantém os perfis (`lib/quiz-scoring.ts`) e o prompt do chatbot (`lib/ai/prompt.ts`) precisa estar alinhado para que a mensagem semeada seja interpretável pela IA — isso é uma dependência cross-team a resolver antes do build, não durante.
