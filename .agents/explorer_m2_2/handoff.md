# Handoff Report — Explorer M2-2
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Task**: Keyboard Shortcuts `[1]`-`[4]`, Safety Guards & Visual Shortcut Badges Investigation  
**Author**: Explorer M2-2 (`teamwork_preview_explorer`)  
**Date**: 2026-09-14T19:40:00Z  

---

## Executive Summary
This report provides the exhaustive architectural investigation and concrete code blueprints for implementing instant archetype keyboard switching (`[1]`-`[4]`), multi-layer safety guards against keystroke stealing, and Radical Functional Minimalist visual shortcut badges inside the Admin Cockpit Switcher for Medical Trip Colombia S.A.S.

---

## 1. Observation

### 1.1 Current State of Keyboard Shortcuts in AppContext
In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx` (lines 570-636), an inline `handleGlobalShortcuts` listener exists directly inside the 711-line state context provider:
```typescript
// src/presentation/state/AppContext.tsx:571-602
useEffect(() => {
  const handleGlobalShortcuts = (e: KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
      return;
    }

    if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      setIsSwarmDiagnosticsOpen((prev) => !prev);
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.key === '1') {
      e.preventDefault();
      switchArchetype('rva171');
    } else if (e.key === '2') {
      e.preventDefault();
      switchArchetype('rva282');
    } else if (e.key === '3') {
      e.preventDefault();
      switchArchetype('rva341');
    } else if (e.key === '4') {
      e.preventDefault();
      switchArchetype('rva077');
    }
    // ...
```
- **Finding**: While basic switching for keys `1` to `4` exists in `AppContext`, it is tightly coupled inside the main state provider, mixing global DOM event listeners with domain state management.
- **Finding**: There is no role check. If a user is authenticated as `PATIENT` or `COMPANION`, keystrokes `1`-`4` still reach `switchArchetype`, violating strict role isolation.

### 1.2 Current State of ArchetypeSwitcherBar Component
In `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`:
- **Line 81**: The dropdown trigger button contains `className="md:hidden ..."`, hiding the switcher trigger from desktop viewports (>=1024px).
- **Line 147**: The dropdown popup uses `shadow-2xl`, which directly violates Section 2.1 of `.agents/rules/uiux_minimalist_standards.md` ("Prohibición de `shadow-lg`, `shadow-xl`, `shadow-2xl`").
- **Lines 248-256**: Shortcut badges are rendered as plain `<span>` elements with `text-[10px] font-mono`:
  ```tsx
  <span
    className={`text-[10px] font-mono px-1 rounded ${
      isActive ? 'text-zinc-400' : 'text-zinc-400 bg-zinc-100'
    }`}
  >
    [{shortcutNum}]
  </span>
  ```
  They lack semantic `<kbd>` markup, lack `tabular-nums`, lack border definitions, and lack `aria-keyshortcuts` accessibility tags for AOM/CDP tree inspection.

### 1.3 Analysis of Operational Archetypes vs. Raw Entity Data
- In `src/core/infrastructure/data/archetypes.data.ts` (lines 767-824), the 4 canonical, synthesized, and verified operational bundles are:
  1. `rva171`: **Catia Rodrigues** (`RVA171-4`, Curazao, Clofán/CIMA, 5 Pax)
  2. `rva282`: **George Hernandez** (`RVA282-5`, Curazao, Cardio VID, 2 Pax)
  3. `rva341`: **Eduard Hogenboom** (`RVA341-1`, Bonaire/Curazao, Urología CES, 2 Pax)
  4. `rva077`: **Alejandra Rumai** (`RVA077-5`, Curazao, Cirugía HPTU, 4 Pax)
- In the raw WhatsApp chat database (`data/master_entities.json`):
  - `CTZ335-1-Sharella` / `RVA335-1-Sharella` is a raw patient inquiry.
  - `Xiomara` is a raw chat contact.
- In `tests/presentation/ArchetypeSwitcher.test.tsx` (lines 106-136) and `PROJECT.md` (lines 25, 275):
  Keys `1`, `2`, `3`, `4` map to `rva171`, `rva282`, `rva341`, `rva077`.
- **Finding**: The shortcut design must be positional (`archetypesList[idx]`) so that `[1]` always binds to the 1st archetype, `[2]` to the 2nd, `[3]` to the 3rd, and `[4]` to the 4th, while maintaining static ID fallbacks (`rva171`, `rva282`, `rva341`, `rva077`).

### 1.4 Critical Safety Gaps in Keystroke Interception
Across `AppContext.tsx` (line 573) and `CalendarHeader.tsx` (line 38), the current input checks are:
```typescript
const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;
```
Direct empirical vulnerabilities identified:
1. **Rich-text & ContentEditable**: `<div contenteditable="true">` has `tagName === 'DIV'`. Typing numbers `1`-`4` in any editable div triggers patient switching and swallows characters.
2. **ARIA Custom Inputs**: Custom inputs with `role="textbox"` or `role="searchbox"` are not detected.
3. **`document.activeElement` vs `e.target`**: If an event bubbles from an inner element or child node, `e.target` might be a `<span>` inside a container while `document.activeElement` is an input.
4. **Active Modal Dialogs**: When `NewPatientModal`, `SmartItineraryModal`, or `DisbursementModal` is open, pressing `1`-`4` while entering values or dates switches the underlying patient state in the background, causing state corruption.
5. **IME Composition**: Keystrokes during IME composition (`e.isComposing` or `keyCode === 229`) are not ignored.
6. **Operating System Modifiers**: While `e.ctrlKey || e.metaKey || e.altKey` is checked, it must be rigorously protected so browser shortcuts like `Cmd+1`..`Cmd+4` (tab switching in macOS Chrome/Safari) remain completely unaffected.

---

## 2. Logic Chain

1. **Premise 1 (Single Responsibility & Clean Architecture)**:
   DOM event listening for keyboard shortcuts belongs in the Presentation layer as a dedicated, reusable custom hook (`src/presentation/hooks/useKeyboardShortcuts.ts`). Placing it in `AppContext.tsx` bloats the domain state provider and hinders isolated testing.
2. **Premise 2 (Role Boundary Isolation - Milestone 1 Invariant)**:
   Milestone 1 established strict RBAC with zero role bleed. Only users with `ADMIN` role are permitted to switch archetypes or access the multi-case cockpit. Therefore, `useKeyboardShortcuts` must accept an `enabled` flag (or inspect `isAdmin`), immediately returning when disabled or when the user is not an Admin.
3. **Premise 3 (Positional & Fallback Resolution)**:
   By resolving the target archetype via `archetypesList[parseInt(e.key, 10) - 1]?.id` with fallback to `DEFAULT_SHORTCUT_KEY_MAP[key]`:
   - Key `1` -> index 0 (`rva171` / Catia)
   - Key `2` -> index 1 (`rva282` / George)
   - Key `3` -> index 2 (`rva341` / Eduard / Sharella)
   - Key `4` -> index 3 (`rva077` / Alejandra / Xiomara)
   This guarantees 100% decoupling from hardcoded string matching while remaining fully resilient to catalog order.
4. **Premise 4 (Multi-Layer Safety Shield)**:
   To guarantee 0 typing collisions:
   - Layer A: Tag check on both `e.target` and `document.activeElement` for `INPUT`, `TEXTAREA`, `SELECT`.
   - Layer B: `isContentEditable` property and `[contenteditable="true"]` attribute check.
   - Layer C: ARIA role check for `textbox`, `searchbox`, `combobox`.
   - Layer D: `.closest()` traversal for nested elements.
   - Layer E: System modifier check (`e.ctrlKey || e.metaKey || e.altKey`).
   - Layer F: IME composition check (`e.isComposing || e.keyCode === 229`).
   - Layer G: DOM modal check (`[role="dialog"]`, `[aria-modal="true"]`, `dialog[open]`).
5. **Premise 5 (Radical Functional Minimalist Visual Badges)**:
   Following `.agents/rules/uiux_minimalist_standards.md`:
   - Replace `<span>` with semantic `<kbd>` elements.
   - Apply `font-mono tabular-nums text-[10px] font-semibold`.
   - Use hairline borders (`border border-zinc-200/80` or `border-zinc-700`).
   - Light state: `bg-zinc-100 text-zinc-500 shadow-2xs`.
   - Dark/active state: `bg-zinc-800 text-zinc-300 border-zinc-700`.
   - Provide `aria-keyshortcuts="1"` on the parent button for AOM / Chromium CDP accessibility tree inspection.
   - Replace `shadow-2xl` on the dropdown popup with `shadow-md border border-zinc-200`.

---

## 3. Caveats

1. **Historical Patient Names vs. Canonical Archetypes**:
   The prompt references `Catia [1]`, `George [2]`, `Sharella [3]`, `Xiomara [4]`. In the tested application codebase, slot 3 is `rva341` (Eduard CES) and slot 4 is `rva077` (Alejandra HPTU). Our positional design abstracts this completely: pressing key `3` activates the 3rd card and key `4` activates the 4th card, regardless of whether the business displays Eduard or Sharella.
2. **Browser Native Shortcuts**:
   `Cmd+1` through `Cmd+4` (macOS) and `Ctrl+1` through `Ctrl+4` (Windows/Linux) switch browser tabs. The safety guard suppresses shortcut execution when any modifier key is active. Single keys `1`, `2`, `3`, `4` trigger switching only when no modifiers are held.
3. **Testing in Headless Environments**:
   In JSDOM / Vitest, `document.activeElement` defaults to `document.body` unless `.focus()` is called explicitly on the target input. Tests must fire events with `bubbles: true` and verify both focused inputs and window-level dispatch.

---

## 4. Conclusion & Code Blueprints

### 4.1 Blueprint 1: Dedicated Custom Hook `src/presentation/hooks/useKeyboardShortcuts.ts`

```typescript
/**
 * Medical Trip Colombia S.A.S. - useKeyboardShortcuts
 * Presentation Layer Hook
 * 
 * Global keyboard shortcuts listener for instant archetype switching [1]-[4].
 * Invariants:
 * 1. Zero keystroke theft when user is in INPUT, TEXTAREA, SELECT, or contentEditable.
 * 2. Zero collision with browser/system shortcuts (Cmd+1..4, Ctrl+1..4).
 * 3. Zero switching while interactive modal dialogs are open.
 * 4. Strict RBAC: enabled only for Admin users.
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
    if (el.isContentEditable) {
      return true;
    }

    // 3. ARIA text entry roles
    const role = el.getAttribute?.('role')?.toLowerCase();
    if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
      return true;
    }

    // 4. Ancestor containment check
    if (el.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"], [role="searchbox"]')) {
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
    '[role="dialog"], [aria-modal="true"], dialog[open], [data-testid$="-modal"]'
  );
  return modal !== null;
}

export const CANONICAL_SHORTCUT_MAP: Record<string, string> = {
  '1': 'rva171', // Catia Rodrigues
  '2': 'rva282', // George Hernandez
  '3': 'rva341', // Eduard Hogenboom / Sharella
  '4': 'rva077', // Alejandra Rumai / Xiomara
};

export function useKeyboardShortcuts({
  enabled = true,
  onSwitchArchetype,
  archetypesList = [],
  onShortcutTriggered,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 1. Inactive or disabled
      if (!enabled) return;

      // 2. Form input / text editing guard
      if (isTypingContext(e)) return;

      // 3. IME composition guard
      if (e.isComposing || e.keyCode === 229) return;

      // 4. Modifier key guard (preserves Cmd+1..4 for browser tabs)
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
```

### 4.2 Blueprint 2: Export from `src/presentation/hooks/index.ts`
```typescript
export * from './useItinerary';
export * from './useArchetypes';
export * from './useSettlement';
export * from './useSwarmActors';
export * from './useMediaQuery';
export * from './useKeyboardShortcuts';
```

### 4.3 Blueprint 3: Refactored `ArchetypeSwitcherBar.tsx`
Key enhancements to apply in `ArchetypeSwitcherBar.tsx`:
1. Remove `md:hidden` from `patient-dropdown-trigger` so the switcher is omnipresent on desktop and mobile.
2. Hook `useKeyboardShortcuts` with `enabled: isAdmin` and `archetypesList`.
3. Render semantic `<kbd>` shortcut badges inside each dropdown button and on the dropdown header.
4. Replace `shadow-2xl` with `shadow-md border border-zinc-200` to comply with Minimalist Standards.
5. Add `aria-keyshortcuts={String(shortcutNum)}` to each button.

```tsx
// Excerpt from ArchetypeSwitcherBar.tsx
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export const ArchetypeSwitcherBar: React.FC = () => {
  const { archetypesList, activeArchetypeId, switchArchetype } = useArchetypes();
  const { isAdmin, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLElement>(null);

  // Global listener for instant switching [1]-[4] without opening dropdown
  useKeyboardShortcuts({
    enabled: isAdmin,
    onSwitchArchetype: (id) => {
      switchArchetype(id);
      setIsDropdownOpen(false);
    },
    archetypesList,
  });

  // Dropdown list rendering:
  // ...
  {archetypesList.map((archetype, idx) => {
    const isActive = archetype.id === activeArchetypeId;
    const shortcutNum = idx + 1;

    return (
      <button
        key={archetype.id}
        type="button"
        onClick={() => {
          switchArchetype(archetype.id);
          setIsDropdownOpen(false);
        }}
        data-testid={`switcher-${archetype.id}`}
        aria-keyshortcuts={String(shortcutNum)}
        title={`${archetype.patientName} (${archetype.code}) - Atajo [${shortcutNum}]`}
        className={`group relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-left transition-all duration-150 cursor-pointer shrink-0 snap-start touch-manipulation min-h-[44px] active:scale-98 ${
          isActive
            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
            : 'bg-zinc-50/60 hover:bg-zinc-100 text-zinc-700 border-transparent hover:border-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none" role="img" aria-label={archetype.country}>
            {archetype.countryFlag}
          </span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-zinc-900'}`}>
                {archetype.patientName}
              </span>
              <span className={`text-[10px] font-mono tabular-nums uppercase px-1 rounded font-medium ${
                isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200/80 text-zinc-600'
              }`}>
                {archetype.code}
              </span>
            </div>
            <span className={`text-[10px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {archetype.hotelName} &bull; {archetype.paxCount} Pax
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Radical Minimalist <kbd> Badge */}
          <kbd
            className={`px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold rounded border transition-colors ${
              isActive
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                : 'bg-zinc-100 border-zinc-200/80 text-zinc-500 shadow-2xs group-hover:border-zinc-300'
            }`}
            title={`Atajo de teclado: Tecla [${shortcutNum}]`}
          >
            [{shortcutNum}]
          </kbd>
          {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
        </div>
      </button>
    );
  })}
```

### 4.4 Blueprint 4: Unit Test Suite `tests/presentation/useKeyboardShortcuts.test.tsx`
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, isTypingContext } from '../../src/presentation/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts & Safety Guards Unit Suite', () => {
  let switchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    switchFn = vi.fn();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers archetype switch when pressing keys 1 to 4', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });
    expect(switchFn).toHaveBeenCalledWith('rva171');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
    });
    expect(switchFn).toHaveBeenCalledWith('rva282');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
    });
    expect(switchFn).toHaveBeenCalledWith('rva341');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '4', bubbles: true }));
    });
    expect(switchFn).toHaveBeenCalledWith('rva077');
  });

  it('suppresses shortcut when user is typing inside an INPUT', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });

  it('suppresses shortcut when user is typing inside a TEXTAREA', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });

  it('suppresses shortcut when typing inside a contenteditable DIV', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    div.focus();

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      div.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });

  it('suppresses shortcut when modifier keys (Cmd, Ctrl, Alt) are pressed', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    // Cmd+1 (macOS tab switch)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', metaKey: true, bubbles: true }));
    });
    // Ctrl+2 (Windows tab switch)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', ctrlKey: true, bubbles: true }));
    });
    // Alt+3
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', altKey: true, bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });

  it('suppresses shortcut when an interactive modal dialog is open in the DOM', () => {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    document.body.appendChild(modal);

    renderHook(() =>
      useKeyboardShortcuts({
        enabled: true,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });

  it('suppresses shortcut when enabled is false (non-admin session)', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        onSwitchArchetype: switchFn,
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });

    expect(switchFn).not.toHaveBeenCalled();
  });
});
```

---

## 5. Verification Method

### 5.1 Automated Test Execution
Run the following test suites to independently verify implementation integrity:
```bash
# 1. Run ArchetypeSwitcher and adversarial stress tests
cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
npx vitest run tests/presentation/ArchetypeSwitcher.test.tsx tests/adversarial/Milestone1TelemetryAdversarialStress.test.tsx

# 2. Run TypeScript strict typecheck
npm run typecheck

# 3. Run production build verification
npm run build
```

### 5.2 Manual / Visual Verification
1. Log in as Administrator (`admin`).
2. Verify that the Cockpit Switcher is visible on desktop without requiring mobile emulation.
3. Without clicking the dropdown, press `2` on the keyboard: verify the interface switches to George Hernandez (`RVA282-5`) instantaneously without page reload.
4. Click "+ Nuevo Paciente" to open the creation modal. While typing in the patient name field, press `1`, `2`, `3`, `4`: verify the numbers are typed into the input field and the background patient does not switch.
5. Close the modal, open the patient dropdown, and inspect the shortcut badges: verify they render with semantic `<kbd>[1]</kbd>`-`<kbd>[4]</kbd>` styling and clean 1px hairline borders.

### 5.3 Invalidation Conditions
- Any test in `tests/presentation/ArchetypeSwitcher.test.tsx` fails.
- Pressing `Cmd+1` or `Cmd+2` triggers `preventDefault()`, blocking browser tab switching.
- Typing `1` in an input field switches patient state.
- A non-admin user can switch patients via keyboard shortcuts.
