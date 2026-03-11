import { useEffect, RefObject } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref and optionally handles Escape key.
 */
export function useClickOutside(
  refs: (RefObject<HTMLElement> | null)[],
  onOutsideClick: () => void,
  handleEsc: boolean = true
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const isOutside = refs.every(ref =>
        ref && ref.current && !ref.current.contains(event.target as Node)
      );

      if (isOutside) {
        onOutsideClick();
      }
    }

    function handleEscKey(event: KeyboardEvent) {
      if (handleEsc && event.key === 'Escape') {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [refs, onOutsideClick, handleEsc]);
}
