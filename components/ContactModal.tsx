import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';
import type { ContactModalOptions } from '../utils/contactForm';
import { pushFormAnalyticsEvent } from '../utils/formAnalytics';
import { FormField } from './forms/FormField';

const FIELD_CLASSNAME =
    'w-full rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none transition-colors placeholder-zinc-400 focus:border-anhanga-action focus-visible:ring-2 focus-visible:ring-anhanga-action';

const ContactModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ContactModalOptions>({});
    const titleId = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousBodyOverflow = useRef<string>('');

    const { fields, setField, canAttemptSubmit, isSubmitting, error, fieldErrors, submitted, lastAction, submit, reset, honeypotProps } =
        useContactForm(options);

    const close = useCallback(() => {
        setIsOpen(false);
        reset();
    }, [reset]);

    const closeRef = useRef(close);
    useEffect(() => { closeRef.current = close; });

    useEffect(() => {
        const handleOpen = (event: Event) => {
            setOptions((event as CustomEvent<ContactModalOptions>).detail ?? {});
            setIsOpen(true);
        };

        window.addEventListener('open-contact-modal', handleOpen);
        return () => window.removeEventListener('open-contact-modal', handleOpen);
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            pushFormAnalyticsEvent({
                event: 'form_view',
                formType: 'contact_modal',
                formId: options.source ?? 'contact-modal',
            });
            previousBodyOverflow.current = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            dialog.showModal();
            firstFieldRef.current?.focus();
        } else if (!isOpen && dialog.open) {
            dialog.close();
            document.body.style.overflow = previousBodyOverflow.current;
        }

        return () => {
            document.body.style.overflow = previousBodyOverflow.current;
        };
    }, [isOpen, options.source]);

    useEffect(() => {
        if (submitted) closeButtonRef.current?.focus();
    }, [submitted]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault();
            closeRef.current();
        };
        const handleClick = (e: MouseEvent) => {
            if (e.target === dialog) closeRef.current();
        };

        dialog.addEventListener('cancel', handleCancel);
        dialog.addEventListener('click', handleClick);
        return () => {
            dialog.removeEventListener('cancel', handleCancel);
            dialog.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 z-50 m-auto p-4 bg-transparent backdrop:bg-black/60 backdrop:backdrop-blur-sm max-w-md w-full"
            aria-labelledby={titleId}
        >
            {isOpen && <div className="relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <p className="mb-1 text-xs font-black uppercase tracking-widest text-anhanga-action">
                            Anhangá Viagens
                        </p>
                        {/*
                          "consultor", não "especialista": a mesma conversa tinha três
                          rótulos (nav "Falar no WhatsApp", CTA "Falar com um consultor",
                          modal "Fale com um especialista") — Jordan não sabia se eram
                          três coisas diferentes. Terminologia unificada em "consultor",
                          a palavra do PRODUCT.md. Ver critique de /consultoria-de-viagem.
                        */}
                        <h2 id={titleId} className="text-lg font-black text-anhanga-dark">
                            Fale com um consultor
                        </h2>
                        {/* Confirma ao visitante que o clique carregou o contexto certo
                            (ex.: a oferta de cruzeiro escolhida). Aditivo: só aparece
                            quando o CTA passa `destination`. */}
                        {options.destination ? (
                            <p className="mt-1.5 text-sm font-semibold text-zinc-500">
                                Sobre: <span className="text-anhanga-dark">{options.destination}</span>
                            </p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-action"
                        aria-label="Fechar"
                    >
                        <X className="size-5" weight="bold" />
                    </button>
                </div>

                {submitted ? (
                    <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
                        <output
                            className="flex flex-col items-center gap-4"
                            aria-live="polite"
                        >
                            <CheckCircle className="size-14 text-green-600" weight="fill" />
                            <p className="font-bold text-zinc-800">Recebemos seu contato!</p>
                            <p className="text-sm text-zinc-500">
                                {lastAction === 'callback'
                                    ? 'Nossa equipe chama você em breve pelo WhatsApp.'
                                    : 'Abrimos o WhatsApp para você continuar com a nossa equipe.'}
                            </p>
                        </output>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={close}
                            className="w-full rounded-xl bg-anhanga-dark py-3 font-bold text-white transition-colors hover:bg-anhanga-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-anhanga-dark focus-visible:ring-offset-2"
                        >
                            Fechar
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void submit('whatsapp');
                        }}
                        className="flex flex-col gap-3 px-6 pb-6"
                        noValidate
                    >
                        {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
                        <input {...honeypotProps} />
                        <FormField
                            inputRef={firstFieldRef}
                            id="contact-firstName"
                            label="Nome *"
                            autoComplete="name"
                            value={fields.firstName}
                            onChange={(value) => setField('firstName', value)}
                            required
                            inputClassName={FIELD_CLASSNAME}
                            placeholder="ex: Maria Silva"
                            error={fieldErrors.firstName}
                        />

                        <FormField
                            id="contact-whatsapp"
                            label="WhatsApp *"
                            type="tel"
                            autoComplete="tel"
                            value={fields.whatsapp}
                            onChange={(value) => setField('whatsapp', value)}
                            required
                            inputClassName={FIELD_CLASSNAME}
                            placeholder="(11) 90000-0000"
                            error={fieldErrors.whatsapp}
                        />

                        <FormField
                            id="contact-email"
                            label="E-mail"
                            type="email"
                            autoComplete="email"
                            value={fields.email}
                            onChange={(value) => setField('email', value)}
                            inputClassName={FIELD_CLASSNAME}
                            placeholder="seu@email.com (opcional)"
                            error={fieldErrors.email}
                        />

                        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <input
                                id="contact-optIn"
                                type="checkbox"
                                checked={fields.emailOptIn}
                                onChange={(event) => setField('emailOptIn', event.target.checked)}
                                className="mt-0.5 size-4 flex-shrink-0 cursor-pointer rounded border-2 border-anhanga-action accent-anhanga-action"
                            />
                            <label htmlFor="contact-optIn" className="cursor-pointer text-xs leading-relaxed text-blue-700">
                                Quero receber novidades, ofertas e dicas de viagem da Anhangá Viagens.
                            </label>
                        </div>

                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Seus dados serão registrados em nosso CRM e usados para entrar em contato via WhatsApp.{' '}
                            <a
                                href="/politica-privacidade/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-zinc-700"
                            >
                                Política de Privacidade
                            </a>.
                        </p>

                        {error ? (
                            <p className="text-xs font-medium text-red-500" role="alert">
                                {error}
                            </p>
                        ) : null}

                        {/*
                          As duas ações usam raízes de verbo distintas ("Abrir" vs. "chamem")
                          e pesos visuais diferentes de propósito: a primária (preenchida,
                          verde WhatsApp) é quem age agora; a secundária (borda, sem
                          preenchimento) é quem prefere que a equipe chame depois. Antes as
                          duas liam como opções gêmeas de mesmo peso ("Chamar no WhatsApp" /
                          "Me chamem no WhatsApp"), causando hesitação no ponto de maior risco
                          do funil — ver critique de /consultoria-de-viagem.
                        */}
                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={!canAttemptSubmit || isSubmitting}
                                // Texto Ardósia, não branco: branco sobre o verde WhatsApp mede
                                // ~2.0:1 (piso WCAG AA: 4.5:1 em text-sm) — mesmo par acessível
                                // dos variants `cta`/`action` do Button (bg saturado + texto
                                // escuro). Ver critique de /consultoria-de-viagem (P1).
                                className="w-full rounded-xl bg-anhanga-whatsapp py-3 text-sm font-black text-anhanga-dark transition duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isSubmitting ? 'Enviando…' : 'Abrir WhatsApp agora'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void submit('callback')}
                                disabled={!canAttemptSubmit || isSubmitting}
                                className="w-full rounded-xl border-2 border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-600 transition-colors hover:border-anhanga-action hover:text-anhanga-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anhanga-action disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isSubmitting ? 'Enviando…' : 'Prefiro que me chamem'}
                            </button>
                        </div>
                    </form>
                )}
            </div>}
        </dialog>
    );
};

export default ContactModal;
