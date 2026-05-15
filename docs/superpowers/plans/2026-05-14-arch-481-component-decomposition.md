# [arch] Decomposição de Componentes Gigantes — Issue #481

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir 6 componentes com 300+ linhas a arquivos focados extraindo subcomponentes com responsabilidade única, sem alterar comportamento.

**Architecture:** Cada componente gigante é decomposto em subcomponentes que não leem estado de irmãos. O orquestrador original mantém o estado e a lógica de negócio; os subcomponentes recebem apenas as props de que precisam. Privacy.tsx é excluído (conteúdo legal estático — exceção documentada em `rules/security.md`).

**Tech Stack:** React 19, TypeScript, Tailwind CSS. Ciclo de verificação: `pnpm typecheck` + `pnpm test:regression` após cada tarefa.

**Verificação a cada commit:**
```bash
pnpm typecheck           # zero erros TypeScript
pnpm test:regression     # todos os testes passando
```

---

## Chunk 1: NPS.tsx

### Tarefa 1: Mover `NpsTextarea` para `components/nps/NpsTextarea.tsx`

**Files:**
- Criar: `components/nps/NpsTextarea.tsx`
- Modificar: `pages/NPS.tsx`

`NpsTextarea` já existe como função local em `pages/NPS.tsx` (linhas 398–445). É um componente de UI puro sem acoplamento ao estado de NPS.

- [ ] **Step 1: Criar o arquivo**

```tsx
// components/nps/NpsTextarea.tsx
import { useState } from 'react';

export interface NpsTextareaProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
}

export function NpsTextarea({ id, value, onChange, placeholder, rows, required, maxLength }: NpsTextareaProps) {
  const [focused, setFocused] = useState(false);

  const charsLeft = maxLength !== undefined ? maxLength - value.length : null;
  const showCounter = charsLeft !== null && (focused || value.length > (maxLength ?? 0) * 0.6);
  const counterColor = charsLeft !== null && charsLeft < 100 ? '#f87171' : '#475569';

  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-xl px-4 py-3 text-sm resize-none"
        style={{
          fontFamily: 'Poppins, sans-serif',
          background: '#1e293b',
          color: '#f1f5f9',
          border: focused ? '2px solid #0ea5e9' : '2px solid #334155',
          boxShadow: focused ? '0 0 0 4px rgba(14,165,233,0.15)' : 'none',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          lineHeight: '1.65',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showCounter && (
        <p
          aria-live="polite"
          style={{
            textAlign: 'right',
            fontSize: '0.7rem',
            color: counterColor,
            marginTop: '4px',
            transition: 'color 0.2s ease',
          }}
        >
          {charsLeft} {charsLeft === 1 ? 'caractere restante' : 'caracteres restantes'}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Substituir em `pages/NPS.tsx`**

Remover o bloco `interface NpsTextareaProps` e a função `function NpsTextarea(...)` das linhas 388–445.
Adicionar import no topo:
```tsx
import { NpsTextarea } from '../components/nps/NpsTextarea';
```

- [ ] **Step 3: Verificar tipos**
```bash
pnpm typecheck
```
Esperado: zero erros.

- [ ] **Step 4: Commit**
```bash
git add components/nps/NpsTextarea.tsx pages/NPS.tsx
git commit -m "refactor(nps): mover NpsTextarea para components/nps/"
```

---

### Tarefa 2: Extrair `NpsScoreSelector` para `components/nps/NpsScoreSelector.tsx`

**Files:**
- Criar: `components/nps/NpsScoreSelector.tsx`
- Modificar: `pages/NPS.tsx`

O grid de 11 botões (linhas 163–210 em `pages/NPS.tsx`) não lê estado de irmãos. Recebe score, hover e callbacks como props.

- [ ] **Step 1: Criar o arquivo**

```tsx
// components/nps/NpsScoreSelector.tsx

const SCORE_LABELS: Record<number, string> = {
  0: 'Nada provável',
  5: 'Neutro',
  10: 'Extremamente provável',
};

export interface NpsScoreSelectorProps {
  score: number | null;
  hoveredScore: number | null;
  onSelect: (score: number) => void;
  onHover: (score: number | null) => void;
}

export function NpsScoreSelector({ score, hoveredScore, onSelect, onHover }: NpsScoreSelectorProps) {
  return (
    <fieldset className="mb-8">
      <legend
        className="block text-xs font-bold uppercase mb-4"
        style={{ letterSpacing: '0.15em', color: '#94a3b8' }}
      >
        De 0 a 10, o quanto você recomendaria a Anhangá Viagens para um amigo ou familiar?
      </legend>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(2.75rem, 1fr))', gap: '6px' }}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = score === i;
          const hovered = hoveredScore === i && !selected;
          return (
            <button
              key={`score-${i}`}
              type="button"
              onClick={() => onSelect(i)}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              aria-pressed={selected}
              aria-label={`Nota ${i}${SCORE_LABELS[i] ? ` — ${SCORE_LABELS[i]}` : ''}`}
              className="nps-score-btn"
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '0.375rem',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease',
                background: selected ? '#0056D2' : hovered ? '#263144' : '#1e293b',
                color: selected ? '#ffffff' : hovered ? '#e2e8f0' : '#64748b',
                border: selected ? '2px solid #0056D2' : hovered ? '2px solid #475569' : '2px solid #334155',
                boxShadow: selected ? '4px 4px 0 #003B8E' : hovered ? '3px 3px 0 rgba(0,0,0,0.25)' : '2px 2px 0 rgba(0,0,0,0.3)',
                transform: selected ? 'translate(-1px,-1px)' : hovered ? 'translate(-0.5px,-0.5px)' : 'none',
              }}
            >
              {i}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between mt-2" style={{ color: '#475569', fontSize: '0.75rem' }}>
        <span>Nada provável</span>
        <span>Extremamente provável</span>
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 2: Substituir em `pages/NPS.tsx`**

Remover a constante `SCORE_LABELS` e o `<fieldset>` do grid de scores (linhas 10–13 e 163–210).
Adicionar import:
```tsx
import { NpsScoreSelector } from '../components/nps/NpsScoreSelector';
```
Substituir o `<fieldset>` por:
```tsx
<NpsScoreSelector
  score={score}
  hoveredScore={hoveredScore}
  onSelect={setScore}
  onHover={setHoveredScore}
/>
```

- [ ] **Step 3: Verificar tipos**
```bash
pnpm typecheck
```
Esperado: zero erros.

- [ ] **Step 4: Commit**
```bash
git add components/nps/NpsScoreSelector.tsx pages/NPS.tsx
git commit -m "refactor(nps): extrair NpsScoreSelector para components/nps/"
```

---

### Tarefa 3: Extrair `NpsThankPromoter` e `NpsThankOther` para `components/nps/`

**Files:**
- Criar: `components/nps/NpsThankPromoter.tsx`
- Criar: `components/nps/NpsThankOther.tsx`
- Modificar: `pages/NPS.tsx`

Os dois estados de agradecimento não leem estado de irmãos. Cada um recebe apenas as props de que precisa.

- [ ] **Step 1: Criar `NpsThankPromoter.tsx`**

```tsx
// components/nps/NpsThankPromoter.tsx
const GOOGLE_REVIEW_URL = 'https://g.page/r/Ca7sLORX6EQ7EBM/review';

export interface NpsThankPromoterProps {
  firstname: string;
  countdown: number;
}

export function NpsThankPromoter({ firstname, countdown }: NpsThankPromoterProps) {
  return (
    <div className="nps-thank-card animate-fade-in-up text-center py-8">
      <div
        className="mx-auto mb-6 flex items-center justify-center rounded-full"
        style={{
          width: '4rem',
          height: '4rem',
          background: '#FFD600',
          border: '2px solid #0f172a',
          boxShadow: '4px 4px 0 #0f172a',
        }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: '-0.025em' }}>
        Muito obrigado{firstname ? `, ${firstname}` : ''}!
      </h1>
      <p className="text-base mb-6" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
        Que ótimo saber que a experiência foi incrível!<br />
        Que tal compartilhar sua opinião no Google?
      </p>

      <p className="text-sm mb-6" style={{ color: '#475569' }} aria-live="polite" aria-atomic="true">
        Abrindo o Google em{' '}
        <span className="font-bold" style={{ color: '#FFD600' }}>{countdown}</span>{' '}
        segundo{countdown !== 1 ? 's' : ''}…
      </p>

      <a href={GOOGLE_REVIEW_URL} className="nps-cta nps-cta-yellow">
        Avaliar no Google agora
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Criar `NpsThankOther.tsx`**

```tsx
// components/nps/NpsThankOther.tsx
const WHATSAPP_URL = 'https://wa.me/551152833309';

export interface NpsThankOtherProps {
  firstname: string;
}

export function NpsThankOther({ firstname }: NpsThankOtherProps) {
  return (
    <div className="nps-thank-card animate-fade-in-up text-center py-8">
      <div
        className="mx-auto mb-6 flex items-center justify-center rounded-full"
        style={{
          width: '4rem',
          height: '4rem',
          background: '#0056D2',
          border: '2px solid #0f172a',
          boxShadow: '4px 4px 0 #003B8E',
        }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: '-0.025em' }}>
        Obrigado pelo seu feedback!
      </h1>
      <p className="text-base mb-8" style={{ color: '#94a3b8', lineHeight: '1.75' }}>
        Sua opinião nos ajuda a melhorar cada detalhe.<br />
        Quer conversar mais sobre sua experiência?
      </p>

      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="nps-cta nps-cta-whatsapp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Falar no WhatsApp
      </a>
    </div>
  );
}
```

- [ ] **Step 3: Atualizar `pages/NPS.tsx`**

Remover os dois blocos `{pageState === 'thank-promoter' && ...}` e `{pageState === 'thank-other' && ...}`.
Remover as constantes `GOOGLE_REVIEW_URL` e `WHATSAPP_URL` do topo.
Adicionar imports:
```tsx
import { NpsThankPromoter } from '../components/nps/NpsThankPromoter';
import { NpsThankOther } from '../components/nps/NpsThankOther';
```
Substituir os blocos removidos por:
```tsx
{pageState === 'thank-promoter' && (
  <NpsThankPromoter firstname={firstname} countdown={countdown} />
)}
{pageState === 'thank-other' && (
  <NpsThankOther firstname={firstname} />
)}
```

- [ ] **Step 4: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros e todos os testes passando.

- [ ] **Step 5: Commit**
```bash
git add components/nps/NpsThankPromoter.tsx components/nps/NpsThankOther.tsx pages/NPS.tsx
git commit -m "refactor(nps): extrair NpsThankPromoter e NpsThankOther"
```

---

## Chunk 2: CallToAction.tsx

### Tarefa 4: Extrair `CtaTicketStub` para `components/cta/CtaTicketStub.tsx`

**Files:**
- Criar: `components/cta/CtaTicketStub.tsx`
- Modificar: `components/CallToAction.tsx`

O lado direito do ticket (boarding pass stub, linhas 208–316 em `CallToAction.tsx`) é decoração pura — não lê estado, não recebe props.

- [ ] **Step 1: Criar o arquivo**

```tsx
// components/cta/CtaTicketStub.tsx
import { AirplaneTilt, DeviceMobile } from '@phosphor-icons/react';

export function CtaTicketStub() {
  return (
    <div className="w-full md:w-[30%] bg-gray-50 p-6 flex flex-col relative">

      {/* Stub Header */}
      <div className="flex justify-between items-center mb-5 opacity-60">
        <span className="text-[10px] font-bold tracking-widest uppercase">Anhangá Air</span>
        <AirplaneTilt className="w-3 h-3" weight="fill" />
      </div>

      {/* Passenger Name */}
      <div className="mb-4">
        <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Passenger Name</span>
        <span className="block text-lg font-black text-brand-dark truncate">VOCÊ / VIP</span>
      </div>

      {/* Flight Details Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 border-b-2 border-dashed border-gray-200 pb-4">
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Flight</span>
          <span className="block text-sm font-bold font-mono text-gray-800">ANH 777</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Date</span>
          <span className="block text-sm font-bold font-mono text-gray-800">HOJE</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">From</span>
          <span className="block text-base font-black text-gray-800">GRU</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">To</span>
          <span className="block text-base font-black text-brand-vibrant">MUNDO</span>
        </div>
      </div>

      {/* Critical Boarding Info */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-2 flex justify-between items-center shadow-sm mb-4">
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Gate</span>
          <span className="block text-xl font-black text-brand-dark">01</span>
        </div>
        <div className="w-[1px] h-8 bg-gray-100"></div>
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Seat</span>
          <span className="block text-xl font-black text-brand-dark">1A</span>
        </div>
        <div className="w-[1px] h-8 bg-gray-100"></div>
        <div className="text-center flex-1">
          <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-wider">Zone</span>
          <span className="block text-xl font-black text-brand-dark">1</span>
        </div>
      </div>

      {/* Footer Info & Barcode */}
      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Boarding</span>
            <span className="block text-sm font-black text-red-500">AGORA</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">SEQ</span>
            <span className="block text-sm font-mono font-bold text-gray-600">001</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-center items-stretch h-12 w-full overflow-hidden select-none bg-transparent gap-[1px]">
            {[4, 2, 1, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 2, 1, 3, 1, 1, 2, 1, 4, 1, 2].map((w, i) => (
              <div key={`bar-start-${i}`} className="bg-gray-950" style={{ width: `${w * 2}px`, flexShrink: 0 }} />
            ))}
            <div className="flex-1"></div>
            {[2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2].map((w, i) => (
              <div key={`bar-end-${i}`} className="bg-gray-950" style={{ width: `${w * 2}px`, flexShrink: 0 }} />
            ))}
          </div>

          <div className="flex justify-between items-center mt-1">
            <span className="font-mono text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase">
              ETKT 29384910239
            </span>
            <DeviceMobile className="w-3 h-3 text-gray-300" weight="fill" />
          </div>
        </div>
      </div>

      {/* Decorative Stamp Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] pointer-events-none">
        <AirplaneTilt className="w-32 h-32 text-brand-dark" weight="fill" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Atualizar `components/CallToAction.tsx`**

Remover o bloco `{/* --- RIGHT SIDE: Stub / Details --- */}` completo (linhas 208–316).
Adicionar import:
```tsx
import { CtaTicketStub } from './cta/CtaTicketStub';
```
Substituir pelo componente:
```tsx
<CtaTicketStub />
```

- [ ] **Step 3: Verificar tipos**
```bash
pnpm typecheck
```
Esperado: zero erros.

- [ ] **Step 4: Commit**
```bash
git add components/cta/CtaTicketStub.tsx components/CallToAction.tsx
git commit -m "refactor(cta): extrair CtaTicketStub para components/cta/"
```

---

### Tarefa 5: Extrair `CtaBody` para `components/cta/CtaBody.tsx`

**Files:**
- Criar: `components/cta/CtaBody.tsx`
- Modificar: `components/CallToAction.tsx`

O lado esquerdo do ticket contém os 3 estados do formulário (closed/open/submitted) e pode encapsular `useContactForm` internamente, expondo apenas o estado final para o orquestrador via prop `onStateChange` opcional. Na prática, não há necessidade de comunicação upward — o componente é completamente autossuficiente.

- [ ] **Step 1: Criar o arquivo**

```tsx
// components/cta/CtaBody.tsx
import { useEffect, useState } from 'react';
import { AirplaneTilt, WhatsappLogo, SpinnerGap, CheckCircle } from '@phosphor-icons/react';
import { useContactForm } from '../../hooks/useContactForm';

type FormState = 'closed' | 'open' | 'submitted';

export function CtaBody() {
  const [formState, setFormState] = useState<FormState>('closed');
  const { fields, setField, isValid, isSubmitting, error, submitted, submit } =
    useContactForm({ source: 'cta-homepage' });

  useEffect(() => {
    if (submitted && formState === 'open') {
      setFormState('submitted');
    }
  }, [formState, submitted]);

  if (formState === 'submitted') {
    return (
      <div className="flex flex-col gap-3" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-green-600 text-sm font-bold">
          <CheckCircle className="w-5 h-5" weight="fill" />
          Recebemos! Nossa equipe entra em contato em breve.
        </p>
      </div>
    );
  }

  if (formState === 'open') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit('whatsapp');
        }}
        className="flex flex-col gap-3 w-full"
        noValidate
      >
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">
          Seus dados para contato
        </p>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="cta-firstName" className="sr-only">Nome</label>
            <input
              id="cta-firstName"
              type="text"
              placeholder="Nome *"
              value={fields.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="cta-lastName" className="sr-only">Sobrenome</label>
            <input
              id="cta-lastName"
              type="text"
              placeholder="Sobrenome"
              value={fields.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cta-whatsapp" className="sr-only">WhatsApp</label>
          <input
            id="cta-whatsapp"
            type="tel"
            placeholder="WhatsApp *"
            value={fields.whatsapp}
            onChange={(event) => setField('whatsapp', event.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
          />
        </div>

        <div>
          <label htmlFor="cta-email" className="sr-only">E-mail</label>
          <input
            id="cta-email"
            type="email"
            placeholder="E-mail (opcional)"
            value={fields.email}
            onChange={(event) => setField('email', event.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors placeholder-gray-400"
          />
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
          <input
            id="cta-optIn"
            type="checkbox"
            checked={fields.emailOptIn}
            onChange={(event) => setField('emailOptIn', event.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0"
          />
          <label htmlFor="cta-optIn" className="text-xs text-blue-700 leading-relaxed cursor-pointer">
            Quero receber novidades por e-mail.{' '}
            <a href="/politica-privacidade" target="_blank" rel="noopener noreferrer" className="underline">
              Política de Privacidade
            </a>
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-xs font-medium" role="alert">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#1fba59] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" />
            ) : (
              <WhatsappLogo className="w-4 h-4" weight="fill" />
            )}
            Chamar no WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void submit('callback')}
            disabled={!isValid || isSubmitting}
            className="w-full sm:flex-1 bg-brand-dark text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-brand-vibrant disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Me chamem
          </button>
        </div>
      </form>
    );
  }

  // formState === 'closed'
  return (
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
        type="button"
        onClick={() => setFormState('open')}
        className="btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all self-start"
        data-tracking="cta-home-footer"
      >
        Solicitar meu Orçamento
      </button>
    </>
  );
}
```

- [ ] **Step 2: Simplificar `components/CallToAction.tsx`**

Remover `type FormState`, o estado `formState`, o `useContactForm`, o `useEffect`, `handleOpenForm`, e todo o JSX do lado esquerdo (exceto header strip e holes).
Adicionar import:
```tsx
import { CtaBody } from './cta/CtaBody';
```
O bloco esquerdo do ticket fica:
```tsx
<div className="w-full md:w-[70%] p-8 md:p-12 relative flex flex-col justify-between">
  {/* Header Strip */}
  <div className="flex justify-between items-center mb-8 border-b-2 border-dashed border-gray-100 pb-4">
    <div className="flex items-center gap-2 text-brand-cyan font-black tracking-widest text-sm uppercase" title="Estilo Boarding Pass">
      <AirplaneTilt className="w-5 h-5" weight="fill" /> Anhangá Airlines
      <span className="text-[10px] opacity-40 ml-1 hidden lg:inline">(Boarding Pass)</span>
    </div>
    <div className="text-gray-400 font-bold text-xs uppercase">First Class Experience</div>
  </div>

  <CtaBody />

  {/* Perforation holes */}
  <div className="hidden md:block absolute -right-4 top-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20"></div>
  <div className="hidden md:block absolute -right-4 bottom-[-1.5rem] w-8 h-8 bg-brand-light rounded-full z-20"></div>
</div>
```

- [ ] **Step 3: Remover imports desnecessários de `CallToAction.tsx`**

Remover `useState`, `useEffect`, `useContactForm`, `WhatsappLogo`, `SpinnerGap`, `CheckCircle` do CallToAction (usados apenas pelo CtaBody agora).

- [ ] **Step 4: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros e todos os testes passando.

- [ ] **Step 5: Commit**
```bash
git add components/cta/CtaBody.tsx components/CallToAction.tsx
git commit -m "refactor(cta): extrair CtaBody — CallToAction reduzido a orquestrador de layout"
```

---

## Chunk 3: BrazilPromotionDayLanding.tsx

### Tarefa 6: Criar constants e subcomponentes de BrazilPromotionDayLanding

**Files:**
- Criar: `components/landings/brazil-promotion-day/constants.ts`
- Criar: `components/landings/brazil-promotion-day/BpdNav.tsx`
- Criar: `components/landings/brazil-promotion-day/BpdHero.tsx`
- Criar: `components/landings/brazil-promotion-day/BpdPillars.tsx`
- Criar: `components/landings/brazil-promotion-day/BpdWhatsAppBand.tsx`
- Criar: `components/landings/brazil-promotion-day/BpdContactSection.tsx`
- Criar: `components/landings/brazil-promotion-day/BpdFooter.tsx`
- Modificar: `pages/landings/BrazilPromotionDayLanding.tsx`

Esta tarefa extrai 6 seções independentes e um módulo de constantes. `BpdContactSection` encapsula o formulário e toda a lógica de submissão (`useLeadCapture`, `useWhatsAppLink`, estado do form).

- [ ] **Step 1: Criar `constants.ts`**

```ts
// components/landings/brazil-promotion-day/constants.ts
import { UsersThree, Sparkle, ClipboardText } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export const WHATSAPP_MESSAGE =
  'Olá! Conheci a Anhangá Viagens na Brazil Promotion Day e gostaria de saber mais sobre roteiros personalizados. ✈️🌎';

export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/anhangaviagens',
  facebook: 'https://facebook.com/profile.php?id=61585422494271',
};

export interface Pillar {
  icon: Icon;
  title: string;
  description: string;
  bg: string;
  accent: string;
  iconColor: string;
  rotate: string;
}

export const PILLARS: Pillar[] = [
  {
    icon: UsersThree,
    title: 'Concierge Humano',
    description: 'Esqueça os robôs. Fale com gente que entende de gente.',
    bg: 'bg-blue-100',
    accent: 'border-blue-200',
    iconColor: 'text-blue-600',
    rotate: '-rotate-1',
  },
  {
    icon: Sparkle,
    title: 'Roteiros à Mão',
    description: 'Cada dia de viagem desenhado do zero, só para você. Sem pacote genérico, sem destino padrão.',
    bg: 'bg-emerald-100',
    accent: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    rotate: 'rotate-2',
  },
  {
    icon: ClipboardText,
    title: 'Zero Burocracia',
    description: 'Vistos, transfers, seguro viagem e chatices? Cuida com a gente.',
    bg: 'bg-orange-100',
    accent: 'border-orange-200',
    iconColor: 'text-orange-600',
    rotate: '-rotate-2',
  },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
  }),
};
```

- [ ] **Step 2: Criar `BpdNav.tsx`**

Extrair o bloco `{/* ── Nav ───── */}` de `BrazilPromotionDayLanding.tsx` para este arquivo. O componente não recebe props.

```tsx
// components/landings/brazil-promotion-day/BpdNav.tsx
import { WhatsappLogo } from '@phosphor-icons/react';
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';
import { openContactModal } from '../../../utils/contactForm';

export function BpdNav() {
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 px-6 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <a href="https://www.anhanga.tur.br/" aria-label="Voltar para o site principal">
          <img
            src={BRAND_LOGO_BLUE_URL}
            alt="Anhangá Viagens"
            width="160"
            height="83"
            className="h-12 w-auto object-contain"
          />
        </a>
        <button
          type="button"
          onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
          className="btn-whatsapp btn-specialist hidden sm:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          data-contact-intent
          data-tracking="header-brazil-promotion-day"
        >
          <WhatsappLogo className="w-4 h-4" weight="fill" />
          Falar no WhatsApp
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Criar `BpdHero.tsx`**

Extrair o bloco `{/* ── Hero ──── */}`. Sem props.

```tsx
// components/landings/brazil-promotion-day/BpdHero.tsx
import { m } from 'framer-motion';
import { AirplaneTilt, ArrowRight, WhatsappLogo } from '@phosphor-icons/react';
import { openContactModal } from '../../../utils/contactForm';
import { fadeUp } from './constants';

export function BpdHero() {
  return (
    <section className="relative w-full min-h-[100svh] md:min-h-[720px] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/85 to-blue-900/75" />
        <div className="hidden md:block absolute inset-0 opacity-20" style={{ backgroundImage: "url('/noise.png')" }} />
      </div>

      {/* Decorative blobs */}
      <div aria-hidden="true" className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl animate-blob" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-6 relative z-10 pt-20 pb-24">
        <div className="flex flex-col items-center text-center">
          <m.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-block relative mb-6">
            <span className="absolute inset-0 bg-brand-yellow/30 transform -skew-x-12 rounded-lg" />
            <span className="relative px-4 py-1.5 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
              <AirplaneTilt className="w-4 h-4" weight="fill" />
              Brazil Promotion Day 2026
            </span>
          </m.div>

          <m.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="font-sans font-extrabold text-white leading-[0.9] tracking-tight drop-shadow-lg text-5xl sm:text-6xl md:text-8xl mb-6">
            Sua equipe <br />
            <span className="text-yellow-300">Viaja bem.</span>
          </m.h1>

          <m.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
            Roteiros exclusivos feitos do zero. Sem pacote pronto, sem estresse. Só a sua viagem.
          </m.p>

          <m.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => openContactModal({ source: 'brazil-promotion-day' })}
              className="btn-whatsapp btn-specialist flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              data-contact-intent
              data-tracking="hero-brazil-promotion-day"
            >
              <WhatsappLogo className="w-6 h-6" weight="fill" />
              Falar com a gente agora
            </button>
            <a
              href="#contato"
              className="btn-specialist flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition-all duration-200"
            >
              Prefiro ser contatado
              <ArrowRight className="w-5 h-5" />
            </a>
          </m.div>

          <m.div
            className="mt-10 flex flex-wrap justify-center gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
            }}
          >
            {[
              { icon: '✈️', text: 'Roteiro Personalizado' },
              { icon: '🤝', text: 'Atendimento Humano' },
              { icon: '🌎', text: 'Viagem Sob Medida' },
              { icon: '💛', text: 'Sem Pacote Pronto' },
            ].map((feat) => (
              <m.div
                key={feat.text}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
                }}
                className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300 cursor-default"
              >
                <span>{feat.icon}</span>
                {feat.text}
              </m.div>
            ))}
          </m.div>
        </div>
      </div>

      {/* Wavy bottom separator */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#fffdf5" />
        </svg>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Criar `BpdPillars.tsx`** — extrair seção `{/* ── Pillars ── */}`. Sem props, importa `PILLARS` e `fadeUp` de `constants.ts`.

- [ ] **Step 5: Criar `BpdWhatsAppBand.tsx`** — extrair seção `{/* ── WhatsApp CTA band ── */}`. Sem props.

- [ ] **Step 6: Criar `BpdContactSection.tsx`** — extrair seção `{/* ── Contact Form ── */}`.

Este componente encapsula a lógica do formulário que antes estava no componente pai. Ele usa `useLeadCapture`, `useWhatsAppLink`, e gerencia `form`, `submitState`, `errorMessage`, `isLocallySubmitting` internamente. Não recebe props.

O corpo deste componente corresponde às linhas 76–143 (hooks + handlers) e linhas 441–687 (JSX da seção) do arquivo original.

- [ ] **Step 7: Criar `BpdFooter.tsx`** — extrair seção `{/* ── Footer ── */}`. Sem props.

- [ ] **Step 8: Reescrever `pages/landings/BrazilPromotionDayLanding.tsx`**

Após as extrações, o arquivo fica com apenas ~35 linhas:

```tsx
// pages/landings/BrazilPromotionDayLanding.tsx
import React from 'react';
import { SEO } from '../../components/SEO';
import { BpdNav } from '../../components/landings/brazil-promotion-day/BpdNav';
import { BpdHero } from '../../components/landings/brazil-promotion-day/BpdHero';
import { BpdPillars } from '../../components/landings/brazil-promotion-day/BpdPillars';
import { BpdWhatsAppBand } from '../../components/landings/brazil-promotion-day/BpdWhatsAppBand';
import { BpdContactSection } from '../../components/landings/brazil-promotion-day/BpdContactSection';
import { BpdFooter } from '../../components/landings/brazil-promotion-day/BpdFooter';

const BrazilPromotionDayLanding: React.FC = () => {
  return (
    <>
      <SEO
        title="Anhangá Viagens na Brazil Promotion Day | Roteiros Personalizados"
        description="Conheça a Anhangá Viagens na Brazil Promotion Day. Agência de viagens em SP com roteiros exclusivos feitos do zero, sem pacote pronto."
        canonical="https://www.anhanga.tur.br/brazil-promotion-day/"
      />
      <div className="bg-[#fffdf5] min-h-screen font-sans">
        <BpdNav />
        <BpdHero />
        <BpdPillars />
        <BpdWhatsAppBand />
        <BpdContactSection />
        <BpdFooter />
      </div>
    </>
  );
};

export default BrazilPromotionDayLanding;
```

- [ ] **Step 9: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros e todos os testes passando.

- [ ] **Step 10: Commit**
```bash
git add components/landings/brazil-promotion-day/ pages/landings/BrazilPromotionDayLanding.tsx
git commit -m "refactor(bpd): decompor BrazilPromotionDayLanding em 6 subcomponentes"
```

---

## Chunk 4: beto-carrero/Solution.tsx

### Tarefa 7: Extrair `DestinationsModal`, `SolutionPhoneMockup` e `SolutionChecklist`

**Files:**
- Criar: `components/landings/beto-carrero/DestinationsModal.tsx`
- Criar: `components/landings/beto-carrero/SolutionPhoneMockup.tsx`
- Criar: `components/landings/beto-carrero/SolutionChecklist.tsx`
- Modificar: `components/landings/beto-carrero/Solution.tsx`

- [ ] **Step 1: Criar `DestinationsModal.tsx`**

Extrair o bloco `{/* --- FLOATING MODAL --- */}` (linhas 282–375). Recebe `isOpen: boolean` e `onClose: () => void`.

```tsx
// components/landings/beto-carrero/DestinationsModal.tsx
import { Sun, Fish, Building2, X } from 'lucide-react';
import Button from './Button';

interface DestinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DestinationsModal({ isOpen, onClose }: DestinationsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Fechar modal"
        className="absolute inset-0 bg-fun-dark/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl border-4 border-fun-dark shadow-hard-lg p-6 md:p-8 animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-fun-pink text-white p-2 rounded-full border-2 border-fun-dark shadow-hard hover:scale-110 hover:rotate-90 transition-all z-10"
          aria-label="Fechar janela"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="text-center mb-8">
          <h3 className="font-sans font-bold text-3xl md:text-4xl text-fun-dark mb-2">Destinos Extras</h3>
          <p className="text-slate-600 font-bold">Escolha um (ou todos) e peça no Zap!</p>
        </div>

        <div className="space-y-5 mb-4">
          {[
            { Icon: Sun,       bg: 'bg-fun-yellow', iconClass: 'text-fun-dark', name: 'Florianópolis',      desc: '42 praias, dunas de areia e gastronomia.' },
            { Icon: Fish,      bg: 'bg-fun-green',  iconClass: 'text-white',    name: 'Bombinhas',           desc: 'Mergulho ecológico e águas cristalinas.' },
            { Icon: Building2, bg: 'bg-fun-blue',   iconClass: 'text-white',    name: 'Balneário Camboriú', desc: 'Roda gigante, aquário e vida noturna.' },
          ].map(({ Icon, bg, iconClass, name, desc }) => (
            <div
              key={name}
              className="group bg-white p-5 rounded-2xl border-2 border-fun-dark shadow-hard hover:shadow-hard-hover hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 cursor-default relative overflow-hidden"
            >
              <div className={`w-16 h-16 ${bg} border-2 border-fun-dark rounded-full flex items-center justify-center shadow-sm shrink-0 z-10 group-hover:rotate-12 transition-transform duration-300`}>
                <Icon size={32} className={iconClass} strokeWidth={2.5} />
              </div>
              <div className="z-10">
                <h4 className="font-sans font-bold text-2xl text-fun-dark mb-1">{name}</h4>
                <p className="text-sm font-bold text-slate-500 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 pt-6 border-t-2 border-dashed border-gray-300">
          <Button
            text="Montar Roteiro no Zap"
            variant="secondary"
            fullWidth={true}
            onClick={onClose}
            tooltip="Ajustamos tudo para você"
            dataTracking="modal-betocarrero"
          />
        </div>
      </div>
    </div>
  );
}
```

> **Nota:** O array usa `iconClass` para preservar as cores originais: `Sun` → `text-fun-dark`, `Fish` e `Building2` → `text-white`. Verificar visualmente após extração.

- [ ] **Step 2: Criar `SolutionPhoneMockup.tsx`**

Extrair o bloco `{/* --- RIGHT COLUMN: The Visual --- */}` (linhas 198–277). Sem props.

```tsx
// components/landings/beto-carrero/SolutionPhoneMockup.tsx
import { Send, MessageCircle } from 'lucide-react';

export function SolutionPhoneMockup() {
  return (
    <div className="lg:w-1/2 relative flex justify-center mt-12 lg:mt-0">
      {/* ... JSX do mockup de phone conforme original ... */}
    </div>
  );
}
```

Copiar o JSX completo do bloco RIGHT COLUMN do arquivo original.

- [ ] **Step 3: Criar `SolutionChecklist.tsx`**

Extrair o bloco `{/* --- LEFT COLUMN: The Stack --- */}` (linhas 47–195). Recebe `onOpenModal: () => void`.

```tsx
// components/landings/beto-carrero/SolutionChecklist.tsx
import { Check, Plane, BedDouble, Ticket, MapPin, ArrowRight } from 'lucide-react';
import { openContactModal } from '../../../utils/contactForm';

interface SolutionChecklistProps {
  onOpenModal: () => void;
}

export function SolutionChecklist({ onOpenModal }: SolutionChecklistProps) {
  return (
    <div className="lg:w-1/2 relative flex flex-col items-center lg:items-start">
      {/* ... JSX completo do LEFT COLUMN conforme original ... */}
    </div>
  );
}
```

- [ ] **Step 4: Simplificar `Solution.tsx`**

Após as extrações, `Solution.tsx` mantém apenas: modal state, wave divider, layout e imports.

```tsx
// components/landings/beto-carrero/Solution.tsx
import React, { useState } from 'react';
import { SolutionChecklist } from './SolutionChecklist';
import { SolutionPhoneMockup } from './SolutionPhoneMockup';
import { DestinationsModal } from './DestinationsModal';

const Solution: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-24 bg-fun-blue relative border-b-4 border-fun-dark overflow-hidden">
      <style>{`
        @keyframes wave-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-wave { animation: wave-float 5s ease-in-out infinite; }
      `}</style>

      {/* Wave Divider Top */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-10">
        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[90px] animate-wave" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-fun-white" />
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3" fill="none" stroke="#0F172A" strokeWidth="2" opacity="0.1" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <SolutionChecklist onOpenModal={() => setIsModalOpen(true)} />
          <SolutionPhoneMockup />
        </div>
      </div>

      <DestinationsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default Solution;
```

- [ ] **Step 5: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros.

- [ ] **Step 6: Commit**
```bash
git add components/landings/beto-carrero/DestinationsModal.tsx components/landings/beto-carrero/SolutionPhoneMockup.tsx components/landings/beto-carrero/SolutionChecklist.tsx components/landings/beto-carrero/Solution.tsx
git commit -m "refactor(beto): decompor Solution.tsx em 3 subcomponentes"
```

---

## Chunk 5: lollapalooza/VenueMap.tsx

### Tarefa 8: Extrair dados e lista de POIs

**Files:**
- Criar: `components/landings/lollapalooza/venueMapData.ts`
- Criar: `components/landings/lollapalooza/VenuePoiList.tsx`
- Modificar: `components/landings/lollapalooza/VenueMap.tsx`

- [ ] **Step 1: Criar `venueMapData.ts`**

Extrair o array `pois` (linhas 19–70) e a função `getPoiStyle` (linhas 73–84).

```ts
// components/landings/lollapalooza/venueMapData.ts
import { Plane, Building2, Trees, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Poi {
  name: string;
  coords: [number, number];
  type: string;
  distance: string;
  time: string;
  description: string;
  transitInfo: string;
  image: string;
}

export interface PoiStyle {
  Icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  label: string;
}

export const POIS: Poi[] = [
  // ... copiar o array pois[] do arquivo original
];

export function getPoiStyle(poi: Poi): PoiStyle {
  if (poi.type === 'airport') {
    return { Icon: Plane, bgColor: '#4B5563', iconColor: 'white', label: 'Aeroporto' };
  }
  if (poi.name.includes('Parque')) {
    return { Icon: Trees, bgColor: '#059669', iconColor: 'white', label: 'Natureza' };
  }
  if (poi.name.includes('Pinheiros')) {
    return { Icon: Utensils, bgColor: '#FFD600', iconColor: '#003B8E', label: 'Gastronomia' };
  }
  return { Icon: Building2, bgColor: '#0056D2', iconColor: 'white', label: 'Cidade' };
}
```

- [ ] **Step 2: Criar `VenuePoiList.tsx`**

Extrair o painel esquerdo (linhas 244–374 do JSX de VenueMap). Recebe props: `pois`, `activeIndex`, `listContainerRef`, `itemsRef`, `onItemClick`, `getPoiStyle`.

```tsx
// components/landings/lollapalooza/VenuePoiList.tsx
import type { RefObject, MutableRefObject } from 'react';
import { MapPin, Navigation, Plane, Building2, Trees, CarFront, Info, ChevronRight, Utensils, TrainFront } from 'lucide-react';
import { optimizeRemoteImageUrl } from '../../../data/mediaConfig';
import type { Poi, PoiStyle } from './venueMapData';

interface VenuePoiListProps {
  pois: Poi[];
  activeIndex: number | null;
  listContainerRef: RefObject<HTMLDivElement>;
  itemsRef: MutableRefObject<(HTMLButtonElement | null)[]>;
  onItemClick: (index: number) => void;
  getPoiStyle: (poi: Poi) => PoiStyle;
}

export function VenuePoiList({ pois, activeIndex, listContainerRef, itemsRef, onItemClick, getPoiStyle }: VenuePoiListProps) {
  return (
    <div className="w-full md:w-1/3 p-6 md:p-8 bg-white flex flex-col border-r border-gray-100 h-auto flex-shrink-0">
      {/* ... JSX completo do painel esquerdo conforme original ... */}
    </div>
  );
}
```

- [ ] **Step 3: Atualizar `VenueMap.tsx`**

Remover: `pois` data, `getPoiStyle`, e o bloco JSX do painel esquerdo.
Adicionar imports de `venueMapData.ts` e `VenuePoiList`.

O mapa Leaflet e sua lógica de inicialização permanecem em `VenueMap.tsx`.

```tsx
// VenueMap.tsx (após extração) — mantém ~170 linhas
import { POIS, getPoiStyle } from './venueMapData';
import { VenuePoiList } from './VenuePoiList';
// ... resto dos imports Leaflet

const VenueMap: React.FC = () => {
  // ... refs + state
  // ... useEffect com Leaflet init (linhas 86-202) — permanece aqui
  // ... handleListClick

  return (
    <section ...>
      <div className="bg-white rounded-3xl ...">
        <VenuePoiList
          pois={POIS}
          activeIndex={activeIndex}
          listContainerRef={listContainerRef}
          itemsRef={itemsRef}
          onItemClick={handleListClick}
          getPoiStyle={getPoiStyle}
        />
        {/* Mapa Leaflet */}
        <div className="w-full md:w-2/3 ...">
          <div ref={mapContainerRef} ... />
        </div>
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros.

- [ ] **Step 5: Commit**
```bash
git add components/landings/lollapalooza/venueMapData.ts components/landings/lollapalooza/VenuePoiList.tsx components/landings/lollapalooza/VenueMap.tsx
git commit -m "refactor(lolla): extrair VenuePoiList e venueMapData de VenueMap"
```

---

## Chunk 6: orlando/OrlandoApp.tsx

### Tarefa 9: Extrair `ParkCard`, `OrlandoParksGallery`, `OrlandoItinerary`, `OrlandoFooter`, `OrlandoFeatures`, `OrlandoHero`

**Files:**
- Criar: `components/landings/orlando/OrlandoParkCard.tsx`
- Criar: `components/landings/orlando/OrlandoParksGallery.tsx`
- Criar: `components/landings/orlando/OrlandoItinerary.tsx`
- Criar: `components/landings/orlando/OrlandoFooter.tsx`
- Criar: `components/landings/orlando/OrlandoFeatures.tsx`
- Criar: `components/landings/orlando/OrlandoHero.tsx`
- Modificar: `components/landings/orlando/OrlandoApp.tsx`

Esta é a maior decomposição (838 linhas). Recomenda-se criar os arquivos de folha primeiro (ParkCard) e depois os agregadores.

- [ ] **Step 1: Criar `OrlandoParkCard.tsx`**

O padrão de card de parque se repete 12 vezes em `OrlandoApp.tsx`. Extrair para componente reutilizável.

```tsx
// components/landings/orlando/OrlandoParkCard.tsx
import { optimizeRemoteImageUrl, getMediaUrl } from '../../../data/mediaConfig';

interface OrlandoParkCardProps {
  imageSrc: string;
  imageAlt: string;
  logoSrc: string;
  logoAlt: string;
  logoStyle?: React.CSSProperties;
  description: string;
}

export function OrlandoParkCard({ imageSrc, imageAlt, logoSrc, logoAlt, logoStyle, description }: OrlandoParkCardProps) {
  return (
    <div className="park-card">
      <div className="park-image-frame">
        <img
          src={optimizeRemoteImageUrl(imageSrc, 600, 400)}
          alt={imageAlt}
          width="600"
          height="400"
          loading="lazy"
        />
      </div>
      <img
        className="park-logo-title"
        src={getMediaUrl(logoSrc)}
        alt={logoAlt}
        width="120"
        height="40"
        loading="lazy"
        style={logoStyle}
      />
      <p>{description}</p>
    </div>
  );
}
```

- [ ] **Step 2: Criar `OrlandoParksGallery.tsx`**

Extrair a seção `<section className="parks-gallery" ...>` (linhas 322–709) usando `OrlandoParkCard` + arrays de dados.

```tsx
// components/landings/orlando/OrlandoParksGallery.tsx
import { OrlandoParkCard } from './OrlandoParkCard';
import { openContactModal } from '../../../utils/contactForm';

const DISNEY_PARKS = [ /* array com os 5 parques Disney */ ];
const UNIVERSAL_PARKS = [ /* array com os 4 parques Universal */ ];
const OTHER_PARKS = [ /* array com os 3 parques outros */ ];

export function OrlandoParksGallery() {
  return (
    <section className="parks-gallery" id="parks">
      <h2 className="section-title">
        <span className="highlight-pink">Parques</span>{' '}
        <span className="highlight-blue">Imperdíveis</span>
      </h2>

      <div className="complex-group disney-group">
        <div className="complex-label"><span>Walt Disney World</span></div>
        <div className="parks-grid">
          {DISNEY_PARKS.map(park => <OrlandoParkCard key={park.imageAlt} {...park} />)}
        </div>
      </div>

      <div className="complex-group universal-group">
        <div className="complex-label"><span>Universal Orlando</span></div>
        <div className="parks-grid">
          {UNIVERSAL_PARKS.map(park => <OrlandoParkCard key={park.imageAlt} {...park} />)}
        </div>
      </div>

      <div className="complex-group other-group">
        <div className="complex-label"><span>Outras Aventuras</span></div>
        <div className="parks-grid">
          {OTHER_PARKS.map(park => <OrlandoParkCard key={park.imageAlt} {...park} />)}
        </div>
      </div>

      <div className="gallery-cta">
        <button
          onClick={(e) => { e.preventDefault(); openContactModal({ source: 'orlando', destination: 'Orlando' }); }}
          className="btn-whatsapp btn-specialist main-btn secondary"
          data-tracking="mid-orlando"
        >
          Ver Pacotes
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Criar `OrlandoItinerary.tsx`** — extrair `<section className="itinerary-section" ...>` (linhas 711–778). Sem props.

- [ ] **Step 4: Criar `OrlandoFooter.tsx`** — extrair `<footer className="main-footer" ...>` (linhas 780–833). Sem props além de `runtimeMetadata` (que pode ser calculado internamente com `useFooterRuntimeMetadata()`).

- [ ] **Step 5: Criar `OrlandoFeatures.tsx`** — extrair `<section className="features-section" ...>` (linhas 241–320). Sem props.

- [ ] **Step 6: Criar `OrlandoHero.tsx`** — extrair `<main className="hero">` (linhas 129–239) + os componentes `WashiTape`, `Card`, `Badge` (linhas 23–62) + o `useEffect` de parallax (linhas 71–94) + `cardsRef` (linha 69).

```tsx
// components/landings/orlando/OrlandoHero.tsx
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { optimizeRemoteImageUrl } from '../../../data/mediaConfig';
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';
import { openContactModal } from '../../../utils/contactForm';

// WashiTape, Card, Badge — movidos para cá
// cardsRef + useEffect parallax — movidos para cá

export function OrlandoHero() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 1100) return;
      const { innerWidth, innerHeight } = window;
      const x = (innerWidth / 2 - e.pageX) / 50;
      const y = (innerHeight / 2 - e.pageY) / 50;
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        if (!card.matches(':hover')) {
          const speed = (index + 1) * 0.5;
          const rotation = index % 2 === 0 ? -5 : 3;
          card.style.transform = `translate(${x * speed}px, ${y * speed}px) rotate(${rotation}deg)`;
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <header>
        <Link to="/" className="logo">
          <img src={BRAND_LOGO_BLUE_URL} alt="Anhangá Viagens Logo" width="150" height="78" fetchPriority="high" />
        </Link>
        <nav className="nav-links" aria-label="Navegação Interna">
          <a href="#features">Destaques</a>
          <a href="#parks">Parques</a>
          <a href="#itinerary">Roteiro</a>
          <a href="#contact">Contato</a>
        </nav>
      </header>
      <main className="hero">
        {/* ... JSX do hero conforme original, usando cardsRef ... */}
      </main>
    </>
  );
}
```

> **Nota:** `OrlandoHero` renderiza também o `<header>` pois ambos dependem de `cardsRef` e o `useEffect` de parallax. Separar header e hero nesta etapa criaria acoplamento desnecessário.

- [ ] **Step 7: Simplificar `OrlandoApp.tsx`**

```tsx
// components/landings/orlando/OrlandoApp.tsx
import React from 'react';
import { OrlandoHero } from './OrlandoHero';
import { OrlandoFeatures } from './OrlandoFeatures';
import { OrlandoParksGallery } from './OrlandoParksGallery';
import { OrlandoItinerary } from './OrlandoItinerary';
import { OrlandoFooter } from './OrlandoFooter';

function OrlandoApp() {
  return (
    <div className="landing-orlando">
      <svg className="grain-overlay" aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
      <OrlandoHero />
      <OrlandoFeatures />
      <OrlandoParksGallery />
      <OrlandoItinerary />
      <OrlandoFooter />
    </div>
  );
}

export default OrlandoApp;
```

- [ ] **Step 8: Verificar tipos e testes**
```bash
pnpm typecheck
pnpm test:regression
```
Esperado: zero erros e todos os testes passando.

- [ ] **Step 9: Commit**
```bash
git add components/landings/orlando/
git commit -m "refactor(orlando): decompor OrlandoApp.tsx em 6 subcomponentes"
```

---

## Verificação Final

- [ ] **Contar linhas dos arquivos modificados**
```bash
wc -l pages/NPS.tsx components/CallToAction.tsx pages/landings/BrazilPromotionDayLanding.tsx components/landings/beto-carrero/Solution.tsx components/landings/lollapalooza/VenueMap.tsx components/landings/orlando/OrlandoApp.tsx
```
Esperado: todos abaixo de 200 linhas.

- [ ] **Typecheck final**
```bash
pnpm typecheck
```

- [ ] **Testes de regressão**
```bash
pnpm test:regression
```

- [ ] **Smoke visual** — abrir `pnpm dev` e navegar por: Home (CTA), `/nps`, `/lollapalooza`, `/beto-carrero`, `/orlando`, `/brazil-promotion-day`. Confirmar que todos os componentes renderizam corretamente.

- [ ] **Fechar issue** — após merge do PR, fechar a issue #481 com referência ao PR.

---

## Notas de Implementação

- **Privacy.tsx** foi excluído intencionalmente — conteúdo legal estático, sem estado nem lógica extraível. Exceção documentada em `rules/security.md`.
- Cada commit é atômico: um componente por vez. Se uma extração gerar erro de tipos que não é óbvio, resolver antes de avançar — não acumular dívida técnica de compilação.
- `DestinationsModal` simplifica levemente o array de destinos usando um padrão unificado. Verificar visualmente se as cores de ícone (especialmente `Sun` que usa `text-fun-dark` vs `Fish/Building2` que usam `text-white`) estão preservadas após a extração.
- Os subcomponentes **não devem** ser exportados como `default` — usar named exports é consistente com o padrão de `lib/` e `utils/` do projeto, e facilita tree-shaking.
