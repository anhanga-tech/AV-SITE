import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.resolve(process.cwd(), 'content/blog');
const STATUS_PATTERN = /^imageCreditStatus:\s*["']?(confirmed|unknown)["']?\s*$/m;

// Posts legados cujas capas ainda estão sob verificação de procedência. Este
// allowlist é um *ratchet*: posts novos (fora desta lista) não podem herdar
// `unknown` e precisam documentar créditos confirmados antes de o CI passar.
// Quando um item legado for resolvido, remova-o da lista e promova a `confirmed`.
const LEGACY_UNKNOWN_SLUGS = new Set([
    '5-segredos-da-disney-que-ninguem-conta',
    'agencia-de-viagens-confiavel-cadastur',
    'agencia-de-viagens-ou-por-conta-propria',
    'america-do-norte-destinos-alem-de-nova-york',
    'asia-destinos-para-brasileiros-2026',
    'cancun-punta-cana-aruba-lua-de-mel',
    'caribe-destinos-para-brasileiros',
    'copa-do-mundo-2026-as-cidades-sede-e-o-que-cada-uma-tem-a-oferecer-alem-do-futebol',
    'cruzeiros-costa-brasileira-2026-2027',
    'destinos-america-do-sul-latam',
    'destinos-carnaval-2026-brasil',
    'disney-ou-beto-carrero',
    'disney-tropical-americas-animal-kingdom',
    'documentos-para-viajar-com-crianca',
    'etias-2026-brasileiros-europa',
    'europa-gastronomica-roteiro-italia',
    'ferias-julho-2026-destinos',
    'guia-definitivo-sobrevivencia-festivais',
    'jalapao-julho-roteiro-custos',
    'lua-de-mel-nas-maldivas',
    'malas-de-mao-o-guia-definitivo',
    'melhores-destinos-brasil-2026',
    'nova-york-no-natal',
    'onde-fica-beto-carrero-como-chegar',
    'primeira-viagem-internacional-depois-dos-60',
    'quanto-custa-beto-carrero-world-2026',
    'quanto-custa-viagem-disney-2026',
    'quanto-investir-viagem-dos-sonhos',
    'roteiro-bonito-ms-5-dias',
    'roteiro-europa-brasileiros-2026',
    'seguro-viagem-internacional-2026',
    'turismo-terceira-idade-guia-completo',
    'viagem-corporativa-para-pequenas-empresas-guia-completo',
    'viagem-solo-depois-dos-50',
    'viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line',
]);

const CONFIRMED_FIELDS = ['imageCredit', 'imageSource', 'imageLicense', 'imageLicenseUrl', 'imageAdaptation'] as const;

function frontmatter(text: string): string {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(match, 'post must have a YAML frontmatter block');
    return match[1];
}

// Retorna undefined quando o valor está ausente ou é vazio/"". Assim `imageCredit: ""`
// não conta como preenchido (a `.` do regex anterior casava com as aspas vazias).
function fieldValue(fm: string, field: string): string | undefined {
    const match = fm.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (!match) return undefined;
    const raw = match[1].trim();
    const unquoted = raw.replace(/^["']|["']$/g, '').trim();
    return unquoted === '' ? undefined : raw;
}

test('cada capa do blog tem status de crédito documentado', () => {
    const posts = fs.readdirSync(BLOG_DIR).filter(name => name.endsWith('.mdx')).sort();
    assert.ok(posts.length > 0);

    for (const filename of posts) {
        const slug = filename.replace(/\.mdx$/, '');
        const text = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
        const fm = frontmatter(text);
        const status = fm.match(STATUS_PATTERN)?.[1];
        assert.ok(status, `${filename}: imageCreditStatus must be confirmed or unknown`);

        if (status === 'confirmed') {
            for (const field of CONFIRMED_FIELDS) {
                assert.ok(fieldValue(fm, field), `${filename}: confirmed image must have a non-empty ${field}`);
            }
        } else {
            // `unknown` só é permitido para capas legadas explicitamente listadas.
            assert.ok(
                LEGACY_UNKNOWN_SLUGS.has(slug),
                `${filename}: only legacy covers in the allowlist may remain 'unknown'; new posts must set 'confirmed' with full credits`,
            );
        }
    }
});