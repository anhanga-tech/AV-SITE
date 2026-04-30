import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectMainDestination, selectInspirationDestinations } from '../lib/quiz-destinations';
import type { ProfileKey } from '../lib/quiz-scoring';

const PROFILES: ProfileKey[] = ['escapista', 'bon-vivant', 'viajante-de-verdade', 'desbravador', 'nomade-de-alma'];
const P1_REGIONS = ['europa', 'america-norte', 'latam', 'caribe', 'asia', 'africa-oriente'];

const KNOWN_IMAGE_KEYS = new Set([
    'maragogi', 'riviera-maya', 'sauipe',
    'buenos-aires', 'lisboa', 'gramado',
    'cartagena', 'chapada', 'santiago',
    'patagonia', 'lencois', 'machu-picchu',
    'quioto', 'marrocos', 'pantanal',
]);

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
        const nomadeAsia = selectMainDestination('nomade-de-alma', ['asia']);
        assert.ok(nomadeAsia.name.toLowerCase().includes('jap'), `expected Japão rural, got ${nomadeAsia.name}`);

        const nomadeLatam = selectMainDestination('nomade-de-alma', ['latam']);
        assert.ok(nomadeLatam.name.toLowerCase().includes('bol'), `expected Bolívia, got ${nomadeLatam.name}`);

        const bonEuropa = selectMainDestination('bon-vivant', ['europa']);
        assert.ok(bonEuropa.name.toLowerCase().includes('par'), `expected Paris, got ${bonEuropa.name}`);

        const desbLatam = selectMainDestination('desbravador', ['latam']);
        assert.ok(desbLatam.name.toLowerCase().includes('patagô'), `expected Patagônia, got ${desbLatam.name}`);
    });

    it('surpresa fallback never matches a primary inspiration for the same profile', () => {
        for (const profile of PROFILES) {
            const mainDest = selectMainDestination(profile, ['surpresa']);
            const inspirations = selectInspirationDestinations(profile, mainDest);
            // After filtering, all 3 returned inspirations must differ from main
            for (const insp of inspirations) {
                const mainFirst = mainDest.name.toLowerCase().split(' ')[0];
                const inspFirst = insp.name.toLowerCase().split(' ')[0];
                assert.notEqual(mainFirst, inspFirst,
                    `surpresa fallback "${mainDest.name}" overlaps inspiration "${insp.name}" for ${profile}`);
            }
        }
    });
});

describe('selectInspirationDestinations', () => {
    it('returns exactly 3 inspirations for every profile', () => {
        for (const profile of PROFILES) {
            const mainDest = selectMainDestination(profile, []);
            const insp = selectInspirationDestinations(profile, mainDest);
            assert.equal(insp.length, 3, `expected 3 inspirations for ${profile}, got ${insp.length}`);
        }
    });

    it('every inspiration has required fields', () => {
        for (const profile of PROFILES) {
            const mainDest = selectMainDestination(profile, []);
            for (const dest of selectInspirationDestinations(profile, mainDest)) {
                assert.ok(dest.name, `missing name in ${profile}`);
                assert.ok(dest.region, `missing region in ${profile}`);
                assert.ok(dest.tag, `missing tag in ${profile}`);
                assert.ok(dest.imageKey, `missing imageKey in ${profile}`);
            }
        }
    });

    it('imageKeys use only known CDN keys', () => {
        for (const profile of PROFILES) {
            const mainDest = selectMainDestination(profile, []);
            for (const dest of selectInspirationDestinations(profile, mainDest)) {
                assert.ok(KNOWN_IMAGE_KEYS.has(dest.imageKey), `unknown imageKey "${dest.imageKey}" in ${profile}`);
            }
        }
    });

    it('filters inspiration that overlaps with the main destination — viajante latam', () => {
        // main = Cartagena, inspiration[0] = Cartagena → should be replaced by reserve
        const mainDest = selectMainDestination('viajante-de-verdade', ['latam']);
        assert.ok(mainDest.name.toLowerCase().startsWith('cart'));
        const inspirations = selectInspirationDestinations('viajante-de-verdade', mainDest);
        assert.equal(inspirations.length, 3);
        const names = inspirations.map(d => d.name.toLowerCase());
        assert.ok(!names.some(n => n.startsWith('cart')), `Cartagena should be filtered, got: ${names.join(', ')}`);
    });

    it('filters inspiration that overlaps with the main destination — desbravador latam', () => {
        // main = Patagônia, inspiration[0] = Patagônia → should be replaced by reserve
        const mainDest = selectMainDestination('desbravador', ['latam']);
        assert.ok(mainDest.name.toLowerCase().startsWith('patagô'));
        const inspirations = selectInspirationDestinations('desbravador', mainDest);
        assert.equal(inspirations.length, 3);
        const names = inspirations.map(d => d.name.toLowerCase());
        assert.ok(!names.some(n => n.startsWith('patagô')), `Patagônia should be filtered, got: ${names.join(', ')}`);
    });

    it('filters inspiration that overlaps with main destination — nomade asia', () => {
        // main = Japão rural, inspiration[0] = Japão → semantic overlap, should be replaced
        const mainDest = selectMainDestination('nomade-de-alma', ['asia']);
        assert.ok(mainDest.name.toLowerCase().startsWith('jap'));
        const inspirations = selectInspirationDestinations('nomade-de-alma', mainDest);
        assert.equal(inspirations.length, 3);
        const names = inspirations.map(d => d.name.toLowerCase());
        assert.ok(!names.some(n => n.startsWith('jap')), `Japão should be filtered, got: ${names.join(', ')}`);
    });

    it('reserve imageKeys are also known CDN keys', () => {
        // Force filter to trigger for all profiles and verify reserve imageKey
        const overlapTriggers: Record<ProfileKey, string> = {
            'escapista': 'surpresa',          // old surpresa was Maragogi (now Costa do Sauípe, no overlap)
            'bon-vivant': 'surpresa',
            'viajante-de-verdade': 'latam',   // triggers Cartagena → reserve Chapada
            'desbravador': 'latam',           // triggers Patagônia → reserve Lençóis
            'nomade-de-alma': 'asia',         // triggers Japão → reserve Patagônia
        };
        for (const [profile, region] of Object.entries(overlapTriggers) as [ProfileKey, string][]) {
            const mainDest = selectMainDestination(profile, [region]);
            const inspirations = selectInspirationDestinations(profile, mainDest);
            for (const d of inspirations) {
                assert.ok(KNOWN_IMAGE_KEYS.has(d.imageKey), `unknown reserve imageKey "${d.imageKey}" for ${profile}`);
            }
        }
    });
});
