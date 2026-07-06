import { useReducer, useRef, useCallback } from 'react';
import { isValidEmail, normalizeWhatsappNumber } from '@/lib/lead-logic';

export type FormFields = {
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    empresa: string;
    cargo: string;
};

export type ErrorField = keyof FormFields | 'lgpd';

type IdleState = { phase: 'idle'; form: FormFields; acceptedLGPD: boolean };
type SubmittingState = { phase: 'submitting'; form: FormFields; acceptedLGPD: boolean };
type ErrorState = { phase: 'error'; form: FormFields; acceptedLGPD: boolean; message: string; field?: ErrorField };
type SuccessState = { phase: 'success'; form: FormFields; acceptedLGPD: boolean };

type CorpFormState = IdleState | SubmittingState | ErrorState | SuccessState;

type Action =
    | { type: 'change-field'; field: keyof FormFields; value: string }
    | { type: 'toggle-lgpd'; value: boolean }
    | { type: 'submit-start' }
    | { type: 'submit-error'; message: string; field?: ErrorField }
    | { type: 'submit-success' };

const INITIAL_FORM: FormFields = {
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    empresa: '',
    cargo: '',
};

const INITIAL_STATE: CorpFormState = {
    phase: 'idle',
    form: INITIAL_FORM,
    acceptedLGPD: false,
};

function corpFormReducer(state: CorpFormState, action: Action): CorpFormState {
    switch (action.type) {
        case 'change-field':
            if (state.phase === 'submitting' || state.phase === 'success') return state;
            return {
                ...state,
                form: { ...state.form, [action.field]: action.value },
            } as CorpFormState;

        case 'toggle-lgpd':
            if (state.phase === 'submitting' || state.phase === 'success') return state;
            if (state.phase === 'error' && state.field === 'lgpd' && action.value) {
                return { phase: 'idle', form: state.form, acceptedLGPD: true };
            }
            return { ...state, acceptedLGPD: action.value } as CorpFormState;

        case 'submit-start':
            if (state.phase === 'submitting') return state;
            return { phase: 'submitting', form: state.form, acceptedLGPD: state.acceptedLGPD };

        case 'submit-error':
            return {
                phase: 'error',
                form: state.form,
                acceptedLGPD: state.acceptedLGPD,
                message: action.message,
                field: action.field,
            };

        case 'submit-success':
            return { phase: 'success', form: state.form, acceptedLGPD: state.acceptedLGPD };

        default:
            return state;
    }
}

type ValidationResult =
    | { ok: true }
    | { ok: false; message: string; field: ErrorField };

export function validateCorpForm(form: FormFields, acceptedLGPD: boolean): ValidationResult {
    if (!form.firstName.trim()) {
        return { ok: false, message: 'Informe seu nome.', field: 'firstName' };
    }
    if (!form.lastName.trim()) {
        return { ok: false, message: 'Informe seu sobrenome.', field: 'lastName' };
    }
    if (!form.email.trim()) {
        return { ok: false, message: 'Informe seu e-mail profissional.', field: 'email' };
    }
    if (!form.whatsapp.trim()) {
        return { ok: false, message: 'Informe seu WhatsApp.', field: 'whatsapp' };
    }
    if (!isValidEmail(form.email)) {
        return { ok: false, message: 'Insira um e-mail profissional válido', field: 'email' };
    }
    if (!normalizeWhatsappNumber(form.whatsapp)) {
        return { ok: false, message: 'Insira um número de WhatsApp válido', field: 'whatsapp' };
    }
    if (!acceptedLGPD) {
        return { ok: false, message: 'Você deve aceitar os termos para continuar.', field: 'lgpd' };
    }
    return { ok: true };
}

export function useCorpFormReducer() {
    const [state, dispatch] = useReducer(corpFormReducer, INITIAL_STATE);
    // Synchronous re-entry guard — dispatch is async-batched, so phase
    // may not yet reflect 'submitting' within the same handler tick.
    const isSubmittingRef = useRef(false);

    const handleField = useCallback(
        (field: keyof FormFields) =>
            (e: React.ChangeEvent<HTMLInputElement>) =>
                dispatch({ type: 'change-field', field, value: e.target.value }),
        [],
    );

    const toggleLgpd = useCallback(
        (value: boolean) => dispatch({ type: 'toggle-lgpd', value }),
        [],
    );

    return { state, dispatch, isSubmittingRef, handleField, toggleLgpd };
}
