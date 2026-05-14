import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle, X } from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';
import type { ContactModalOptions } from '../utils/contactForm';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const ContactModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ContactModalOptions>({});
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);
    const previousBodyOverflow = useRef<string>('');

    const { fields, setField, isValid, isSubmitting, error, submitted, submit, reset } =
        useContactForm(options);

    const close = useCallback(() => {
        setIsOpen(false);
        reset();
        triggerRef.current?.focus();
    }, [reset]);

    useEffect(() => {
        const handleOpen = (event: Event) => {
            triggerRef.current = document.activeElement as HTMLElement | null;
            setOptions((event as CustomEvent<ContactModalOptions>).detail ?? {});
            setIsOpen(true);
        };

        window.addEventListener('open-contact-modal', handleOpen);
        return () => window.removeEventListener('open-contact-modal', handleOpen);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        firstFieldRef.current?.focus();
        previousBodyOverflow.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousBodyOverflow.current;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusable = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            ).filter((element) => element.offsetParent !== null);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
                return;
            }

            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [close, isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={close}
                aria-label="Fechar formulário"
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
            >
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
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                        aria-label="Fechar"
                    >
                        <X className="size-5" weight="bold" />
                    </button>
                </div>

                {submitted ? (
                    <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
                        <div
                            className="flex flex-col items-center gap-4"
                            role="status"
                            aria-live="polite"
                        >
                            <CheckCircle className="size-14 text-green-600" weight="fill" />
                            <p className="font-bold text-gray-800">Recebemos seu contato!</p>
                            <p className="text-sm text-gray-500">
                                Nossa equipe entra em contato em breve pelo WhatsApp.
                            </p>
                        </div>
                        <button
                            type="button"
                            autoFocus
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
                                <label htmlFor="contact-firstName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
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
                                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors placeholder-gray-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                    placeholder="ex: Maria"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="contact-lastName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Sobrenome
                                </label>
                                <input
                                    id="contact-lastName"
                                    type="text"
                                    autoComplete="family-name"
                                    value={fields.lastName}
                                    onChange={(event) => setField('lastName', event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors placeholder-gray-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                    placeholder="ex: Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="contact-whatsapp" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                WhatsApp *
                            </label>
                            <input
                                id="contact-whatsapp"
                                type="tel"
                                autoComplete="tel"
                                value={fields.whatsapp}
                                onChange={(event) => setField('whatsapp', event.target.value)}
                                required
                                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors placeholder-gray-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
                                placeholder="+55 (11) 9 0000-0000"
                            />
                        </div>

                        <div>
                            <label htmlFor="contact-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                E-mail
                            </label>
                            <input
                                id="contact-email"
                                type="email"
                                autoComplete="email"
                                value={fields.email}
                                onChange={(event) => setField('email', event.target.value)}
                                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors placeholder-gray-400 focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan"
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
                                    href="/politica-privacidade"
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
        </div>
    );
};

export default ContactModal;
