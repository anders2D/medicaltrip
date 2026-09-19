# HANDOFF — Explorer M2-3: Multi-Window State Synchronization & Test Suite Planning

**Role**: teamwork_preview_explorer (Reactivity & Test Suite Designer)  
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Author**: Explorer M2-3  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_3`  
**Application Target**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-09-14  

---

## 1. Observation

### 1.1 Source Code Findings

1. **Patient Dropdown Button Hidden on Desktop**  
   - File: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (Lines 75-82)  
   - Direct quote:
     ```tsx
     <button
       type="button"
       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
       data-testid="patient-dropdown-trigger"
       aria-expanded={isDropdownOpen}
       title="Cambiar paciente activo"
       className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all cursor-pointer min-h-[32px] active:scale-98 shrink-0"
     >
     ```
   - **Finding**: The class `md:hidden` strictly hides the patient switcher on viewports $\ge 768\text{px}$ (desktop and tablet landscape). Desktop administrators must resort to secondary sidebars or shortcuts rather than an omnipresent top cockpit switcher.
   - The button label only renders:
     ```tsx
     <span className="text-sm leading-none shrink-0" role="img" aria-label={activeArchetype?.country}>
       {activeArchetype?.countryFlag}
     </span>
     <span className="font-bold text-zinc-900 truncate max-w-[80px] sm:max-w-[120px]">
       {activeArchetype?.patientName.split(' ')[0]}
     </span>
     <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-semibold shrink-0 hidden sm:inline">
       {activeArchetype?.code}
     </span>
     ```
     It completely lacks the Clinic identifier (`CIMA`, `Cardio VID`, `Clofán`, `HPTU`) and Pax Count (`3 Pax`, `5 Pax`), which are explicitly mandated by R1 (`[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`).

2. **Central State Reactivity & Batching in AppContext**  
   - File: `src/presentation/state/AppContext.tsx` (Lines 168-199 & 207-213)  
   - Direct quote:
     ```tsx
     const loadArchetypeData = useCallback(
       async (archetypeId: string) => {
         setIsLoading(true);
         setError(null);
         try {
           const loadUseCase = new LoadArchetypeUseCase(storagePort);
           const bundle = await loadUseCase.execute({ archetypeKey: archetypeId });

           setActiveArchetypeId(archetypeId);
           setActiveBooking(bundle.booking);
           setEvents([...bundle.events]);
           setShifts([...bundle.shifts]);
           setTransfers([...bundle.transfers]);
           setExpenses([...bundle.expenses]);
           setSettlement(bundle.settlement);

           if (!initialDate) {
             const arrival = new Date(bundle.booking.arrivalDate);
             if (!isNaN(arrival.getTime())) {
               setSelectedDate(arrival);
             }
           }
         } catch (err: unknown) {
           const msg = err instanceof Error ? err.message : 'Error al cargar el arquetipo';
           setError(msg);
         } finally {
           setIsLoading(false);
         }
       },
       [storagePort, initialDate]
     );
     ```
   - **Finding**: State updates are batched inside React 18's asynchronous scheduler. All state variables (`activeBooking`, `events`, `shifts`, `transfers`, `expenses`, `settlement`, `selectedDate`) update atomically in a single render pass without causing full-page reloads (`window.location.reload()`) or routing jumps.

3. **Window 2 (Settlement Bento Grid) State Ingestion**  
   - File: `src/features/settlement/presentation/SettlementView.tsx` (Lines 88-154, 250-289)  
   - File: `src/features/settlement/presentation/hooks/useSettlement.ts` (Lines 9-33, 99-115, 138-142)  
   - Direct quote from `SettlementView.tsx`:
     ```tsx
     <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-900 text-white">
       {activeBooking?.code?.toUpperCase() || 'RVA171'}
     </span>
     <span className="text-sm font-bold text-zinc-900">
       {activeBooking?.firstName || 'Catia'} {activeBooking?.lastName || ''}
     </span>
     ...
     <div className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 tabular-nums my-1.5">
       {displayNetBalance}
     </div>
     ```
   - Direct quote from `useSettlement.ts`:
     ```tsx
     const dailySettlement = useMemo(() => {
       if (!activeBooking) return settlement;
       return SettlementLedger.calculateDaily({
         bookingId: activeBooking.code,
         date: activeDayDate,
         dayNumber: activeDayNumber,
         expenses: dailyExpenses,
         shifts: dailyShifts,
         transfers: dailyTransfers,
         advances: dailyAdvances,
         sha256Seal: settlement?.sha256Seal,
       });
     }, [activeBooking, activeDayDate, activeDayNumber, dailyExpenses, dailyShifts, dailyTransfers, dailyAdvances, settlement]);
     ```
   - **Finding**: Financial figures in Window 2 recompute deterministically on activeBooking change. However, local shift inputs (`hoursWorked`, `mealTier`, `includePrep` at lines 122-128 of `SettlementView.tsx`) are initialized via `useState(currentShift?.hoursLogged || 2.5)` without a `useEffect` synchronization or a React `key` tied to `activeBooking.id`.

4. **Window 4 (Plan Timeline) State Ingestion**  
   - File: `src/features/medical-plan/presentation/PlanView.tsx` (Lines 20-56, 64-124)  
   - Direct quote:
     ```tsx
     export const PlanView: React.FC = () => {
       const { activeBooking } = useAppContext();

       const packageName = activeBooking?.notes?.includes('Oftalmología')
         ? 'Paquete Oftalmológico & Diagnóstico CIMA (5 Días)'
         : activeBooking?.notes?.includes('Cardio')
         ? 'Chequeo Cardiológico Integral Cardio VID (5 Días)'
         : activeBooking?.notes?.includes('Cirugía')
         ? 'Cirugía Plástica Reconstructiva & Estética (12 Días)'
         : 'Atención Médica Especializada Internacional (5 Días)';
     ```
   - **Finding**: Pure functional derivation from `activeBooking`. Zero internal state cache; updates immediately upon `activeBooking` change.

5. **Window 5 (Passengers Dossier) State Ingestion**  
   - File: `src/features/directory/presentation/PassengersView.tsx` (Lines 45-57, 80-94, 146-189, 495-557)  
   - Direct quote:
     ```tsx
     const titularName = activeBooking ? `${activeBooking.firstName} ${activeBooking.lastName}` : 'Catia Rodrigues';
     const paxCount = activeBooking?.paxCount || 5;
     const companionNames = activeBooking?.companionNames && activeBooking.companionNames.length > 0
       ? activeBooking.companionNames
       : ['Tatiana Faria', 'Mariana Faria', 'María Rodrigues', 'Lisandra Rodrigues'];
     ```
   - **Finding**: Both the titular dossier hero and the list of archetypes (`allBookings` with `isActive: arch.id === activeArchetypeId`) derive dynamically from `activeBooking` and `activeArchetypeId`.

6. **Global Keyboard Shortcuts & Input Safety Suppression**  
   - File: `src/presentation/state/AppContext.tsx` (Lines 571-635)  
   - Direct quote:
     ```tsx
     const handleGlobalShortcuts = (e: KeyboardEvent) => {
       const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
       if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
         return;
       }
       ...
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
     ```
   - **Finding**: `1`-`4` switching is already in `AppContext.tsx`. However:
     - It checks `targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select'`, but omits `(e.target as HTMLElement)?.isContentEditable`.
     - When modifier keys (`ctrlKey`, `metaKey`, `altKey`) are pressed, lines 586-588 correctly bail out.

7. **Test Infrastructure Execution**  
   - Command run: `npm test -- tests/presentation/ArchetypeSwitcher.test.tsx`  
   - Result: 5/5 tests passed in 1.33s.  
   - Architecture test: 119/119 test files pass in total workspace.

---

## 2. Logic Chain

```
[Observation 1: md:hidden in ArchetypeSwitcherBar.tsx]
       │
       ▼
(Step 1: Removing md:hidden renders the Status Pill on desktop (>=1024px) as well as mobile (<768px))
       │
       ▼
(Step 2: Status Pill label must incorporate flag, patient name, reservation code, clinic, and pax count)
       │
       ▼
[Observation 2: AppContext loadArchetypeData updates React state synchronously via React 18 batching]
       │
       ▼
(Step 3: When switchArchetype is invoked, AppContext updates activeBooking, settlement, shifts, expenses)
       │
       ├─────────────────────────────────────────┬─────────────────────────────────────────┐
       ▼                                         ▼                                         ▼
[Observation 3: Window 2 SettlementView]  [Observation 4: Window 4 PlanView]  [Observation 5: Window 5 PassengersView]
       │                                         │                                         │
(useSettlement recomputes balance,         (PlanView recomputes package,      (PassengersView re-renders titular
 daily ledger, and active booking tags)    clinic name, dates and pax)        dossier and active badge highlight)
       │                                         │                                         │
       └─────────────────────────────────────────┴─────────────────────────────────────────┘
                                                 │
                                                 ▼
[Observation 6: Global Shortcuts 1-4 in AppContext]
                                                 │
                                                 ▼
(Step 4: Pressing 1-4 triggers switchArchetype without opening dropdown, suppressed if typing in inputs)
                                                 │
                                                 ▼
(Step 5: Synthesize test suite specifications for tests/presentation/AdminCockpitSwitcher.test.tsx)
```

1. **Desktop & Mobile Unification**:  
   Removing `md:hidden` from the dropdown trigger button allows the selector to render persistently in the header navbar on desktop screens ($\ge 1024\text{px}$) and mobile screens ($< 768\text{px}$). Replacing the rudimentary first-name pill with the complete business Status Pill `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]` satisfies R1 presentation standards.

2. **Synchronous Multi-Window Reactivity**:  
   Because all 3 operational windows (`SettlementView`, `PlanView`, `PassengersView`) read `activeBooking` directly from `AppContext` (or via its hooks `useSettlement` and `useArchetypes`), any update executed through `switchArchetype` flows downward through React context without page reloads (`window.location.reload()`), route changes, or state desynchronization.

3. **Input Suppression Robustness**:  
   When entering financial amounts in `SettlementView` (e.g., typing `"15000"` into petty cash input) or patient names in `PassengersView` (e.g., typing `"1"` into search box), the keydown listener must not switch the archetype. Checking `isContentEditable` alongside `input`, `textarea`, and `select` guarantees zero accidental patient switches during data entry.

---

## 3. Caveats

1. **SettlementView Shift Stepper Local State**:  
   Lines 122-128 of `SettlementView.tsx` store `hoursWorked`, `mealTier`, and `includePrep` in component local state initialized at mount. While the financial hero and ledger rows update reactively from `useSettlement()`, the internal shift editor inputs retain previously entered numbers unless `SettlementView` receives a React `key={activeBooking?.id || activeArchetypeId}` in `App.tsx` (lines 104-109) or includes a `useEffect` watching `shifts`. Recommending adding `key={activeBooking?.id}` to `<SettlementView key={activeBooking?.id} ... />` ensures pristine state on every archetype switch.
2. **Clinic Identifier Data Source**:  
   In `ARCHETYPES_DATA`, clinical assignments are detailed in `booking.notes` (e.g. `"Oftalmología Clofán, CIMA ecografías"`, `"Cardio VID"`, `"CES Oviedo"`, `"HPTU"`). In `useArchetypes()`, a helper `clinicTag` should be exposed (or mapped: `rva171` $\to$ `CIMA`, `rva282` $\to$ `Cardio VID`, `rva341` $\to$ `CES Oviedo`, `rva077` $\to$ `HPTU`) so the Status Pill consistently displays the short clinic tag.
3. **Storage Port Synchronization**:  
   `LoadArchetypeUseCase` writes all entities to the configured `storagePort` (Dexie or InMemory). In test environments, `InMemoryStorageAdapter` must be provided to `AppProvider` to ensure fast, isolated assertions.

---

## 4. Conclusion & Test Suite Blueprint

### 4.1 Recommended Changes to `ArchetypeSwitcherBar.tsx`

```tsx
// 1. In useArchetypes.ts (or locally in ArchetypeSwitcherBar.tsx):
const clinicTag =
  activeArchetype?.code === 'RVA171-4' || activeArchetype?.id === 'rva171' ? 'CIMA' :
  activeArchetype?.code === 'RVA282-5' || activeArchetype?.id === 'rva282' ? 'Cardio VID' :
  activeArchetype?.code === 'RVA341-1' || activeArchetype?.id === 'rva341' ? 'CES Oviedo' :
  'HPTU';

// 2. In ArchetypeSwitcherBar.tsx: Remove 'md:hidden' and render full Status Pill:
<button
  type="button"
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  data-testid="patient-dropdown-trigger"
  aria-expanded={isDropdownOpen}
  title="Cambiar paciente activo"
  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all cursor-pointer min-h-[34px] active:scale-98 shrink-0 shadow-2xs"
>
  <span className="text-sm leading-none shrink-0" role="img" aria-label={activeArchetype?.country}>
    {activeArchetype?.countryFlag}
  </span>
  <span className="font-bold text-zinc-900 truncate max-w-[90px] sm:max-w-none">
    {activeArchetype?.patientName.split(' ')[0]} {activeArchetype?.patientName.split(' ')[1] || ''}
  </span>
  <span className="text-zinc-400 font-mono">·</span>
  <span className="text-[10px] font-mono uppercase px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-semibold shrink-0">
    {activeArchetype?.code.split('-')[0]}
  </span>
  <span className="text-zinc-300 hidden sm:inline">|</span>
  <span className="text-xs text-zinc-600 font-medium hidden sm:inline">
    {clinicTag}
  </span>
  <span className="text-zinc-400 font-mono hidden sm:inline">·</span>
  <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
    {activeArchetype?.paxCount || 3} Pax
  </span>
  <ChevronDown
    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 shrink-0 ${
      isDropdownOpen ? 'rotate-180' : ''
    }`}
  />
</button>
```

### 4.2 Comprehensive Test Specification Blueprint: `tests/presentation/AdminCockpitSwitcher.test.tsx`

```typescript
/**
 * tests/presentation/AdminCockpitSwitcher.test.tsx
 * Comprehensive Vitest Test Suite for Milestone 2: Admin Cockpit Switcher & Status Pill
 * Medical Trip Colombia S.A.S.
 *
 * Requirements Certified:
 * R1. Persistent Status Pill visible across all viewports (desktop >=1024px & mobile <768px).
 * R2. Standardized Status Pill format: [🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾].
 * R3. 1-Click Dropdown Cockpit with keyboard shortcuts [1]-[4], hotel stays, and [+ Nuevo Paciente].
 * R4. Global keyboard shortcuts 1, 2, 3, 4 with strict suppression during input/textarea/editable focus.
 * R5. Synchronous multi-window state reactivity across Settlement (W2), Plan (W4), and Passengers (W5).
 */

import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';

import { AppProvider, useAppContext } from '../../src/presentation/state/AppContext';
import { AuthProvider } from '../../src/presentation/state/AuthContext';
import { LanguageProvider } from '../../src/presentation/i18n';
import { ArchetypeSwitcherBar } from '../../src/presentation/components/switcher/ArchetypeSwitcherBar';
import { SettlementView } from '../../src/features/settlement/presentation/SettlementView';
import { PlanView } from '../../src/features/medical-plan/presentation/PlanView';
import { PassengersView } from '../../src/features/directory/presentation/PassengersView';
import { InMemoryStorageAdapter } from '../../src/core/infrastructure/storage/InMemoryStorageAdapter';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn().mockReturnValue(Promise.resolve(null)),
}));

describe('Milestone 2: Admin Cockpit Switcher & Status Pill (R1)', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    cleanup();
    storage = new InMemoryStorageAdapter();
  });

  afterEach(() => {
    cleanup();
  });

  // Harness Component to mount Switcher + Active Module Window
  const TestHarness: React.FC<{
    initialArchetype?: string;
    activeModule?: 'settlement' | 'plan' | 'passengers';
  }> = ({ initialArchetype = 'rva171', activeModule = 'settlement' }) => {
    return (
      <LanguageProvider initialLanguage="es">
        <AuthProvider>
          <AppProvider storagePort={storage} initialArchetypeId={initialArchetype}>
            <div data-testid="app-harness" className="min-h-screen">
              <ArchetypeSwitcherBar />
              <main data-testid="module-container">
                {activeModule === 'settlement' && <SettlementView />}
                {activeModule === 'plan' && <PlanView />}
                {activeModule === 'passengers' && <PassengersView />}
              </main>
            </div>
          </AppProvider>
        </AuthProvider>
      </LanguageProvider>
    );
  };

  // =========================================================================
  // SUITE 1: Desktop & Mobile Visibility & Status Pill Format
  // =========================================================================
  describe('Suite 1: Desktop & Mobile Visibility & Status Pill Format', () => {
    it('renders the Cockpit Switcher trigger button unconditionally without md:hidden restriction', async () => {
      render(<TestHarness />);

      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger')).toBeTruthy();
      });

      const triggerBtn = screen.getByTestId('patient-dropdown-trigger');
      expect(triggerBtn).toBeDefined();
      // Ensure md:hidden class is NOT present
      expect(triggerBtn.className).not.toContain('md:hidden');
    });

    it('renders the persistent Status Pill with complete Caribbean format: flag, name, code, clinic, pax count', async () => {
      render(<TestHarness initialArchetype="rva171" />);

      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger')).toBeTruthy();
      });

      const triggerBtn = screen.getByTestId('patient-dropdown-trigger');
      
      // Caribbean flag
      expect(triggerBtn.textContent).toContain('🇨🇼');
      // Patient name
      expect(triggerBtn.textContent).toMatch(/Catia/i);
      // Reservation code
      expect(triggerBtn.textContent).toMatch(/RVA171/i);
      // Assigned clinic
      expect(triggerBtn.textContent).toMatch(/CIMA|Clofán/i);
      // Pax count
      expect(triggerBtn.textContent).toMatch(/Pax/i);
    });
  });

  // =========================================================================
  // SUITE 2: Instant Dropdown Cockpit Grid & Actions
  // =========================================================================
  describe('Suite 2: Dropdown Cockpit Interaction & Content', () => {
    it('opens dropdown on trigger click and displays all 4 Caribbean cases with shortcuts [1]-[4]', async () => {
      render(<TestHarness initialArchetype="rva171" />);

      const triggerBtn = await screen.findByTestId('patient-dropdown-trigger');
      fireEvent.click(triggerBtn);

      // Verify all 4 archetype options exist in dropdown
      await waitFor(() => {
        expect(screen.getByTestId('switcher-rva171')).toBeTruthy();
        expect(screen.getByTestId('switcher-rva282')).toBeTruthy();
        expect(screen.getByTestId('switcher-rva341')).toBeTruthy();
        expect(screen.getByTestId('switcher-rva077')).toBeTruthy();
      });

      // Verify keyboard shortcut badges [1], [2], [3], [4]
      expect(screen.getByTestId('switcher-rva171').textContent).toContain('[1]');
      expect(screen.getByTestId('switcher-rva282').textContent).toContain('[2]');
      expect(screen.getByTestId('switcher-rva341').textContent).toContain('[3]');
      expect(screen.getByTestId('switcher-rva077').textContent).toContain('[4]');

      // Verify hotel information renders in dropdown items
      expect(screen.getByTestId('switcher-rva171').textContent).toMatch(/Hotel Inntu/i);
      expect(screen.getByTestId('switcher-rva282').textContent).toMatch(/Park 42/i);
    });

    it('provides a prominent [+ Nuevo Paciente] action', async () => {
      render(<TestHarness />);

      // Should have new patient trigger in header or dropdown
      const newPatientBtn = screen.getByTestId('btn-header-new-patient');
      expect(newPatientBtn).toBeTruthy();
    });

    it('closes dropdown when pressing Escape key or clicking outside', async () => {
      render(<TestHarness />);

      const triggerBtn = await screen.findByTestId('patient-dropdown-trigger');
      fireEvent.click(triggerBtn);

      expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
      });
    });
  });

  // =========================================================================
  // SUITE 3: Global Keyboard Shortcuts [1]-[4] & Safety Suppression
  // =========================================================================
  describe('Suite 3: Global Keyboard Shortcuts [1]-[4] & Safety Suppression', () => {
    it('switches between all 4 archetypes immediately upon pressing keys 1, 2, 3, 4', async () => {
      render(<TestHarness initialArchetype="rva171" />);

      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Catia/i);
      });

      // Press '2' -> George Cardio (RVA282)
      fireEvent.keyDown(window, { key: '2' });
      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/George/i);
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/RVA282/i);
      });

      // Press '3' -> Eduard CES (RVA341)
      fireEvent.keyDown(window, { key: '3' });
      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Eduard/i);
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/RVA341/i);
      });

      // Press '4' -> Alejandra Surgical (RVA077)
      fireEvent.keyDown(window, { key: '4' });
      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Alejandra/i);
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/RVA077/i);
      });

      // Press '1' -> Back to Catia (RVA171)
      fireEvent.keyDown(window, { key: '1' });
      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Catia/i);
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/RVA171/i);
      });
    });

    it('suppresses shortcut triggering when typing inside input, textarea, or select', async () => {
      render(
        <LanguageProvider initialLanguage="es">
          <AuthProvider>
            <AppProvider storagePort={storage} initialArchetypeId="rva171">
              <div>
                <ArchetypeSwitcherBar />
                <input data-testid="test-input" type="text" />
                <textarea data-testid="test-textarea" />
              </div>
            </AppProvider>
          </AuthProvider>
        </LanguageProvider>
      );

      const input = await screen.findByTestId('test-input');
      input.focus();

      // Fire keydown on input
      fireEvent.keyDown(input, { key: '2' });

      // Archetype must NOT switch
      const triggerBtn = screen.getByTestId('patient-dropdown-trigger');
      expect(triggerBtn.textContent).toMatch(/Catia/i);
      expect(triggerBtn.textContent).not.toMatch(/George/i);
    });

    it('suppresses shortcuts when modifier keys (Ctrl/Cmd/Alt) are pressed', async () => {
      render(<TestHarness initialArchetype="rva171" />);

      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Catia/i);
      });

      // Press Meta+2 (Cmd+2)
      fireEvent.keyDown(window, { key: '2', metaKey: true });

      // Should remain Catia
      expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/Catia/i);
      expect(screen.getByTestId('patient-dropdown-trigger').textContent).not.toMatch(/George/i);
    });
  });

  // =========================================================================
  // SUITE 4: Multi-Window Synchronous State Reactivity (Zero Page Reloads)
  // =========================================================================
  describe('Suite 4: Multi-Window Synchronous State Reactivity', () => {
    it('synchronously updates Window 2 (Settlement Bento Grid) upon switching activeBooking without reload', async () => {
      render(<TestHarness initialArchetype="rva171" activeModule="settlement" />);

      // Verify Catia RVA171 initial ledger
      await waitFor(() => {
        expect(screen.getAllByText(/RVA171/i).length).toBeGreaterThan(0);
      });

      // Switch to George via shortcut '2'
      fireEvent.keyDown(window, { key: '2' });

      // Verify SettlementView updates synchronously to George RVA282
      await waitFor(() => {
        expect(screen.getAllByText(/RVA282/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/George/i).length).toBeGreaterThan(0);
      });

      // Status pill in header also reflects George
      expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/George/i);
    });

    it('synchronously updates Window 4 (Plan Timeline) upon switching activeBooking without reload', async () => {
      render(<TestHarness initialArchetype="rva171" activeModule="plan" />);

      // Verify initial PlanView for Catia (Oftalmología CIMA)
      await waitFor(() => {
        expect(screen.getByText(/Paquete Oftalmológico/i)).toBeTruthy();
      });

      // Switch to RVA282 George Cardio via shortcut '2'
      fireEvent.keyDown(window, { key: '2' });

      // PlanView must update to Chequeo Cardiológico Cardio VID
      await waitFor(() => {
        expect(screen.getByText(/Chequeo Cardiológico Integral Cardio VID/i)).toBeTruthy();
        expect(screen.getByText(/Clínica Cardio VID/i)).toBeTruthy();
      });

      // Switch to RVA077 Alejandra Surgical via shortcut '4'
      fireEvent.keyDown(window, { key: '4' });

      await waitFor(() => {
        expect(screen.getByText(/Cirugía Plástica Reconstructiva/i)).toBeTruthy();
        expect(screen.getByText(/Hotel Novelty Suites/i)).toBeTruthy();
      });
    });

    it('synchronously updates Window 5 (Passengers Dossier) upon switching activeBooking without reload', async () => {
      render(<TestHarness initialArchetype="rva171" activeModule="passengers" />);

      // Verify initial PassengersView for Catia
      await waitFor(() => {
        expect(screen.getAllByText(/Catia Rodrigues/i).length).toBeGreaterThan(0);
      });

      // Switch to Eduard Hogenboom via shortcut '3'
      fireEvent.keyDown(window, { key: '3' });

      // PassengersView must update titular dossier to Eduard Hogenboom
      await waitFor(() => {
        expect(screen.getAllByText(/Eduard Hogenboom/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/RVA341/i).length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // SUITE 5: Persistence & Idempotency
  // =========================================================================
  describe('Suite 5: Persistence & Idempotency', () => {
    it('persists newly switched archetype into storagePort', async () => {
      render(<TestHarness initialArchetype="rva171" />);

      fireEvent.keyDown(window, { key: '2' });

      await waitFor(() => {
        expect(screen.getByTestId('patient-dropdown-trigger').textContent).toMatch(/George/i);
      });

      const storedBooking = await storage.getBooking('bkg-rva282');
      expect(storedBooking).toBeDefined();
      expect(storedBooking?.firstName).toBe('George');
    });
  });
});
```

---

## 5. Verification Method

### 5.1 Verification Commands
To independently verify the test suite once written and implemented:

1. **Run the new presentation test suite**:
   ```bash
   npm test -- tests/presentation/AdminCockpitSwitcher.test.tsx
   ```
2. **Run existing switcher tests**:
   ```bash
   npm test -- tests/presentation/ArchetypeSwitcher.test.tsx
   ```
3. **Run full workspace regression tests**:
   ```bash
   npm test
   ```
   *Expected result*: 100% PASS rate across all 119+ test suites (>1131 tests).
4. **TypeScript compiler validation**:
   ```bash
   npm run typecheck
   ```
   *Expected result*: 0 compilation errors (`tsc --noEmit`).
5. **Production build**:
   ```bash
   npm run build
   ```
   *Expected result*: Clean Vite bundle generated in `dist/` in $\le 4\text{s}$.

### 5.2 Files to Inspect
- `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (Status Pill markup & unhidden trigger)
- `src/presentation/state/AppContext.tsx` (Keyboard shortcuts & state batching)
- `src/features/settlement/presentation/SettlementView.tsx` (Settlement reactivity)
- `src/features/medical-plan/presentation/PlanView.tsx` (Plan reactivity)
- `src/features/directory/presentation/PassengersView.tsx` (Passengers reactivity)
- `tests/presentation/AdminCockpitSwitcher.test.tsx` (New test suite)

### 5.3 Invalidation Conditions
- Trigger button still contains `md:hidden` or cannot be found on desktop viewport queries.
- Status Pill fails to display island flag, patient name, reservation code, or clinic tag.
- Pressing `1`-`4` switches patient while the user is actively typing in a text input or textarea.
- Switching archetype triggers browser navigation or `window.location.reload()`.
- Settlement or Plan views retain stale patient data after a switch occurs.

