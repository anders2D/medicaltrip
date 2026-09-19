# FORENSIC AUDIT REPORT — Milestone 2: Admin Cockpit Switcher & Status Pill (R1)

**Auditor**: Forensic Auditor M2 (`auditor_m2_1`)  
**Target Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Target Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-09-14T20:18:00Z  
**Verdict**: **`INTEGRITY VIOLATION`**

---

## 1. Observation

### 1.1 Unshielded Duplicate Global Listener in `AppContext.tsx` (Bypassing 7-Layer Shield)
- **File**: `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx` (lines 570-602)
- **Direct quote**:
  ```tsx
  570:   // Global Keyboard Shortcuts
  571:   useEffect(() => {
  572:     const handleGlobalShortcuts = (e: KeyboardEvent) => {
  573:       const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
  574:       if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
  575:         return;
  576:       }
  577: 
  578:       // 1. Diagnostics shortcut takes top priority
  579:       if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
  580:         e.preventDefault();
  581:         setIsSwarmDiagnosticsOpen((prev) => !prev);
  582:         return;
  583:       }
  584: 
  585:       // 2. Suppress single-key shortcuts when modifier keys are pressed (e.g. Cmd+C, Cmd+A, Cmd+W, Cmd+N)
  586:       if (e.ctrlKey || e.metaKey || e.altKey) {
  587:         return;
  588:       }
  589: 
  590:       if (e.key === '1') {
  591:         e.preventDefault();
  592:         switchArchetype('rva171');
  593:       } else if (e.key === '2') {
  594:         e.preventDefault();
  595:         switchArchetype('rva282');
  596:       } else if (e.key === '3') {
  597:         e.preventDefault();
  598:         switchArchetype('rva341');
  599:       } else if (e.key === '4') {
  600:         e.preventDefault();
  601:         switchArchetype('rva077');
  ```
- **Direct observation**:
  - `AppContext.tsx` attaches a raw `window.addEventListener('keydown', handleGlobalShortcuts)` that hard-intercepts keys `'1'`, `'2'`, `'3'`, and `'4'`.
  - This listener ONLY checks `targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select'`.
  - It completely lacks the Layer 2 (`contenteditable`), Layer 3 (ARIA `textbox`/`searchbox`/`combobox`), Layer 6 (IME composition), Layer 7 (active modal dialogs), and RBAC (`isAdmin`) guards implemented in `useKeyboardShortcuts.ts`.
  - Because `AppProvider` wraps the application, this listener is ALWAYS active in the background.

### 1.2 Parallel Dual-Firing and Keystroke Theft in Runtime
- **File**: `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 74-81)
- **Direct quote**:
  ```tsx
  74:   // Wire 7-layer safety keyboard shortcuts [1]-[4]
  75:   useKeyboardShortcuts({
  76:     enabled: isAdmin,
  77:     onSwitchArchetype: (id) => {
  78:       switchArchetype(id);
  79:       setIsDropdownOpen(false);
  80:     },
  81:     archetypesList,
  82:   });
  ```
- **Direct observation**:
  - In `ArchetypeSwitcherBar.tsx`, `useKeyboardShortcuts` attaches a second `keydown` listener to `window`.
  - When typing inside an element with `contenteditable="true"`, `role="textbox"`, or when a modal dialog is open, `useKeyboardShortcuts` safely returns early without calling `e.preventDefault()`.
  - However, the unshielded listener in `AppContext.tsx` STILL intercepts the event, calls `e.preventDefault()`, and executes `switchArchetype(id)`.
  - Under normal admin conditions, pressing keys 1-4 executes TWO concurrent asynchronous `switchArchetype` calls simultaneously (`loadArchetypeData` invoked twice per keystroke).

### 1.3 Production Build Failure (`npm run build`)
- **Command**: `npm run build` in `apps/medicaltrip_react_app` (`tsc -b && vite build`)
- **Exit Code**: `2`
- **Verbatim Error Output**:
  ```
  > medicaltrip-react-app@1.0.0 build
  > tsc -b && vite build

  tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx(26,23): error TS6133: 'useAppContext' is declared but its value is never read.
  ```

### 1.4 Static Compliance Verified in `ArchetypeSwitcherBar.tsx` & `App.tsx`
- **Styling**: Prohibited class `shadow-2xl` is completely absent from `ArchetypeSwitcherBar.tsx` (verified via exact regex grep: only `shadow-2xs`, `shadow-xs`, and `shadow-md` used).
- **Viewport Accessibility**: `md:hidden` is completely removed from `patient-dropdown-trigger` (line 146). The trigger is unconditionally rendered across desktop and mobile viewports.
- **Status Pill Format**: Verified rendering `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]` with dynamic fallback logic and `<kbd>[{shortcutNum}]</kbd>` badges.
- **SettlementView Key Invalidation**: `src/App.tsx` (line 108) correctly applies `key={activeBooking?.id || activeArchetypeId}` to force atomic remounting upon archetype changes.

---

## 2. Logic Chain

1. **Safety Shield Bypass**:
   - `worker_m2` claimed in `handoff.md` (Section 1.3 & Section 2.1) that global shortcuts `[1]`-`[4]` are protected by a 7-layer safety shield against keystroke theft in `contenteditable` divs, ARIA widgets, and active modal dialogs.
   - However, empirical examination revealed that `AppContext.tsx` still contains legacy lines 590-601 attaching an unshielded global keydown listener to `window`.
   - Because `AppContext.tsx` only filters native `input`, `textarea`, and `select`, any keystroke `'1'`-`'4'` fired within rich-text elements, ARIA inputs, or open modal dialogs is intercepted and swallowed by `AppContext.tsx`.
   - Consequently, the 7-layer safety shield implemented in `useKeyboardShortcuts.ts` is bypassed in the live application context, rendering the safety claims invalid in actual runtime.

2. **State Concurrency & Race Conditions**:
   - Because both `AppContext.tsx` and `ArchetypeSwitcherBar.tsx` attach global listeners for keys `'1'`-`'4'`, every legitimate keydown event dispatches two parallel asynchronous `switchArchetype` calls.
   - Each call executes `loadArchetypeData`, triggering duplicate `storagePort` reads and asynchronous state updates.
   - In rapid sequential bursts, this duplicate async invocation creates promise race conditions, causing state desynchronization.

3. **Compilation Gate Violation**:
   - The production build command `npm run build` executes `tsc -b && vite build`.
   - TypeScript project reference checking fails on `tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx` with error `TS6133: 'useAppContext' is declared but its value is never read`.
   - Under the Integrity Forensics standard, failure of `npm run build` is a blocking condition.

---

## 3. Caveats

- **Isolated Hook Unit Tests Passed**: In `tests/presentation/useKeyboardShortcuts.test.tsx`, tests passed (13/13) because the hook was tested in isolation without mounting `AppProvider`.
- **Targeted Switcher Tests Passed**: In `tests/presentation/AdminCockpitSwitcher.test.tsx`, tests passed (12/12) because tests only checked native `<input>` and `<textarea>` (which both listeners filter), masking the leak in `contenteditable` and modal dialog contexts.
- **Root Cause is Confined**: The remedy is straightforward and localized: deleting lines 590-601 from `src/presentation/state/AppContext.tsx` so that shortcut handling is centralized in `useKeyboardShortcuts.ts`, and removing the unused import in the test file.

---

## 4. Conclusion

**Verdict: `INTEGRITY VIOLATION`**

The work product for Milestone 2 cannot be certified as `CLEAN` due to two critical defects:
1. **Architectural Safety Bypass (Facade Invariant Failure)**: `src/presentation/state/AppContext.tsx` retains duplicate legacy lines 590-601 that bypass the 7-layer safety shield, stealing keystrokes in `contenteditable` and modal dialog contexts, violating non-admin RBAC, and double-firing async state transitions.
2. **Build Gate Failure**: `npm run build` fails with exit code 2 due to `TS6133` in `tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx`.

### Required Remediation for Worker M2
1. **Purge duplicate listener from `AppContext.tsx`**:
   In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`, completely remove lines 590-601 (`if (e.key === '1') ... switchArchetype('rva077')`). Centralize all archetype switching shortcuts exclusively in `useKeyboardShortcuts.ts`.
2. **Fix Compiler Error**:
   In `tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx`, remove unused `useAppContext` on line 26 so `tsc -b` succeeds.

---

## 5. Verification Method

### 5.1 Independent Commands to Reproduce Findings
Run directly in `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`:

```bash
# 1. Reproduce production build compilation failure
npm run build

# 2. Inspect duplicate unshielded listener in AppContext.tsx
grep -n -C 5 "switchArchetype('rva171')" src/presentation/state/AppContext.tsx

# 3. Observe failure of safety shield in presence of AppContext listener
npx vitest run tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx -t "CHAL-M2-05"
```

### 5.2 Invalidation Conditions
This rejection will be overturned to `CLEAN` once:
- Lines 590-601 in `AppContext.tsx` are removed.
- `npm run build` succeeds with exit code 0 (`tsc -b && vite build`).
- `npm test` passes 100% across all suites including `M2ShortcutsSafetyChallenger2.test.tsx`.
