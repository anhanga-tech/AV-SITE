import { useEffect, useState } from 'react';

export interface FooterRuntimeMetadata {
  currentYear: string;
  lastUpdatedLabel: string;
}

const ptBrDateFormat = new Intl.DateTimeFormat('pt-BR');

export function useFooterRuntimeMetadata(): FooterRuntimeMetadata | null {
  const [metadata, setMetadata] = useState<FooterRuntimeMetadata | null>(null);

  useEffect(() => {
    const now = new Date();

    // Keep the first render deterministic for prerendered routes (null → no date baked
    // into static HTML), then fill runtime-only labels after mount. This client-only
    // deferral is the intended use of the effect, not redundant derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount hydration of a client-only date, fires once
    setMetadata({
      currentYear: String(now.getFullYear()),
      lastUpdatedLabel: ptBrDateFormat.format(now),
    });
  }, []);

  return metadata;
}
