# Spec: Redesign dos CTAs — Formulário de Contato Rápido

**Data:** 2026-05-11
**Status:** Aprovado para implementação

## Problema

Os botões de CTA do site abrem o chatbot (BANT), criando uma barreira de qualificação para visitantes que já têm intenção de contato clara. Isso reduz a taxa de conversão desse perfil de visitante.

## Decisão

Substituir `openAiChat()` em todos os CTAs externos por `openContactModal()`, que abre um formulário simples de captura com dois caminhos de ação. O Hero (desktop + mobile) e a bolha flutuante do chatbot permanecem intocados.

**Nota:** `api/submit-lead.ts` já usa n8n (`N8N_SUBMIT_LEAD_WEBHOOK_URL`). Não há migração a fazer nesse endpoint — apenas o novo `api/submit-contact.ts` é criado.

---

## Design das Interfaces

### Modal de contato (todos os CTAs exceto CallToAction)

- Overlay escuro centralizado
- Layout compacto: Nome + Sobrenome na mesma linha, WhatsApp e Email em linhas separadas
- Sem emojis no componente
- Checkbox de opt-in com link para `/privacidade`
- Dois botões de ação (ver comportamento abaixo)
- Fecha ao clicar no overlay, pressionar Escape ou clicar em botão X
- Após submissão bem-sucedida de "Me chamem": exibe confirmação dentro do modal com botão "Fechar" — fechamento manual pelo usuário

### Formulário inline (CallToAction da homepage)

- Expande dentro da própria seção ao clicar no botão principal
- O stub do "ticket" (lado direito) permanece visível e intacto
- Campos idênticos ao modal
- Unifica e substitui o botão primário atual ("Começar minha Viagem") e o formulário WhatsApp secundário (nome + email)
- Após submissão bem-sucedida de "Me chamem": exibe mensagem de confirmação inline (estado `'submitted'`), com link para abrir WhatsApp manualmente
- Não tem botão X — o usuário pode simplesmente ignorar o formulário expandido

---

## Campos do Formulário

| Campo | Obrigatoriedade |
|---|---|
| Nome | Obrigatório |
| Sobrenome | Opcional |
| WhatsApp | Obrigatório |
| E-mail | Opcional |
| Opt-in de e-mail marketing | Checkbox não obrigatório, com link para `/privacidade` |

---

## Comportamento dos Botões

### "Chamar no WhatsApp"

- Fica desabilitado (e `cursor-not-allowed`) durante `isSubmitting` e enquanto Nome ou WhatsApp estiverem vazios
- Ao clicar: `window.open(whatsappUrl, '_blank')` é chamado **sincronamente** dentro do event handler (antes do `fetch`) para evitar bloqueio de pop-up; em seguida o POST para `/api/submit-contact` usa `fetch` com `keepalive: true` para garantir entrega mesmo se o usuário navegar imediatamente
- Se o POST falhar, o WhatsApp já foi aberto — não há rollback; o erro é logado silenciosamente (a conversão já aconteceu)
- A mensagem do WhatsApp é pré-preenchida com o campo `message` recebido em `openContactModal(options)`, threadado via estado do `ContactModal` até o botão

### "Me chamem no WhatsApp"

- Mesmo requisito de campos (Nome + WhatsApp obrigatórios)
- Fica desabilitado durante `isSubmitting`
- Ao clicar: POST para `/api/submit-contact`; em caso de sucesso exibe confirmação; em caso de erro exibe mensagem de falha com opção de tentar novamente
- Não abre o WhatsApp

---

## Arquitetura

### Novos artefatos

**`utils/contactForm.ts`**
Exporta `openContactModal(options?: ContactModalOptions)`. Segue o padrão de `utils/aiChat.ts`:

```ts
export interface ContactModalOptions {
  source?: string;      // ex: 'blog-sidebar', 'header', 'destinations-modal'
  destination?: string; // ex: 'Orlando', null para genérico
  message?: string;     // mensagem pré-preenchida no WhatsApp ao clicar "Chamar"
}

export function openContactModal(options: ContactModalOptions = {}): void {
  window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: options }));
}
```

**`components/ContactModal.tsx`**
Componente global renderizado dentro de `ClientFeatures` em `App.tsx`, ao lado de `AIChat`:

```tsx
const ClientFeatures: React.FC = () => (
  <ClientOnly>
    <AIChat />
    <ContactModal />
  </ClientOnly>
);
```

Escuta o evento `'open-contact-modal'`. Gerencia abertura/fechamento e renderiza o `useContactForm` hook.

Acessibilidade obrigatória:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para o título
- Foco movido para o primeiro campo ao abrir (`autoFocus` no campo Nome)
- Foco preso dentro do modal enquanto aberto (focus trap)
- Tecla Escape fecha o modal e devolve foco ao elemento que o abriu
- Scroll do body bloqueado enquanto o modal está aberto

**`hooks/useContactForm.ts`**
Gerencia campos, validação, submissão e estado de sucesso/erro. Interface pública:

```ts
interface UseContactFormReturn {
  fields: ContactFormFields;
  setField: (key: keyof ContactFormFields, value: string | boolean) => void;
  isValid: boolean;       // true quando firstName e whatsapp não-vazios
  isSubmitting: boolean;
  error: string | null;
  submitted: boolean;
  submit(action: 'whatsapp' | 'callback'): Promise<void>;
  reset(): void;
}
```

**`types/contactCapture.ts`** (novo)
```ts
export interface ContactFormFields {
  firstName: string;
  lastName: string;
  whatsapp: string;
  email: string;
  emailOptIn: boolean;
}

export interface SubmitContactRequest {
  firstName: string;
  lastName?: string;
  whatsapp: string;
  email?: string;
  emailOptIn: boolean;
  source?: string;
  destination?: string;
  eventId?: string;
}

export interface SubmitContactResponse {
  ok: true;
  requestId: string;
}
```

**`api/submit-contact.ts`** (novo endpoint)
Recebe dados do formulário, valida, sanitiza e encaminha para `N8N_CONTACT_WEBHOOK_URL`.

Fluxo interno (ordem obrigatória):
1. Method gate (apenas POST)
2. CORS preflight (`lib/network.ts`)
3. Config check (`N8N_CONTACT_WEBHOOK_URL` e `N8N_WEBHOOK_SECRET` presentes)
4. Parse body
5. Validação (`firstName` obrigatório, `whatsapp` obrigatório, formato)
6. Rate limit: **5 req/min por IP**, prefixo `ratelimit:submit-contact` (`lib/rate-limit.ts`)
7. Sanitização: `cleanString` e `normalizeWhatsappNumber` de `lib/lead-logic.ts`
8. Montar payload via `buildN8nContactPayload` (novo, em `lib/n8n-payloads.ts`)
9. POST para `N8N_CONTACT_WEBHOOK_URL` com header `x-webhook-secret`
10. Resposta estruturada JSON

**`lib/n8n-payloads.ts`** (adição)
Adicionar `N8nContactPayload` e `buildN8nContactPayload` seguindo a estrutura nested existente:

```ts
export interface N8nContactPayload {
  requestId: string;
  source: 'submit-contact';
  contact: {
    firstName: string;
    lastName: string | null;
    whatsapp: string;
    email: string | null;
    emailOptIn: boolean;
    eventId: string | null;
    ctaSource: string | null;    // ex: 'blog-sidebar'
    destination: string | null;  // ex: 'Orlando', null para genérico
  };
  tracking: N8nLeadTracking;
  meta: {
    receivedAt: string;
  };
}
```

O campo `source: 'submit-contact'` permite ao n8n distinguir leads do formulário de contato dos leads BANT do chatbot (`source: 'submit-lead'`).

Para landings sem destino específico (`ConsultoriaDeViagemLanding`, `ViagensParaExecutivosLanding`, etc.), `destination` será `null`.

---

## Variáveis de Ambiente

Adicionar ao `.env.example` (nova seção junto às demais vars do n8n):

```bash
# Webhook que recebe submissões do formulário de contato rápido.
# Nunca use VITE_ — nunca deve ser exposta ao navegador.
N8N_CONTACT_WEBHOOK_URL=https://seu-n8n.com/webhook/contact-form
```

A autenticação reutiliza `N8N_WEBHOOK_SECRET` já existente — mesmo segredo compartilhado pelos demais webhooks do site.

**Nenhuma variável existente é renomeada.** `N8N_SUBMIT_LEAD_WEBHOOK_URL` permanece inalterado.

---

## DataLayer / Tracking

`hooks/useContactForm.ts` deve disparar eventos GTM após submissão bem-sucedida, seguindo o padrão de `pushGenerateLeadDataLayerEvent` em `hooks/useLeadCapture.ts`:

```ts
window.dataLayer?.push({ event: 'contact_form_submission', action, source });
```

O campo `eventId` deve ser gerado pelo frontend (ex: `createLeadEventId()` de `useLeadCapture`) e incluído no payload para deduplicação no Meta CAPI.

---

## Escopo de Mudanças nos CTAs

### Site principal

| Componente | CTA atual | Mudança |
|---|---|---|
| `components/Header/Header.tsx` | "Consultor de Viagem" (desktop + mobile) | `openContactModal({ source: 'header' })` |
| `components/CallToAction.tsx` | "Começar minha Viagem" + form WhatsApp secundário | Expansão inline unificada |
| `components/Highlights.tsx` | "Falar com Especialista" | `openContactModal({ source: 'highlights' })` |
| `components/HowItWorks.tsx` | CTA da seção | `openContactModal({ source: 'how-it-works' })` |
| `components/Destinations.tsx` | Botão no modal de destino | `openContactModal({ source: 'destinations-modal', destination })` |
| `pages/About.tsx` | 2 botões (hero + footer) | `openContactModal({ source: 'about' })` |

### Blog

| Componente | CTA atual | Mudança |
|---|---|---|
| `pages/BlogList.tsx` | Chama `openAiChat()` | `openContactModal({ source: 'blog-list' })` |
| `components/blog/ChatCTA.tsx` | Chama `openAiChat()` | `openContactModal({ source: 'blog-inline-cta' })` |
| `components/blog/BlogPostFinalCTA.tsx` | Link direto para WhatsApp via `getWhatsAppLink` | Converter para `openContactModal({ source: 'blog-post-footer' })` |
| `components/blog/BlogPostSidebar.tsx` | Chama `openAiChat()` | `openContactModal({ source: 'blog-sidebar' })` |

### Landings

| Componente | CTA | Mudança |
|---|---|---|
| `pages/landings/MelhorIdadeLanding.tsx` | 3 botões com `openAiChat()` | `openContactModal({ source: 'melhor-idade' })` |
| `pages/landings/BetoCarreroLanding.tsx` | 1 botão footer | `openContactModal({ source: 'beto-carrero' })` |
| `pages/landings/OrlandoLanding.tsx` | 1 botão footer | `openContactModal({ source: 'orlando' })` |
| `pages/landings/LollapaloozaLanding.tsx` | "Falar com especialista" | `openContactModal({ source: 'lollapalooza' })` |
| `components/landings/beto-carrero/Button.tsx` | Botão reutilizável | `openContactModal({ source: 'beto-carrero' })` |
| `components/landings/beto-carrero/Solution.tsx` | Card clicável | `openContactModal({ source: 'beto-carrero-solution' })` |
| `components/landings/lollapalooza/Button.tsx` | Botão reutilizável | `openContactModal({ source: 'lollapalooza' })` |
| `components/landings/orlando/OrlandoApp.tsx` | 4 botões | `openContactModal({ source: 'orlando', destination: 'Orlando' })` |
| `pages/landings/ViagensParaExecutivosLanding.tsx` | 3 botões | `openContactModal({ source: 'viagens-executivos' })` |
| `pages/landings/ConsultoriaDeViagemLanding.tsx` | 3 botões | `openContactModal({ source: 'consultoria-viagem' })` |
| `pages/landings/CuradoriaCruzeirosBrasilLanding.tsx` | 3 botões | `openContactModal({ source: 'cruzeiros-brasil' })` |
| `pages/landings/BrazilPromotionDayLanding.tsx` | 5 botões | `openContactModal({ source: 'brazil-promotion-day' })` |

### Intocado

| Componente | Motivo |
|---|---|
| `components/Hero.tsx` | SearchForm desktop + CTA mobile → chatbot. Mantido por design. |
| `components/AIChat.tsx` | Bolha flutuante e UI do chatbot. Totalmente intocados. |
| `api/submit-lead.ts` | Já usa n8n (`N8N_SUBMIT_LEAD_WEBHOOK_URL`). Sem alterações. |
| Lollapalooza waitlist section | Formulário próprio de waitlist. Fora de escopo. |

---

## Testes

- **Unit** (`node:test`): `api/submit-contact.ts` — validação de campos obrigatórios, `normalizeWhatsappNumber`, rate limit, erro de webhook, resposta estruturada
- **Unit** (`node:test`): `lib/n8n-payloads.ts` — `buildN8nContactPayload` com campos opcionais ausentes
- **Unit** (`node:test`): `hooks/useContactForm.ts` — `isValid` com combinações de campos, estado `isSubmitting` durante submit, reset após sucesso
- **E2E** (Playwright): abrir modal via Header CTA → preencher Nome + WhatsApp → clicar "Me chamem" → verificar mensagem de confirmação
- **E2E** (Playwright): "Chamar no WhatsApp" desabilitado com campos vazios → habilitado após preenchimento
- **E2E** (Playwright): expansão inline do `CallToAction` → preencher → submeter
- **E2E** (Playwright): fechar modal via Escape e via clique no overlay
- **Snapshots**: baselines Playwright para homepage e páginas com CTAs alterados precisam ser regeneradas após a implementação

---

## Fora de Escopo

- Criação ou alteração de workflows no n8n
- Mudança na interface ou comportamento do chatbot existente
- Migração de `api/submit-lead.ts` (já concluída em versão anterior)
- Landings com formulários próprios de waitlist (Lollapalooza waitlist section)
