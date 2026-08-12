import React from 'react';
import type { ErrorField, FormFields } from './useCorpFormReducer';

interface CorpFormFieldsProps {
    form: FormFields;
    onField: (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => void;
    errorField?: ErrorField;
    errorMessage?: string;
}

const INPUT_CLASS =
    'w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-500';

function fieldClass(hasError: boolean): string {
    return `${INPUT_CLASS} ${hasError ? 'border-red-400' : 'border-zinc-200'}`;
}

function FieldError({ id, show, message }: { id: string; show: boolean; message?: string }) {
    if (!show || !message) return null;
    return <span id={id} className="mt-1 block text-xs font-semibold text-red-500" role="alert">{message}</span>;
}

export function CorpFormFields({ form, onField, errorField, errorMessage }: CorpFormFieldsProps) {
    const isError = (field: keyof FormFields) => errorField === field;

    return (
        <>
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
                        onChange={onField('firstName')}
                        required
                        aria-invalid={isError('firstName') || undefined}
                        aria-describedby={isError('firstName') ? 'firstName-error' : undefined}
                        className={fieldClass(isError('firstName'))}
                    />
                    <FieldError id="firstName-error" show={isError('firstName')} message={errorMessage} />
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
                        onChange={onField('lastName')}
                        required
                        aria-invalid={isError('lastName') || undefined}
                        aria-describedby={isError('lastName') ? 'lastName-error' : undefined}
                        className={fieldClass(isError('lastName'))}
                    />
                    <FieldError id="lastName-error" show={isError('lastName')} message={errorMessage} />
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    E-mail profissional <span className="text-brand-cyan">*</span>
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="joao@suaempresa.com.br"
                    autoComplete="email"
                    value={form.email}
                    onChange={onField('email')}
                    required
                    aria-invalid={isError('email') || undefined}
                    aria-describedby={isError('email') ? 'email-error' : undefined}
                    className={fieldClass(isError('email'))}
                />
                <FieldError id="email-error" show={isError('email')} message={errorMessage} />
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
                    onChange={onField('whatsapp')}
                    required
                    aria-invalid={isError('whatsapp') || undefined}
                    aria-describedby={isError('whatsapp') ? 'whatsapp-error' : undefined}
                    className={fieldClass(isError('whatsapp'))}
                />
                <FieldError id="whatsapp-error" show={isError('whatsapp')} message={errorMessage} />
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
                        onChange={onField('empresa')}
                        className={fieldClass(false)}
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
                        onChange={onField('cargo')}
                        className={fieldClass(false)}
                    />
                </div>
            </div>
        </>
    );
}
