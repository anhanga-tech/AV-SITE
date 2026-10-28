import { useEffect, useRef, useState } from 'react';
import { getWhatsAppLink } from '../../../utils/whatsapp';
import { pushFormAnalyticsEvent } from '../../../utils/formAnalytics';

interface WhatsAppUpgradeProps {
    profileName: string;
    mainDestName: string;
    firstName: string;
    baseWaUrl: string;
    onPhoneSubmit: (phone: string) => void;
}

function maskPhone(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function WhatsAppUpgrade({ profileName, mainDestName, firstName, baseWaUrl, onPhoneSubmit }: WhatsAppUpgradeProps) {
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const doneCtaRef = useRef<HTMLAnchorElement | null>(null);

    const digits = phone.replace(/\D/g, '');
    const isValid = digits.length >= 10;

    // On success, move focus to the next primary action so keyboard and screen
    // reader users land on it without hunting (autoFocus is unreliable on <a>).
    useEffect(() => {
        if (submitted) doneCtaRef.current?.focus();
    }, [submitted]);

    function handleSubmit() {
        if (!isValid || submitted) return;
        pushFormAnalyticsEvent({
            event: 'field_complete',
            formType: 'quiz_lead',
            formId: 'quiz-whatsapp-enrichment',
            fieldName: 'whatsapp',
            destination: mainDestName,
        });
        onPhoneSubmit(phone);
        setSubmitted(true);
    }

    function trackWhatsAppOpened() {
        pushFormAnalyticsEvent({
            event: 'whatsapp_opened',
            formType: 'quiz_lead',
            formId: 'quiz-whatsapp-enrichment',
            destination: mainDestName,
        });
    }

    const waUrl = isValid && submitted
        ? getWhatsAppLink(
            `Oi! Sou ${firstName}. Descobri no Quiz da Anhangá que meu perfil é ${profileName} e meu próximo destino pode ser ${mainDestName}. Bora planejar essa viagem?`,
          )
        : baseWaUrl;

    if (submitted) {
        return (
            <div className="quiz-wa-upgrade quiz-wa-upgrade--done" role="status">
                <p className="quiz-wa-upgrade-done">
                    Perfeito! Agora é só abrir o WhatsApp.
                </p>
                <a
                    ref={doneCtaRef}
                    className="btn-whatsapp btn-specialist quiz-btn quiz-btn-primary quiz-btn-lg"
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackWhatsAppOpened}
                    data-tracking="result-quiz-whatsapp"
                >
                    Montar minha viagem
                    <span className="quiz-arrow">→</span>
                </a>
            </div>
        );
    }

    return (
        <div className="quiz-wa-upgrade">
            <p className="quiz-wa-upgrade-label">
                Quer continuar essa conversa pelo WhatsApp?
            </p>
            <div className="quiz-wa-upgrade-row">
                <input
                    type="tel"
                    className="quiz-wa-input"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    aria-label="Número de WhatsApp (opcional)"
                    aria-describedby="quiz-wa-hint"
                />
                <button
                    type="button"
                    className={`quiz-btn quiz-btn-primary ${isValid ? 'quiz-btn--ready' : ''}`}
                    onClick={handleSubmit}
                    disabled={!isValid}
                    aria-describedby="quiz-wa-hint"
                >
                    Enviar
                </button>
            </div>
            {/* Botão nasce desabilitado até haver DDD + número; o texto é a instrução, não só o estado desabilitado. */}
            <p id="quiz-wa-hint" className="m-0 text-xs text-slate-500" aria-live="polite">
                {isValid ? ' ' : 'Digite o DDD e o número para enviar'}
            </p>
            <a
                className="btn-whatsapp btn-specialist quiz-wa-skip"
                href={baseWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhatsAppOpened}
                data-tracking="result-quiz-skip"
            >
                Pular número e abrir WhatsApp →
            </a>
        </div>
    );
}
