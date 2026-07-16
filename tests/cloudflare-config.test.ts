import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const LEGACY_BLOG_HOST_REDIRECT_RE = /^\/blog(?:[\/\s*].*)?\s+https:\/\/blog\.anhanga\.tur\.br\b/m;

function collectTomlVarsSection(source: string, sectionName: string): Map<string, string> {
  const vars = new Map<string, string>();
  let inSection = false;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      inSection = sectionMatch[1] === sectionName;
      continue;
    }

    if (!inSection) continue;

    const assignmentMatch = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      vars.set(assignmentMatch[1], assignmentMatch[2].replace(/^["']|["']$/g, ''));
    }
  }

  return vars;
}

function collectHeadersBlocks(source: string): Map<string, Map<string, string>> {
  const blocks = new Map<string, Map<string, string>>();
  let currentPath: string | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const line = rawLine.trim();
    if (line.startsWith('#')) continue;

    if (!rawLine.startsWith(' ') && !rawLine.startsWith('\t')) {
      currentPath = line;
      if (!blocks.has(currentPath)) {
        blocks.set(currentPath, new Map());
      }
      continue;
    }

    if (!currentPath) continue;

    const headerMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (headerMatch) {
      blocks.get(currentPath)?.set(headerMatch[1], headerMatch[2]);
    }
  }

  return blocks;
}

function normalizeRedirectLine(line: string): string {
  return line.trim().replace(/^["']|["']$/g, '');
}

function collectRedirectRules(source: string): string[] {
  return source
    .split(/\r?\n/)
    .flatMap((line) => {
      const normalized = normalizeRedirectLine(line);
      return normalized && !normalized.startsWith('#') ? [normalized] : [];
    });
}

function hasLegacyBlogHostRedirect(source: string): boolean {
  return collectRedirectRules(source).some((line) => LEGACY_BLOG_HOST_REDIRECT_RE.test(line));
}

function hasExactRedirectAfterFirstSplat(source: string): boolean {
  const lines = collectRedirectRules(source);
  const firstSplatIndex = lines.findIndex((line) => normalizeRedirectLine(line).includes('*'));

  if (firstSplatIndex === -1) return false;

  return lines.slice(firstSplatIndex + 1).some((line) => {
    const normalized = normalizeRedirectLine(line);
    return normalized.length > 0 && !normalized.includes('*');
  });
}

test('Cloudflare Pages build should use the repo Node runtime target', async () => {
  const nodeVersion = await readFile(new URL('../.node-version', import.meta.url), 'utf8');

  assert.equal(nodeVersion.trim(), '24');
});

test('wrangler production vars should mirror top-level runtime vars', async () => {
  const source = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const topLevelVars = collectTomlVarsSection(source, 'vars');
  const productionVars = collectTomlVarsSection(source, 'env.production.vars');

  assert.ok(topLevelVars.size > 0);
  assert.deepEqual(productionVars, topLevelVars);
});

test('Cloudflare media vars should use the managed media zone for assets and transforms', async () => {
  const source = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const vars = collectTomlVarsSection(source, 'vars');

  assert.equal(vars.get('VITE_MEDIA_BASE_URL'), 'https://media.anhanga.tur.br');
  assert.equal(vars.get('VITE_MEDIA_TRANSFORM_ZONE_URL'), 'https://media.anhanga.tur.br');
  assert.equal(vars.get('VITE_MEDIA_ENABLE_TRANSFORMS'), 'true');
});

test('Cloudflare redirects should use supported status codes', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.doesNotMatch(redirects, /(?:^|\s)(?:301|302|303|307|308)!(?:\s|$)/);
});

test('Cloudflare redirects should expose the /indica short link with NPS referral UTMs', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');
  const rules = collectRedirectRules(redirects)
    .map((line) => line.split(/\s+/))
    .filter(([from]) => from === '/indica' || from === '/indica/');

  assert.equal(rules.length, 2, 'expected exactly two /indica redirect rules (with and without trailing slash)');

  for (const [, target, status] of rules) {
    assert.equal(status, '302', '/indica must use a temporary 302 redirect');

    const url = new URL(target, 'https://www.anhanga.tur.br');
    assert.equal(url.pathname, '/', '/indica must redirect to the home route');
    assert.equal(url.searchParams.get('utm_source'), 'indicacao');
    assert.equal(url.searchParams.get('utm_medium'), 'whatsapp');
    assert.equal(url.searchParams.get('utm_campaign'), 'nps_promotor');
  }
});

test('Cloudflare page redirects should target the canonical trailing-slash form', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  // O site normaliza trailing slash com um 308, então um destino sem barra
  // encadeia 301 → 308 → 200 e dilui link equity. Handlers de função (/api/*),
  // destinos com query string e splats não passam por essa normalização.
  const pageRedirects = collectRedirectRules(redirects)
    .map((line) => line.split(/\s+/))
    .filter(([from, target]) => {
      if (!from?.startsWith('/') || !target?.startsWith('/')) return false;
      if (target.startsWith('/api/') || target.includes('?') || target.includes('*')) return false;
      return target !== '/';
    });

  assert.ok(pageRedirects.length > 0, 'expected at least one internal page redirect to guard');

  for (const [from, target] of pageRedirects) {
    assert.ok(
      target.endsWith('/'),
      `${from} redirects to ${target} without a trailing slash, which chains 301 → 308 → 200`,
    );
  }
});

test('Cloudflare redirects should avoid redundant SPA fallback rewrites', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.doesNotMatch(redirects, /^\/\*\s+\/index\.html\s+200$/m);
});

test('Cloudflare redirects should keep blog routes on the main site', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.equal(hasLegacyBlogHostRedirect(redirects), false);
});

test('Cloudflare blog redirect guard should catch nested legacy blog routes', () => {
  const redirects = '/blog/post-1  https://blog.anhanga.tur.br/post-1  301';

  assert.equal(hasLegacyBlogHostRedirect(redirects), true);
});

test('Cloudflare Pages headers should cache hashed Vite assets immutably', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const assetHeaders = blocks.get('/assets/*');
  const globalHeaders = blocks.get('/*');

  assert.ok(assetHeaders);
  assert.ok(globalHeaders);
  assert.equal(assetHeaders.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.notEqual(globalHeaders.get('Cache-Control'), assetHeaders.get('Cache-Control'));
});

test('Cloudflare Pages headers should keep NPS routes out of search results', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);

  for (const path of ['/nps', '/nps/', '/nps/*']) {
    assert.equal(blocks.get(path)?.get('X-Robots-Tag'), 'noindex, nofollow');
  }
});

test('Cloudflare Pages headers should include HSTS on the global route', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const globalHeaders = blocks.get('/*');

  assert.ok(globalHeaders, 'global /* block must exist');
  const hsts = globalHeaders.get('Strict-Transport-Security');
  assert.ok(hsts, 'Strict-Transport-Security header must be present in /* block');
  assert.match(hsts, /^max-age=\d+/i, 'Strict-Transport-Security must start with max-age=<number>');
});

test('Cloudflare Pages HSTS should not include subdomains until subdomain inventory is complete', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const globalHeaders = blocks.get('/*');

  assert.ok(globalHeaders, 'global /* block must exist');
  const hsts = globalHeaders.get('Strict-Transport-Security') ?? '';
  assert.doesNotMatch(hsts, /includesubdomains/i, 'includeSubDomains must not be set until beto.anhanga.tur.br HTTPS status is confirmed');
});

test('Cloudflare Pages headers should set a defense-in-depth Content-Security-Policy', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const globalHeaders = blocks.get('/*');

  assert.ok(globalHeaders, 'global /* block must exist');
  const csp = globalHeaders.get('Content-Security-Policy');
  assert.ok(csp, 'Content-Security-Policy header must be present in /* block');

  // These restrictive directives close real attack surface (base-tag injection,
  // plugin-based content, clickjacking) without constraining where scripts,
  // styles, images, or XHR/fetch may load from.
  assert.match(csp, /\bbase-uri 'self'/, 'base-uri must be locked to self');
  assert.match(csp, /\bobject-src 'none'/, 'object-src must be none');
  assert.match(csp, /\bframe-ancestors 'none'/, 'frame-ancestors must be none');
});

test('Cloudflare Pages CSP should stay non-breaking until a source allowlist is audited', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  const blocks = collectHeadersBlocks(headers);
  const csp = blocks.get('/*')?.get('Content-Security-Policy') ?? '';

  // Guard: do not introduce default-src/script-src/style-src/connect-src here
  // without first auditing GTM, Gemini, Leaflet/globe.gl and the media zone,
  // otherwise the SPA breaks. Keep this policy to source-agnostic directives.
  assert.doesNotMatch(csp, /\bdefault-src\b/, 'default-src needs a full source audit first');
  assert.doesNotMatch(csp, /\bscript-src\b/, 'script-src needs a full source audit first');
  assert.doesNotMatch(csp, /\bstyle-src\b/, 'style-src needs a full source audit first');
  assert.doesNotMatch(csp, /\bconnect-src\b/, 'connect-src needs a full source audit first');
});

test('Cloudflare splat redirects should come after exact redirects when present', async () => {
  const redirects = await readFile(new URL('../public/_redirects', import.meta.url), 'utf8');

  assert.equal(hasExactRedirectAfterFirstSplat(redirects), false);
});

test('Cloudflare splat redirect ordering guard should handle non-blog splats', () => {
  const redirects = [
    '/assets/*  /assets/:splat  301',
    '/admin  /admin/  301',
  ].join('\n');

  assert.equal(hasExactRedirectAfterFirstSplat(redirects), true);
});
