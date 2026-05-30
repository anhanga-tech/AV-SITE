import React, { useState, useRef } from 'react';
import { m } from 'framer-motion';
import {
    WhatsappLogo,
    CheckCircle,
    AirplaneTilt,
    PaperPlaneTilt,
    SpinnerGap,
} from '@phosphor-icons/react';
import { useLeadCapture, createLeadEventId } from '../../../hooks/useLeadCapture';
import { useWhatsAppLink } from '../../../utils/whatsapp';
import { WHATSAPP_MESSAGE, fadeUp } from './constants';
import { BpdContactInfo } from './BpdContactInfo';

export function BpdContactSection() {
    const { submitLead, isSubmitting } = useLeadCapture();
    const whatsappUrl = useWhatsAppLink(WHATSAPP_MESSAGE, { appendTrackingRef: true });

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        whatsapp: '',
        destination: '',
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
            const destination = form.destination.trim() || 'A definir';

            const result = await submitLead(
                {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    whatsapp: form.whatsapp,
                    destination,
                    bantSummary: `Lead captado via QR Code — Brazil Promotion Day 2026. Destino de interesse: ${destination}.`,
                },
                { eventId, pushDataLayerEvent: true, formType: 'event_lead' },
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

                    <BpdContactInfo whatsappUrl={whatsappUrl} />

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
                            <output className="flex flex-col items-center text-center p-12" aria-live="polite">
                                <m.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <CheckCircle className="size-16 text-emerald-500 mb-4" weight="fill" />
                                </m.div>
                                <h3 className="text-2xl font-black text-brand-dark mb-3">
                                    Mensagem recebida! 🎉
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
                                    data-tracking="success-brazil-promotion-day"
                                >
                                    <WhatsappLogo className="size-4" weight="fill" />
                                    Ou fale agora no WhatsApp →
                                </a>
                            </output>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="flex justify-between items-center px-8 py-5 border-b-2 border-dashed border-zinc-100">
                                    <span className="text-brand-cyan font-black tracking-widest text-sm uppercase flex items-center gap-2">
                                        <AirplaneTilt className="size-4" weight="fill" /> Formulário de Contato
                                    </span>
                                    <span className="text-zinc-400 font-bold text-xs uppercase">Brazil Promotion Day</span>
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
                                            E-mail <span className="text-brand-cyan">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="joao@empresa.com.br"
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

                                    <div>
                                        <label htmlFor="destination" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            Destino de interesse
                                        </label>
                                        <input
                                            id="destination"
                                            type="text"
                                            placeholder="Ex: Orlando, Europa, Nordeste…"
                                            autoComplete="off"
                                            value={form.destination}
                                            onChange={handleField('destination')}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-400"
                                        />
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
                                        data-tracking="submit-form-brazil-promotion-day"
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
