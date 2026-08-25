// Helpers puros de HTML do prerender, extraídos de scripts/prerender.mjs.
//
// O script executa `prerender()` no topo do módulo, então importá-lo dispararia um build
// inteiro — é por isso que `tests/seo-prerender-contract.test.ts` só consegue afirmar
// regex sobre o texto-fonte dele. Estas funções são puras (entram string e rota, sai
// string ou exceção) e moram aqui para terem um seam de verdade: o teste exercita o
// comportamento com HTML real, em vez de checar que um identificador existe no arquivo.

const REQUIRED_PATTERNS = [
  { label: 'title', pattern: /<title\b[^>]*>[\s\S]*?<\/title>/i },
  { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*content="[^"]+"/i },
  { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.anhanga\.tur\.br\/[^"?#]*"/i },
  { label: 'Open Graph', pattern: /<meta\b[^>]*property="og:title"[^>]*content="[^"]+"/i },
  { label: 'Twitter card', pattern: /<meta\b[^>]*name="twitter:title"[^>]*content="[^"]+"/i },
  { label: 'JSON-LD schema', pattern: /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i }
];

const UNIQUE_TAG_PATTERNS = [
  { label: 'title', pattern: /<title\b[^>]*>/gi },
  { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*>/gi },
  { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*>/gi },
  { label: 'og:title', pattern: /<meta\b[^>]*property="og:title"[^>]*>/gi },
  { label: 'og:description', pattern: /<meta\b[^>]*property="og:description"[^>]*>/gi },
  { label: 'og:image', pattern: /<meta\b[^>]*property="og:image"[^>]*>/gi },
  { label: 'og:type', pattern: /<meta\b[^>]*property="og:type"[^>]*>/gi },
  { label: 'og:url', pattern: /<meta\b[^>]*property="og:url"[^>]*>/gi },
  { label: 'twitter:card', pattern: /<meta\b[^>]*name="twitter:card"[^>]*>/gi },
  { label: 'twitter:title', pattern: /<meta\b[^>]*name="twitter:title"[^>]*>/gi },
  { label: 'twitter:description', pattern: /<meta\b[^>]*name="twitter:description"[^>]*>/gi },
  { label: 'twitter:image', pattern: /<meta\b[^>]*name="twitter:image"[^>]*>/gi }
];

// Recursos marcados como exclusivos da home no template. O prerender emite o mesmo
// index.html para toda rota, então sem esse strip o preload do hero da Home dispararia
// também em rotas que nunca renderizam o Hero: /links, a página de bio, baixava o
// candidato de 1200w em `fetchpriority="high"` competindo com o próprio JS.
// A justificativa mora aqui, e não num comentário do index.html, porque comentário de
// HTML é servido ao browser em toda resposta — este arquivo não.
const HOME_ONLY_PRELOAD_PATTERN = /<link\b[^>]*data-av-preload="home-hero"[^>]*>\s*/gi;

const NOINDEX_META_PATTERN = /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;

export const normalizeRoute = (route) => (route === '/' ? '/' : route.replace(/\/+$/, ''));

/** `true` quando o HTML pede `noindex` aos robôs (em qualquer combinação de diretivas). */
export const isNoindexHtml = (html) => NOINDEX_META_PATTERN.test(html);

/** Remove do template os recursos marcados como exclusivos da home, exceto na própria `/`. */
export const stripHomeOnlyPreloads = (template, route) =>
  normalizeRoute(route) === '/' ? template : template.replace(HOME_ONLY_PRELOAD_PATTERN, '');

const countMatches = (html, pattern) => Array.from(html.matchAll(pattern)).length;

/** Lança se o HTML prerenderizado quebrar o contrato de head. */
export const validateHtml = (route, html) => {
  // Dado estruturado numa página `noindex` não tem consumidor: exigi-lo só forçaria
  // schema decorativo. Todo o resto do contrato de head continua valendo.
  const isNoindex = isNoindexHtml(html);

  for (const requirement of REQUIRED_PATTERNS) {
    if (isNoindex && requirement.label === 'JSON-LD schema') {
      continue;
    }
    if (!requirement.pattern.test(html)) {
      throw new Error(`Missing ${requirement.label} in prerendered output for route "${route}"`);
    }
  }

  for (const tag of UNIQUE_TAG_PATTERNS) {
    const matchCount = countMatches(html, tag.pattern);
    if (matchCount !== 1) {
      throw new Error(`Expected exactly 1 ${tag.label} tag in prerendered output for route "${route}", found ${matchCount}`);
    }
  }
};
