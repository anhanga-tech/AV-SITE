import { useEffect, useState } from 'react';

export interface FooterRuntimeMetadata {
  currentYear: string;
  lastUpdatedLabel: string;
}

export function useFooterRuntimeMetadata(): FooterRuntimeMetadata | null {
  const [metadata, setMetadata] = useState<FooterRuntimeMetadata | null>(null);

  useEffect(() => {
    const now = new Date();

    // Keep the first render deterministic for prerendered routes, then fill runtime-only labels.
    setMetadata({
      currentYear: String(now.getFullYear()),
      lastUpdatedLabel: new Intl.DateTimeFormat('pt-BR').format(now),
    });
  }, []);

  return metadata;
}
