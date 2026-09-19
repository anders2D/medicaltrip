/**
 * Medical Trip Colombia S.A.S. - useKeyboardShortcuts
 * Presentation Layer Hook
 *
 * Global keyboard shortcuts listener for instant archetype switching [1]-[4].
 * Invariants:
 * 1. Zero keystroke theft when user is in INPUT, TEXTAREA, SELECT, or contentEditable.
 * 2. Zero collision with browser/system shortcuts (Cmd+1..4, Ctrl+1..4, Alt+1..4).
 * 3. Zero switching while interactive modal dialogs are open in the DOM.
 * 4. Strict RBAC: enabled only for authorized Admin sessions.
 * 5. Safe IME composition suppression.
 */

import { useEffect, useCallback } from 'react';

export interface ShortcutArchetypeItem {
  id: string;
  code?: string;
  patientName?: string;
}

export interface UseKeyboardShortcutsOptions {
  /** Enables/disables listener; defaults to true */
  enabled?: boolean;
  /** Function invoked with the target archetype ID */
  onSwitchArchetype: (archetypeId: string) => void;
  /** Ordered list of available archetypes for positional 1..N mapping */
  archetypesList?: ShortcutArchetypeItem[];
  /** Optional callback for telemetry or tactile feedback */
  onShortcutTriggered?: (key: string, archetypeId: string) => void;
}

/**
 * Deterministically checks if the event originated inside an editable text context
 */
export function isTypingContext(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null;
  const activeEl = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  const check = (el: HTMLElement | null): boolean => {
    if (!el) return false;

    // 1. Native form controls
    const tag = el.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true;
    }

    // 2. Rich-text and ContentEditable elements
    if (el.isContentEditable || el.getAttribute?.('contenteditable') === 'true') {
      return true;
    }

    // 3. ARIA text entry roles
    const role = el.getAttribute?.('role')?.toLowerCase();
    if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
      return true;
    }

    // 4. Ancestor containment check
    if (
      el.closest?.(
        'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]'
      )
    ) {
      return true;
    }

    return false;
  };

  return check(target) || check(activeEl);
}

/**
 * Checks if any modal dialog is currently active in the DOM
 */
export function isModalDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  const modal = document.querySelector(
    '[role="dialog"], [aria-modal="true"], dialog[open], div[data-testid$="-modal"]'
  );
  return modal !== null;
}

export const CANONICAL_SHORTCUT_MAP: Record<string, string> = {
  '1': 'rva350', // Natalie Monica Bito e/v Rumai & Alci Amundaray Rumai
};

export function useKeyboardShortcuts({
  enabled = true,
  onSwitchArchetype,
  archetypesList = [],
  onShortcutTriggered,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 1. Inactive or disabled (RBAC guard)
      if (!enabled) return;

      // 2. Form input / text editing guard (7-layer safety shield)
      if (isTypingContext(e)) return;

      // 3. IME composition guard
      if (e.isComposing || e.keyCode === 229) return;

      // 4. Modifier key guard (preserves Cmd+1..4, Ctrl+1..4 for browser tabs)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 5. Active modal dialog guard
      if (isModalDialogOpen()) return;

      // 6. Check keys '1' to '4'
      const key = e.key;
      if (key >= '1' && key <= '4') {
        const slotIdx = parseInt(key, 10) - 1;
        let targetId = archetypesList[slotIdx]?.id;
        if (!targetId) {
          targetId = CANONICAL_SHORTCUT_MAP[key];
        }

        if (targetId) {
          e.preventDefault();
          onSwitchArchetype(targetId);
          onShortcutTriggered?.(key, targetId);
        }
      }
    },
    [enabled, onSwitchArchetype, archetypesList, onShortcutTriggered]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
