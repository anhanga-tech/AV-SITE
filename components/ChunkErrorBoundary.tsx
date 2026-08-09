import React from 'react';

import { attemptStaleChunkBoundaryReload, isStaleChunkErrorMessage } from '../lib/stale-chunk-recovery';

interface Props {
  children: React.ReactNode;
  /**
   * Overrides the default full-page fallback. Use for boundaries wrapping a
   * small widget rather than routed page content (e.g. AIChat.tsx) — the
   * default `min-h-[40vh]` section reads as a full-page failure and can
   * break layout when it renders in the normal document flow instead of a
   * fixed-position widget's own space.
   */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches "Failed to fetch dynamically imported module" errors that occur
 * when a Vite deployment replaces content-hashed chunks. On first failure,
 * forces a hard reload so the browser picks up the new chunk URLs. If the
 * error persists after the reload, shows a manual-refresh fallback instead
 * of looping indefinitely.
 */
class ChunkErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const isChunkError = isStaleChunkErrorMessage(error?.message) || error?.name === 'ChunkLoadError';

    if (!isChunkError) {
      throw error;
    }

    // Shares its reload budget with the `vite:preloadError` listener in
    // index.tsx (lib/stale-chunk-recovery.ts) — the same failure can reach
    // both, and they must not each reload independently. If the budget is
    // already spent, this falls through to the fallback UI below instead of
    // reloading (or looping) again.
    attemptStaleChunkBoundaryReload();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <section className="min-h-[40vh] flex flex-col items-center justify-center gap-4 bg-white px-4 text-center">
          <p className="text-gray-700 text-lg font-medium">
            Ocorreu um erro ao carregar esta página.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Atualizar página
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;