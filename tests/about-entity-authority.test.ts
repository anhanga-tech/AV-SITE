import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regressão da estratégia GEO/AEO (docs/seo/geo-content-strategy-2026-07.md):
// a /sobre é a página-âncora de entidade. Estes testes travam os sinais de
// confiança que motores de resposta (ChatGPT/Gemini/Perplexity) extraem para
// *recomendar* a marca: schema de organização com AggregateRating, FAQPage de
// confiança, Person dos consultores ligados à organização e credenciamentos
// como fatos verificáveis em texto renderizado (não só imagem).

const readRepoFile = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('About renders the entity/trust JSON-LD schemas', async () => {
  const source = await readRepoFile('pages/About.tsx');
  assert.match(source, /<FAQPageSchema\b/, 'FAQPage schema ausente');
  assert.match(source, /<PersonSchema\b/, 'Person schema ausente');
  assert.match(source, /<OrganizationSchema[\s\S]*aggregateRating=/, 'AggregateRating não passado ao OrganizationSchema');
});

test('About Person schemas link consultores à organização (worksFor + id único)', async () => {
  const source = await readRepoFile('pages/About.tsx');
  assert.match(source, /worksFor=\{\{\s*name:\s*ORG_NAME/, 'Person schema não define worksFor da organização');
  assert.match(source, /id=\{`person-\$\{member\.id\}`\}/, 'Person schema precisa de id único por consultor');
});

test('About expõe credenciamentos como fatos verificáveis em texto', async () => {
  const source = await readRepoFile('pages/About.tsx');
  // CNPJ/Cadastur, Hopi Hari e NCL precisam aparecer no conteúdo renderizado.
  assert.match(source, /37\.036\.732\/0001-41/, 'CNPJ/Cadastur ausente do texto');
  assert.match(source, /Hopi Hari/, 'Credenciamento Hopi Hari ausente do texto');
  assert.match(source, /Norwegian Cruise Line/, 'Parceria NCL ausente do texto');
});

test('About FAQ de confiança cobre as queries de entidade', async () => {
  const source = await readRepoFile('pages/About.tsx');
  assert.match(source, /é confiável\?/, 'Falta a pergunta "é confiável?"');
  assert.match(source, /registrada no Cadastur\?/, 'Falta a pergunta sobre Cadastur');
  // O mesmo array alimenta o JSON-LD e a seção visível — sem drift possível.
  assert.match(source, /<FAQPageSchema items=\{TRUST_FAQ_ITEMS\}/);
  assert.match(source, /TRUST_FAQ_ITEMS\.map/, 'FAQ não é renderizado visivelmente');
});

test('PersonSchema emite worksFor e id configurável', async () => {
  const source = await readRepoFile('components/schemas/PersonSchema.tsx');
  assert.match(source, /worksFor\?:/, 'prop worksFor ausente');
  assert.match(source, /"worksFor":/, 'worksFor não é emitido no JSON-LD');
  assert.match(source, /id\s*=\s*"person"/, 'id deve ter default retrocompatível');
  assert.match(source, /StructuredData id=\{id\}/, 'id não é repassado ao StructuredData');
});
