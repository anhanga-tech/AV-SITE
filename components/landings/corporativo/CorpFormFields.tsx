import React from 'react';
import type { FormFields } from './useCorpFormReducer';

interface CorpFormFieldsProps {
    form: FormFields;
    onField: (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const INPUT_CLASS =
    'w-full px-4 py-2.5 rounded-xl border-2 border-zinc-200 text-sm font-medium text-zinc-800 outline-none focus:border-brand-cyan focus-visible:ring-2 focus-visible:ring-brand-cyan transition-colors duration-150 placeholder-zinc-500';

export function CorpFormFields({ form, onField }: CorpFormFieldsProps) {
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
                        className={INPUT_CLASS}
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
                        onChange={onField('lastName')}
                        required
                        className={INPUT_CLASS}
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
                    onChange={onField('email')}
                    required
                    className={INPUT_CLASS}
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
                    onChange={onField('whatsapp')}
                    required
                    className={INPUT_CLASS}
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
                        onChange={onField('empresa')}
                        className={INPUT_CLASS}
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
                        className={INPUT_CLASS}
                    />
                </div>
            </div>
        </>
    );
}
