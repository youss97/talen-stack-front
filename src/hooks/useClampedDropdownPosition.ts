import { useLayoutEffect, useState, type RefObject } from "react";

export interface ClampedPosition {
  top: number;
  left: number;
}

/**
 * Position "fixed" pour un popup ancré à un bouton déclencheur, mais toujours contenue dans
 * le viewport — contrairement à un simple `absolute end-0`, qui suppose que le bouton est
 * proche du bord droit de son conteneur (faux par ex. dans le menu mobile déplié du header,
 * où les boutons langue/notifications se retrouvent à gauche de l'écran, poussant le popup
 * entièrement hors-écran à gauche).
 *
 * Deux passes : position provisoire sous/aligné au bouton dès l'ouverture, puis correction
 * une fois le popup rendu (sa largeur réelle connue) pour ne jamais dépasser les bords.
 */
export function useClampedDropdownPosition(
  buttonRef: RefObject<HTMLElement | null>,
  dropdownRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  gap = 8,
  margin = 8,
): ClampedPosition | null {
  const [pos, setPos] = useState<ClampedPosition | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPos(null);
      return;
    }
    const button = buttonRef.current;
    if (!button) return;
    const buttonRect = button.getBoundingClientRect();
    // Position provisoire : alignée au bord droit du bouton (comme end-0), corrigée ci-dessous.
    setPos({ top: buttonRect.bottom + gap, left: buttonRect.right - 320 });
  }, [isOpen, buttonRef, gap]);

  useLayoutEffect(() => {
    if (!isOpen || !pos || !dropdownRef.current || !buttonRef.current) return;
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const clampedLeft = Math.min(
      Math.max(buttonRect.right - dropdownRect.width, margin),
      window.innerWidth - dropdownRect.width - margin,
    );
    const clampedTop = dropdownRect.bottom > window.innerHeight
      ? Math.max(margin, buttonRect.top - dropdownRect.height - gap)
      : pos.top;
    if (Math.abs(clampedLeft - pos.left) > 1 || Math.abs(clampedTop - pos.top) > 1) {
      setPos({ top: clampedTop, left: clampedLeft });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pos?.top, pos?.left]);

  return pos;
}
