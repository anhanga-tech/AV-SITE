import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LeadForm, TravelerProfile } from '../../../data/quiz';
import type { HoneypotProps } from '../../../hooks/useAntiBot';
import { pushFormAnalyticsEvent } from '../../../utils/formAnalytics';
import { isFieldCompleteForAnalytics, isValidEmail } from '../../../lib/form-v1-validation';

interface PreLeadScreenProps {
    profile: TravelerProfile;
    onSubmit: (form: LeadForm) => void;
    onBack: () => void;
    isSubmitting: boolean;
    /** Valores vindos da URL (ex.: ?nome=&email=) para pré-preencher o form.
     *  `aceite` fica de fora de propósito: o opt-in de newsletter precisa de
     *  marcação explícita do usuário e não é presumido a partir do link. */
    initialValues?: Partial<LeadForm>;
    /** Props do input honeypot (anti-bot); ver hooks/useAntiBot. */
    honeypotProps?: HoneypotProps;
}

export function PreLeadScreen({ profile, onSubmit, onBack, isSubmitting, initialValues, honeypotProps }: PreLeadScreenProps) {
    const [form, setForm] = useState<LeadForm>(() => ({
        nome: initialValues?.nome ?? '',
        sobrenome: initialValues?.sobrenome ?? '',
        email: initialValues?.email ?? '',
        aceite: false,
    }));
    const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});
    const startedRef = useRef(false);
    const completedFields = useRef<Set<string> | null>(null);

    useEffect(() => {
        pushFormAnalyticsEvent({
            event: 'form_view',
            formType: 'quiz_lead',
            formId: 'quiz-anhanga',
            destination: profile.name,
        });
    }, [profile.name]);

    function trackField(fieldName: 'name' | 'email' | 'marketingOptIn', value: string | boolean) {
        if (!startedRef.current) {
            startedRef.current = true;
            pushFormAnalyticsEvent({
                event: 'form_start',
                formType: 'quiz_lead',
                formId: 'quiz-anhanga',
                destination: profile.name,
            });
        }

        const completed = isFieldCompleteForAnalytics(fieldName === 'name' ? 'firstName' : fieldName, value);
        const trackedFields = completedFields.current ?? (completedFields.current = new Set());
        if (completed && !trackedFields.has(fieldName)) {
            trackedFields.add(fieldName);
            pushFormAnalyticsEvent({
                event: 'field_complete',
                formType: 'quiz_lead',
                formId: 'quiz-anhanga',
                fieldName,
                destination: profile.name,
            });
        }
    }

    function update<K extends keyof LeadForm>(k: K, v: LeadForm[K]) {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
        if (k === 'nome') trackField('name', String(v));
        if (k === 'email') trackField('email', String(v));
        if (k === 'aceite') trackField('marketingOptIn', Boolean(v));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        pushFormAnalyticsEvent({
            event: 'submit_attempt',
            formType: 'quiz_lead',
            formId: 'quiz-anhanga',
            destination: profile.name,
        });
        const errs: typeof errors = {};
        if (!form.nome.trim()) errs.nome = 'Conta pra gente seu nome';
        if (!isValidEmail(form.email)) errs.email = 'E-mail inválido';
        if (Object.keys(errs).length) {
            setErrors(errs);
            pushFormAnalyticsEvent({
                event: 'field_error',
                formType: 'quiz_lead',
                formId: 'quiz-anhanga',
                errorType: errs.email ? 'email' : 'required',
                fieldName: errs.email ? 'email' : 'name',
                destination: profile.name,
            });
            return;
        }
        onSubmit(form);
    }

    return (
        <div className="quiz-screen quiz-screen-lead">
            <div className="quiz-q-top">
                <button type="button" className="quiz-q-back" onClick={onBack} aria-label="Voltar">← voltar</button>
                <span className="quiz-q-step">Último passo!</span>
            </div>

            <div className="quiz-lead-card">
                <span className="quiz-stamp-lead">PRONTO</span>

                <div className={`quiz-lead-preview quiz-lead-preview--${profile.color}`} aria-hidden="true">
                    <div className="quiz-lead-preview-orbit">
                        <span className="quiz-lead-preview-icon">{profile.icon}</span>
                    </div>
                    <div className="quiz-lead-preview-copy">
                        <span className="quiz-lead-preview-kicker">perfil calculado</span>
                        <strong>Resultado reservado</strong>
                        <span className="quiz-lead-preview-line" />
                    </div>
                </div>

                <h2 className="quiz-lead-title">Seu perfil está pronto.</h2>
                <p className="quiz-lead-sub">
                    Seu perfil, destino principal e três ideias para sonhar já estão separados.
                    Deixe seu e-mail para guardar o resultado e abrir tudo agora.
                </p>

                <form className="quiz-lead-form" onSubmit={submit}>
                    {/* Honeypot: hidden from humans, blind form-fillers populate it. */}
                    {honeypotProps && <input {...honeypotProps} />}
                    <div className="quiz-field">
                        <label htmlFor="quiz-nome">Como podemos te chamar?</label>
                        <input
                            id="quiz-nome"
                            type="text"
                            placeholder="Seu nome"
                            value={form.nome}
                            onChange={(e) => update('nome', e.target.value)}
                            className={errors.nome ? 'has-error' : ''}
                            autoComplete="given-name"
                        />
                        {errors.nome && <span className="quiz-err">{errors.nome}</span>}
                    </div>

                    <div className="quiz-field">
                        <label htmlFor="quiz-email">E-mail</label>
                        <input
                            id="quiz-email"
                            type="email"
                            placeholder="voce@email.com"
                            value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            className={errors.email ? 'has-error' : ''}
                            autoComplete="email"
                        />
                        {errors.email && <span className="quiz-err">{errors.email}</span>}
                    </div>

                    <label className="quiz-check">
                        <input
                            type="checkbox"
                            checked={form.aceite}
                            onChange={(e) => update('aceite', e.target.checked)}
                        />
                        <span className="quiz-check-box" aria-hidden="true" />
                        <span className="quiz-check-label">
                            Quero receber novidades, ofertas e dicas de viagem da Anhangá Viagens.
                        </span>
                    </label>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                        Ao revelar seu perfil, seus dados serão registrados em nosso CRM para guardar seu resultado
                        e permitir atendimento comercial por e-mail. O WhatsApp é opcional na próxima etapa.{' '}
                        <Link to="/politica-privacidade/" target="_blank" rel="noopener noreferrer"
                            className="underline hover:text-zinc-700">
                            Política de Privacidade
                        </Link>.
                    </p>

                    <button type="submit" className="quiz-btn quiz-btn-primary quiz-btn-lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Revelar meu perfil'}
                        <span className="quiz-arrow">→</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
