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
  // Match the SSR cache state before hydrating. Only this route's MDX chunk is
  // requested; subsequent blog navigation is handled by the route Suspense boundary.
  // If this chunk fails to load (stale cache, network blip), the vite:preloadError
  // listener above triggers a one-time reload; falling through here would leave the
  // root without hydrateRoot/createRoot, so keep the app bootable regardless.
  try {
    await preloadBlogPostMdxForUrl(window.location.href);
  } catch {
    // The blog body will load via the route's Suspense boundary on client render.
    // Do not block bootstrapping the app on a single chunk.
  }

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
