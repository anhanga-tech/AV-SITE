import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.resolve(process.cwd(), 'content/blog');
const STATUS_PATTERN = /^imageCreditStatus:\s*["']?(confirmed|unknown)["']?\s*$/m;

// Posts legados cujas capas ainda estão sob verificação de procedência. Este
// allowlist é um *ratchet*: posts novos (fora desta lista) não podem herdar
// `unknown` e precisam documentar créditos confirmados antes de o CI passar.
// Cada entrada trava o slug À imagem atual: se a capa for trocada sem que o
// crédito seja resolvido, o teste falha (evita herdar 'unknown' silenciosamente
// para uma imagem nova sem procedência verificada).
// Quando um item legado for resolvido, remova-o do mapa e promova a `confirmed`.
const LEGACY_UNKNOWN_COVERS = new Map<string, string>([
    ['5-segredos-da-disney-que-ninguem-conta', 'images/blog/5-segredos-disney.jpg'],
    ['agencia-de-viagens-confiavel-cadastur', 'images/blog/agencia-de-viagens-confiavel-cadastur.jpg'],
    ['agencia-de-viagens-ou-por-conta-propria', 'images/blog/agencia-de-viagens-ou-conta-propria.jpg'],
    ['america-do-norte-destinos-alem-de-nova-york', 'images/blog/america-do-norte-destinos-alem-de-nova-york.jpg'],
    ['asia-destinos-para-brasileiros-2026', 'images/destinations/toquio.jpg'],
    ['cancun-punta-cana-aruba-lua-de-mel', 'images/blog/cancun-punta-cana-aruba-lua-de-mel.jpg'],
    ['caribe-destinos-para-brasileiros', 'images/blog/caribe-destinos-para-brasileiros.jpg'],
    ['copa-do-mundo-2026-as-cidades-sede-e-o-que-cada-uma-tem-a-oferecer-alem-do-futebol', 'images/blog/guadalajara.jpg'],
    ['cruzeiros-costa-brasileira-2026-2027', 'images/destinations/natal.jpg'],
    ['destinos-america-do-sul-latam', 'images/destinations/cartagena.jpg'],
    ['destinos-carnaval-2026-brasil', 'images/blog/destinos-carnaval-2026.jpg'],
    ['disney-ou-beto-carrero', 'images/blog/disney-ou-beto-carrero.jpg'],
    ['disney-tropical-americas-animal-kingdom', 'images/blog/disney-tropical-americas-animal-kingdom.jpg'],
    ['documentos-para-viajar-com-crianca', 'images/blog/documentos-viajar-crianca-exterior.jpg'],
    ['etias-2026-brasileiros-europa', 'images/blog/etias-2026-brasileiros-europa.jpg'],
    ['europa-gastronomica-roteiro-italia', 'images/blog/europa-gastronomica-italia.jpg'],
    ['ferias-julho-2026-destinos', 'images/blog/ferias-julho-2026.jpg'],
    ['guia-definitivo-sobrevivencia-festivais', 'images/blog/guia-festivais.jpg'],
    ['jalapao-julho-roteiro-custos', 'images/blog/jalapao-julho-roteiro-custos.jpg'],
    ['lua-de-mel-nas-maldivas', 'images/blog/lua-de-mel-maldivas.jpg'],
    ['malas-de-mao-o-guia-definitivo', 'images/blog/malas-de-mao.jpg'],
    ['melhores-destinos-brasil-2026', 'images/destinations/natal.jpg'],
    ['nova-york-no-natal', 'images/blog/nova-york-natal.jpg'],
    ['onde-fica-beto-carrero-como-chegar', 'images/blog/onde-fica-beto-carrero-como-chegar.jpg'],
    ['primeira-viagem-internacional-depois-dos-60', 'images/destinations/lisboa.jpg'],
    ['quanto-custa-beto-carrero-world-2026', 'images/blog/quanto-custa-beto-carrero-world-2026.webp'],
    ['quanto-custa-viagem-disney-2026', 'images/blog/quanto-custa-viagem-disney-2026.jpg'],
    ['quanto-investir-viagem-dos-sonhos', 'images/blog/quanto-custa-viagem-disney-2026.jpg'],
    ['roteiro-bonito-ms-5-dias', 'images/blog/roteiro-bonito-ms-5-dias.jpg'],
    ['roteiro-europa-brasileiros-2026', 'images/destinations/lisboa.jpg'],
    ['seguro-viagem-internacional-2026', 'images/blog/seguro-viagem-2026.jpg'],
    ['turismo-terceira-idade-guia-completo', 'images/blog/turismo-terceira-idade-guia-completo.jpg'],
    ['viagem-corporativa-para-pequenas-empresas-guia-completo', 'images/blog/viagem-corp.jpg'],
    ['viagem-solo-depois-dos-50', 'images/blog/viagem-solo-depois-dos-50.jpg'],
    ['viagem-solo-feminina-ganha-espaco-nos-cruzeiros-da-norwegian-cruise-line', 'images/blog/blog-viagem-solo-feminina.png'],
]);

const CONFIRMED_FIELDS = ['imageCredit', 'imageSource', 'imageLicense', 'imageLicenseUrl', 'imageAdaptation'] as const;

function frontmatter(text: string): string {
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(match, 'post must have a YAML frontmatter block');
    return match[1];
}

// Retorna undefined quando o valor está ausente, vazio/"", ou é um *null* YAML
// (`null`, `Null`, `NULL`, `~`). Gray-matter parseia esses escalares como null,
// então `imageCredit: null` não pode contar como preenchido.
function fieldValue(fm: string, field: string): string | undefined {
    const match = fm.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (!match) return undefined;
    const raw = match[1].trim();
    const quoted = raw.match(/^(["'])([\s\S]*)\1$/);
    const core = quoted ? quoted[2].trim() : raw;
    if (core === '' || /^(null|Null|NULL|~)$/.test(core)) return undefined;
    return raw;
}

test('fieldValue rejeita YAML null e strings vazias', () => {
    for (const nullValue of ['null', 'Null', 'NULL', '~']) {
        assert.equal(fieldValue(`imageCredit: ${nullValue}`, 'imageCredit'), undefined, `deve rejeitar \`${nullValue}\``);
    }
    assert.equal(fieldValue('imageCredit: ""', 'imageCredit'), undefined);
    assert.equal(fieldValue("imageCredit: ''", 'imageCredit'), undefined);
    assert.equal(fieldValue('imageCredit: "Vitor Pamplona"', 'imageCredit'), '"Vitor Pamplona"');
});

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
            // `unknown` só é permitido para capas legadas explicitamente listadas,
            // e travado à imagem exata registrada no allowlist.
            const image = fieldValue(fm, 'image');
            const pinnedImage = LEGACY_UNKNOWN_COVERS.get(slug);
            assert.ok(
                pinnedImage !== undefined,
                `${filename}: only legacy covers in the allowlist may remain 'unknown'; new posts must set 'confirmed' with full credits`,
            );
            const normalizedImage = image?.replace(/^["']|["']$/g, '');
            assert.equal(
                normalizedImage,
                pinnedImage,
                `${filename}: cover image changed (was pinned to '${pinnedImage}', now '${normalizedImage}'); resolve the credit and promote to 'confirmed', or update the pin if this really is the same untraced legacy image`,
            );
        }
    }
});