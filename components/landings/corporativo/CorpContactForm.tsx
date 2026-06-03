import React, { useState, useRef } from 'react';
import { m } from 'framer-motion';
import {
    WhatsappLogo,
    CheckCircle,
    AirplaneTilt,
    PaperPlaneTilt,
    SpinnerGap,
    Check,
} from '@phosphor-icons/react';
import { useLeadCapture, createLeadEventId } from '@/hooks/useLeadCapture';
import { normalizeWhatsappNumber } from '@/lib/lead-logic';
import { fadeUp } from './constants';

interface CorpContactFormProps {
    whatsappUrl: string;
}

export function CorpContactForm({ whatsappUrl }: CorpContactFormProps) {
    const { submitLead, isSubmitting } = useLeadCapture();

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
    const [acceptedLGPD, setAcceptedLGPD] = useState(false);
    const isLocallySubmitting = useRef(false);

    const lgpdError = submitState === 'error' && !acceptedLGPD ? 'Aceite obrigatório' : '';

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email.trim())) {
            setSubmitState('error');
            setErrorMessage('Insira um e-mail corporativo válido');
            return;
        }
        if (!normalizeWhatsappNumber(form.whatsapp)) {
            setSubmitState('error');
            setErrorMessage('Insira um número de WhatsApp válido');
            return;
        }
        if (!acceptedLGPD) {
            setSubmitState('error');
            setErrorMessage('Você deve aceitar os termos para continuar.');
            return;
        }
        isLocallySubmitting.current = true;
        setErrorMessage('');

        try {
            const eventId = createLeadEventId();
            const empresa = form.empresa.trim() || 'Não informado';
            const cargo = form.cargo.trim() || 'Não informado';

            const sfPromise = fetch('/api/submit-lead-sf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    whatsapp: form.whatsapp,
                    empresa: form.empresa,
                    cargo: form.cargo,
                    leadSource: 'Corporativo',
                }),
            }).catch(() => {});

            const n8nPromise = submitLead(
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

            const [, n8nResult] = await Promise.all([sfPromise, n8nPromise]);

            if (n8nResult.ok) {
                setSubmitState('success');
            } else {
                setSubmitState('error');
                setErrorMessage('error' in n8nResult ? n8nResult.error : 'Ocorreu um erro ao enviar. Tente novamente.');
                isLocallySubmitting.current = false;
            }
        } catch (err) {
            setSubmitState('error');
            setErrorMessage('Ocorreu um erro inesperado. Tente novamente.');
            isLocallySubmitting.current = false;
        }
    }

    return (
        <m.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            custom={1}
            className="bg-white rounded-[2rem] border-2 border-zinc-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden"
        >
            {submitState === 'success' ? (
                <output className="flex flex-col items-center text-center p-8 sm:p-12" aria-live="polite">
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
                </output>
            ) : (
                <form onSubmit={handleSubmit} noValidate>
                    <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b-2 border-dashed border-zinc-100 gap-4">
                        <span className="text-brand-cyan font-black tracking-widest text-xs sm:text-sm uppercase flex items-center gap-2 min-w-0">
                            <AirplaneTilt className="size-4 shrink-0" weight="fill" /> Contato
                        </span>
                        <span className="text-zinc-400 font-bold text-xs uppercase shrink-0">Corporativo</span>
                    </div>

                    <div className="p-6 sm:p-8 space-y-5">
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

                        <div className="flex flex-col gap-1">
                            <label htmlFor="lgpd-corp" className="flex items-start gap-3 cursor-pointer group">
                                <span className="relative flex items-center mt-0.5">
                                    <input
                                        id="lgpd-corp"
                                        type="checkbox"
                                        checked={acceptedLGPD}
                                        onChange={(e) => {
                                            setAcceptedLGPD(e.target.checked);
                                            if (e.target.checked && errorMessage === 'Você deve aceitar os termos para continuar.') {
                                                setErrorMessage('');
                                                setSubmitState('idle');
                                            }
                                        }}
                                        className="peer size-4 cursor-pointer appearance-none rounded border-2 border-zinc-300 bg-white checked:bg-brand-cyan checked:border-brand-cyan transition focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
                                    />
                                    <Check className="absolute size-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" weight="bold" />
                                </span>
                                <span className="text-xs text-zinc-500 leading-tight">
                                    Aceito receber comunicações e autorizo o tratamento dos meus dados conforme a{' '}
                                    <a
                                        href="https://www.anhanga.tur.br/politica-privacidade/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-brand-cyan"
                                    >
                                        Política de Privacidade
                                    </a>
                                    .
                                </span>
                            </label>
                            {lgpdError && (
                                <span className="text-[10px] text-red-500 font-bold ml-7 uppercase">
                                    {lgpdError}
                                </span>
                            )}
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
                    </div>
                </form>
            )}
        </m.div>
    );
}
