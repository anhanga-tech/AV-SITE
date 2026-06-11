const SF_WEB_TO_LEAD_URL = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Das00000EnTnB';
const SF_ORG_ID = '00Das00000EnTnB';
const SF_RET_URL = 'https://www.anhanga.tur.br';
const SF_REQUEST_TIMEOUT_MS = 5000;

export const SF_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
export type SfUtmKey = (typeof SF_UTM_KEYS)[number];

// IDs dos campos personalizados de Lead no Salesforce (formato 00N...).
// Criar em Setup → Object Manager → Lead → Fields & Relationships (Text 255) e
// preencher aqui com o ID que aparece no gerador de Web-to-Lead ou na URL do campo.
// Enquanto um ID estiver vazio, o UTM correspondente é anexado à description
// para que a atribuição não se perca.
export const SF_UTM_FIELD_IDS: Record<SfUtmKey, string> = {
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
};

export interface SalesforceLeadFields {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    leadSource: string;
    description?: string;
    utms?: Partial<Record<SfUtmKey, string>>;
}

export async function postWebToLead(
    fields: SalesforceLeadFields,
    utmFieldIds: Record<SfUtmKey, string> = SF_UTM_FIELD_IDS,
): Promise<{ ok: boolean }> {
    const params = new URLSearchParams();
    params.set('oid', SF_ORG_ID);
    params.set('retURL', SF_RET_URL);
    params.set('first_name', fields.firstName);
    params.set('last_name', fields.lastName);
    params.set('lead_source', fields.leadSource);

    if (fields.email) params.set('email', fields.email);
    if (fields.phone) params.set('phone', fields.phone);
    if (fields.company) params.set('company', fields.company);
    if (fields.title) params.set('title', fields.title);

    const unmappedUtms: string[] = [];
    for (const key of SF_UTM_KEYS) {
        const value = fields.utms?.[key];
        if (!value) continue;

        const fieldId = utmFieldIds[key];
        if (fieldId) {
            params.set(fieldId, value);
        } else {
            unmappedUtms.push(`${key}=${value}`);
        }
    }

    const description = unmappedUtms.length > 0
        ? [fields.description, `UTMs: ${unmappedUtms.join(' | ')}`].filter(Boolean).join('\n')
        : fields.description;

    if (description) params.set('description', description);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SF_REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(SF_WEB_TO_LEAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            signal: controller.signal,
            redirect: 'manual',
        });

        return { ok: response.status < 400 };
    } catch (error: unknown) {
        if (controller.signal.aborted) {
            const abortError = new Error('Salesforce request timed out');
            abortError.name = 'AbortError';
            throw abortError;
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
