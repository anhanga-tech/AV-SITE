import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES = [
  '/',
  '/orlando',
  '/beto-carrero',
  '/lollapalooza',
  '/sobre',
  '/melhor-idade',
  '/mapa-do-site',
  '/termos-de-uso',
  '/politica-privacidade'
];

const DIST_DIR = path.resolve(__dirname, '../dist');
const SSR_OUT_DIR = path.resolve(__dirname, '../.prerender-ssr');
const SSR_ENTRY = path.resolve(__dirname, '../ssr.tsx');
const INDEX_FILE = path.join(DIST_DIR, 'index.html');

const REQUIRED_PATTERNS = [
  { label: 'title', pattern: /<title\b[^>]*>[\s\S]*?<\/title>/i },
  { label: 'meta description', pattern: /<meta\b[^>]*name="description"[^>]*content="[^"]+"/i },
  { label: 'canonical', pattern: /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.anhanga\.tur\.br\/[^"?#]*"/i },
  { label: 'Open Graph', pattern: /<meta\b[^>]*property="og:title"[^>]*content="[^"]+"/i },
  { label: 'Twitter card', pattern: /<meta\b[^>]*name="twitter:title"[^>]*content="[^"]+"/i },
  { label: 'JSON-LD schema', pattern: /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i }
];
const MANAGED_TEMPLATE_HEAD_TAG_PATTERNS = [
  /<title\b[^>]*data-av-head="[^"]+"[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi,
  /<link\b[^>]*data-av-head="[^"]+"[^>]*\/?>\s*/gi
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
const HOME_REVIEWS_SECTION_PATTERN = /id="depoimentos"/i;
const HOME_REVIEWS_PLACEHOLDER_PATTERN = /<section id="depoimentos"[^>]*aria-hidden="true"[^>]*><\/section>/i;
const HOME_REVIEWS_REAL_MODE_PATTERN = /data-review-mode="real"/i;
const HOME_REVIEWS_FALLBACK_MODE_PATTERN = /data-review-mode="fallback"/i;
const HOME_REVIEW_CARD_PATTERN = /data-review-card-id="/gi;
const ORGANIZATION_SCHEMA_PATTERN = /<script\b[^>]*data-av-head="script:ld-json:organization"[^>]*>([\s\S]*?)<\/script>/i;

const routeToOutputPath = (route) =>
  route === '/' ? path.join(DIST_DIR, 'index.html') : path.join(DIST_DIR, route.slice(1), 'index.html');

const ensurePrerenderMarker = (html) =>
  html.replace(/<html([^>]*)>/i, (match, attrs) =>
    attrs.includes('data-prerendered=') ? match : `<html${attrs} data-prerendered="true">`
  );

const stripManagedHeadTags = (template) => {
  let strippedTemplate = template;

  for (const pattern of MANAGED_TEMPLATE_HEAD_TAG_PATTERNS) {
    strippedTemplate = strippedTemplate.replace(pattern, '');
  }

  return strippedTemplate;
};

const injectRenderedHtml = (template, appHtml, headHtml) => {
  const withManagedHeadRemoved = stripManagedHeadTags(template);
  const withRoot = withManagedHeadRemoved.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
  const withHead = withRoot.replace('</head>', `${headHtml}\n</head>`);
  return ensurePrerenderMarker(withHead);
};

const countMatches = (html, pattern) => Array.from(html.matchAll(pattern)).length;

const extractOrganizationSchema = (html) => {
  const match = html.match(ORGANIZATION_SCHEMA_PATTERN);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1].replace(/\\u003c/g, '<'));
  } catch (error) {
    throw new Error(`Failed to parse organization schema from prerendered HTML: ${String(error)}`);
  }
};

const validateReviewMarkup = (route, html) => {
  if (route === '/') {
    if (!HOME_REVIEWS_SECTION_PATTERN.test(html)) {
      throw new Error('Missing visible reviews section in prerendered Home HTML');
    }

    if (HOME_REVIEWS_PLACEHOLDER_PATTERN.test(html)) {
      throw new Error('Home prerender still contains the empty depoimentos placeholder');
    }

    const hasRealMode = HOME_REVIEWS_REAL_MODE_PATTERN.test(html);
    const hasFallbackMode = HOME_REVIEWS_FALLBACK_MODE_PATTERN.test(html);

    if (hasRealMode === hasFallbackMode) {
      throw new Error('Home prerender must declare exactly one review mode');
    }

    const organizationSchema = extractOrganizationSchema(html);
    const hasAggregateRating = Boolean(organizationSchema?.aggregateRating);

    if (hasRealMode) {
      if (countMatches(html, HOME_REVIEW_CARD_PATTERN) < 3) {
        throw new Error('Home prerender must expose at least 3 visible real review cards');
      }

      if (!hasAggregateRating) {
        throw new Error('Home prerender is in real review mode without aggregateRating');
      }
    }

    if (hasFallbackMode && hasAggregateRating) {
      throw new Error('Home fallback mode must not emit aggregateRating');
    }
  }

  if (route === '/sobre') {
    const organizationSchema = extractOrganizationSchema(html);

    if (!organizationSchema) {
      throw new Error('Missing organization schema in /sobre prerender');
    }

    if (organizationSchema.aggregateRating) {
      throw new Error('/sobre prerender must not emit aggregateRating without visible reviews');
    }
  }
};

const validateHtml = (route, html) => {
  for (const requirement of REQUIRED_PATTERNS) {
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

  validateReviewMarkup(route, html);
};

const removeDirectory = (directoryPath) => {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true, force: true });
  }
};

async function buildSsrBundle() {
  removeDirectory(SSR_OUT_DIR);

  await build({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    mode: process.env.NODE_ENV || 'production',
    build: {
      ssr: SSR_ENTRY,
      outDir: SSR_OUT_DIR,
      emptyOutDir: false,
      minify: false,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'entry-server.mjs',
          format: 'es'
        }
      }
    }
  });

  const serverEntryUrl = pathToFileURL(path.join(SSR_OUT_DIR, 'entry-server.mjs')).href;
  return import(serverEntryUrl);
}

async function prerender() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error(`Missing client build output at ${INDEX_FILE}. Run "vite build" first.`);
  }

  console.log('Starting SSR prerender...');

  const template = fs.readFileSync(INDEX_FILE, 'utf8');
  const serverModule = await buildSsrBundle();

  if (typeof serverModule.render !== 'function') {
    throw new Error('SSR bundle does not export a render(url) function.');
  }

  for (const route of ROUTES) {
    console.log(`Rendering ${route}`);
    const { appHtml, headHtml } = await serverModule.render(route);
    const html = injectRenderedHtml(template, appHtml, headHtml);

    validateHtml(route, html);

    const outputPath = routeToOutputPath(route);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
  }

  removeDirectory(SSR_OUT_DIR);
  console.log('SSR prerender complete.');
}

prerender().catch((error) => {
  removeDirectory(SSR_OUT_DIR);
  console.error('Prerender failed:', error);
  process.exit(1);
});
