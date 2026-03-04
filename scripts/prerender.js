import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES = [
  '/',
  '/orlando',
  '/beto-carrero',
  '/lollapalooza-2026',
  '/mapa-do-site',
  '/termos-de-uso',
  '/politica-privacidade'
];

const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = 3001;

async function prerender() {
  console.log('🚀 Starting pre-rendering...');

  const originalIndex = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(originalIndex)) {
    throw new Error('Vite build output (dist/index.html) not found!');
  }

  const { createServer } = await import('http');
  const sirv = (await import('sirv')).default;
  const handler = sirv(DIST_DIR, { single: true, cleanUrls: true });

  const server = createServer((req, res) => handler(req, res));
  server.listen(PORT);
  console.log(`📡 Static server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const route of ROUTES) {
    console.log(`📄 Prerendering: ${route}`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Wait for SPA stability
    await page.waitForSelector('#root > *', { timeout: 30000 });
    // Aggressive wait for React 19 metadata hoisting
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Deduplicate metadata in-browser before capturing
    await page.evaluate(() => {
      const deduplicate = (selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length <= 1) return;
        // Keep ONLY the last one (most recent React injection)
        const last = elements[elements.length - 1];
        elements.forEach(el => { if (el !== last) el.remove(); });
      };

      const selectors = [
        'title',
        'meta[name="description"]',
        'meta[name="keywords"]',
        'meta[name="robots"]',
        'link[rel="canonical"]'
      ];
      selectors.forEach(deduplicate);

      [{ p: 'og:', a: 'property' }, { p: 'twitter:', a: 'name' }].forEach(({ p, a }) => {
        const tags = Array.from(document.querySelectorAll(`meta[${a}^="${p}"]`));
        const seen = new Map();
        tags.forEach(tag => {
          const val = tag.getAttribute(a);
          if (seen.has(val)) seen.get(val).remove();
          seen.set(val, tag);
        });
      });

      const alternates = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]'));
      const langMap = new Map();
      alternates.forEach(el => {
        const lang = el.getAttribute('hreflang');
        if (lang) {
          if (langMap.has(lang)) {
            langMap.get(lang).remove();
          }
          langMap.set(lang, el);
        }
      });

      // Playwright fix: Ensure only ONE description remains
      const finalDescs = document.querySelectorAll('meta[name="description"]');
      if (finalDescs.length > 1) {
          for (let i = 0; i < finalDescs.length - 1; i++) finalDescs[i].remove();
      }

      // CRITICAL: Remove all data-rh attributes which cause React to think it doesn't own the tags
      // OR better, move them all to the top of head.
      // But actually, we just want React 19 to REUSE these tags.
      // Adding 'data-react-pre-rendered="true"' might help?
      // No, React 19 looks for hoisted tags.
    });

    const html = await page.content();
    const routePath = route === '/' ? 'index.html' : `${route.replace(/^\/|\/$/g, '')}/index.html`;
    const filePath = path.join(DIST_DIR, routePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('✅ Pre-rendering complete!');
}

prerender().catch(err => {
  console.error('❌ Pre-rendering failed:', err);
  process.exit(1);
});
