# Contact Form CTA Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `openAiChat()` em ~35 CTAs por `openContactModal()`, que abre um formulário de captura simples (nome, WhatsApp, e-mail, opt-in) com dois caminhos: abrir WhatsApp imediatamente ou solicitar retorno — enviando os dados via webhook n8n.

**Architecture:** Um utilitário `openContactModal()` dispara um `CustomEvent` escutado pelo `ContactModal` global (montado em `ClientFeatures` em `App.tsx`). O formulário é gerenciado pelo hook `useContactForm`, que coleta tracking via `getTrackingDataObject()` e submete para o novo endpoint `/api/submit-contact`. A `CallToAction` da homepage mantém expansão inline ao invés do modal.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vercel Edge Functions, `node:test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-11-contact-form-cta-redesign.md`

---

## Chunk 1: Fundação — Tipos, Payload Builder, Utilitário de Evento, Env

### Files
- Create: `types/contactCapture.ts`
- Modify: `lib/n8n-payloads.ts`
- Modify: `services/n8n.ts`
- Create: `utils/contactForm.ts`
- Modify: `hooks/useLeadCapture.ts` (exportar `extractUtms`)
- Modify: `.env.example`

---

### Task 1: Tipos do formulário de contato

**Files:**
- Create: `types/contactCapture.ts`

- [ ] **1.1 Criar `types/contactCapture.ts`**

```ts
import type { LeadTracking, LeadUtms } from './leadCapture';

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
  utms: LeadUtms;
  tracking?: LeadTracking;
}

export type SubmitContactErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_CONFIG_ERROR'
  | 'N8N_WEBHOOK_ERROR'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

export interface SubmitContactSuccess {
  ok: true;
  requestId: string;
}

export interface SubmitContactError {
  ok: false;
  requestId: string;
  error: string;
  code: SubmitContactErrorCode;
}

export type SubmitContactResponse = SubmitContactSuccess | SubmitContactError;
```

- [ ] **1.2 Verificar que TypeScript compila**

```bash
pnpm typecheck
```

Esperado: sem erros no arquivo novo.

- [ ] **1.3 Commit**

```bash
git add types/contactCapture.ts
git commit -m "feat(types): adiciona tipos para formulário de contato rápido"
```

---

### Task 2: Exportar `extractUtms` de `useLeadCapture`

**Files:**
- Modify: `hooks/useLeadCapture.ts:91`

Atualmente `extractUtms` é privada. O `useContactForm` precisa dela para montar o payload de tracking.

- [ ] **2.1 Exportar a função**

Localizar `function extractUtms` (~linha 91) e adicionar `export`:

```ts
export function extractUtms(tracking: LeadTracking): LeadUtms {
```

- [ ] **2.2 Verificar que nenhum teste quebrou**

```bash
pnpm test:regression
```

Esperado: todos os testes passam.

- [ ] **2.3 Commit**

```bash
git add hooks/useLeadCapture.ts
git commit -m "feat(hooks): exporta extractUtms para reuso no hook de contato"
```

---

### Task 3: Adicionar `N8nContactPayload` e `buildN8nContactPayload` em `lib/n8n-payloads.ts`

**Files:**
- Modify: `lib/n8n-payloads.ts`

Seguir a estrutura nested dos payloads existentes (`N8nLeadPayload`, `N8nWaitlistPayload`).

- [ ] **3.1 Adicionar interface e builder**

Após as interfaces existentes (antes de `toNullableTrackingValue`), adicionar:

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
    ctaSource: string | null;
    destination: string | null;
  };
  tracking: N8nLeadTracking;
  meta: {
    receivedAt: string;
  };
}
```

Após `buildN8nLeadPayload`, adicionar:

```ts
export function buildN8nContactPayload(
  payload: SubmitContactRequest,
  requestId: string,
): N8nContactPayload {
  const tracking: N8nLeadTracking = {
    utm_source: payload.tracking?.utm_source ?? payload.utms.utm_source,
    utm_medium: payload.tracking?.utm_medium ?? payload.utms.utm_medium,
    utm_campaign: payload.tracking?.utm_campaign ?? payload.utms.utm_campaign,
    utm_term: payload.tracking?.utm_term ?? payload.utms.utm_term,
    utm_content: payload.tracking?.utm_content ?? payload.utms.utm_content,
    cid: toNullableTrackingValue(payload.tracking?.cid),
    sid: toNullableTrackingValue(payload.tracking?.sid),
    gclid: toNullableTrackingValue(payload.tracking?.gclid),
    fbclid: toNullableTrackingValue(payload.tracking?.fbclid),
    msclkid: toNullableTrackingValue(payload.tracking?.msclkid),
    ttclid: toNullableTrackingValue(payload.tracking?.ttclid),
    wbraid: toNullableTrackingValue(payload.tracking?.wbraid),
    gbraid: toNullableTrackingValue(payload.tracking?.gbraid),
    fbc: toNullableTrackingValue(payload.tracking?.fbc),
    fbp: toNullableTrackingValue(payload.tracking?.fbp),
    extras: payload.tracking?.extras ?? {},
  };

  return {
    requestId,
    source: 'submit-contact',
    contact: {
      firstName: payload.firstName,
      lastName: payload.lastName ?? null,
      whatsapp: payload.whatsapp,
      email: payload.email ?? null,
      emailOptIn: payload.emailOptIn,
      eventId: payload.eventId ?? null,
      ctaSource: payload.source ?? null,
      destination: payload.destination ?? null,
    },
    tracking,
    meta: {
      receivedAt: new Date().toISOString(),
    },
  };
}
```

Adicionar o import do novo tipo no topo do arquivo (junto aos imports existentes):

```ts
import type { SubmitContactRequest } from '../types/contactCapture';
```

- [ ] **3.2 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **3.3 Commit**

```bash
git add lib/n8n-payloads.ts types/contactCapture.ts
git commit -m "feat(lib): adiciona N8nContactPayload e buildN8nContactPayload"
```

---

### Task 4: Adicionar `sendContactToN8n` em `services/n8n.ts`

**Files:**
- Modify: `services/n8n.ts`

- [ ] **4.1 Adicionar export**

Após `sendLeadToN8n`, adicionar:

```ts
export function sendContactToN8n(
  url: string,
  secret: string,
  requestId: string,
  payload: N8nContactPayload,
): Promise<Response> {
  return n8nRequest(url, secret, requestId, payload);
}
```

Adicionar `N8nContactPayload` no import do topo:

```ts
import type { N8nContactPayload, N8nLeadPayload, N8nQuizPayload, N8nWaitlistPayload } from '../lib/n8n-payloads';
```

- [ ] **4.2 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **4.3 Commit**

```bash
git add services/n8n.ts
git commit -m "feat(services): adiciona sendContactToN8n"
```

---

### Task 5: `utils/contactForm.ts` e `.env.example`

**Files:**
- Create: `utils/contactForm.ts`
- Modify: `.env.example`

- [ ] **5.1 Criar `utils/contactForm.ts`**

```ts
export interface ContactModalOptions {
  source?: string;
  destination?: string;
  message?: string;
}

export function openContactModal(options: ContactModalOptions = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('open-contact-modal', { detail: options }));
}
```

- [ ] **5.2 Adicionar `N8N_SUBMIT_CONTACT_WEBHOOK_URL` ao `.env.example`**

Localizar o bloco `# REQUIRED (prod) - n8n Webhook Secret` e adicionar após ele:

```bash
# =============================================================================
# REQUIRED (prod) - n8n Webhook de contato rápido
# =============================================================================
# Webhook que recebe submissões do formulário de contato rápido (CTAs do site).
# Nunca use VITE_ — nunca deve ser exposta ao navegador.
# Autenticação: reutiliza N8N_WEBHOOK_SECRET (já configurado acima).
N8N_SUBMIT_CONTACT_WEBHOOK_URL=https://seu-n8n.com/webhook/contact-form
```

- [ ] **5.3 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **5.4 Commit**

```bash
git add utils/contactForm.ts .env.example
git commit -m "feat(utils): adiciona openContactModal e documenta N8N_SUBMIT_CONTACT_WEBHOOK_URL"
```

---

## Chunk 2: API Endpoint `/api/submit-contact.ts`

### Files
- Create: `api/submit-contact.ts`

O endpoint segue exatamente o padrão de `api/submit-lead.ts`. Leia esse arquivo antes de começar.

---

### Task 6: Escrever teste do endpoint antes da implementação (TDD)

**Files:**
- Create: `tests/submit-contact.test.ts`

- [ ] **6.1 Criar `tests/submit-contact.test.ts` com casos básicos**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

const originalEnv = {
  N8N_SUBMIT_CONTACT_WEBHOOK_URL: process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL,
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
};

function restoreEnv() {
  if (originalEnv.N8N_SUBMIT_CONTACT_WEBHOOK_URL === undefined) {
    delete process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL;
  } else {
    process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = originalEnv.N8N_SUBMIT_CONTACT_WEBHOOK_URL;
  }
  if (originalEnv.N8N_WEBHOOK_SECRET === undefined) {
    delete process.env.N8N_WEBHOOK_SECRET;
  } else {
    process.env.N8N_WEBHOOK_SECRET = originalEnv.N8N_WEBHOOK_SECRET;
  }
}

function buildRequest(
  body: Record<string, unknown>,
  opts?: { method?: string; ip?: string },
): Request {
  const ipSuffix = Math.floor(Math.random() * 200) + 1;
  const method = opts?.method ?? 'POST';
  return new Request('http://localhost/api/submit-contact', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': opts?.ip ?? `10.0.0.${ipSuffix}`,
    },
    body: method === 'OPTIONS' ? undefined : JSON.stringify(body),
  });
}

function validBody(overrides?: Record<string, unknown>) {
  return {
    firstName: 'Maria',
    whatsapp: '+5511987654321',
    emailOptIn: false,
    utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: null, utm_term: null, utm_content: null },
    ...overrides,
  };
}

// Stub global fetch before importing the handler
const originalFetch = global.fetch;

test.afterEach(() => {
  global.fetch = originalFetch;
  restoreEnv();
});

test('rejects non-POST requests with 405', async () => {
  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest({}, { method: 'GET' });
  const res = await handler(req);
  assert.equal(res.status, 405);
});

test('returns 503 when N8N_SUBMIT_CONTACT_WEBHOOK_URL is missing', async () => {
  delete process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL;
  delete process.env.N8N_WEBHOOK_SECRET;
  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest(validBody());
  const res = await handler(req);
  assert.equal(res.status, 503);
  const json = await res.json();
  assert.equal(json.code, 'SERVER_CONFIG_ERROR');
});

test('returns 400 when firstName is missing', async () => {
  process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
  process.env.N8N_WEBHOOK_SECRET = 'secret';
  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest(validBody({ firstName: '' }));
  const res = await handler(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.code, 'VALIDATION_ERROR');
});

test('returns 400 when whatsapp is missing', async () => {
  process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
  process.env.N8N_WEBHOOK_SECRET = 'secret';
  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest(validBody({ whatsapp: '' }));
  const res = await handler(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.code, 'VALIDATION_ERROR');
});

test('returns 200 and calls n8n webhook on valid request', async () => {
  process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
  process.env.N8N_WEBHOOK_SECRET = 'secret';

  let capturedUrl = '';
  let capturedBody: Record<string, unknown> = {};

  global.fetch = async (input, init) => {
    capturedUrl = typeof input === 'string' ? input : (input as Request).url;
    capturedBody = JSON.parse((init?.body as string) ?? '{}');
    return new Response('{}', { status: 200 });
  };

  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest(validBody({ source: 'header', destination: 'Orlando' }));
  const res = await handler(req);

  assert.equal(res.status, 200);
  assert.equal(capturedUrl, 'https://n8n.example.com/hook');
  assert.equal(capturedBody.source, 'submit-contact');
  assert.equal(capturedBody.contact?.firstName, 'Maria');
  assert.equal(capturedBody.contact?.ctaSource, 'header');
  assert.equal(capturedBody.contact?.destination, 'Orlando');
});

test('returns 502 when n8n webhook fails', async () => {
  process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL = 'https://n8n.example.com/hook';
  process.env.N8N_WEBHOOK_SECRET = 'secret';
  global.fetch = async () => new Response('error', { status: 500 });

  const { default: handler } = await import('../api/submit-contact.ts');
  const req = buildRequest(validBody());
  const res = await handler(req);

  assert.equal(res.status, 502);
  const json = await res.json();
  assert.equal(json.code, 'N8N_WEBHOOK_ERROR');
});
```

- [ ] **6.2 Rodar e confirmar que falham** (handler não existe ainda)

```bash
node --import=tsx/esm --test tests/submit-contact.test.ts
```

Esperado: `Error: Cannot find module '../api/submit-contact.ts'`

---

### Task 7: Implementar `api/submit-contact.ts`

**Files:**
- Create: `api/submit-contact.ts`

Use `api/submit-lead.ts` como referência estrutural.

- [ ] **7.1 Criar o handler**

```ts
import type { SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import { buildCorsHeaders, createRequestId, getClientIP } from '../lib/network';
import { checkRateLimit } from '../lib/rate-limit';
import { cleanString, normalizeWhatsappNumber } from '../lib/lead-logic';
import { buildN8nContactPayload } from '../lib/n8n-payloads';
import { sendContactToN8n } from '../services/n8n';

export const config = {
  runtime: 'edge',
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_KEY_PREFIX = 'ratelimit:submit-contact';

interface ContactConfig {
  webhookUrl: string;
  webhookSecret: string;
}

function getContactConfig(): ContactConfig | null {
  const webhookUrl = cleanString(process.env.N8N_SUBMIT_CONTACT_WEBHOOK_URL);
  const webhookSecret = cleanString(process.env.N8N_WEBHOOK_SECRET);
  if (!webhookUrl || !webhookSecret) return null;
  return { webhookUrl, webhookSecret };
}

function buildJsonResponse(
  body: SubmitContactResponse,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  const requestId =
    'requestId' in body && typeof body.requestId === 'string' ? body.requestId : undefined;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId ? { 'X-Request-Id': requestId } : {}),
      ...corsHeaders,
    },
  });
}

function validateContactRequest(body: unknown): SubmitContactRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const firstName = cleanString(b.firstName);
  const whatsapp = normalizeWhatsappNumber(b.whatsapp);

  if (!firstName || !whatsapp) return null;

  const utms = b.utms && typeof b.utms === 'object'
    ? (b.utms as SubmitContactRequest['utms'])
    : { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };

  return {
    firstName,
    lastName: cleanString(b.lastName) || undefined,
    whatsapp,
    email: cleanString(b.email) || undefined,
    emailOptIn: Boolean(b.emailOptIn),
    source: cleanString(b.source) || undefined,
    destination: cleanString(b.destination) || undefined,
    eventId: cleanString(b.eventId) || undefined,
    utms,
    tracking: b.tracking as SubmitContactRequest['tracking'],
  };
}

export default async function handler(request: Request): Promise<Response> {
  const corsHeaders = buildCorsHeaders(request);
  const requestId = createRequestId();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return buildJsonResponse(
      { ok: false, requestId, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' },
      405,
      corsHeaders,
    );
  }

  const contactConfig = getContactConfig();
  if (!contactConfig) {
    return buildJsonResponse(
      { ok: false, requestId, error: 'Serviço temporariamente indisponível.', code: 'SERVER_CONFIG_ERROR' },
      503,
      corsHeaders,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return buildJsonResponse(
      { ok: false, requestId, error: 'Corpo da requisição inválido.', code: 'VALIDATION_ERROR' },
      400,
      corsHeaders,
    );
  }

  const payload = validateContactRequest(body);
  if (!payload) {
    return buildJsonResponse(
      { ok: false, requestId, error: 'Nome e WhatsApp são obrigatórios.', code: 'VALIDATION_ERROR' },
      400,
      corsHeaders,
    );
  }

  const ip = getClientIP(request);
  const rateLimitResult = await checkRateLimit(ip, {
    limit: RATE_LIMIT_MAX_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
    prefix: RATE_LIMIT_KEY_PREFIX,
  });
  if (!rateLimitResult.allowed) {
    return buildJsonResponse(
      { ok: false, requestId, error: 'Muitas requisições. Tente novamente em breve.', code: 'RATE_LIMIT_EXCEEDED' },
      429,
      corsHeaders,
    );
  }

  try {
    await sendContactToN8n(contactConfig.webhookUrl, contactConfig.webhookSecret, requestId, buildN8nContactPayload(payload, requestId));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const isWebhookError = message.startsWith('N8N_WEBHOOK_ERROR:');
    return buildJsonResponse(
      {
        ok: false,
        requestId,
        error: 'Não foi possível enviar sua mensagem. Tente novamente.',
        code: isWebhookError ? 'N8N_WEBHOOK_ERROR' : 'INTERNAL_ERROR',
      },
      isWebhookError ? 502 : 500,
      corsHeaders,
    );
  }

  return buildJsonResponse({ ok: true, requestId }, 200, corsHeaders);
}
```

- [ ] **7.2 Rodar os testes — todos devem passar**

```bash
node --import=tsx/esm --test tests/submit-contact.test.ts
```

Esperado: 5 testes passando (`✔`).

- [ ] **7.3 Rodar suite completa para garantir não-regressão**

```bash
pnpm test:regression
```

Esperado: todos os testes existentes passam.

- [ ] **7.4 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **7.5 Commit**

```bash
git add api/submit-contact.ts tests/submit-contact.test.ts
git commit -m "feat(api): adiciona endpoint /api/submit-contact com webhook n8n"
```

---

## Chunk 3: Hook `useContactForm`

### Files
- Create: `hooks/useContactForm.ts`

---

### Task 8: Implementar `hooks/useContactForm.ts`

O hook coleta tracking via `getTrackingDataObject()` (mesmo padrão de `captureInitialTracking` em `useLeadCapture.ts`) e dispara dataLayer após submit bem-sucedido.

- [ ] **8.1 Criar `hooks/useContactForm.ts`**

```ts
import { useState, useCallback } from 'react';
import { getTrackingDataObject, getWhatsAppLink } from '../utils/whatsapp';
import { extractUtms, createLeadEventId } from './useLeadCapture';
import type { ContactFormFields, SubmitContactRequest, SubmitContactResponse } from '../types/contactCapture';
import type { ContactModalOptions } from '../utils/contactForm';

const EMPTY_FIELDS: ContactFormFields = {
  firstName: '',
  lastName: '',
  whatsapp: '',
  email: '',
  emailOptIn: false,
};

function collectTracking() {
  const raw = getTrackingDataObject() ?? {};
  const tracking = {
    utm_source: (raw.utm_source as string) ?? null,
    utm_medium: (raw.utm_medium as string) ?? null,
    utm_campaign: (raw.utm_campaign as string) ?? null,
    utm_term: (raw.utm_term as string) ?? null,
    utm_content: (raw.utm_content as string) ?? null,
    cid: (raw.cid as string) ?? null,
    sid: (raw.sid as string) ?? null,
    gclid: (raw.gclid as string) ?? null,
    fbclid: (raw.fbclid as string) ?? null,
    msclkid: (raw.msclkid as string) ?? null,
    ttclid: (raw.ttclid as string) ?? null,
    wbraid: (raw.wbraid as string) ?? null,
    gbraid: (raw.gbraid as string) ?? null,
    fbc: (raw.fbc as string) ?? null,
    fbp: (raw.fbp as string) ?? null,
    extras: {},
  };
  return { tracking, utms: extractUtms(tracking) };
}

function pushContactDataLayerEvent(
  eventId: string,
  action: 'whatsapp' | 'callback',
  source?: string,
): void {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push({
    event: 'contact_form_submission',
    event_id: eventId,
    form_action: action,
    cta_source: source ?? null,
    page_location: window.location.href,
  });
}

export function useContactForm(options: ContactModalOptions = {}) {
  const [fields, setFieldsState] = useState<ContactFormFields>(EMPTY_FIELDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isValid = Boolean(fields.firstName.trim() && fields.whatsapp.trim());

  const setField = useCallback(
    (key: keyof ContactFormFields, value: string | boolean) => {
      setFieldsState((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  const reset = useCallback(() => {
    setFieldsState(EMPTY_FIELDS);
    setIsSubmitting(false);
    setError(null);
    setSubmitted(false);
  }, []);

  const submit = useCallback(
    async (action: 'whatsapp' | 'callback'): Promise<void> => {
      if (!isValid || isSubmitting) return;

      const eventId = createLeadEventId();
      const { tracking, utms } = collectTracking();

      const whatsappMessage =
        options.message ??
        `Olá! Meu nome é ${fields.firstName.trim()}. Gostaria de saber mais sobre viagens.`;

      const whatsappUrl = getWhatsAppLink(whatsappMessage, { appendTrackingRef: true });

      // Para 'whatsapp': abrir o WhatsApp sincronamente antes do fetch
      // para evitar bloqueio de pop-up do navegador.
      if (action === 'whatsapp') {
        window.open(whatsappUrl, '_blank');
      }

      const requestBody: SubmitContactRequest = {
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim() || undefined,
        whatsapp: fields.whatsapp.trim(),
        email: fields.email.trim() || undefined,
        emailOptIn: fields.emailOptIn,
        source: options.source,
        destination: options.destination,
        eventId,
        utms,
        tracking,
      };

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/submit-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          keepalive: true,
        });

        const data = (await response.json()) as SubmitContactResponse;

        if (!response.ok || !data.ok) {
          const errData = data as Extract<SubmitContactResponse, { ok: false }>;
          if (action === 'whatsapp') {
            // WhatsApp já abriu; falha silenciosa no tracking
            console.warn('[submit-contact] tracking falhou:', errData.code);
            setSubmitted(true);
          } else {
            setError(errData.error ?? 'Não foi possível enviar. Tente novamente.');
          }
          return;
        }

        pushContactDataLayerEvent(eventId, action, options.source);
        setSubmitted(true);
      } catch {
        if (action === 'whatsapp') {
          // WhatsApp já abriu; log silencioso
          console.warn('[submit-contact] fetch falhou após abrir WhatsApp');
          setSubmitted(true);
        } else {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [fields, isValid, isSubmitting, options],
  );

  return { fields, setField, isValid, isSubmitting, error, submitted, submit, reset };
}
```

- [ ] **8.2 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **8.3 Rodar testes existentes (não-regressão)**

```bash
pnpm test:regression
```

- [ ] **8.4 Commit**

```bash
git add hooks/useContactForm.ts
git commit -m "feat(hooks): adiciona useContactForm com tracking e dataLayer"
```

---

## Chunk 4: Componente `ContactModal` e montagem global

### Files
- Create: `components/ContactModal.tsx`
- Modify: `App.tsx`

---

### Task 9: Criar `components/ContactModal.tsx`

O modal é um overlay global com focus trap, suporte a Escape e acessibilidade ARIA. Use Tailwind CSS seguindo o padrão visual do projeto (brand colors, rounded-xl, shadow).

- [ ] **9.1 Criar `components/ContactModal.tsx`**

```tsx
import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { X } from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';
import type { ContactModalOptions } from '../utils/contactForm';

const ContactModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ContactModalOptions>({});
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const { fields, setField, isValid, isSubmitting, error, submitted, submit, reset } =
    useContactForm(options);

  const close = useCallback(() => {
    setIsOpen(false);
    reset();
    (triggerRef.current as HTMLElement | null)?.focus();
  }, [reset]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setOptions((e as CustomEvent<ContactModalOptions>).detail ?? {});
      setIsOpen(true);
    };
    window.addEventListener('open-contact-modal', handleOpen);
    return () => window.removeEventListener('open-contact-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      firstFieldRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xs font-black text-brand-vibrant tracking-widest uppercase mb-1">
              Anhangá Viagens
            </p>
            <h2 id={titleId} className="text-lg font-black text-brand-dark">
              Fale com um especialista
            </h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 pb-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl text-green-600 font-black">OK</span>
            </div>
            <p className="font-bold text-gray-800">Recebemos seu contato!</p>
            <p className="text-sm text-gray-500">Nossa equipe entra em contato em breve pelo WhatsApp.</p>
            <button
              onClick={close}
              className="w-full bg-brand-dark text-white font-bold py-3 rounded-xl hover:bg-brand-vibrant transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => e.preventDefault()}
            className="px-6 pb-6 flex flex-col gap-3"
            noValidate
          >
            {/* Nome + Sobrenome */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="contact-firstName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nome *
                </label>
                <input
                  ref={firstFieldRef}
                  id="contact-firstName"
                  type="text"
                  autoComplete="given-name"
                  value={fields.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
                  placeholder="ex: Maria"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="contact-lastName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Sobrenome
                </label>
                <input
                  id="contact-lastName"
                  type="text"
                  autoComplete="family-name"
                  value={fields.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
                  placeholder="ex: Silva"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="contact-whatsapp" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                WhatsApp *
              </label>
              <input
                id="contact-whatsapp"
                type="tel"
                autoComplete="tel"
                value={fields.whatsapp}
                onChange={(e) => setField('whatsapp', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
                placeholder="+55 (11) 9 0000-0000"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
                placeholder="seu@email.com (opcional)"
              />
            </div>

            {/* Opt-in */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
              <input
                id="contact-optIn"
                type="checkbox"
                checked={fields.emailOptIn}
                onChange={(e) => setField('emailOptIn', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0"
              />
              <label htmlFor="contact-optIn" className="text-xs text-blue-700 leading-relaxed cursor-pointer">
                Quero receber novidades e ofertas de viagem por e-mail.{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                  Política de Privacidade
                </a>
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-xs font-medium" role="alert">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => void submit('whatsapp')}
                disabled={!isValid || isSubmitting}
                className="w-full bg-[#25D366] text-white font-black py-3 rounded-xl text-sm hover:bg-[#1fba59] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
              >
                {isSubmitting ? 'Enviando...' : 'Chamar no WhatsApp'}
              </button>
              <button
                type="button"
                onClick={() => void submit('callback')}
                disabled={!isValid || isSubmitting}
                className="w-full bg-brand-dark text-white font-black py-3 rounded-xl text-sm hover:bg-brand-vibrant transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
              >
                {isSubmitting ? 'Enviando...' : 'Me chamem no WhatsApp'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
```

- [ ] **9.2 Verificar typecheck**

```bash
pnpm typecheck
```

---

### Task 10: Montar `ContactModal` em `App.tsx`

**Files:**
- Modify: `App.tsx:39-45` (bloco `ClientFeatures`)

- [ ] **10.1 Importar e montar `ContactModal`**

Adicionar o import no topo de `App.tsx` (junto aos outros imports de componentes):

```ts
import ContactModal from './components/ContactModal';
```

Localizar o componente `ClientFeatures` (~linha 39) e adicionar `<ContactModal />` ao lado de `<AIChat />`:

```tsx
const ClientFeatures: React.FC = () => (
  <ClientOnly>
    <AIChat />
    <ContactModal />
  </ClientOnly>
);
```

- [ ] **10.2 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **10.3 Rodar testes existentes**

```bash
pnpm test:regression
```

- [ ] **10.4 Commit (Chunk 3 + 4)**

```bash
git add hooks/useContactForm.ts components/ContactModal.tsx App.tsx
git commit -m "feat(ui): adiciona ContactModal global com useContactForm e tracking"
```

---

## Chunk 5: `CallToAction.tsx` — Expansão Inline

### Files
- Modify: `components/CallToAction.tsx`

---

### Task 11: Atualizar `CallToAction.tsx` para expansão inline com o novo formulário

O componente atual tem `formState: 'closed' | 'open' | 'submitted'` com campos nome + e-mail. Substituir por formulário completo usando `useContactForm`.

- [ ] **11.1 Reescrever `CallToAction.tsx`**

Substituir o conteúdo do componente pelos novos campos e lógica. Preservar o layout "ticket" (esquerda + divisor + stub direito) intacto.

Principais mudanças:
1. Remover `openAiChat`, `name`, `email`, `useLeadCapture` do estado local
2. Importar `useContactForm` e usar os campos `firstName`, `lastName`, `whatsapp`, `email`, `emailOptIn`
3. O botão primário "Começar minha Viagem" passa a chamar `setFormState('open')` (expansão inline)
4. Remover o botão secundário "Prefere o WhatsApp?" — substituído pela expansão unificada
5. Nos estados `'open'` e `'submitted'`, usar o hook e os campos novos

Código do lado esquerdo atualizado:

```tsx
import React, { useState } from 'react';
import {
  AirplaneTilt,
  DeviceMobile,
  WhatsappLogo,
  CheckCircle,
  SpinnerGap,
} from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';

type FormState = 'closed' | 'open' | 'submitted';

const CallToAction: React.FC = () => {
  const [formState, setFormState] = useState<FormState>('closed');

  const { fields, setField, isValid, isSubmitting, error, submitted, submit } =
    useContactForm({ source: 'cta-homepage' });

  // Sincronizar estado do hook com estado local
  React.useEffect(() => {
    if (submitted && formState === 'open') {
      setFormState('submitted');
    }
  }, [submitted, formState]);

  const handleOpenForm = () => setFormState('open');

  return (
    <section id="contato" className="py-24 bg-brand-light relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-brand-dark">TRAVEL</div>
        <div className="absolute bottom-10 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-brand-dark">FLY</div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden relative flex flex-col md:flex-row min-h-[500px] md:min-h-[420px]">

          {/* LEFT SIDE */}
          <div className="w-full md:w-[70%] p-8 md:p-12 relative flex flex-col justify-between">
            {/* Header Strip */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-dashed border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-brand-cyan font-black tracking-widest text-sm uppercase">
                <AirplaneTilt className="w-5 h-5" weight="fill" /> Anhangá Airlines
              </div>
              <div className="text-gray-400 font-bold text-xs uppercase">First Class Experience</div>
            </div>

            {formState === 'closed' && (
              <>
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 leading-tight">
                    Próxima parada: <br />
                    <span className="text-brand-vibrant">aquele lugar que você sempre adiou.</span>
                  </h2>
                  <p className="text-gray-500 font-medium text-lg max-w-md">
                    Orçamento gratuito. Roteiro feito do zero, só pra você.
                  </p>
                </div>
                <button
                  onClick={handleOpenForm}
                  className="btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all self-start"
                  data-tracking="cta-home-footer"
                >
                  Solicitar meu Orçamento
                </button>
              </>
            )}

            {formState === 'open' && (
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 w-full" noValidate>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Seus dados para contato</p>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="cta-firstName" className="sr-only">Nome</label>
                    <input id="cta-firstName" type="text" placeholder="Nome *" value={fields.firstName}
                      onChange={(e) => setField('firstName', e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan transition-colors placeholder-gray-400" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="cta-lastName" className="sr-only">Sobrenome</label>
                    <input id="cta-lastName" type="text" placeholder="Sobrenome" value={fields.lastName}
                      onChange={(e) => setField('lastName', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan transition-colors placeholder-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="cta-whatsapp" className="sr-only">WhatsApp</label>
                  <input id="cta-whatsapp" type="tel" placeholder="WhatsApp *" value={fields.whatsapp}
                    onChange={(e) => setField('whatsapp', e.target.value)} required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan transition-colors placeholder-gray-400" />
                </div>

                <div>
                  <label htmlFor="cta-email" className="sr-only">E-mail</label>
                  <input id="cta-email" type="email" placeholder="E-mail (opcional)" value={fields.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan transition-colors placeholder-gray-400" />
                </div>

                <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <input id="cta-optIn" type="checkbox" checked={fields.emailOptIn}
                    onChange={(e) => setField('emailOptIn', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0" />
                  <label htmlFor="cta-optIn" className="text-xs text-blue-700 leading-relaxed cursor-pointer">
                    Quero receber novidades por e-mail.{' '}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a>
                  </label>
                </div>

                {error && <p className="text-red-500 text-xs font-medium" role="alert">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => void submit('whatsapp')}
                    disabled={!isValid || isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1fba59] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {isSubmitting ? <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" /> : <WhatsappLogo className="w-4 h-4" weight="fill" />}
                    Chamar no WhatsApp
                  </button>
                  <button type="button" onClick={() => void submit('callback')}
                    disabled={!isValid || isSubmitting}
                    className="flex-1 bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-brand-vibrant disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Me chamem
                  </button>
                </div>
              </form>
            )}

            {formState === 'submitted' && (
              <div className="flex flex-col gap-3" role="status" aria-live="polite">
                <p className="flex items-center gap-2 text-green-600 text-sm font-bold">
                  <CheckCircle className="w-5 h-5" weight="fill" />
                  Recebemos! Nossa equipe entra em contato em breve.
                </p>
              </div>
            )}

            <div className="hidden md:block absolute -right-4 top-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20" />
            <div className="hidden md:block absolute -right-4 bottom-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20" />
          </div>

          {/* DIVIDER */}
          <div className="relative w-full h-8 md:w-8 md:h-auto flex items-center justify-center">
            <div className="w-full h-[2px] md:w-[2px] md:h-[90%] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300" />
            <div className="md:hidden absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-light rounded-full z-20" />
            <div className="md:hidden absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-light rounded-full z-20" />
          </div>

          {/* RIGHT SIDE: Stub — preservado intacto */}
          {/* (manter exatamente o mesmo JSX do stub que já existe no arquivo) */}
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
```

> **Nota para o implementador:** mantenha o JSX do stub direito (seção `RIGHT SIDE`) exatamente como está no arquivo original — inclui barcode, gate, seat, etc. Apenas o lado esquerdo muda.

- [ ] **11.2 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **11.3 Subir dev server e testar manualmente**

```bash
pnpm dev
```

Verificar: clicar em "Solicitar meu Orçamento" expande o formulário; preencher Nome + WhatsApp habilita os botões.

- [ ] **11.4 Commit**

```bash
git add components/CallToAction.tsx
git commit -m "feat(ui): substitui CTA principal do CallToAction por formulário inline"
```

---

## Chunk 6: CTAs do Site Principal e Blog

### Files
- Modify: `components/Header/Header.tsx`
- Modify: `components/Highlights.tsx`
- Modify: `components/HowItWorks.tsx`
- Modify: `components/Destinations.tsx`
- Modify: `pages/About.tsx`
- Modify: `pages/BlogList.tsx`
- Modify: `components/blog/ChatCTA.tsx`
- Modify: `components/blog/BlogPostFinalCTA.tsx`
- Modify: `components/blog/BlogPostSidebar.tsx`

Em cada arquivo: trocar `import { openAiChat }` por `import { openContactModal }` e substituir as chamadas.

---

### Task 12: Header

**Files:**
- Modify: `components/Header/Header.tsx`

- [ ] **12.1 Substituir `openAiChat` por `openContactModal`**

1. Remover `import { openAiChat } from '../../utils/aiChat'`
2. Adicionar `import { openContactModal } from '../../utils/contactForm'`
3. Na função que chama `openAiChat(...)` (~linha 35), substituir por:
   ```ts
   openContactModal({ source: 'header' });
   ```
4. Remover argumentos específicos do chatbot (ex: `message: '...'`)

- [ ] **12.2 Verificar typecheck**

```bash
pnpm typecheck
```

---

### Task 13: Highlights, HowItWorks, Destinations, About

**Files:**
- Modify: `components/Highlights.tsx`
- Modify: `components/HowItWorks.tsx`
- Modify: `components/Destinations.tsx`
- Modify: `pages/About.tsx`

Mesmo padrão da Task 12. Para `Destinations.tsx`, o `openContactModal` recebe o destino selecionado:

```ts
openContactModal({ source: 'destinations-modal', destination: selectedDestination.city });
```

- [ ] **13.1 Highlights:** trocar `openAiChat` → `openContactModal({ source: 'highlights' })`
- [ ] **13.2 HowItWorks:** trocar `openAiChat` → `openContactModal({ source: 'how-it-works' })`
- [ ] **13.3 Destinations:** trocar `openAiChat` → `openContactModal({ source: 'destinations-modal', destination: selectedDestination.city })`
- [ ] **13.4 About:** trocar ambos os `openAiChat` → `openContactModal({ source: 'about' })`

- [ ] **13.5 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **13.6 Commit (Tasks 12 + 13)**

```bash
git add components/Header/Header.tsx components/Highlights.tsx components/HowItWorks.tsx components/Destinations.tsx pages/About.tsx
git commit -m "feat(cta): migra CTAs do site principal para openContactModal"
```

---

### Task 14: Blog CTAs

**Files:**
- Modify: `pages/BlogList.tsx`
- Modify: `components/blog/ChatCTA.tsx`
- Modify: `components/blog/BlogPostFinalCTA.tsx`
- Modify: `components/blog/BlogPostSidebar.tsx`

> **Atenção `BlogPostFinalCTA.tsx`:** atualmente usa `getWhatsAppLink` diretamente (não `openAiChat`). Converter o `<a>` para `<button>` que chama `openContactModal`.

- [ ] **14.1 BlogList:** trocar `openAiChat` → `openContactModal({ source: 'blog-list' })`
- [ ] **14.2 ChatCTA:** trocar `openAiChat` → `openContactModal({ source: 'blog-inline-cta' })`
- [ ] **14.3 BlogPostFinalCTA:** converter `<a href={getWhatsAppLink(...)}>` em `<button onClick={() => openContactModal({ source: 'blog-post-footer' })}>` com mesmos estilos
- [ ] **14.4 BlogPostSidebar:** trocar `openAiChat` → `openContactModal({ source: 'blog-sidebar' })`

- [ ] **14.5 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **14.6 Commit**

```bash
git add pages/BlogList.tsx components/blog/ChatCTA.tsx components/blog/BlogPostFinalCTA.tsx components/blog/BlogPostSidebar.tsx
git commit -m "feat(cta): migra CTAs do blog para openContactModal"
```

---

## Chunk 7: CTAs das Landings

### Files
- Modify: `pages/landings/MelhorIdadeLanding.tsx`
- Modify: `pages/landings/BetoCarreroLanding.tsx`
- Modify: `pages/landings/OrlandoLanding.tsx`
- Modify: `pages/landings/LollapaloozaLanding.tsx`
- Modify: `components/landings/beto-carrero/Button.tsx`
- Modify: `components/landings/beto-carrero/Solution.tsx`
- Modify: `components/landings/lollapalooza/Button.tsx`
- Modify: `components/landings/orlando/OrlandoApp.tsx`
- Modify: `pages/landings/ViagensParaExecutivosLanding.tsx`
- Modify: `pages/landings/ConsultoriaDeViagemLanding.tsx`
- Modify: `pages/landings/CuradoriaCruzeirosBrasilLanding.tsx`
- Modify: `pages/landings/BrazilPromotionDayLanding.tsx`

---

### Task 15: Landings Beto Carrero e Lollapalooza

- [ ] **15.1 `components/landings/beto-carrero/Button.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'beto-carrero' })`
- [ ] **15.2 `components/landings/beto-carrero/Solution.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'beto-carrero-solution' })`
- [ ] **15.3 `pages/landings/BetoCarreroLanding.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'beto-carrero' })`
- [ ] **15.4 `components/landings/lollapalooza/Button.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'lollapalooza' })`
- [ ] **15.5 `pages/landings/LollapaloozaLanding.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'lollapalooza' })`

- [ ] **15.6 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **15.7 Commit**

```bash
git add components/landings/beto-carrero/ components/landings/lollapalooza/ pages/landings/BetoCarreroLanding.tsx pages/landings/LollapaloozaLanding.tsx
git commit -m "feat(cta): migra CTAs das landings Beto Carrero e Lollapalooza"
```

---

### Task 16: Landings Orlando, Melhor Idade e demais

- [ ] **16.1 `components/landings/orlando/OrlandoApp.tsx`:** trocar todos os `openAiChat` (4 ocorrências) → `openContactModal({ source: 'orlando', destination: 'Orlando' })`
- [ ] **16.2 `pages/landings/OrlandoLanding.tsx`:** trocar `openAiChat` → `openContactModal({ source: 'orlando' })`
- [ ] **16.3 `pages/landings/MelhorIdadeLanding.tsx`:** trocar todos os `openAiChat` (3 ocorrências) → `openContactModal({ source: 'melhor-idade' })`
- [ ] **16.4 `pages/landings/ViagensParaExecutivosLanding.tsx`:** Não usa `openAiChat`. Tem botões `<a href={whatsappUrl}>` com `useWhatsAppLink`. Converter cada `<a>` CTA para `<button onClick={() => openContactModal({ source: 'viagens-executivos' })}>`, mantendo os estilos Tailwind exatos.
- [ ] **16.5 `pages/landings/ConsultoriaDeViagemLanding.tsx`:** Mesmo padrão — `<a>` → `<button>` com `openContactModal({ source: 'consultoria-viagem' })`
- [ ] **16.6 `pages/landings/CuradoriaCruzeirosBrasilLanding.tsx`:** Mesmo padrão — `<a>` → `<button>` com `openContactModal({ source: 'cruzeiros-brasil' })`
- [ ] **16.7 `pages/landings/BrazilPromotionDayLanding.tsx`:** Mesmo padrão — converter os botões CTA (verificar se `<a>` ou `<button>`) → `openContactModal({ source: 'brazil-promotion-day' })`. **Nota:** esta landing pode ter um formulário próprio de captura de WhatsApp — não alterar esse formulário, apenas os botões CTA externos.

- [ ] **16.8 Verificar typecheck**

```bash
pnpm typecheck
```

- [ ] **16.9 Rodar testes de regressão**

```bash
pnpm test:regression
```

- [ ] **16.10 Commit**

```bash
git add components/landings/orlando/ pages/landings/OrlandoLanding.tsx pages/landings/MelhorIdadeLanding.tsx pages/landings/ViagensParaExecutivosLanding.tsx pages/landings/ConsultoriaDeViagemLanding.tsx pages/landings/CuradoriaCruzeirosBrasilLanding.tsx pages/landings/BrazilPromotionDayLanding.tsx
git commit -m "feat(cta): migra CTAs das demais landings para openContactModal"
```

---

## Chunk 8: Testes E2E

### Files
- Create: `tests/e2e/contact-form.spec.ts`

Use `tests/e2e/chatbot-lead-submit.spec.ts` como referência de estrutura.

---

### Task 17: Testes Playwright do fluxo de contato

- [ ] **17.1 Criar `tests/e2e/contact-form.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

test.describe('Contact form modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/submit-contact', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, requestId: 'req_test' }) }),
    );
    await page.goto('/');
  });

  test('abre o modal ao clicar no CTA do Header', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabelText(/nome/i).first()).toBeFocused();
  });

  test('botões desabilitados com campos vazios', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await expect(page.getByRole('button', { name: /chamar no whatsapp/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /me chamem/i })).toBeDisabled();
  });

  test('botões habilitados após preencher nome e whatsapp', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await page.getByLabel(/nome \*/i).fill('Maria');
    await page.getByLabel(/whatsapp \*/i).fill('11987654321');
    await expect(page.getByRole('button', { name: /chamar no whatsapp/i })).toBeEnabled();
    await expect(page.getByRole('button', { name: /me chamem/i })).toBeEnabled();
  });

  test('"Me chamem no WhatsApp" envia formulário e exibe confirmação', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await page.getByLabel(/nome \*/i).fill('Maria');
    await page.getByLabel(/whatsapp \*/i).fill('11987654321');
    await page.getByRole('button', { name: /me chamem/i }).click();
    await expect(page.getByText(/recebemos seu contato/i)).toBeVisible();
  });

  test('fecha com tecla Escape', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('fecha ao clicar no overlay', async ({ page }) => {
    await page.getByRole('button', { name: /fale conosco/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

test.describe('CallToAction inline form', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/submit-contact', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, requestId: 'req_test' }) }),
    );
    await page.goto('/#contato');
  });

  test('expande formulário ao clicar em "Solicitar meu Orçamento"', async ({ page }) => {
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();
    await expect(page.getByLabel(/nome \*/i).first()).toBeVisible();
  });

  test('exibe confirmação após "Me chamem"', async ({ page }) => {
    await page.getByRole('button', { name: /solicitar meu orçamento/i }).click();
    await page.getByLabel(/nome \*/i).first().fill('João');
    await page.getByLabel(/whatsapp \*/i).first().fill('11999998888');
    await page.getByRole('button', { name: /^me chamem$/i }).click();
    await expect(page.getByText(/recebemos/i)).toBeVisible();
  });
});
```

- [ ] **17.2 Rodar os testes E2E**

```bash
pnpm test:e2e --grep "contact form"
```

Esperado: todos os testes passando.

- [ ] **17.3 Regenerar baselines de snapshot**

O `ContactModal` adicionado no DOM pode quebrar snapshots visuais existentes.

```bash
pnpm test:e2e --update-snapshots
```

Revisar as diferenças no output — aceitar apenas mudanças esperadas (adição do modal ao DOM).

- [ ] **17.4 Commit**

```bash
git add tests/e2e/contact-form.spec.ts tests/e2e/visual.spec.ts-snapshots/
git commit -m "test(e2e): adiciona testes do formulário de contato e atualiza baselines"
```

---

## Verificação Final

- [ ] **Typecheck completo**

```bash
pnpm typecheck
```

- [ ] **Suite de testes completa**

```bash
pnpm test:regression
```

- [ ] **Build de produção**

```bash
pnpm build
```

Esperado: sem erros, chunks `react-vendor` e `ai-vendor` presentes.

- [ ] **Confirmar que Hero não foi alterado**

```bash
git log --oneline -- components/Hero.tsx
```

Esperado: nenhum commit novo nesse arquivo.

- [ ] **Confirmar que AIChat não foi alterado**

```bash
git log --oneline -- components/AIChat.tsx
```

Esperado: nenhum commit novo nesse arquivo.
