import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCorpForm } from '../components/landings/corporativo/useCorpFormReducer';
import { buildCorporateLeadDraft } from '../components/landings/corporativo/CorpLeadDraft';
import type { FormFields } from '../components/landings/corporativo/useCorpFormReducer';

const VALID_FORM: FormFields = {
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria@empresa.com.br',
    whatsapp: '(11) 98831-4487',
    empresa: 'Empresa Teste',
    cargo: 'Sócia',
};

describe('validateCorpForm', () => {
    it('should pass with all required fields and LGPD accepted', () => {
        const result = validateCorpForm(VALID_FORM, true);
        assert.deepStrictEqual(result, { ok: true });
    });

    it('should fail when required text fields are empty', () => {
        const result = validateCorpForm({ ...VALID_FORM, firstName: '' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'firstName');
            assert.equal(result.message, 'Informe seu nome.');
        }
    });

    it('should fail for whitespace-only required fields', () => {
        const result = validateCorpForm({ ...VALID_FORM, email: '   ' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'email');
        }
    });

    it('should fail for invalid email format', () => {
        const result = validateCorpForm({ ...VALID_FORM, email: 'not-an-email' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'email');
            assert.equal(result.message, 'Insira um e-mail profissional válido');
        }
    });

    it('should fail for invalid WhatsApp number', () => {
        const result = validateCorpForm({ ...VALID_FORM, whatsapp: '123' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'whatsapp');
            assert.equal(result.message, 'Insira um número de WhatsApp válido');
        }
    });

    it('should fail when LGPD is not accepted', () => {
        const result = validateCorpForm(VALID_FORM, false);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'lgpd');
            assert.equal(result.message, 'Você deve aceitar os termos para continuar.');
        }
    });

    it('should check required fields before email format', () => {
        const result = validateCorpForm({ ...VALID_FORM, firstName: '', email: 'bad' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'firstName');
        }
    });

    it('should check email format before WhatsApp', () => {
        const result = validateCorpForm({ ...VALID_FORM, email: 'bad', whatsapp: '123' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'email');
        }
    });

    it('should check WhatsApp before LGPD', () => {
        const result = validateCorpForm({ ...VALID_FORM, whatsapp: '123' }, false);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'whatsapp');
        }
    });

    it('should accept form without optional empresa and cargo', () => {
        const result = validateCorpForm({ ...VALID_FORM, empresa: '', cargo: '' }, true);
        assert.deepStrictEqual(result, { ok: true });
    });

    it('should build a lead draft with empresa/cargo as structured fields', () => {
        const draft = buildCorporateLeadDraft(VALID_FORM);
        assert.ok(draft, 'Expected draft to be defined');
        assert.equal(draft.destination, 'Corporativo');
        assert.equal(draft.empresa, 'Empresa Teste');
        assert.equal(draft.cargo, 'Sócia');
        assert.ok(draft.bantSummary, 'Expected corporate draft to include bantSummary');
        assert.match(draft.bantSummary, /Empresa: Empresa Teste/);
        assert.match(draft.bantSummary, /Cargo: Sócia/);
    });

    it('should build a lead draft when optional empresa/cargo are missing at runtime', () => {
        const { empresa: _empresa, cargo: _cargo, ...partialForm } = VALID_FORM;
        const draft = buildCorporateLeadDraft(partialForm as FormFields);

        assert.ok(draft, 'Expected draft to be defined');
        assert.equal(draft.destination, 'Corporativo');
        assert.equal(draft.empresa, undefined);
        assert.equal(draft.cargo, undefined);
        assert.ok(draft.bantSummary, 'Expected corporate draft to include bantSummary');
        assert.match(draft.bantSummary, /Empresa: Não informado/);
        assert.match(draft.bantSummary, /Cargo: Não informado/);
    });
});
