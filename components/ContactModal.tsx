import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';
import type { ContactModalOptions } from '../utils/contactForm';

const ContactModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ContactModalOptions>({});
    const titleId = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousBodyOverflow = useRef<string>('');

    const { fields, setField, isValid, isSubmitting, error, submitted, submit, reset } =
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
            previousBodyOverflow.current = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            dialog.showModal();
            firstFieldRef.current?.focus();
        } else if (!isOpen && dialog.open) {
            dialog.close();
            document.body.style.overflow = previousBodyOverflow.current;
        }
    }, [isOpen]);

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
            <div className="relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <p className="mb-1 text-xs font-black uppercase tracking-widest text-brand-vibrant">
                            Anhangá Viagens
                        </p>
                        <h2 id={titleId} className="text-lg font-black text-brand-dark">
                            Fale com um especialista
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
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
                                Nossa equipe entra em contato em breve pelo WhatsApp.
                            </p>
                        </output>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={close}
                            className="w-full rounded-xl bg-brand-dark py-3 font-bold text-white transition-colors hover:bg-brand-vibrant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
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
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label htmlFor="contact-firstName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Nome *
                                </label>
                                <input
                                    ref={firstFieldRef}
                                    id="contact-firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    value={fields.firstName}
                                    onChange={(event) => setField('firstName', event.target.value)}
                                    required
                                    className="w-full rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none transition-colors placeholder-zinc-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                    placeholder="ex: Maria"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="contact-lastName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Sobrenome
                                </label>
                                <input
                                    id="contact-lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    value={fields.lastName}
                                    onChange={(event) => setField('lastName', event.target.value)}
                                    className="w-full rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none transition-colors placeholder-zinc-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                    placeholder="ex: Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="contact-whatsapp" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                                WhatsApp *
                            </label>
                            <input
                                id="contact-whatsapp"
                                type="tel"
                                autoComplete="tel"
                                value={fields.whatsapp}
                                onChange={(event) => setField('whatsapp', event.target.value)}
                                required
                                className="w-full rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none transition-colors placeholder-zinc-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                placeholder="+55 (11) 9 0000-0000"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                                E-mail
                            </label>
                            <input
                                id="contact-email"
                                type="email"
                                autoComplete="email"
                                value={fields.email}
                                onChange={(event) => setField('email', event.target.value)}
                                className="w-full rounded-xl border-2 border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none transition-colors placeholder-zinc-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                placeholder="seu@email.com (opcional)"
                            />
                        </div>

                        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <input
                                id="contact-optIn"
                                type="checkbox"
                                checked={fields.emailOptIn}
                                onChange={(event) => setField('emailOptIn', event.target.checked)}
                                className="mt-0.5 size-4 flex-shrink-0 cursor-pointer rounded border-2 border-brand-vibrant accent-brand-vibrant"
                            />
                            <label htmlFor="contact-optIn" className="cursor-pointer text-xs leading-relaxed text-blue-700">
                                Quero receber novidades e ofertas de viagem por e-mail.{' '}
                                <a
                                    href="/politica-privacidade/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-blue-900"
                                >
                                    Política de Privacidade
                                </a>
                            </label>
                        </div>

                        {error ? (
                            <p className="text-xs font-medium text-red-500" role="alert">
                                {error}
                            </p>
                        ) : null}

                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="submit"
                                disabled={!isValid || isSubmitting}
                                className="w-full rounded-xl bg-[#25D366] py-3 text-sm font-black text-white transition-colors hover:bg-[#1fba59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isSubmitting ? 'Enviando…' : 'Chamar no WhatsApp'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void submit('callback')}
                                disabled={!isValid || isSubmitting}
                                className="w-full rounded-xl bg-brand-dark py-3 text-sm font-black text-white transition-colors hover:bg-brand-vibrant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {isSubmitting ? 'Enviando…' : 'Me chamem no WhatsApp'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </dialog>
    );
};

export default ContactModal;
