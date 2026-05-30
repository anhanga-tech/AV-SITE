# Landing Page Corporativo — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a B2B corporate landing page at `/corporativo` by adapting the existing Brazil Promotion Day landing, with redirect from `/brazil-promotion-day`.

**Architecture:** Copy the 6 BPD components into a new `components/landings/corporativo/` folder, replace all text/constants with B2B content, add `empresa` and `cargo` form fields, and wire the new page into routing. The existing `useLeadCapture` hook is reused; `destination` is set to `'Corporativo'` since the form has no destination field.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Framer Motion, Phosphor Icons, existing `useLeadCapture` hook

**Spec:** `docs/superpowers/specs/2026-05-28-landing-corporativo-design.md`

---

## Chunk 1: Type system + Constants + Components

### Task 1: Extend LeadFormType

**Files:**
- Modify: `hooks/useLeadCapture.ts:247`

- [ ] **Step 1: Add `'corporate_lead'` to the union type**

In `hooks/useLeadCapture.ts`, line 247, change:

```typescript
export type LeadFormType = 'ai_chatbot_lead' | 'event_lead';
```

to:

```typescript
export type LeadFormType = 'ai_chatbot_lead' | 'event_lead' | 'corporate_lead';
```

- [ ] **Step 2: Verify typecheck passes**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add hooks/useLeadCapture.ts
git commit -m "feat: add corporate_lead to LeadFormType union"
```

---

### Task 2: Create corporativo constants

**Files:**
- Create: `components/landings/corporativo/constants.ts`

- [ ] **Step 1: Create the constants file**

Create `components/landings/corporativo/constants.ts` based on the BPD pattern at `components/landings/brazil-promotion-day/constants.ts`:

```typescript
import { UsersThree, Sparkle, ClipboardText } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export const WHATSAPP_MESSAGE =
    'Oi! Vi que vocês fazem viagens corporativas. Quero entender como funciona pra minha empresa.';

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
        title: 'Consultor só seu',
        description: 'Uma pessoa que conhece sua empresa e resolve tudo: passagem, hotel, transfer, seguro. Você liga, ela resolve.',
        bg: 'bg-blue-100',
        accent: 'border-blue-200',
        iconColor: 'text-blue-600',
        rotate: '-rotate-1',
    },
    {
        icon: Sparkle,
        title: 'Roteiro feito pra sua equipe',
        description: 'Premiação dos top vendedores, retiro de fim de ano ou reunião fora do escritório. Cada viagem tem um motivo. A gente monta em cima dele.',
        bg: 'bg-emerald-100',
        accent: 'border-emerald-200',
        iconColor: 'text-emerald-600',
        rotate: 'rotate-2',
    },
    {
        icon: ClipboardText,
        title: 'Sem burocracia',
        description: 'Faturamento direto no CNPJ e condições pra grupo. Você cuida da empresa, a gente cuida da viagem.',
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

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/landings/corporativo/constants.ts
git commit -m "feat: add corporativo landing constants"
```

---

### Task 3: Create CorpNav

**Files:**
- Create: `components/landings/corporativo/CorpNav.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdNav.tsx`

- [ ] **Step 1: Create CorpNav**

Copy `BpdNav.tsx` to `CorpNav.tsx`. The only change is the `source` parameter in `openContactModal` and the `data-tracking` attribute:

```tsx
import { WhatsappLogo } from '@phosphor-icons/react';
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';
import { openContactModal } from '../../../utils/contactForm';

export function CorpNav() {
    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50 px-6 py-2">
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
                    onClick={() => openContactModal({ source: 'corporativo' })}
                    className="btn-whatsapp btn-specialist hidden sm:flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                    data-contact-intent
                    data-tracking="header-corporativo"
                >
                    <WhatsappLogo className="size-4" weight="fill" />
                    Falar no WhatsApp
                </button>
            </div>
        </nav>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpNav.tsx
git commit -m "feat: add CorpNav component"
```

---

### Task 4: Create CorpHero

**Files:**
- Create: `components/landings/corporativo/CorpHero.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdHero.tsx`

- [ ] **Step 1: Create CorpHero**

Copy `BpdHero.tsx` to `CorpHero.tsx`. Replace all text content and tracking attributes. Key changes:
- Badge: "Viagens para Empresas" (icon stays `AirplaneTilt`)
- Headline: "A viagem da sua equipe" / "começa aqui."
- Subtitle: new B2B copy
- Feature pills: Roteiro do Zero, Consultor Só Seu, Faturamento PJ, Grupos e Eventos
- CTA primary text: "Falar no WhatsApp"
- `openContactModal({ source: 'corporativo' })`
- All `data-tracking` attributes use `"corporativo"` instead of `"brazil-promotion-day"`

```tsx
import { m } from 'framer-motion';
import { AirplaneTilt, ArrowRight, WhatsappLogo } from '@phosphor-icons/react';
import { openContactModal } from '../../../utils/contactForm';
import { fadeUp } from './constants';

export function CorpHero() {
    return (
        <section className="relative w-full min-h-[100svh] md:min-h-[720px] flex items-center overflow-hidden">

            {/* Background gradient */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/85 to-blue-900/75" />
                <div
                    className="hidden md:block absolute inset-0 opacity-20"
                    style={{ backgroundImage: "url('/noise.png')" }}
                />
            </div>

            {/* Decorative blobs */}
            <div
                aria-hidden="true"
                className="absolute top-0 right-0 size-[500px] rounded-full bg-blue-500/20 blur-3xl animate-blob"
            />
            <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 size-96 rounded-full bg-brand-yellow/10 blur-3xl animate-blob"
                style={{ animationDelay: '4s' }}
            />

            <div className="container mx-auto px-6 relative z-10 pt-20 pb-24">
                <div className="flex flex-col items-center text-center">

                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        className="inline-block relative mb-6"
                    >
                        <span className="absolute inset-0 bg-brand-yellow/30 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-4 py-1.5 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                            <AirplaneTilt className="size-4" weight="fill" />
                            Viagens para Empresas
                        </span>
                    </m.div>

                    <m.h1
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        className="font-sans font-extrabold text-white leading-[0.9] tracking-tight drop-shadow-lg text-5xl sm:text-6xl md:text-8xl mb-6"
                    >
                        A viagem da sua equipe <br />
                        <span className="text-yellow-300">
                            começa aqui.
                        </span>
                    </m.h1>

                    <m.p
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={2}
                        className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md"
                    >
                        Incentivo, confraternização, evento ou viagem a trabalho.
                        A gente monta o roteiro do zero, você só embarca.
                    </m.p>

                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={3}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button
                            type="button"
                            onClick={() => openContactModal({ source: 'corporativo' })}
                            className="btn-whatsapp btn-specialist flex items-center justify-center gap-3 bg-brand-yellow text-brand-dark px-8 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                            data-contact-intent
                            data-tracking="hero-corporativo"
                        >
                            <WhatsappLogo className="size-6" weight="fill" />
                            Falar no WhatsApp
                        </button>
                        <a
                            href="#contato"
                            className="btn-specialist flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:border-white hover:bg-white/10 transition duration-200"
                        >
                            Prefiro ser contatado
                            <ArrowRight className="size-5" />
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
                            { icon: '✈️', text: 'Roteiro do Zero' },
                            { icon: '🤝', text: 'Consultor Só Seu' },
                            { icon: '🏢', text: 'Faturamento PJ' },
                            { icon: '👥', text: 'Grupos e Eventos' },
                        ].map((feat) => (
                            <m.div
                                key={feat.text}
                                variants={{
                                    hidden: { opacity: 0, y: 16, scale: 0.9 },
                                    visible: {
                                        opacity: 1, y: 0, scale: 1,
                                        transition: { type: 'spring', stiffness: 400, damping: 20 },
                                    },
                                }}
                                className="flex items-center gap-2 text-white/90 font-bold text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition duration-300 cursor-default"
                            >
                                <span>{feat.icon}</span>
                                {feat.text}
                            </m.div>
                        ))}
                    </m.div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
                <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="fill-brand-surface"
                    />
                </svg>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpHero.tsx
git commit -m "feat: add CorpHero component with B2B copy"
```

---

### Task 5: Create CorpPillars

**Files:**
- Create: `components/landings/corporativo/CorpPillars.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdPillars.tsx`

- [ ] **Step 1: Create CorpPillars**

Copy `BpdPillars.tsx` to `CorpPillars.tsx`. Changes:
- Section title: "Por que empresas escolhem a Anhangá"
- Import from local `./constants` (same pattern, new text in PILLARS array)
- All other visual code is identical

```tsx
import { m } from 'framer-motion';
import { Sparkle, ArrowRight } from '@phosphor-icons/react';
import { PILLARS, fadeUp } from './constants';

export function CorpPillars() {
    return (
        <section className="py-24 bg-brand-surface relative overflow-hidden">

            <div
                className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
            />

            <div className="container mx-auto px-6 relative z-10">

                <m.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    custom={0}
                    className="text-center mb-16"
                >
                    <div className="inline-block relative mb-4">
                        <span className="absolute inset-0 bg-blue-100 transform -skew-x-12 rounded-lg" />
                        <span className="relative px-3 py-1 text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                            <Sparkle className="size-4" weight="fill" /> O Jeito Anhangá
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight">
                        Por que empresas <br />
                        <span className="text-brand-cyan">
                            escolhem a Anhangá.
                        </span>
                    </h2>
                </m.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {PILLARS.map((item, idx) => {
                        const Icon = item.icon;
                        const rotateVal = parseInt(item.rotate.replace(/rotate-|-/g, ''), 10) || 0;
                        const sign = item.rotate.startsWith('-') ? -1 : 1;

                        return (
                            <m.div
                                key={item.title}
                                className={`relative p-8 rounded-[2.5rem] bg-white border-[3px] ${item.accent} shadow-[8px_8px_0px_rgba(0,0,0,0.05)] flex flex-col h-full group`}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                custom={idx + 1}
                                whileHover={{
                                    scale: 1.03,
                                    rotate: 0,
                                    y: -8,
                                    boxShadow: '14px 14px 0px rgba(0,0,0,0.05)',
                                    zIndex: 10,
                                    transition: { type: 'spring', stiffness: 350, damping: 18 },
                                }}
                                style={{ rotate: `${sign * rotateVal}deg` }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-50/90 backdrop-blur-sm border-l-2 border-r-2 border-white/40 rotate-1 shadow-sm z-20 opacity-90" />

                                <m.div
                                    className={`size-16 rounded-2xl ${item.bg} border-2 ${item.accent} flex items-center justify-center mb-6 shadow-sm`}
                                    whileHover={{ scale: 1.1, rotate: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                                >
                                    <Icon className={`size-8 ${item.iconColor}`} weight="fill" />
                                </m.div>

                                <h3 className="text-xl font-extrabold text-zinc-900 mb-3 leading-tight group-hover:text-brand-cyan transition-colors duration-300">
                                    {item.title}
                                </h3>
                                <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                                    {item.description}
                                </p>

                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition duration-300 translate-x-4 group-hover:translate-x-0">
                                    <ArrowRight className={`size-5 ${item.iconColor}`} />
                                </div>
                            </m.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpPillars.tsx
git commit -m "feat: add CorpPillars component"
```

---

### Task 6: Create CorpWhatsAppBand

**Files:**
- Create: `components/landings/corporativo/CorpWhatsAppBand.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdWhatsAppBand.tsx`

- [ ] **Step 1: Create CorpWhatsAppBand**

Copy `BpdWhatsAppBand.tsx`. Changes:
- Subtitle: "Bate-papo rápido"
- Headline: "Quer uma proposta?" / "Chama no WhatsApp."
- `openContactModal({ source: 'corporativo' })`
- `data-tracking="whatsapp-band-corporativo"`

```tsx
import { AirplaneTilt, WhatsappLogo } from '@phosphor-icons/react';
import { openContactModal } from '../../../utils/contactForm';

export function CorpWhatsAppBand() {
    return (
        <section className="py-16 bg-brand-dark relative overflow-hidden">
            <div
                className="absolute top-5 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-white pointer-events-none select-none"
            >
                FLY
            </div>
            <div
                className="absolute bottom-5 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-white pointer-events-none select-none"
            >
                TRAVEL
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-white/5 rounded-[2rem] p-10 border border-white/10">
                    <div>
                        <p className="text-brand-yellow font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                            <AirplaneTilt className="size-4" weight="fill" />
                            Bate-papo rápido
                        </p>
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                            Quer uma proposta? <br />
                            <span className="text-brand-cyan">Chama no WhatsApp.</span>
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => openContactModal({ source: 'corporativo' })}
                        className="btn-whatsapp btn-specialist shrink-0 flex items-center gap-3 bg-brand-yellow text-brand-dark px-10 py-5 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition whitespace-nowrap"
                        data-contact-intent
                        data-tracking="whatsapp-band-corporativo"
                    >
                        <WhatsappLogo className="size-6" weight="fill" />
                        Abrir WhatsApp
                    </button>
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpWhatsAppBand.tsx
git commit -m "feat: add CorpWhatsAppBand component"
```

---

### Task 7: Create CorpContactSection

**Files:**
- Create: `components/landings/corporativo/CorpContactSection.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdContactSection.tsx`

This is the component with the most changes. Key differences from BPD:
- Form fields: replaces `destination` with `empresa` and `cargo`
- `bantSummary`: includes company name and role
- `destination`: hardcoded to `'Corporativo'` (required by `useLeadCapture` validation)
- `formType`: `'corporate_lead'`
- All tracking/text references changed from "brazil-promotion-day" to "corporativo"

- [ ] **Step 1: Create CorpContactSection**

```tsx
import React, { useState, useRef } from 'react';
import { m } from 'framer-motion';
import {
    InstagramLogo,
    FacebookLogo,
    WhatsappLogo,
    CheckCircle,
    MapPin,
    Phone,
    Envelope,
    Sparkle,
    AirplaneTilt,
    PaperPlaneTilt,
    SpinnerGap,
} from '@phosphor-icons/react';
import { useLeadCapture, createLeadEventId } from '../../../hooks/useLeadCapture';
import { useWhatsAppLink } from '../../../utils/whatsapp';
import { WHATSAPP_MESSAGE, SOCIAL_LINKS, fadeUp } from './constants';

export function CorpContactSection() {
    const { submitLead, isSubmitting } = useLeadCapture();
    const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        whatsapp: '',
        empresa: '',
        cargo: '',
    });
    const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const isLocallySubmitting = useRef(false);

    function handleField(field: keyof typeof form) {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
        };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isLocallySubmitting.current) return;
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.whatsapp.trim()) {
            setSubmitState('error');
            setErrorMessage('Preencha todos os campos obrigatórios');
            return;
        }
        isLocallySubmitting.current = true;
        setErrorMessage('');

        try {
            const eventId = createLeadEventId();
            const empresa = form.empresa.trim() || 'Não informado';
            const cargo = form.cargo.trim() || 'Não informado';

            const result = await submitLead(
                {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    whatsapp: form.whatsapp,
                    destination: 'Corporativo',
                    bantSummary: `Lead corporativo captado via landing /corporativo. Empresa: ${empresa}. Cargo: ${cargo}.`,
                },
                { eventId, pushDataLayerEvent: true, formType: 'corporate_lead' },
            );

            if (result.ok) {
                setSubmitState('success');
            } else {
                setSubmitState('error');
                setErrorMessage('error' in result ? result.error : 'Ocorreu um erro ao enviar. Tente novamente.');
                isLocallySubmitting.current = false;
            }
        } catch (err) {
            setSubmitState('error');
            setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
            isLocallySubmitting.current = false;
        }
    }

    return (
        <section id="contato" className="py-24 bg-brand-surface relative overflow-hidden">

            <div
                className="absolute inset-0 z-0 opacity-[0.3]"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}
            />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">

                    {/* Left: contact info */}
                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        custom={0}
                    >
                        <div className="inline-block relative mb-4">
                            <span className="absolute inset-0 bg-emerald-100 transform -skew-x-12 rounded-lg" />
                            <span className="relative px-3 py-1 text-emerald-600 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                <Sparkle className="size-4" weight="fill" /> Fale com a gente
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-brand-dark leading-tight mb-6">
                            Prefere que a gente <br />
                            <span className="text-brand-cyan">
                                entre em contato?
                            </span>
                        </h2>

                        <p className="text-zinc-500 font-medium text-lg leading-relaxed mb-10 max-w-sm">
                            Preencha o formulário e um consultor entra em contato pelo canal que você preferir, sem enrolação.
                        </p>

                        <ul className="space-y-5 mb-10" role="list">
                            {[
                                { icon: Phone, label: '(11) 5283-3309', href: 'tel:+551152833309' },
                                { icon: Envelope, label: 'contato@anhanga.tur.br', href: 'mailto:contato@anhanga.tur.br' },
                                { icon: MapPin, label: 'Av. Dom Pedro I, 773 — Vila Monumento, SP', href: null },
                            ].map(({ icon: Icon, label, href }) => (
                                <li key={label} className="flex items-start gap-4">
                                    <div className="size-10 rounded-xl bg-blue-100 border-2 border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon className="size-5 text-blue-600" weight="fill" />
                                    </div>
                                    {href ? (
                                        <a href={href} className="font-semibold text-zinc-700 hover:text-brand-cyan transition-colors duration-150 pt-1.5">
                                            {label}
                                        </a>
                                    ) : (
                                        <span className="font-semibold text-zinc-700 leading-snug pt-1.5">{label}</span>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Social links */}
                        <div>
                            <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-4">
                                Nos siga nas redes
                            </p>
                            <div className="flex gap-3">
                                {[
                                    { href: SOCIAL_LINKS.instagram, icon: InstagramLogo, label: 'Instagram da Anhangá Viagens' },
                                    { href: SOCIAL_LINKS.facebook, icon: FacebookLogo, label: 'Facebook da Anhangá Viagens' },
                                    { href: whatsappUrl, icon: WhatsappLogo, label: 'WhatsApp da Anhangá Viagens', contact: true },
                                ].map(({ href, icon: Icon, label, contact }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="size-11 rounded-xl bg-white border-2 border-zinc-200 flex items-center justify-center text-zinc-500 hover:border-brand-cyan hover:text-brand-cyan shadow-[2px_2px_0px_rgba(0,0,0,0.05)] hover:shadow-hard-yellow hover:-translate-y-1 transition duration-200"
                                        aria-label={label}
                                        {...(contact ? { 'data-contact-intent': true, 'data-tracking': 'social-whatsapp-corporativo' } : {})}
                                    >
                                        <Icon className="size-5" weight="fill" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </m.div>

                    {/* Right: form */}
                    <m.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        custom={1}
                        className="bg-white rounded-[2rem] border-2 border-zinc-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden"
                    >
                        {submitState === 'success' ? (
                            <div className="flex flex-col items-center text-center p-12" role="status" aria-live="polite">
                                <m.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <CheckCircle className="size-16 text-emerald-500 mb-4" weight="fill" />
                                </m.div>
                                <h3 className="text-2xl font-black text-brand-dark mb-3">
                                    Mensagem recebida!
                                </h3>
                                <p className="text-zinc-500 max-w-xs leading-relaxed mb-8">
                                    Um consultor da Anhangá vai entrar em contato em breve. Fique de olho no WhatsApp ou e-mail.
                                </p>
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-whatsapp btn-specialist flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition"
                                    data-contact-intent
                                    data-tracking="success-corporativo"
                                >
                                    <WhatsappLogo className="size-4" weight="fill" />
                                    Ou fale agora no WhatsApp
                                </a>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                {/* Form header strip */}
                                <div className="flex justify-between items-center px-8 py-5 border-b-2 border-dashed border-zinc-100">
                                    <span className="text-brand-cyan font-black tracking-widest text-sm uppercase flex items-center gap-2">
                                        <AirplaneTilt className="size-4" weight="fill" /> Formulário de Contato
                                    </span>
                                    <span className="text-zinc-400 font-bold text-xs uppercase">Corporativo</span>
                                </div>

                                <div className="p-8 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="firstName" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                                Nome <span className="text-brand-cyan">*</span>
                                            </label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                placeholder="João"
                                                autoComplete="given-name"
                                                value={form.firstName}
                                                onChange={handleField('firstName')}
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                                Sobrenome <span className="text-brand-cyan">*</span>
                                            </label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                placeholder="Silva"
                                                autoComplete="family-name"
                                                value={form.lastName}
                                                onChange={handleField('lastName')}
                                                required
                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            E-mail corporativo <span className="text-brand-cyan">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="joao@suaempresa.com.br"
                                            autoComplete="email"
                                            value={form.email}
                                            onChange={handleField('email')}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="whatsapp" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            WhatsApp <span className="text-brand-cyan">*</span>
                                        </label>
                                        <input
                                            id="whatsapp"
                                            type="tel"
                                            placeholder="(11) 99999-9999"
                                            autoComplete="tel"
                                            value={form.whatsapp}
                                            onChange={handleField('whatsapp')}
                                            required
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="empresa" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                                Empresa
                                            </label>
                                            <input
                                                id="empresa"
                                                type="text"
                                                placeholder="Sua empresa"
                                                autoComplete="organization"
                                                value={form.empresa}
                                                onChange={handleField('empresa')}
                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="cargo" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                                Cargo / Função
                                            </label>
                                            <input
                                                id="cargo"
                                                type="text"
                                                placeholder="Ex: Sócio, RH, Assistente"
                                                autoComplete="organization-title"
                                                value={form.cargo}
                                                onChange={handleField('cargo')}
                                                className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    {submitState === 'error' && errorMessage && (
                                        <p className="text-red-500 text-xs font-medium" role="alert">
                                            {errorMessage}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-3 bg-brand-dark text-white py-4 rounded-xl font-bold text-base shadow-hard-yellow hover:shadow-[2px_2px_0px_theme(colors.brand.yellow)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition disabled:opacity-60 disabled:pointer-events-none"
                                        data-tracking="submit-form-corporativo"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <SpinnerGap className="size-5 animate-spin" weight="bold" />
                                                Enviando…
                                            </>
                                        ) : (
                                            <>
                                                <PaperPlaneTilt className="size-5" weight="fill" />
                                                Quero ser contatado
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-zinc-400 text-center leading-relaxed">
                                        Seus dados são usados apenas para entrar em contato. Não compartilhamos com terceiros.
                                    </p>
                                </div>
                            </form>
                        )}
                    </m.div>
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpContactSection.tsx
git commit -m "feat: add CorpContactSection with empresa/cargo fields"
```

---

### Task 8: Create CorpFooter

**Files:**
- Create: `components/landings/corporativo/CorpFooter.tsx`
- Reference: `components/landings/brazil-promotion-day/BpdFooter.tsx`

- [ ] **Step 1: Create CorpFooter**

Identical to BpdFooter (no text changes needed):

```tsx
import { BRAND_LOGO_BLUE_URL } from '../../../lib/media-assets';

export function CorpFooter() {
    return (
        <footer className="bg-brand-dark text-zinc-300 py-10">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <img
                    src={BRAND_LOGO_BLUE_URL}
                    alt="Anhangá Viagens"
                    width="120"
                    height="62"
                    className="h-8 w-auto object-contain brightness-0 invert"
                />
                <p className="text-xs text-white/50 font-medium text-center">
                    ANHANGA TURISMO LTDA • CNPJ 37.036.732/0001-41
                </p>
                <a
                    href="https://www.anhanga.tur.br/"
                    className="text-xs text-white/50 hover:text-white transition-colors duration-150 font-medium underline underline-offset-2"
                >
                    Ir para o site principal →
                </a>
            </div>
        </footer>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landings/corporativo/CorpFooter.tsx
git commit -m "feat: add CorpFooter component"
```

---

## Chunk 2: Page + Routing + Infra + Tests

### Task 9: Create CorporativoLanding page

**Files:**
- Create: `pages/landings/CorporativoLanding.tsx`

- [ ] **Step 1: Create the page component**

```tsx
import React, { useEffect } from 'react';
import { SEO } from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/schemas/BreadcrumbSchema';
import { CorpNav } from '../../components/landings/corporativo/CorpNav';
import { CorpHero } from '../../components/landings/corporativo/CorpHero';
import { CorpPillars } from '../../components/landings/corporativo/CorpPillars';
import { CorpWhatsAppBand } from '../../components/landings/corporativo/CorpWhatsAppBand';
import { CorpContactSection } from '../../components/landings/corporativo/CorpContactSection';
import { CorpFooter } from '../../components/landings/corporativo/CorpFooter';

const CorporativoLanding: React.FC = () => {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'landing_view',
                campaign: 'corporativo',
                landing_type: 'b2b',
            });
        }
    }, []);

    return (
        <>
            <SEO
                title="Viagens Corporativas | Anhangá Viagens"
                description="Viagens corporativas sob medida para micro e pequenas empresas. Incentivo, confraternização, eventos e viagens a trabalho com atendimento dedicado."
                canonical="https://www.anhanga.tur.br/corporativo/"
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Início', item: 'https://www.anhanga.tur.br/' },
                    { name: 'Corporativo', item: 'https://www.anhanga.tur.br/corporativo/' },
                ]}
            />
            <div className="bg-brand-surface min-h-screen font-sans">
                <CorpNav />
                <CorpHero />
                <CorpPillars />
                <CorpWhatsAppBand />
                <CorpContactSection />
                <CorpFooter />
            </div>
        </>
    );
};

export default CorporativoLanding;
```

- [ ] **Step 2: Commit**

```bash
git add pages/landings/CorporativoLanding.tsx
git commit -m "feat: add CorporativoLanding page"
```

---

### Task 10: Wire up routing in App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add lazy import for CorporativoLanding**

After line 27 (`const BrazilPromotionDayLanding = ...`), add:

```typescript
const CorporativoLanding = lazy(() => import('./pages/landings/CorporativoLanding'));
```

- [ ] **Step 2: Add `/corporativo` route and redirect `/brazil-promotion-day`**

In the `<Routes>` block inside `AppLayout`, find line 81:

```tsx
<Route path="/brazil-promotion-day" element={<BrazilPromotionDayLanding />} />
```

Replace with:

```tsx
<Route path="/corporativo" element={<CorporativoLanding />} />
<Route path="/brazil-promotion-day" element={<Navigate to="/corporativo" replace />} />
```

- [ ] **Step 3: Remove dead BrazilPromotionDayLanding import**

Since `/brazil-promotion-day` now uses `<Navigate>` instead of `<BrazilPromotionDayLanding />`, remove the lazy import on line 27:

```typescript
const BrazilPromotionDayLanding = lazy(() => import('./pages/landings/BrazilPromotionDayLanding'));
```

The BPD component files in `components/landings/brazil-promotion-day/` and `pages/landings/BrazilPromotionDayLanding.tsx` can remain as archive for now but are no longer referenced.

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat: add /corporativo route and redirect /brazil-promotion-day"
```

---

### Task 11: Add host-level 301 redirect

**Files:**
- Modify: `public/_redirects`

- [ ] **Step 1: Add redirect rule**

Add these lines to `public/_redirects` after the Lollapalooza redirects:

```
# Brazil Promotion Day → Corporativo
/brazil-promotion-day    /corporativo    301
/brazil-promotion-day/   /corporativo    301
```

- [ ] **Step 2: Commit**

```bash
git add public/_redirects
git commit -m "feat: add 301 redirect from brazil-promotion-day to corporativo"
```

---

### Task 12: Update site-routes and sitemap

**Files:**
- Modify: `lib/site-routes.js`

- [ ] **Step 1: Replace BPD entry with corporativo**

In `lib/site-routes.js`, find the BPD entry (around line 92-97):

```javascript
  {
    route: '/brazil-promotion-day',
    lastmod: '2026-05-24',
    changefreq: 'monthly',
    priority: '0.5'
  },
```

Replace with:

```javascript
  {
    route: '/corporativo',
    lastmod: '2026-05-29',
    changefreq: 'monthly',
    priority: '0.7'
  },
```

Note: higher priority (0.7 vs 0.5) because this is a permanent landing page, not an event page.

- [ ] **Step 2: Update public/sitemap.xml**

`public/sitemap.xml` is tracked in git. Update it manually: replace the `<url>` block containing `/brazil-promotion-day/` with one containing `/corporativo/` and today's date as `<lastmod>`.

- [ ] **Step 3: Commit**

```bash
git add lib/site-routes.js public/sitemap.xml
git commit -m "chore: update site-routes from brazil-promotion-day to corporativo"
```

---

### Task 13: Update prerender routes test

**Files:**
- Modify: `tests/prerender-routes.test.ts`

- [ ] **Step 1: Update the assertion**

Find line 36:

```javascript
assert.ok(BASE_PRERENDER_ROUTES.includes('/brazil-promotion-day'));
```

Replace with:

```javascript
assert.ok(BASE_PRERENDER_ROUTES.includes('/corporativo'));
```

- [ ] **Step 2: Run test to verify**

Run: `node --test tests/prerender-routes.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/prerender-routes.test.ts
git commit -m "test: update prerender routes assertion for corporativo"
```

---

### Task 14: Create E2E test page object for Corporativo

**Files:**
- Create: `tests/e2e/pages/CorporativoPage.ts`

- [ ] **Step 1: Create the page object**

Based on `tests/e2e/pages/BrazilPromotionDayPage.ts`, adapted for the corporativo form fields:

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class CorporativoPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly whatsappInput: Locator;
  readonly empresaInput: Locator;
  readonly cargoInput: Locator;
  readonly submitBtn: Locator;
  readonly successHeading: Locator;
  readonly errorAlert: Locator;
  readonly whatsappCta: Locator;
  readonly contactAnchor: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.emailInput = page.locator('#email');
    this.whatsappInput = page.locator('#whatsapp');
    this.empresaInput = page.locator('#empresa');
    this.cargoInput = page.locator('#cargo');
    this.submitBtn = page.locator('button[type="submit"]');
    this.successHeading = page.locator('h3:has-text("Mensagem recebida!")');
    this.errorAlert = page.locator('p[role="alert"]');
    this.whatsappCta = page.locator('a[data-contact-intent]').first();
    this.contactAnchor = page.locator('a[href="#contato"]');
  }

  async goto() {
    await this.page.goto('/corporativo');
  }

  async fillForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    whatsapp?: string;
    empresa?: string;
    cargo?: string;
  }) {
    if (data.firstName) await this.firstNameInput.fill(data.firstName);
    if (data.lastName) await this.lastNameInput.fill(data.lastName);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.whatsapp) await this.whatsappInput.fill(data.whatsapp);
    if (data.empresa) await this.empresaInput.fill(data.empresa);
    if (data.cargo) await this.cargoInput.fill(data.cargo);
  }

  async submit() {
    await this.submitBtn.click();
  }

  async expectSuccess() {
    await expect(this.successHeading).toBeVisible();
  }

  async expectError(message?: string) {
    await expect(this.errorAlert).toBeVisible();
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/pages/CorporativoPage.ts
git commit -m "test: add CorporativoPage page object for E2E tests"
```

---

### Task 15: Create E2E tests for corporativo landing

**Files:**
- Create: `tests/e2e/corporativo.spec.ts`

- [ ] **Step 1: Create the E2E test file**

```typescript
import { test, expect } from '@playwright/test';
import type { SubmitLeadRequest } from '../../types/leadCapture';
import { CorporativoPage } from './pages/CorporativoPage';

test.describe('Corporativo Landing Page', () => {
  test('should push correct dataLayer event on landing view', async ({ page }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer || []).find(
            e => e && typeof e === 'object' && 'event' in e && e.event === 'landing_view'
          ) || null
        )
      )
      .toMatchObject({
        event: 'landing_view',
        campaign: 'corporativo',
        landing_type: 'b2b',
      });
  });

  test('should validate required fields in the lead form', async ({ page }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await landing.submit();

    await landing.expectError('Preencha todos os campos obrigatórios');
  });

  test('should capture corporate lead and trigger dataLayer events', async ({ page }) => {
    const landing = new CorporativoPage(page);
    let submitPayload: SubmitLeadRequest | null = null;

    await page.route('**/api/submit-lead', async route => {
      submitPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, requestId: 'corp-123' }),
      });
    });

    await landing.goto();
    await landing.fillForm({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '(11) 98831-4487',
      empresa: 'Empresa Teste LTDA',
      cargo: 'Sócia',
    });

    await landing.submit();

    await landing.expectSuccess();

    const safePayload = submitPayload as unknown as SubmitLeadRequest;
    expect(safePayload).toMatchObject({
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@empresa.com.br',
      whatsapp: '+5511988314487',
      destination: 'Corporativo',
    });
    expect(safePayload.bantSummary).toContain('Lead corporativo');
    expect(safePayload.bantSummary).toContain('Empresa Teste LTDA');
    expect(safePayload.bantSummary).toContain('Sócia');

    const formSubmissionEvent = await page.evaluate(() =>
      (window.dataLayer || []).find(e => e.event === 'form_submission')
    );
    expect(formSubmissionEvent).toMatchObject({
      event: 'form_submission',
      form_type: 'corporate_lead',
    });
  });

  test('should handle navigation to #contato anchor', async ({ page, isMobile }) => {
    const landing = new CorporativoPage(page);
    await landing.goto();

    await landing.contactAnchor.click();

    await expect(page).toHaveURL(/#contato$/);

    await page.waitForLoadState('networkidle');

    if (isMobile) {
      await expect(page.locator('#contato')).toBeInViewport();
    } else {
      await expect(landing.firstNameInput).toBeInViewport();
    }
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/corporativo.spec.ts
git commit -m "test: add E2E tests for corporativo landing"
```

---

### Task 16: Update BPD E2E test for redirect

**Files:**
- Modify: `tests/e2e/brazil-promotion-day.spec.ts`

- [ ] **Step 1: Replace all BPD tests with a single redirect test**

Replace the entire content of `tests/e2e/brazil-promotion-day.spec.ts` with:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Brazil Promotion Day Redirect', () => {
  test('should redirect /brazil-promotion-day to /corporativo', async ({ page }) => {
    await page.goto('/brazil-promotion-day');
    await expect(page).toHaveURL(/\/corporativo$/);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/brazil-promotion-day.spec.ts
git commit -m "test: update BPD E2E test to verify redirect to corporativo"
```

---

### Task 17: Final verification

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 2: Run unit/regression tests**

Run: `pnpm test:regression`
Expected: all pass (including updated prerender routes test)

- [ ] **Step 3: Run dev server and manually verify**

Run: `pnpm dev`

Verify in browser:
1. `http://localhost:3000/corporativo` loads the new landing page
2. Hero shows "A viagem da sua equipe / começa aqui."
3. Pillars show 3 corporate cards
4. Form has Empresa and Cargo fields
5. `http://localhost:3000/brazil-promotion-day` redirects to `/corporativo`

- [ ] **Step 4: Run E2E tests (if Playwright is configured)**

Run: `pnpm test:e2e tests/e2e/corporativo.spec.ts tests/e2e/brazil-promotion-day.spec.ts`
Expected: all pass

- [ ] **Step 5: Final commit if any adjustments were needed**

Only if fixes were required during verification.
