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

    // Keep the first render deterministic for prerendered routes, then fill runtime-only labels.
    setMetadata({
      currentYear: String(now.getFullYear()),
      lastUpdatedLabel: ptBrDateFormat.format(now),
    });
  }, []);

  return metadata;
}
