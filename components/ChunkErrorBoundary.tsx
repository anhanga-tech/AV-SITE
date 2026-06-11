import React from 'react';

const RELOAD_FLAG = 'chunk_reload_attempted';

interface Props {
  children: React.ReactNode;
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
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'ChunkLoadError';

    if (!isChunkError) {
      throw error;
    }

    const alreadyRetried = sessionStorage.getItem(RELOAD_FLAG) === 'true';

    if (!alreadyRetried) {
      sessionStorage.setItem(RELOAD_FLAG, 'true');
      window.location.reload();
    } else {
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  }

  componentDidMount() {
    if (!this.state.hasError) {
      sessionStorage.removeItem(RELOAD_FLAG);
    }
  }

  render() {
    if (this.state.hasError) {
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