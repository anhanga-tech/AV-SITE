import { useEffect } from 'react';
import type { OpenPanel } from './types';

type ActivePanel = Exclude<OpenPanel, null>;

export type PanelRegistryEntry = {
  panel: ActivePanel;
  ref: React.RefObject<HTMLDivElement | null>;
};

// Click-outside + Escape dismissal for the search panels. Since the panels are
// mutually exclusive, the listeners are only attached while a panel is open and
// a click outside that one panel's ref closes it — no per-panel branching.
export function useSearchFormDismiss(
  registry: PanelRegistryEntry[],
  openPanel: OpenPanel,
  closePanel: (panel: ActivePanel) => void,
  closeAllPanels: () => void,
): void {
  useEffect(() => {
    if (!openPanel) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      const activeEntry = registry.find((entry) => entry.panel === openPanel);
      if (activeEntry?.ref.current && !activeEntry.ref.current.contains(event.target)) {
        closePanel(openPanel);
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
  }, [registry, openPanel, closePanel, closeAllPanels]);
}
