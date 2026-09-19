# Handoff Report — Reviewer M2-1: Admin Cockpit Switcher & Status Pill (R1)

**Role**: teamwork_preview_reviewer (Lead UI/UX & RBAC Reviewer)  
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/reviewer_m2_1`  
**Target Application**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-09-14T20:17:00Z  
**Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

Direct empirical observations gathered from inspecting code, executing test suites, analyzing the build pipeline, and stress-testing the presentation layer:

### 1.1 `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` Compliance Audit

1. **Eradication of `md:hidden` on Cockpit Switcher Trigger**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 139-147)
   - **Verbatim Code**:
     ```tsx
     <button
       type="button"
       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
       data-testid="patient-dropdown-trigger"
       aria-expanded={isDropdownOpen}
       aria-haspopup="true"
       title={`Cambiar paciente activo (${patientDisplayName})`}
       className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100/90 text-zinc-900 text-xs font-medium transition-all duration-150 cursor-pointer min-h-[34px] shadow-2xs active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shrink-0"
     >
     ```
     * `md:hidden` has been completely purged. The trigger button is visible across desktop ($\ge 1024\text{px}$) and mobile ($< 768\text{px}$).

2. **Persistent Status Pill Format `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 106-110, 148-192)
   - **Verbatim Code**:
     ```tsx
     const reservationCode = activeArchetype?.code?.split('-')[0] || 'RVA171';
     const clinicTag = resolvePrimaryClinic(activeArchetype?.id, activeBooking?.notes);
     const paxCount = activeArchetype?.paxCount || 3;
     const patientDisplayName =
       activeArchetype?.id === 'rva171' ? 'Catia Cortázar' : activeArchetype?.patientName;
     ```
     ```tsx
     {/* Caribbean Island Flag */}
     <span className="text-sm sm:text-base leading-none shrink-0" role="img" aria-label={activeArchetype?.country}>
       {activeArchetype?.countryFlag || '🇨🇼'}
     </span>
     {/* Active Patient Name */}
     <span className="font-semibold text-zinc-900 truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[140px] md:max-w-none">
       {patientDisplayName}
     </span>
     <span className="text-zinc-400 select-none">·</span>
     {/* Reservation Code Badge */}
     <span className="text-[10px] font-mono tabular-nums uppercase px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-bold tracking-wider shrink-0">
       {reservationCode}
     </span>
     <span className="text-zinc-300 select-none font-light hidden xs:inline sm:inline">|</span>
     {/* Assigned Clinic */}
     <span className="font-medium text-zinc-700 truncate max-w-[75px] sm:max-w-[100px] md:max-w-none hidden xs:inline sm:inline">
       {clinicTag}
     </span>
     <span className="text-zinc-400 select-none hidden xs:inline sm:inline">·</span>
     {/* Pax Count */}
     <span className="font-mono tabular-nums text-[11px] text-zinc-600 font-semibold shrink-0 hidden xs:inline sm:inline">
       {paxCount} Pax
     </span>
     {/* Animated Chevron */}
     <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-0.5 ${isDropdownOpen ? 'rotate-180 text-zinc-800' : ''}`} />
     ```
     * Verified exact format: `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
     * Responsive collapse: On viewport widths $< 480\text{px}$ (`xs`), the clinic, pipe, and pax count gracefully hide (`hidden xs:inline sm:inline`), maintaining flag, name, dot, and code badge without navbar overflow.

3. **Lodging Indicators & Summary**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 51-58, 287-298, 363-379)
   - Verified active lodging summary banner:
     `<Hotel className="w-3.5 h-3.5 text-zinc-500 shrink-0" />`
     `<span className="text-[11px] text-zinc-700 font-medium truncate">{resolveLodgingStatus(activeArchetype?.id, activeArchetype?.hotelName)}</span>`
     `<span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold shrink-0">Check-in Activo</span>`
   - Verified per-item lodging status: `resolveLodgingStatus()` maps `rva171` to `Hotel Inntu · Hab 302 (5 Pax)`, `rva282` to `Park 42 · Apto 504 (32 días)`, `rva341` to `Hotel Inntu · Hab 1004 (2 Pax)`, and `rva077` to `Novelty Suites · Hab 408 (12 días)`.

4. **Minimalist Popup (Zero `shadow-2xl`)**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 236-242)
   - **Verbatim Code**:
     ```tsx
     <div
       className={`${
         isDropdownOpen
           ? 'fixed inset-x-3 top-14 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto mt-1.5 z-50 flex flex-col max-h-[85vh] overflow-y-auto'
           : 'hidden'
       } bg-white border border-zinc-200/80 ring-1 ring-zinc-950/5 rounded-xl shadow-md p-2.5 min-w-[300px] sm:min-w-[360px] md:min-w-[400px] gap-2`}
     >
     ```
     * Strict adherence to `.agents/rules/uiux_minimalist_standards.md`: Zero `shadow-xl` or `shadow-2xl`. Clean `shadow-md` and `ring-1 ring-zinc-950/5`.

5. **Semantic `<kbd>` Badges & ARIA Keyshortcuts**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 317, 384-392)
   - **Verbatim Code**:
     ```tsx
     <kbd
       className={`px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold rounded border transition-colors ${
         isActive
           ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
           : 'bg-zinc-100 border-zinc-200/80 text-zinc-500 shadow-2xs'
       }`}
     >
       [{shortcutNum}]
     </kbd>
     ```
     * `<kbd>` element used with `aria-keyshortcuts={String(shortcutNum)}` on parent button.

6. **Prominent `[+ Nuevo Paciente]` Action**:
   - **Location**: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (lines 198-208, 256-269)
   - Both in desktop header (`data-testid="btn-header-new-patient"`) and in dropdown menu header (`data-testid="btn-dropdown-new-patient"`).

---

### 1.2 Automated Tool Execution & Verification Results

1. **`npm run typecheck`**:
   - Command: `tsc --noEmit`
   - Output: Exit code 0. Zero errors.

2. **Target Vitest Suites**:
   - Command: `npx vitest run tests/presentation/AdminCockpitSwitcher.test.tsx tests/presentation/ArchetypeSwitcher.test.tsx`
   - Output:
     ```
     ✓ tests/presentation/AdminCockpitSwitcher.test.tsx (12 tests) 241ms
     ✓ tests/presentation/ArchetypeSwitcher.test.tsx (5 tests) 250ms
     Test Files  2 passed (2)
          Tests  17 passed (17)
     ```
   - Exit code: 0.

3. **Workspace Full Regression Suite (`npm test`)**:
   - Command: `npm test`
   - Output:
     ```
     Test Files  121 passed (121)
          Tests  1156 passed (1156)
       Duration  129.10s
     ```
   - Exit code: 0. 100% pass rate across all 121 suites.

4. **Production Build (`npm run build`)**:
   - Command: `npm run build` (`tsc -b && vite build`)
   - Output:
     ```
     > medicaltrip-react-app@1.0.0 build
     > tsc -b && vite build

     tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx(26,23): error TS6133: 'useAppContext' is declared but its value is never read.
     ```
     * Exit code: 2.
     * Note on `vite build`: When isolated from `tsc -b`, `npx vite build` succeeds cleanly in 3.84s (1,790 modules transformed, production bundles generated in `dist/`).

---

### 1.3 Critical Adversarial Finding: Dual-Listener Collision in `AppContext.tsx`

- **Location**: `src/presentation/state/AppContext.tsx` (lines 570-636)
- **Verbatim Code**:
  ```tsx
  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      // 1. Diagnostics shortcut takes top priority
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsSwarmDiagnosticsOpen((prev) => !prev);
        return;
      }

      // 2. Suppress single-key shortcuts when modifier keys are pressed (e.g. Cmd+C, Cmd+A, Cmd+W, Cmd+N)
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
      ...
  ```
- **Observed Defect**:
  `worker_m2` developed `useKeyboardShortcuts.ts` with a 7-layer safety shield (suppressing keystrokes in `contenteditable`, ARIA `role="textbox"`, active modal dialogs, and non-admin roles) and mounted it in `ArchetypeSwitcherBar.tsx`.
  However, the legacy `handleGlobalShortcuts` listener in `AppContext.tsx` was **never removed or harmonized**.
  `AppContext.tsx`'s listener ONLY inspects `targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select'`.
  When a user types numbers `1`-`4` inside:
  - Any `contenteditable` container or nested element (`<div contenteditable="true"><p><span>1</span></p></div>`)
  - Any ARIA text entry widget (`<div role="textbox">`, `<div role="searchbox">`, `<div role="combobox">`)
  - Any interactive modal dialog (`<NewPatientModal />`, `<SmartItineraryModal />`, etc.)
  - Or when the authenticated user is a `COMPANION` or `PATIENT` (violating RBAC)
  The event bubbles up to `window`. While `useKeyboardShortcuts` safely ignores the event, `AppContext.tsx` intercepts it, calls `e.preventDefault()`, and executes `switchArchetype()`.
  This completely bypasses the 7-layer safety shield and causes state desynchronization and keystroke theft.

---

## 2. Logic Chain

1. **Step 1: Visual and UI Verification**:
   - Code inspection and component tests confirm that `ArchetypeSwitcherBar.tsx` satisfies all UI/UX presentation criteria:
     * `md:hidden` removed.
     * Status Pill renders exact requested format `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
     * Lodging indicators display hotel name and room details.
     * Minimalist styling complies with zero `shadow-2xl`.
     * `<kbd>` badges and `[+ Nuevo Paciente]` actions are prominent.

2. **Step 2: Dual Keyboard Listener Race Condition**:
   - Observation 1.3 proves that two concurrent `window.addEventListener('keydown')` handlers exist in the application:
     * Handler A: `useKeyboardShortcuts.ts` (in `ArchetypeSwitcherBar.tsx`)
     * Handler B: `handleGlobalShortcuts` (in `AppContext.tsx`)
   - Handler A implements strict guards (Layer 1: native inputs; Layer 2: contenteditable; Layer 3: ARIA roles; Layer 4: ancestor containment; Layer 5: modifier keys; Layer 6: IME; Layer 7: modal dialogs; Layer 8: RBAC `isAdmin`).
   - Handler B implements ONLY native input checks (`input`, `textarea`, `select`), omitting contenteditable, ARIA roles, modals, and RBAC.
   - Because events bubble to `window`, Handler B fires on any keypress `1`-`4` not originating directly from an `<input>`, `<textarea>`, or `<select>`.
   - Therefore, Handler B completely negates Handler A's safety shield for all non-native input contexts.

3. **Step 3: Build Pipeline Failure**:
   - `npm run build` runs `tsc -b && vite build`.
   - `tsc -b` fails with exit code 2 due to an unreferenced variable in the test files (`TS6133: 'useAppContext' is declared but its value is never read`).
   - Although the application bundles cleanly with Vite, production release requirements mandate a clean `npm run build` (exit code 0).

4. **Step 4: Conclusion Derivation**:
   - The UI work is of high quality and conforms to design requirements.
   - However, the dual-listener collision in `AppContext.tsx` and the broken `npm run build` command constitute actionable defects that must be resolved before Milestone 2 can be certified.
   - Consequently, the verdict must be **`REQUEST_CHANGES`**.

---

## 3. Caveats

1. **Catia Rodrigues vs. Catia Cortázar**: In the empirical data catalog, the patient's full surname is `Rodrigues`, whereas the business prompt requested `Catia Cortázar`. `worker_m2` resolved this by displaying `Catia Cortázar` in the Status Pill and preserving `Catia Rodrigues` in detailed records. This preserves backwards compatibility with existing test assertions and fulfills the user-facing spec.
2. **Vite Application Build**: The application source code in `src/` builds with 0 errors (`npx vite build` produces the production bundle in `dist/` in 3.84s). The build failure is strictly isolated to TypeScript compilation (`tsc -b`) of test files with `noUnusedLocals: true`.

---

## 4. Conclusion

**Verdict**: **`REQUEST_CHANGES`**

### Required Changes for Worker M2:

1. **Resolve Dual-Listener Collision in `src/presentation/state/AppContext.tsx` (CRITICAL)**:
   - In `AppContext.tsx` (lines 570-636), remove the redundant key listeners for `'1'`, `'2'`, `'3'`, and `'4'` from `handleGlobalShortcuts`.
   - Ensure archetype switching is exclusively handled by `useKeyboardShortcuts.ts`, or integrate the 7-layer safety checks (`isTypingContext`, `isModalDialogOpen`, and `isAdmin` guard) into `AppContext.tsx`'s listener to eliminate the backdoor.

2. **Clean Up Build Compilation for `npm run build` (MAJOR)**:
   - Ensure all files in `tests/presentation/` compile cleanly under `tsc -b` with 0 TypeScript errors (`TS6133`, `TS6198`, `TS1232`).
   - Verify `npm run build` exits with code 0.

---

## 5. Verification Method

### 5.1 Independent Verification Commands

Run directly inside `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`:

```bash
# 1. Verify TypeScript typechecking
npm run typecheck

# 2. Verify target Switcher test suites
npx vitest run tests/presentation/AdminCockpitSwitcher.test.tsx tests/presentation/ArchetypeSwitcher.test.tsx tests/presentation/useKeyboardShortcuts.test.tsx

# 3. Verify adversarial challenger suites (ContentEditable, ARIA widgets, Multi-Window sync)
npx vitest run tests/presentation/M2MultiWindowSyncChallenger1.test.tsx tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx

# 4. Verify full test suite
npm test

# 5. Verify full production build
npm run build
```

### 5.2 Invalidation Conditions
- Any occurrence of `md:hidden` on `data-testid="patient-dropdown-trigger"`.
- Status pill failing to render `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
- Pressing `1`-`4` while focused in `contenteditable`, `role="textbox"`, or while a modal is open resulting in archetype switching.
- `npm run build` failing with non-zero exit code.

### 5.3 Files to Inspect
- `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`
- `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/src/presentation/hooks/useKeyboardShortcuts.ts`
- `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`
- `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/src/App.tsx`

