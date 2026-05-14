import React, { useEffect, useState } from 'react';
import {
    AirplaneTilt,
    WhatsappLogo,
    CheckCircle,
    SpinnerGap,
} from '@phosphor-icons/react';
import { useContactForm } from '../hooks/useContactForm';
import { CtaTicketStub } from './cta/CtaTicketStub';

type FormState = 'closed' | 'open' | 'submitted';

const CallToActionComponent: React.FC = () => {
    const [formState, setFormState] = useState<FormState>('closed');
    const { fields, setField, isValid, isSubmitting, error, submitted, submit } =
        useContactForm({ source: 'cta-homepage' });

    useEffect(() => {
        if (submitted && formState === 'open') {
            setFormState('submitted');
        }
    }, [formState, submitted]);

    const handleOpenForm = () => setFormState('open');

    return (
        <section id="contato" className="py-24 bg-brand-light relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 text-9xl opacity-[0.03] rotate-12 font-black text-brand-dark">TRAVEL</div>
                <div className="absolute bottom-10 right-10 text-9xl opacity-[0.03] -rotate-12 font-black text-brand-dark">FLY</div>
            </div>

            <div className="container mx-auto px-6 relative z-10">

                {/* TICKET CONTAINER */}
                <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden relative flex flex-col md:flex-row min-h-[500px] md:min-h-[420px]">

                    {/* --- LEFT SIDE: Main Info --- */}
                    <div className="w-full md:w-[70%] p-8 md:p-12 relative flex flex-col justify-between">

                        {/* Header Strip */}
                        <div className="flex justify-between items-center mb-8 border-b-2 border-dashed border-gray-100 pb-4">
                            <div className="flex items-center gap-2 text-brand-cyan font-black tracking-widest text-sm uppercase" title="Estilo Boarding Pass">
                                <AirplaneTilt className="size-5" weight="fill" /> Anhangá Airlines
                                <span className="text-[10px] opacity-40 ml-1 hidden lg:inline">(Boarding Pass)</span>
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
                                    type="button"
                                    onClick={handleOpenForm}
                                    className="btn-specialist flex items-center gap-3 bg-brand-dark text-white text-lg font-bold px-8 py-4 rounded-xl shadow-[4px_4px_0px_#fbbf24] hover:shadow-[2px_2px_0px_#fbbf24] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all self-start"
                                    data-tracking="cta-home-footer"
                                >
                                    Solicitar meu Orçamento
                                </button>
                            </>
                        )}

                        {formState === 'open' && (
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
                                        className="mt-0.5 size-4 rounded border-2 border-brand-vibrant accent-brand-vibrant cursor-pointer flex-shrink-0"
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
                                            <SpinnerGap className="size-4 animate-spin" weight="bold" />
                                        ) : (
                                            <WhatsappLogo className="size-4" weight="fill" />
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
                        )}

                        {formState === 'submitted' && (
                            <div className="flex flex-col gap-3" role="status" aria-live="polite">
                                <p className="flex items-center gap-2 text-green-600 text-sm font-bold">
                                    <CheckCircle className="size-5" weight="fill" />
                                    Recebemos! Nossa equipe entra em contato em breve.
                                </p>
                            </div>
                        )}

                        {/* Top "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 top-[-1.5rem] size-8 bg-brand-light rounded-full z-20"></div>
                        {/* Bottom "Hole" for perforation illusion */}
                        <div className="hidden md:block absolute -right-4 bottom-[-1.5rem] size-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- DIVIDER (Perforation) --- */}
                    <div className="relative w-full h-8 md:w-8 md:h-auto flex items-center justify-center">
                        {/* The Dashed Line */}
                        <div className="w-full h-[2px] md:w-[2px] md:h-[90%] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gray-300"></div>

                        {/* Mobile Holes (Left/Right) */}
                        <div className="md:hidden absolute -left-4 top-1/2 -translate-y-1/2 size-8 bg-brand-light rounded-full z-20"></div>
                        <div className="md:hidden absolute -right-4 top-1/2 -translate-y-1/2 size-8 bg-brand-light rounded-full z-20"></div>
                    </div>

                    {/* --- RIGHT SIDE: Stub / Details --- */}
                    <CtaTicketStub />

                </div>
            </div>
        </section>
    );
};

const CallToAction = React.memo(CallToActionComponent);
CallToAction.displayName = 'CallToAction';

export default CallToAction;
