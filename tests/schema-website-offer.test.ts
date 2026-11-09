import assert from 'node:assert/strict';
import test from 'node:test';
import { render } from '../ssr.tsx';
import { CONSULTORIA_SESSION_PRICE_BRL } from '../components/landings/consultoria/pricing';

// Issue #1981 (recheck Site Audit 02/11): a home não tinha nó WebSite e nenhuma página
// marcava o único preço público do site (sessão de consultoria) como Offer.
const ORGANIZATION_ID = 'https://www.anhanga.tur.br/#organization';

type Node = Record<string, unknown>;

const parseJsonLd = (headHtml: string): Node[] =>
  [...headHtml.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]) as Node);

async function jsonLdFor(url: string): Promise<Node[]> {
  const { headHtml } = await render(url);
  return parseJsonLd(headHtml);
}

const hasType = (node: Node, type: string) =>
  ([] as unknown[]).concat(node['@type']).includes(type);

test('home emits a WebSite node published by the Organization @id', async () => {
  const site = (await jsonLdFor('/')).find((node) => hasType(node, 'WebSite'));
  assert.ok(site, 'home has no WebSite node');
  assert.equal(site.url, 'https://www.anhanga.tur.br/');
  assert.equal(site.name, 'Anhangá Viagens');
  assert.equal((site.publisher as Node | undefined)?.['@id'], ORGANIZATION_ID);
});

// SearchAction só vale com busca interna endereçável por URL; a busca do /blog é estado local.
test('WebSite node does not declare a SearchAction', async () => {
  const site = (await jsonLdFor('/')).find((node) => hasType(node, 'WebSite'));
  assert.ok(site, 'home has no WebSite node');
  assert.equal(site.potentialAction, undefined);
});

test('consultoria Service carries an Offer in BRL matching the public price', async () => {
  const service = (await jsonLdFor('/consultoria-de-viagem')).find((node) => hasType(node, 'Service'));
  assert.ok(service, '/consultoria-de-viagem has no Service node');
  const offer = service.offers as Node | undefined;
  assert.ok(offer, 'consultoria Service has no offers');
  assert.equal(offer['@type'], 'Offer');
  assert.equal(offer.priceCurrency, 'BRL');
  assert.equal(Number(offer.price), CONSULTORIA_SESSION_PRICE_BRL);
  assert.equal(offer.url, 'https://www.anhanga.tur.br/consultoria-de-viagem/');
  assert.equal(offer.availability, 'https://schema.org/InStock');
});

test('consultoria page copy shows the same price as the Offer', async () => {
  const { appHtml: html } = await render('/consultoria-de-viagem');
  assert.match(html, new RegExp(`R\\$\\s*${CONSULTORIA_SESSION_PRICE_BRL}\\b`));
});

// Sem preço público, sem Offer: não inventar valor nas outras landings.
test('landings without a public price do not emit an Offer', async () => {
  for (const url of ['/', '/beto-carrero', '/hopi-hari', '/cruzeiros', '/melhor-idade', '/corporativo']) {
    const services = (await jsonLdFor(url)).filter((node) => hasType(node, 'Service'));
    for (const service of services) {
      assert.equal(service.offers, undefined, `${url} Service should not carry offers`);
    }
  }
});
