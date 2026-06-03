import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCorpForm } from '../components/landings/corporativo/useCorpFormReducer';
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
            assert.equal(result.field, 'required');
            assert.equal(result.message, 'Preencha todos os campos obrigatórios');
        }
    });

    it('should fail for whitespace-only required fields', () => {
        const result = validateCorpForm({ ...VALID_FORM, email: '   ' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'required');
        }
    });

    it('should fail for invalid email format', () => {
        const result = validateCorpForm({ ...VALID_FORM, email: 'not-an-email' }, true);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.field, 'email');
            assert.equal(result.message, 'Insira um e-mail corporativo válido');
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
            assert.equal(result.field, 'required');
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
});
