import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { shouldHydratePrerenderedRoute } from './lib/hydration';
import { initClientErrorTracking } from './lib/sentry-client';
import { installTraksWhatsAppClickListener } from './utils/traks';
import { handleStaleChunkPreloadError } from './lib/stale-chunk-recovery';
import { preloadBlogPostMdxForUrl } from './lib/blog-mdx';

// Reload (once per failing asset) on stale-cache preload failures so the
// browser fetches the latest HTML + hashed assets. See
// lib/stale-chunk-recovery.ts for why this deliberately never calls
// event.preventDefault().
window.addEventListener('vite:preloadError', (event: Event & { payload?: unknown }) => {
  handleStaleChunkPreloadError(event);
});

initClientErrorTracking();
installTraksWhatsAppClickListener();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Hydrate only when the prerendered HTML matches the current route.
const prerenderedRoute = document.documentElement.dataset.prerenderRoute;
const hasPrerenderedMarkup =
  document.documentElement.dataset.prerendered === 'true' && rootElement.hasChildNodes();
const canHydrate =
  hasPrerenderedMarkup &&
  shouldHydratePrerenderedRoute(prerenderedRoute, window.location.pathname);

async function bootstrap(appRoot: HTMLElement): Promise<void> {
  // Kick off the article chunk download without blocking the first paint of
  // interactivity: prerendered header/navigation/controls hydrate immediately.
  // On a prerendered blog route the body is already in the server HTML, so the
  // route's Suspense boundary keeps it visible until this resolves; on SPA
  // navigation the boundary waits on the per-article chunk.
  preloadBlogPostMdxForUrl(window.location.href).catch(() => {
    // A failed preload is not fatal: the route's Suspense boundary surfaces the
    // error and vite:preloadError covers the stale-chunk reload case.
  });

  if (canHydrate) {
    ReactDOM.hydrateRoot(
      appRoot,
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    if (hasPrerenderedMarkup) {
      appRoot.replaceChildren();
    }

    const root = ReactDOM.createRoot(appRoot);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

void bootstrap(rootElement);
