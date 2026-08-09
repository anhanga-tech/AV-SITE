import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { shouldHydratePrerenderedRoute } from './lib/hydration';
import { initClientErrorTracking } from './lib/sentry-client';
import { handleStaleChunkPreloadError } from './lib/stale-chunk-recovery';

// Reload (once per failing asset) on stale-cache preload failures so the
// browser fetches the latest HTML + hashed assets.
window.addEventListener('vite:preloadError', (event: Event & { payload?: unknown }) => {
  handleStaleChunkPreloadError(event);
});

initClientErrorTracking();

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

if (canHydrate) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  if (hasPrerenderedMarkup) {
    rootElement.replaceChildren();
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
