import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LeadForm, TravelerProfile } from '../../../data/quiz';

interface PreLeadScreenProps {
    profile: TravelerProfile;
    onSubmit: (form: LeadForm) => void;
    onBack: () => void;
    isSubmitting: boolean;
}

export function PreLeadScreen({ profile, onSubmit, onBack, isSubmitting }: PreLeadScreenProps) {
    const [form, setForm] = useState<LeadForm>({ nome: '', sobrenome: '', email: '', aceite: false });
    const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});

    function update<K extends keyof LeadForm>(k: K, v: LeadForm[K]) {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const errs: typeof errors = {};
        if (!form.nome.trim()) errs.nome = 'Conta pra gente seu nome';
        if (!form.sobrenome.trim()) errs.sobrenome = 'E o sobrenome?';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = 'E-mail inválido';
        if (Object.keys(errs).length) { setErrors(errs); return; }
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
                    Deixe um contato para guardar o resultado e abrir tudo agora.
                </p>

                <form className="quiz-lead-form" onSubmit={submit}>
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
                        <label htmlFor="quiz-sobrenome">Sobrenome</label>
                        <input
                            id="quiz-sobrenome"
                            type="text"
                            placeholder="Seu sobrenome"
                            value={form.sobrenome}
                            onChange={(e) => update('sobrenome', e.target.value)}
                            className={errors.sobrenome ? 'has-error' : ''}
                            autoComplete="family-name"
                        />
                        {errors.sobrenome && <span className="quiz-err">{errors.sobrenome}</span>}
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
                        Ao revelar seu perfil, seus dados serão registrados em nosso CRM para atendimento
                        comercial e entraremos em contato via WhatsApp.{' '}
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
