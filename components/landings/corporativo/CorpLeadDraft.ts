import type { LeadDraftPartial } from '@/hooks/useLeadCapture';
import type { FormFields } from './useCorpFormReducer';

export function buildCorporateLeadDraft(form: FormFields): LeadDraftPartial {
    const empresa = form.empresa.trim();
    const cargo = form.cargo.trim();

    return {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        whatsapp: form.whatsapp,
        destination: 'Corporativo',
        empresa: empresa || undefined,
        cargo: cargo || undefined,
        bantSummary: `Lead corporativo captado via landing /corporativo. Empresa: ${empresa || 'Não informado'}. Cargo: ${cargo || 'Não informado'}.`,
    };
}
