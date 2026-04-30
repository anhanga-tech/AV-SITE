import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectMainDestination, selectInspirationDestinations } from '../lib/quiz-destinations';
import type { ProfileKey } from '../lib/quiz-scoring';

const PROFILES: ProfileKey[] = ['escapista', 'bon-vivant', 'viajante-de-verdade', 'desbravador', 'nomade-de-alma'];
const P1_REGIONS = ['europa', 'america-norte', 'latam', 'caribe', 'asia', 'africa-oriente'];

describe('selectMainDestination', () => {
    it('returns a destination for every profile × region combination', () => {
        for (const profile of PROFILES) {
            for (const region of P1_REGIONS) {
                const dest = selectMainDestination(profile, [region]);
                assert.ok(dest.name, `missing name for ${profile} × ${region}`);
                assert.ok(dest.subtitle, `missing subtitle for ${profile} × ${region}`);
                assert.ok(dest.tag, `missing tag for ${profile} × ${region}`);
                assert.ok(dest.region, `missing region for ${profile} × ${region}`);
            }
        }
    });

    it('falls back to canonical when only surpresa is selected', () => {
        for (const profile of PROFILES) {
            const dest = selectMainDestination(profile, ['surpresa']);
            assert.ok(dest.name, `missing canonical for ${profile}`);
        }
    });

    it('falls back to canonical when selection is empty', () => {
        for (const profile of PROFILES) {
            const dest = selectMainDestination(profile, []);
            assert.ok(dest.name, `missing canonical for ${profile} (empty)`);
        }
    });

    it('ignores surpresa when mixed with specific regions', () => {
        const withSurprise = selectMainDestination('nomade-de-alma', ['surpresa', 'asia']);
        const withoutSurprise = selectMainDestination('nomade-de-alma', ['asia']);
        assert.equal(withSurprise.name, withoutSurprise.name);
    });

    it('uses the first non-surpresa region in multi-select', () => {
        const first = selectMainDestination('bon-vivant', ['europa', 'latam']);
        const single = selectMainDestination('bon-vivant', ['europa']);
        assert.equal(first.name, single.name);
    });

    it('falls through to canonical when all selected regions are surpresa', () => {
        const dest = selectMainDestination('desbravador', ['surpresa', 'surpresa']);
        const canonical = selectMainDestination('desbravador', []);
        assert.equal(dest.name, canonical.name);
    });

    it('returns specific combinations from the issue spec', () => {
        // Nômade de Alma + asia → Japão rural
        const nomadeAsia = selectMainDestination('nomade-de-alma', ['asia']);
        assert.ok(nomadeAsia.name.toLowerCase().includes('jap'), `expected Japão rural, got ${nomadeAsia.name}`);

        // Nômade de Alma + latam → Bolívia
        const nomadeLatam = selectMainDestination('nomade-de-alma', ['latam']);
        assert.ok(nomadeLatam.name.toLowerCase().includes('bol'), `expected Bolívia, got ${nomadeLatam.name}`);

        // Bon Vivant + europa → Paris
        const bonEuropa = selectMainDestination('bon-vivant', ['europa']);
        assert.ok(bonEuropa.name.toLowerCase().includes('par'), `expected Paris, got ${bonEuropa.name}`);

        // Desbravador + latam → Patagônia
        const desbLatam = selectMainDestination('desbravador', ['latam']);
        assert.ok(desbLatam.name.toLowerCase().includes('patagô'), `expected Patagônia, got ${desbLatam.name}`);
    });
});

describe('selectInspirationDestinations', () => {
    it('returns exactly 3 inspirations for every profile', () => {
        for (const profile of PROFILES) {
            const insp = selectInspirationDestinations(profile);
            assert.equal(insp.length, 3, `expected 3 inspirations for ${profile}, got ${insp.length}`);
        }
    });

    it('every inspiration has required fields', () => {
        for (const profile of PROFILES) {
            for (const dest of selectInspirationDestinations(profile)) {
                assert.ok(dest.name, `missing name in ${profile}`);
                assert.ok(dest.region, `missing region in ${profile}`);
                assert.ok(dest.tag, `missing tag in ${profile}`);
                assert.ok(dest.imageKey, `missing imageKey in ${profile}`);
            }
        }
    });

    it('imageKeys use only known CDN keys', () => {
        const KNOWN_KEYS = new Set([
            'maragogi', 'riviera-maya', 'sauipe',
            'buenos-aires', 'lisboa', 'gramado',
            'cartagena', 'chapada', 'santiago',
            'patagonia', 'lencois', 'machu-picchu',
            'quioto', 'marrocos', 'pantanal',
        ]);
        for (const profile of PROFILES) {
            for (const dest of selectInspirationDestinations(profile)) {
                assert.ok(KNOWN_KEYS.has(dest.imageKey), `unknown imageKey "${dest.imageKey}" in ${profile}`);
            }
        }
    });
});
