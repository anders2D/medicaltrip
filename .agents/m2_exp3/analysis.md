# Forensic Investigation Report: UI Consumers & Vitest Test Strategy for AppContext CRUD Operations (Milestone 2)

**Agent ID**: `explorer_m2_3`  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/m2_exp3`  
**Target Application**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Milestone**: Milestone 2 — AppContext CRUD Methods Wiring & UI State Sync  
**Timestamp**: 2026-09-19T16:47:00Z  

---

## Executive Summary

This forensic investigation audited the Presentation Layer, State Management (`AppContext.tsx`), and Automated Test Suites (`tests/`) of Medical Trip Colombia S.A.S. (`apps/medicaltrip_react_app`). 

### Core Discoveries:
1. **Missing CRUD Methods in `AppContext.tsx`**: While `IStoragePort`, `InMemoryStorageAdapter`, `DexieStorageAdapter`, and `SupabaseStorageAdapter` fully support `deleteShift`, `deleteTransfer`, `deleteExpense`, and `deleteBooking`, **NONE of these methods exist in `AppContextType` or `AppProvider`**. Only `deleteEvent` is wired.
2. **Critical Ghost Expense Defect in `CompanionTurnSheetModal.tsx`**: The modal provides a `Trash2` icon (`btn-remove-expense-${exp.id}`) that invokes `handleRemoveExpense(id)`. This method **only removes the expense from local component state (`dailyExpenses`)**, leaving persisted expenses untouched in `storagePort`. When the shift is saved, deleted expenses remain in the database and continue corrupting the financial ledger.
3. **Orphaned `EventDetailDrawer.tsx`**: `EventDetailDrawer.tsx` contains the complete UI for creating, editing, and deleting itinerary events (`deleteEvent`). However, **`<EventDetailDrawer />` is NOT rendered anywhere in `src/App.tsx` (`MainAppLayout`)**, making the event edit/delete drawer inaccessible in runtime.
4. **Direct Database Bypasses in UI Components**: 
   - `PassengersView.tsx` uses duck-typing (`typeof storagePort.deleteBooking === 'function'`) to delete bookings directly on `storagePort` and manually orchestrates archetype switching.
   - `CompanionTurnSheetModal.tsx` directly calls `storagePort.saveShift` and `storagePort.saveExpense` instead of using AppContext mutators.
   - `DriverCheckInAction.tsx` directly instantiates `PerformDriverCheckInUseCase(storagePort)` instead of using `performDriverCheckIn` provided by `AppContext`.
5. **Zero Test Coverage for AppContext and UI Reactivity**: The current test suite comprises 6 files (53 tests) executing against Supabase Cloud. All 53 tests are backend/storage integration tests. There are **0 unit tests for `AppContext`**, **0 tests for UI React reactivity**, and **0 component integration tests**. Furthermore, `vite.config.ts` lacks test environment configuration (`happy-dom`).

---

## 1. Architectural Matrix: `AppContext` vs `IStoragePort`

The table below contrasts the persistence capabilities defined in `IStoragePort` against what is currently exposed by `AppContextType` in `src/presentation/state/AppContext.tsx`:

| Domain Entity | Operation | `IStoragePort` | `SupabaseStorageAdapter` | `AppContext.tsx` | Status / Gap |
|---|---|---|---|---|---|
| **Bookings** | Create | `saveBooking` | Implemented | `createPatientBooking` | ✅ Wired |
| | Read | `getBooking`, `getAllBookings` | Implemented | `loadArchetypeData` | ⚠️ Only single booking loaded; `getAllBookings` not in context |
| | Update | `saveBooking` | Implemented | Indirect via Use Cases | ⚠️ No explicit `updateBooking` in context |
| | Delete / Archive | `deleteBooking` | Implemented (Cascading) | **MISSING** | ❌ Missing `archiveBooking` / `deleteBooking` |
| **Events** | Create | `saveEvent` | Implemented | `createEvent` | ✅ Wired |
| | Read | `getEventsByBooking`, `getEventById` | Implemented | `events` state | ✅ Wired |
| | Update / Reschedule | `saveEvent` | Implemented | `updateEvent`, `rescheduleEvent` | ✅ Wired in AppContext (UI triggers missing) |
| | Delete | `deleteEvent` | Implemented | `deleteEvent` | ✅ Wired in AppContext (`EventDetailDrawer` orphaned) |
| **Shifts** | Create | `saveShift` | Implemented | `saveCompanionShift` | ✅ Wired |
| | Read | `getShiftsByBooking`, `getShiftById` | Implemented | `shifts` state | ✅ Wired |
| | Update | `saveShift` | Implemented | `saveCompanionShift` | ✅ Wired |
| | Delete | `deleteShift` | Implemented | **MISSING** | ❌ Missing `deleteShift` in AppContext |
| **Transfers** | Create | `saveTransfer` | Implemented | Direct Use Case | ⚠️ No `createTransfer` in AppContext |
| | Read | `getTransfersByBooking`, `getTransferById` | Implemented | `transfers` state | ✅ Wired |
| | Update / Check-In | `saveTransfer` | Implemented | `performDriverCheckIn` | ✅ Method exists, bypassed by `DriverCheckInAction` |
| | Delete | `deleteTransfer` | Implemented | **MISSING** | ❌ Missing `deleteTransfer` in AppContext |
| **Expenses** | Create | `saveExpense` | Implemented | `settleExpense`, `logFastExpense` | ✅ Wired |
| | Read | `getExpensesByBooking`, `getExpenseById` | Implemented | `expenses` state | ✅ Wired |
| | Update | `saveExpense` | Implemented | Reconcile Use Case | ⚠️ No direct `updateExpense` in AppContext |
| | Delete | `deleteExpense` | Implemented | **MISSING** | ❌ Missing `deleteExpense` in AppContext |
| **Settlement** | Reconcile | `saveSettlement`, `getSettlement` | Implemented | `recalculateSettlement` | ✅ Wired |

---

## 2. In-Depth Audit of Target Presentation Components

### 2.1 `SettlementView.tsx`
- **File**: `apps/medicaltrip_react_app/src/features/settlement/presentation/SettlementView.tsx` (935 lines)
- **AppContext Hook Usage**:
  ```tsx
  // Lines 96-106:
  const {
    activeBooking,
    expenses,
    shifts,
    settlement: contextSettlement,
    storagePort,
    logFastExpense,
    saveCompanionShift,
    refreshData,
    recalculateSettlement,
  } = useAppContext();
  ```
- **Observations & Evidence**:
  1. **Missing Delete Action for Expenses**:
     - Lines 506-519 show aggregate counts:
       ```tsx
       <span className="font-semibold text-zinc-900">Gastos de Caja Menor</span>
       <span className="text-[11px] text-zinc-500 block">{expenses.length} recibos auditados</span>
       ```
     - The Bento Grid (lines 538-776) contains fast expense triggers (`btn-fast-expense-cafe`, `btn-fast-expense-pharmacy`, `btn-fast-expense-lunch`, `btn-fast-expense-taxi`, `btn-fast-expense-toll`), custom concept forms, and quick categories.
     - **Defect**: There is **no UI list or table rendering individual expenses**, and **no delete or cancel button** to remove an incorrect expense. Once logged, an expense cannot be deleted from `SettlementView`.
  2. **Missing Shift Deletion**:
     - Lines 393-470 allow incrementing/decrementing hours worked (`hoursWorked`) for `currentShift = shifts[0]` via `btn-hours-minus` and `btn-hours-plus`, toggling meal subsidies and prep allowance.
     - **Defect**: There is no button to delete a shift. If a shift was registered under the wrong guide or date, the user cannot remove it.
  3. **Direct StoragePort Bypass for Cash Advances**:
     - Lines 213-224 (`handleSaveDisbursement`):
       ```tsx
       const reconcileUseCase = new ReconcileSettlementUseCase(storagePort);
       await reconcileUseCase.execute({
         bookingId: activeBooking.code,
         additionalAdvances: [newAdvance],
       });
       ```
       The component bypasses `AppContext` abstractions and calls `storagePort` directly. Furthermore, there is no UI to view or revert existing cash advances.
  4. **Silent Error Swallowing**:
     - Line 200: `console.error('Error logging fast expense:', err);` — no error notification is given to the user if saving an expense fails.
     - Line 232: `console.error('Error saving advance:', err);` — advances fail silently on network issues.

---

### 2.2 `CompanionTurnSheetModal.tsx`
- **File**: `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx` (1485 lines)
- **AppContext Hook Usage**:
  ```tsx
  // Line 83:
  const { activeBooking, storagePort, refreshData, recalculateSettlement, expenses } = useAppContext();
  ```
- **Observations & Evidence**:
  1. **CRITICAL DEFECT: Ghost Expenses via Incomplete Deletion**:
     - Lines 187-200 synchronize existing expenses into local state `dailyExpenses` when the modal opens:
       ```tsx
       useEffect(() => {
         if (!isOpen) return;
         const existing = (expenses || [])
           .filter((e) => (e.date || '').startsWith(shiftDate))
           .map((e) => ({ id: e.id, ..., isNew: false }));
         if (existing.length > 0) setDailyExpenses(existing);
       }, [isOpen, expenses, shiftDate]);
       ```
     - In the daily expenses list (lines 1150-1159), each item has a delete button:
       ```tsx
       <button
         type="button"
         onClick={() => handleRemoveExpense(exp.id)}
         data-testid={`btn-remove-expense-${exp.id}`}
         title="Eliminar gasto"
       >
         <Trash2 className="w-3.5 h-3.5" />
       </button>
       ```
     - Look at the implementation of `handleRemoveExpense` (lines 356-358):
       ```tsx
       const handleRemoveExpense = (id: string) => {
         setDailyExpenses((prev) => prev.filter((e) => e.id !== id));
       };
       ```
     - And look at `handleSaveShift` (lines 574-590):
       ```tsx
       // Only iterates over dailyExpenses marked as isNew:
       for (const exp of dailyExpenses) {
         if (exp.isNew) {
           const newExpense = new ReceiptExpense(...);
           await storagePort.saveExpense(newExpense);
         }
       }
       ```
     - **Catastrophic Impact**: If an existing expense (`isNew: false`) is removed by the user clicking the Trash icon, it is filtered from local `dailyExpenses`, BUT **NEVER deleted from `storagePort`**! The user sees the expense disappear, clicks "Guardar Turno", and receives a success message. When the modal closes, the expense is reloaded from `storagePort` into `expenses` and still billed to the patient!
  2. **Bypassing AppContext Mutator `saveCompanionShift`**:
     - Line 571: Directly executes `await storagePort.saveShift(newShift);` instead of calling `saveCompanionShift(newShift)`.
  3. **Missing Shift Deletion**:
     - When `initialShift` is passed to the modal (editing an existing shift), there is no "Eliminar Turno" button.

---

### 2.3 `ArrivalTrackingCard.tsx` & `DriverCheckInAction.tsx`
- **Files**:
  - `apps/medicaltrip_react_app/src/features/logistics-fleet/presentation/ArrivalTrackingCard.tsx` (266 lines)
  - `apps/medicaltrip_react_app/src/features/logistics-fleet/presentation/DriverCheckInAction.tsx` (148 lines)
- **Observations & Evidence**:
  1. **Bypassing AppContext's `performDriverCheckIn`**:
     - `AppContext.tsx` lines 575-603 provides `performDriverCheckIn(command)` which updates transfers state in memory, updates events state, and recalculates settlement:
       ```tsx
       const performDriverCheckIn = useCallback(async (command?: Partial<PerformDriverCheckInCommand>) => { ... });
       ```
     - In `DriverCheckInAction.tsx` (lines 38, 55-63):
       ```tsx
       const { storagePort, activeBooking, refreshData, recalculateSettlement } = useAppContext();
       // ...
       const useCase = new PerformDriverCheckInUseCase(storagePort);
       const result = await useCase.execute({ ... });
       ```
       `DriverCheckInAction.tsx` ignores `performDriverCheckIn` and manually invokes the use case, duplicating logic and requiring manual `refreshData()` and `recalculateSettlement()`.
  2. **Missing Transfer Deletion / Cancellation**:
     - `ArrivalTrackingCard` only visualizes the arrival transfer. There is no button or context menu to cancel or delete an erroneous transfer (`deleteTransfer`).

---

### 2.4 `PlanView.tsx` & `EventDetailDrawer.tsx`
- **Files**:
  - `apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx` (733 lines)
  - `apps/medicaltrip_react_app/src/features/itinerary/presentation/EventDetailDrawer.tsx` (180 lines)
- **Observations & Evidence**:
  1. **CRITICAL ARCHITECTURAL DEFECT: Orphaned `EventDetailDrawer.tsx`**:
     - In `EventDetailDrawer.tsx` (lines 48-61):
       ```tsx
       const handleDelete = async () => {
         if (!activeEvent) return;
         if (window.confirm('¿Estás seguro de que deseas eliminar este evento del itinerario?')) {
           setIsDeleting(true);
           try {
             await deleteEvent(activeEvent.id);
             closeDrawer();
           } catch (err) {
             console.error('Error deleting event:', err);
           } finally {
             setIsDeleting(false);
           }
         }
       };
       ```
       This component correctly invokes `deleteEvent(activeEvent.id)`, `createEvent`, and `updateEvent`.
     - **HOWEVER**, searching for `<EventDetailDrawer` across the entire codebase yields **0 matches**.
     - In `src/App.tsx` (`MainAppLayout`), lines 113-144 mount `ReceiptOcrModal`, `DigitalSignaturePad`, `NewPatientModal`, `SendPatientInvitationModal`, `CompanionTurnSheetModal`, `SwarmDiagnosticsModal`, `WelcomeOrientationModal`, but **`<EventDetailDrawer />` is completely omitted**!
     - When keyboard shortcut `c` or `openCreateDrawer()` or `openEditDrawer(event)` is triggered, `isDrawerOpen` becomes `true`, but **nothing renders on screen**. Event deletion via drawer is blocked at runtime!
  2. **`PlanView.tsx` is Read-Only**:
     - `PlanView.tsx` renders the dual clinical timeline and hospital triage contacts, but event cards do not provide an edit, delete, or reschedule action trigger.

---

### 2.5 `PassengersView.tsx`
- **File**: `apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx` (987 lines)
- **AppContext Hook Usage**:
  ```tsx
  // Lines 57-62:
  const {
    activeBooking,
    openNewPatientModal,
    storagePort,
    refreshData,
  } = useAppContext();
  ```
- **Observations & Evidence**:
  1. **Duck-Typing StoragePort Bypass for Deleting Bookings**:
     - Lines 242-276 (`handleArchive`):
       ```tsx
       const handleArchive = async (bookingId: string) => {
         const nextArchived = new Set(archivedBookingIds);
         nextArchived.add(bookingId);
         setArchivedBookingIds(nextArchived);

         if (storagePort && typeof storagePort.deleteBooking === 'function') {
           try {
             await storagePort.deleteBooking(bookingId);
             if (activeBooking && (activeBooking.id === bookingId || activeBooking.code === bookingId)) {
               if (activeBooking.code && activeBooking.code !== bookingId) {
                 await storagePort.deleteBooking(activeBooking.code);
               }
             }
           } catch (err) {
             console.warn('Error deleting booking from storagePort:', err);
           }
         }

         if (activeBooking?.id === bookingId || activeBooking?.code === bookingId || activeArchetypeId === bookingId) {
           const nextRemaining = archetypesList.find(
             (a) => !nextArchived.has(a.id) && !nextArchived.has(a.code)
           );
           if (nextRemaining) {
             switchArchetype(nextRemaining.id);
           }
         }

         if (refreshData) {
           try { await refreshData(); } catch {}
         }
       };
       ```
     - Because `AppContext` does not expose `archiveBooking(bookingId)` or `deleteBooking(bookingId)`, `PassengersView` must check `typeof storagePort.deleteBooking === 'function'`, manage `archivedBookingIds` locally, switch archetypes, and refresh data.
     - If `storagePort.deleteBooking` fails, the error is swallowed with `console.warn`, leaving UI and database in inconsistent states.
  2. **Active Triggers**:
     - Line 428: `btn-archive-booking` calling `handleArchive(...)`
     - Line 438: `btn-delete-booking` calling `handleDelete(...)`
     - Line 963: `btn-archive-${item.id}` calling `handleArchive(item.id)`
     - All 3 buttons exist in DOM and are ready to invoke `AppContext.archiveBooking` once wired!

---

### 2.6 `NewPatientModal.tsx`
- **File**: `apps/medicaltrip_react_app/src/features/onboarding/presentation/NewPatientModal.tsx` (887 lines)
- **AppContext Hook Usage**:
  ```tsx
  // Line 44:
  const context = useAppContext();
  ```
- **Observations & Evidence**:
  1. **Clean Integration**:
     - Lines 288-295 correctly invoke `await context.createPatientBooking(bookingDTO)`.
     - In `AppContext.tsx`:
       `createNewPatient: createPatientBooking,`
       Both `createPatientBooking` and `createNewPatient` are exported on `AppContextType`.
     - Errors are trapped, and `isSubmitting` is cleanly reset in `finally`.
  2. **State Reset on New Booking**:
     - When a booking is created, `AppContext` sets:
       `setEvents([])`, `setShifts([])`, `setTransfers([])`, `setExpenses([])`, and initializes an empty settlement ledger.

---

## 3. Forensic Review of Existing Automated Test Suites (`tests/`)

### 3.1 Test Suite Inventory
Executing `npm test` runs 6 test files in `apps/medicaltrip_react_app/tests/`:
```
 ✓ tests/unit/SupabaseStorageAdapter_resilience.test.ts (6 tests)
 ✓ tests/integration/Challenger_M1_2_Adversarial_Stress.test.ts (10 tests)
 ✓ tests/integration/SupabaseCloud_Adversarial_Stress.test.ts (11 tests)
 ✓ tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts (8 tests)
 ✓ tests/integration/supabase_crud_domain1_domain2.test.ts (8 tests)
 ✓ tests/integration/supabase_expenses_settlements_crud.test.ts (10 tests)

 Test Files  6 passed (6)
      Tests  53 passed (53)
   Duration  33.03s
```

### 3.2 Coverage Gap Analysis
| Test Area | Current Tests | Gap Description |
|---|---|---|
| **Storage Layer CRUD (Supabase)** | 53 tests | Fully certified in Milestone 1 |
| **AppContext CRUD Methods** | **0 tests** | `deleteShift`, `deleteTransfer`, `deleteExpense`, `archiveBooking`, `rescheduleEvent` have zero tests in AppContext |
| **React State Reactivity** | **0 tests** | Zero assertions confirming that calling a delete method reduces array lengths (`shifts`, `transfers`, `expenses`, `events`) |
| **Deterministic Math State Sync** | **0 tests** | Zero tests confirming that `deleteExpense` or `deleteShift` updates `settlement` in AppContext React state |
| **Component Action Triggers** | **0 tests** | Zero tests rendering `SettlementView`, `EventDetailDrawer`, `PassengersView`, `CompanionTurnSheetModal`, `ArrivalTrackingCard` |
| **Vitest DOM Environment** | Missing | `vite.config.ts` does not set `test: { environment: 'happy-dom' }`. Tests rendering React components fail unless annotated with `// @vitest-environment happy-dom` |

---

## 4. Comprehensive Milestone 2 Automated Verification Test Plan

To certify Milestone 2 with 100% pass rate and zero regressions, we define a two-tier testing strategy:
1. **Tier 1: Fast Deterministic In-Memory AppContext CRUD Suite** (`tests/unit/AppContext_CRUD_StateSync.test.tsx`):
   - Fast (<1s execution) using `InMemoryStorageAdapter`.
   - Tests all AppContext CRUD actions in isolation, confirming React state updates, array filtering, and deterministic BigInt cents recalculations.
2. **Tier 2: UI Presentation & Action Triggers Suite** (`tests/presentation/UI_CRUD_ActionTriggers.test.tsx`):
   - Renders components (`EventDetailDrawer`, `PassengersView`, `CompanionTurnSheetModal`, `SettlementView`) wrapped in `<AppProvider>`.
   - Tests button clicks, modal submissions, and optimistic UI transitions.
3. **Tier 3: Supabase Cloud AppContext Integration Suite** (`tests/integration/AppContext_Supabase_StateSync.test.ts`):
   - Connects `AppProvider` to `SupabaseStorageAdapter`.
   - Certifies that mutations triggered via AppContext persist cleanly to Supabase REST API endpoints.

---

### Detailed Test Specifications

#### Test Suite 1: `AppContext_CRUD_StateSync.test.tsx`
*Environment*: `@vitest-environment happy-dom`  
*Storage*: `InMemoryStorageAdapter`  

1. **`deleteShift` Lifecycle**:
   - Given an `AppProvider` with 2 shifts in `shifts` state ($15.500/h and $31.000/h).
   - When calling `deleteShift(shift1.id)`.
   - Then:
     - `shifts` array length becomes 1.
     - `shifts.find(s => s.id === shift1.id)` is `undefined`.
     - `storagePort.getShiftsByBooking(bookingCode)` does not contain `shift1.id`.
     - `recalculateSettlement()` executes automatically, and `settlement.totalGuideFees` decreases by exactly `shift1.calculateTotalFee()`.
     - Mathematical determinism holds: `netBalance` updates with $\Delta = 0.00$ COP drift.

2. **`deleteTransfer` Lifecycle**:
   - Given an `AppProvider` with 2 transfers in `transfers` state (`TRF-01`, `TRF-02`).
   - When calling `deleteTransfer('TRF-01')`.
   - Then:
     - `transfers` array length becomes 1.
     - `storagePort.getTransfersByBooking(bookingCode)` does not contain `'TRF-01'`.

3. **`deleteExpense` Lifecycle**:
   - Given an `AppProvider` with 3 expenses ($15.000 COP café, $185.000 COP pharmacy, $90.000 COP taxi).
   - When calling `deleteExpense(pharmacyExpense.id)`.
   - Then:
     - `expenses` array length becomes 2.
     - `storagePort.getExpensesByBooking(bookingCode)` does not contain `pharmacyExpense.id`.
     - `settlement.totalExpenses.cents` decreases by exactly `18500000n` ($185.000,00 COP).
     - `settlement.netBalance` recalculates deterministically.

4. **`archiveBooking` / `deleteBooking` Lifecycle**:
   - Given 2 active bookings in `storagePort` (`RVA171`, `RVA350`).
   - When calling `archiveBooking('RVA171')`.
   - Then:
     - `storagePort.getBooking('RVA171')` returns `null`.
     - All related events, shifts, transfers, expenses, and settlements are cascaded and cleared from storage.
     - `AppContext` switches `activeBooking` to the next available booking (`RVA350`).

5. **`rescheduleEvent` State Synchronization**:
   - Given an active event scheduled at 08:00 AM.
   - When calling `rescheduleEvent(event.id, '2026-09-15T14:00:00.000Z', '2026-09-15T16:00:00.000Z', 'Clínica Clofán')`.
   - Then:
     - `events` array in React state updates the target event in-place.
     - `storagePort.getEventById(event.id)` reflects the updated timestamp and location.
     - A domain event record `EVENT_RESCHEDULED` is appended to the event stream.

6. **`useApp` Export Alias**:
   - Assert `useApp === useAppContext`.

---

#### Test Suite 2: `UI_CRUD_ActionTriggers.test.tsx`
*Environment*: `@vitest-environment happy-dom`  

1. **`EventDetailDrawer` Mount & Delete Event Trigger**:
   - Render `MainAppLayout` with `drawerMode = 'edit'` and `isDrawerOpen = true`.
   - Assert `data-testid="event-detail-drawer"` is visible in the DOM (verifying it is mounted in `MainAppLayout`).
   - Click `data-testid="btn-delete-event"`.
   - Assert `deleteEvent` is called, and `isDrawerOpen` transitions to `false`.

2. **`PassengersView` Archive & Delete Button Action**:
   - Render `PassengersView` with `AppProvider`.
   - Click `data-testid="btn-archive-booking"`.
   - Assert `archiveBooking` / `deleteBooking` is invoked and the booking is removed.

3. **`CompanionTurnSheetModal` Ghost Expense Fix Verification**:
   - Render `CompanionTurnSheetModal` with an existing persisted expense.
   - Click `data-testid="btn-remove-expense-${exp.id}"`.
   - Click `data-testid="btn-save-companion-turn"`.
   - Assert the removed expense is deleted from `storagePort` (confirming the ghost expense bug is eradicated).

4. **`DriverCheckInAction` Hook Integration**:
   - Render `DriverCheckInAction`.
   - Click `data-testid="btn-driver-check-in"`.
   - Assert driver check-in completes and UI displays `data-testid="driver-checked-in-badge"`.

---

## 5. Required Implementations for Milestone 2

To satisfy the contracts and resolve the findings, the following concrete modifications are required in `apps/medicaltrip_react_app`:

1. **`src/presentation/state/AppContext.tsx`**:
   - Add to `AppContextType`:
     ```typescript
     deleteShift: (shiftId: string) => Promise<void>;
     deleteTransfer: (transferId: string) => Promise<void>;
     deleteExpense: (expenseId: string) => Promise<void>;
     archiveBooking: (bookingId: string) => Promise<void>;
     deleteBooking: (bookingId: string) => Promise<void>;
     ```
   - Implement handlers in `AppProvider`:
     - `deleteShift`: calls `storagePort.deleteShift(shiftId)`, removes from `shifts` state, and awaits `recalculateSettlement()`.
     - `deleteTransfer`: calls `storagePort.deleteTransfer(transferId)`, removes from `transfers` state.
     - `deleteExpense`: calls `storagePort.deleteExpense(expenseId)`, removes from `expenses` state, and awaits `recalculateSettlement()`.
     - `archiveBooking` / `deleteBooking`: calls `storagePort.deleteBooking(bookingId)`, switches to next archetype, and refreshes data.
   - Export alias: `export const useApp = useAppContext;`.

2. **`src/App.tsx` (`MainAppLayout`)**:
   - Import and render `<EventDetailDrawer />` inside `MainAppLayout` (lines 113-144) so that event creation, editing, and deletion become operational in runtime.

3. **`src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`**:
   - In `handleRemoveExpense(id)`: track deleted existing expense IDs (`deletedExpenseIds`).
   - In `handleSaveShift()`: iterate over `deletedExpenseIds` and execute `await storagePort.deleteExpense(id)` (or call `deleteExpense` from `useAppContext()`).

4. **`src/features/directory/presentation/PassengersView.tsx`**:
   - Refactor `handleArchive` and `handleDelete` to call `context.archiveBooking(bookingId)` / `context.deleteBooking(bookingId)`.

5. **`src/features/logistics-fleet/presentation/DriverCheckInAction.tsx`**:
   - Refactor `handleCheckIn` to call `performDriverCheckIn` from `useAppContext()` directly.
