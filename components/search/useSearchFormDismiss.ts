import { useEffect } from 'react';
import type { OpenPanel } from './types';

type ActivePanel = Exclude<OpenPanel, null>;

export type PanelRegistryEntry = {
  panel: ActivePanel;
  ref: React.RefObject<HTMLDivElement | null>;
};

// Click-outside + Escape dismissal for the search panels. Iterates over a
// registry of { panel, ref } instead of branching per panel: a click outside
// a panel's ref closes that panel (a no-op for panels that aren't open).
export function useSearchFormDismiss(
  registry: PanelRegistryEntry[],
  closePanel: (panel: ActivePanel) => void,
  closeAllPanels: () => void,
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      for (const { panel, ref } of registry) {
        if (ref.current && !ref.current.contains(target)) {
          closePanel(panel);
        }
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAllPanels();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [registry, closePanel, closeAllPanels]);
}
