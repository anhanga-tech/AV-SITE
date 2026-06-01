const SF_WEB_TO_LEAD_URL = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00Das00000EnTnB';
const SF_ORG_ID = '00Das00000EnTnB';
const SF_RET_URL = 'https://www.anhanga.tur.br/corporativo';
const SF_REQUEST_TIMEOUT_MS = 5000;

export interface SalesforceLeadFields {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    title: string;
    leadSource: string;
}

export async function postWebToLead(fields: SalesforceLeadFields): Promise<{ ok: boolean }> {
    const params = new URLSearchParams();
    params.set('oid', SF_ORG_ID);
    params.set('retURL', SF_RET_URL);
    params.set('first_name', fields.firstName);
    params.set('last_name', fields.lastName);
    params.set('email', fields.email);
    params.set('phone', fields.phone);
    params.set('company', fields.company);
    params.set('title', fields.title);
    params.set('lead_source', fields.leadSource);

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
