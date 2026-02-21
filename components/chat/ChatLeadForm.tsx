import React, { useMemo, useState } from 'react';

interface LeadFormValues {
    firstName: string;
    lastName: string;
    email: string;
    consent: boolean;
}

interface ChatLeadFormProps {
    onSubmit: (data: LeadFormValues) => Promise<void> | void;
    isSubmitting: boolean;
    error?: string | null;
    defaultValues?: LeadFormValues;
}

const EMPTY_VALUES: LeadFormValues = {
    firstName: '',
    lastName: '',
    email: '',
    consent: false,
};

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const ChatLeadForm: React.FC<ChatLeadFormProps> = ({
    onSubmit,
    isSubmitting,
    error,
    defaultValues,
}) => {
    const [values, setValues] = useState<LeadFormValues>(defaultValues || EMPTY_VALUES);
    const [localError, setLocalError] = useState<string | null>(null);

    const isFormValid = useMemo(() => {
        return (
            values.firstName.trim().length > 0 &&
            values.lastName.trim().length > 0 &&
            isValidEmail(values.email.trim()) &&
            values.consent
        );
    }, [values]);

    const resolvedError = localError || error || null;

    const updateField = <K extends keyof LeadFormValues>(field: K, value: LeadFormValues[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        setLocalError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLocalError(null);

        const payload: LeadFormValues = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim().toLowerCase(),
            consent: values.consent,
        };

        if (!payload.firstName || !payload.lastName || !isValidEmail(payload.email)) {
            setLocalError('Preencha nome, sobrenome e um e-mail válido.');
            return;
        }

        if (!payload.consent) {
            setLocalError('Você precisa aceitar o termo para continuar.');
            return;
        }

        await onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto rounded-2xl border border-white/40 bg-white/90 backdrop-blur-sm p-4 sm:p-5 text-left animate-fade-in-up">
            <p className="text-sm sm:text-base text-brand-dark font-semibold leading-relaxed mb-3">
                Quase lá! Para enviar seu roteiro personalizado, precisamos de alguns dados:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                    <label htmlFor="lead-first-name" className="block text-xs font-semibold text-gray-700 mb-1">Nome</label>
                    <input
                        id="lead-first-name"
                        type="text"
                        value={values.firstName}
                        onChange={(event) => updateField('firstName', event.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
                        placeholder="Seu nome"
                        autoComplete="given-name"
                    />
                </div>

                <div>
                    <label htmlFor="lead-last-name" className="block text-xs font-semibold text-gray-700 mb-1">Sobrenome</label>
                    <input
                        id="lead-last-name"
                        type="text"
                        value={values.lastName}
                        onChange={(event) => updateField('lastName', event.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
                        placeholder="Seu sobrenome"
                        autoComplete="family-name"
                    />
                </div>
            </div>

            <div className="mb-3">
                <label htmlFor="lead-email" className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                <input
                    id="lead-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
                    placeholder="seu@email.com"
                    autoComplete="email"
                />
            </div>

            <div className="mb-4">
                <label htmlFor="lead-consent" className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer leading-relaxed">
                    <input
                        id="lead-consent"
                        type="checkbox"
                        checked={values.consent}
                        onChange={(event) => updateField('consent', event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-vibrant focus:ring-brand-vibrant"
                    />
                    <span>
                        Concordo em receber contato da Anhangá Viagens sobre minha solicitação.{' '}
                        <a
                            href="/politica-privacidade"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-blue underline hover:opacity-80"
                        >
                            Política de Privacidade
                        </a>
                    </span>
                </label>
            </div>

            {resolvedError && (
                <p className="text-xs text-red-600 mb-3">{resolvedError}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full rounded-xl bg-brand-dark text-white font-semibold py-2.5 px-4 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Enviando...' : 'Continuar para WhatsApp'}
            </button>
        </form>
    );
};

export default ChatLeadForm;
