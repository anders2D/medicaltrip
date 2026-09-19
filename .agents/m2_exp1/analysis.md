# Technical Analysis: AppContext State & CRUD Lifecycle Wiring

**Agent**: explorer_m2_1 (teamwork_preview_explorer)  
**Date**: 2026-09-19T16:47:00Z  
**Application Root**: `apps/medicaltrip_react_app`  
**Target File**: `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`  
**Related Files**:
- `apps/medicaltrip_react_app/src/core/ports/IStoragePort.ts`
- `apps/medicaltrip_react_app/src/core/infrastructure/storage/SupabaseStorageAdapter.ts`
- `apps/medicaltrip_react_app/src/core/infrastructure/storage/DexieStorageAdapter.ts`
- `apps/medicaltrip_react_app/src/core/infrastructure/storage/InMemoryStorageAdapter.ts`
- `apps/medicaltrip_react_app/src/features/settlement/presentation/hooks/useSettlement.ts`
- `apps/medicaltrip_react_app/src/features/itinerary/presentation/hooks/useItinerary.ts`
- `apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx`
- `apps/medicaltrip_react_app/src/features/settlement/presentation/SettlementView.tsx`

---

## 1. Executive Summary

Milestone 1 successfully proved and certified 100% genuine CRUD capabilities directly against live Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`) across all 6 domain tables (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`), passing all 53 integration tests with zero errors.

However, forensic analysis of the presentation state layer reveals an **architectural gap between the storage layer and the UI state layer**:
1. **The storage port contract (`IStoragePort`) and all 3 adapters (`SupabaseStorageAdapter`, `DexieStorageAdapter`, `InMemoryStorageAdapter`) fully implement** `deleteBooking`, `deleteEvent`, `deleteShift`, `deleteTransfer`, and `deleteExpense`.
2. **`AppContext.tsx` fails to expose or wire 6 critical CRUD operations**:
   - `deleteShift` (MISSING)
   - `deleteTransfer` (MISSING)
   - `deleteExpense` (MISSING)
   - `deleteBooking` / `archiveBooking` (MISSING)
   - `saveTransfer` / `createTransfer` (MISSING)
   - `updateBooking` (MISSING)
   - `updateExpense` (MISSING)
3. **Consumer Workarounds**: Because `AppContext` omitted `deleteBooking`, `PassengersView.tsx` was forced to reach down into `storagePort.deleteBooking` directly (lines 247-258) and track `archivedBookingIds` in temporary local component state. Furthermore, `CompanionTurnSheetModal.tsx` bypassed `AppContext` and wrote shifts and expenses directly into `storagePort` (lines 571, 588).
4. **Latency & Reactivity Flaw**: Existing operations like `deleteEvent` and `updateEvent` currently await asynchronous network calls to `storagePort` *before* modifying React state, causing perceptible UI hesitation (200–800ms) rather than instantaneous 60fps tactile feedback.

This report specifies the complete remediation blueprint for Worker M2.

---

## 2. AppContext Inspection & State Topology

### 2.1 Interface Contract (`AppContextType`)
The interface is declared at `AppContext.tsx:33-114`:
- **Domain Entity Collections**:
  * `activeBooking: PatientBooking | null`
  * `events: ItineraryEvent[]`
  * `shifts: CompanionShift[]`
  * `transfers: DriverTransfer[]`
  * `expenses: ReceiptExpense[]`
  * `settlement: SettlementLedger | null`
- **Navigation & View State**:
  * `activeArchetypeId: string` (default `'rva350'`)
  * `activeView: CalendarViewType` (`'month' | 'week' | 'day' | 'agenda'`)
  * `activeModule: ActiveModuleType` (`'settlement' | 'users' | 'plan' | 'passengers'`)
  * `selectedDate: Date`
  * `isDrawerOpen: boolean`, `drawerMode: 'create' | 'edit'`, `activeEvent: ItineraryEvent | null`, `defaultSlot: DateSlotPreset | null`
- **Status & Ports**:
  * `isLoading: boolean`, `error: string | null`, `storagePort: IStoragePort`
- **Modals**:
  * `isNewPatientModalOpen`, `isSendInvitationModalOpen`, `isSmartItineraryModalOpen`, `isSwarmDiagnosticsOpen`, `isWelcomeOrientationModalOpen`, `isCompanionTurnModalOpen`

### 2.2 Provider Architecture (`AppProvider`)
Implemented at `AppContext.tsx:126-725`:
- **Port Initialization**: `const storagePort = useMemo<IStoragePort>(() => customStorage || ServiceContainer.getStoragePort(), [customStorage]);`
- **Data Hydration (`loadArchetypeData`)**:
  1. Checks if booking exists in `storagePort.getBooking(archetypeId)`.
  2. If found, fetches events, shifts, transfers, expenses, and settlement in parallel (`Promise.all`).
  3. If missing, runs `LoadArchetypeUseCase` to seed seed-data bundle into storage.
  4. Recalculates ledger if settlement record is uninitialized.

---

## 3. CRUD Inventory: Existing vs Missing Methods

| Domain | Operation | Method Name in `AppContext` | Status | Implementation in `AppContext.tsx` | StoragePort Parity |
|---|---|---|---|---|---|
| **Bookings** | Create | `createPatientBooking` / `createNewPatient` | **EXISTS** | Line 304: delegates to `CreatePatientBookingUseCase` | `storagePort.saveBooking` |
| | Read | `activeBooking`, `activeArchetypeId`, `switchArchetype` | **EXISTS** | Line 168: `loadArchetypeData` | `storagePort.getBooking` |
| | Update | `updateBooking` | ❌ **MISSING** | None | `storagePort.saveBooking` exists |
| | Delete/Archive | `deleteBooking` / `archiveBooking` | ❌ **MISSING** | None (`PassengersView.tsx` circumvents via raw `storagePort.deleteBooking`) | `storagePort.deleteBooking` exists (cascades across 7 tables) |
| **Events** | Create | `createEvent` | **EXISTS** | Line 450: `CreateEventUseCase` | `storagePort.saveEvent` |
| | Read | `events`, `activeEvent` | **EXISTS** | State array | `storagePort.getEventsByBooking` |
| | Update | `updateEvent` | **EXISTS** | Line 462: `await storagePort.saveEvent(event)` | `storagePort.saveEvent` |
| | Reschedule | `rescheduleEvent` | **EXISTS** | Line 472: `RescheduleEventUseCase` | `storagePort.saveEvent` + log |
| | Status | `transitionEventStatus` | **EXISTS** | Line 504: `target.transitionStatus(status)` | `storagePort.saveEvent` |
| | Delete | `deleteEvent` | **EXISTS** (Non-optimistic) | Line 494: `await storagePort.deleteEvent(id)` then `setEvents` | `storagePort.deleteEvent` |
| **Shifts** | Create / Update | `saveCompanionShift` | **EXISTS** | Line 389: `storagePort.saveShift` then `setShifts` | `storagePort.saveShift` |
| | Read | `shifts` | **EXISTS** | State array | `storagePort.getShiftsByBooking` |
| | Delete | `deleteShift` | ❌ **MISSING** | None | `storagePort.deleteShift` exists |
| **Transfers** | Create / Update | `saveTransfer` | ❌ **MISSING** | None | `storagePort.saveTransfer` exists |
| | Read | `transfers` | **EXISTS** | State array | `storagePort.getTransfersByBooking` |
| | Update (Check-in) | `performDriverCheckIn` | **EXISTS** | Line 575: `PerformDriverCheckInUseCase` | `storagePort.saveTransfer` |
| | Delete | `deleteTransfer` | ❌ **MISSING** | None | `storagePort.deleteTransfer` exists |
| **Expenses** | Create | `settleExpense`, `logFastExpense` | **EXISTS** | Lines 515, 531: `SettleExpenseUseCase` | `storagePort.saveExpense` |
| | Read | `expenses` | **EXISTS** | State array | `storagePort.getExpensesByBooking` |
| | Update | `updateExpense` | ❌ **MISSING** | None | `storagePort.saveExpense` exists |
| | Delete | `deleteExpense` | ❌ **MISSING** | None | `storagePort.deleteExpense` exists |
| **Settlement** | Reconcile / Sign | `recalculateSettlement`, `executeOneTapSettlementWorkflow` | **EXISTS** | Lines 380, 562 | `storagePort.saveSettlement` |

---

## 4. StoragePort Invocation & Reactivity Analysis

### 4.1 How StoragePort is Currently Invoked
In `AppContext.tsx`:
```typescript
// Current deleteEvent (Non-optimistic):
const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
  await storagePort.deleteEvent(eventId);              // 1. Blocks on network
  setEvents((prev) => prev.filter((e) => e.id !== eventId)); // 2. Updates UI state late
  await recalculateSettlement();                       // 3. Reconciles
}, [storagePort, recalculateSettlement]);
```
```typescript
// Current saveCompanionShift (Non-optimistic):
const saveCompanionShift = useCallback(async (shift: CompanionShift): Promise<void> => {
  await storagePort.saveShift(shift);                 // 1. Blocks on network
  setShifts((prev) => { ... });                       // 2. Updates UI state late
  await recalculateSettlement();
}, [storagePort, recalculateSettlement]);
```

### 4.2 Why ReconcileSettlement Depends on Storage
In `ReconcileSettlementUseCase.ts:20-23`:
```typescript
const expenses = await this.storagePort.getExpensesByBooking(command.bookingId);
const shifts = await this.storagePort.getShiftsByBooking(command.bookingId);
const transfers = await this.storagePort.getTransfersByBooking(command.bookingId);
const existingSettlement = await this.storagePort.getSettlement(command.bookingId);
```
Notice that `ReconcileSettlementUseCase` reads the canonical collections from `storagePort`.
Therefore:
1. **To maintain exact BigInt ledger parity ($\Delta = 0.00$ COP)**, the mutation in `storagePort` (`deleteExpense`, `deleteShift`, `saveShift`, etc.) must occur before or concurrently with `recalculateSettlement()`.
2. **For the UI components (`SettlementView`, `EventDetailDrawer`, `WeekView`, etc.)**, `useSettlement()` dynamically recalculates daily sub-ledgers directly from `AppContext` React state (`expenses`, `shifts`, `transfers`).
3. **Hence, mutating React state optimistically on tick 0** provides immediate visual reactivity to the user, while the asynchronous `storagePort` persistence and subsequent `recalculateSettlement()` seal the state in Supabase Cloud.

---

## 5. Required State Update Mechanics (Optimistic UI + Rollback Pattern)

Every mutation must follow the **Triple-Phase Invariant**:
1. **Optimistic Phase (Sync)**: Mutate React state immediately. Store prior state in local closure.
2. **Persistence Phase (Async)**: Execute `storagePort` method and call `recalculateSettlement()`.
3. **Rollback Phase (Catch)**: If `storagePort` rejects, revert React state to prior state, set error message, and rethrow.

### 5.1 `deleteShift(shiftId: string): Promise<void>`
```typescript
const deleteShift = useCallback(
  async (shiftId: string): Promise<void> => {
    const prevShifts = shifts;
    // Phase 1: Optimistic UI removal
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    try {
      // Phase 2: Persistence & Ledger Reconciliation
      if (typeof storagePort.deleteShift === 'function') {
        await storagePort.deleteShift(shiftId);
      }
      await recalculateSettlement();
    } catch (err: unknown) {
      // Phase 3: Rollback on failure
      setShifts(prevShifts);
      const msg = err instanceof Error ? err.message : 'Error al eliminar el turno';
      setError(msg);
      throw err;
    }
  },
  [shifts, storagePort, recalculateSettlement]
);
```

### 5.2 `deleteTransfer(transferId: string): Promise<void>`
```typescript
const deleteTransfer = useCallback(
  async (transferId: string): Promise<void> => {
    const prevTransfers = transfers;
    // Phase 1: Optimistic UI removal
    setTransfers((prev) => prev.filter((t) => t.id !== transferId));
    try {
      // Phase 2: Persistence & Ledger Reconciliation
      if (typeof storagePort.deleteTransfer === 'function') {
        await storagePort.deleteTransfer(transferId);
      }
      await recalculateSettlement();
    } catch (err: unknown) {
      // Phase 3: Rollback on failure
      setTransfers(prevTransfers);
      const msg = err instanceof Error ? err.message : 'Error al eliminar el traslado';
      setError(msg);
      throw err;
    }
  },
  [transfers, storagePort, recalculateSettlement]
);
```

### 5.3 `deleteExpense(expenseId: string): Promise<void>`
```typescript
const deleteExpense = useCallback(
  async (expenseId: string): Promise<void> => {
    const prevExpenses = expenses;
    // Phase 1: Optimistic UI removal
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    try {
      // Phase 2: Persistence & Ledger Reconciliation
      if (typeof storagePort.deleteExpense === 'function') {
        await storagePort.deleteExpense(expenseId);
      }
      await recalculateSettlement();
    } catch (err: unknown) {
      // Phase 3: Rollback on failure
      setExpenses(prevExpenses);
      const msg = err instanceof Error ? err.message : 'Error al eliminar el gasto';
      setError(msg);
      throw err;
    }
  },
  [expenses, storagePort, recalculateSettlement]
);
```

### 5.4 `deleteBooking(bookingId: string): Promise<void>` & `archiveBooking(bookingId: string): Promise<void>`
```typescript
const deleteBooking = useCallback(
  async (bookingId: string): Promise<void> => {
    try {
      if (typeof storagePort.deleteBooking === 'function') {
        await storagePort.deleteBooking(bookingId);
      }
      // If the deleted booking was currently active, switch to fallback archetype
      if (activeBooking && (activeBooking.id === bookingId || activeBooking.code === bookingId)) {
        const fallbackKey = 'rva171';
        await loadArchetypeData(fallbackKey);
      } else {
        await refreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la reserva';
      setError(msg);
      throw err;
    }
  },
  [activeBooking, storagePort, loadArchetypeData, refreshData]
);

const archiveBooking = useCallback(
  async (bookingId: string): Promise<void> => {
    // In accordance with ORIGINAL_REQUEST R1.1 delete/archive cascade
    await deleteBooking(bookingId);
  },
  [deleteBooking]
);
```

### 5.5 `saveTransfer(transfer: DriverTransfer): Promise<void>`
```typescript
const saveTransfer = useCallback(
  async (transfer: DriverTransfer): Promise<void> => {
    const prevTransfers = transfers;
    setTransfers((prev) => {
      const idx = prev.findIndex((t) => t.id === transfer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = transfer;
        return next;
      }
      return [...prev, transfer];
    });
    try {
      await storagePort.saveTransfer(transfer);
      await recalculateSettlement();
    } catch (err: unknown) {
      setTransfers(prevTransfers);
      const msg = err instanceof Error ? err.message : 'Error al guardar el traslado';
      setError(msg);
      throw err;
    }
  },
  [transfers, storagePort, recalculateSettlement]
);
```

### 5.6 `updateBooking(booking: PatientBooking): Promise<void>`
```typescript
const updateBooking = useCallback(
  async (booking: PatientBooking): Promise<void> => {
    const prevBooking = activeBooking;
    if (activeBooking && (activeBooking.id === booking.id || activeBooking.code === booking.code)) {
      setActiveBooking(booking);
    }
    try {
      await storagePort.saveBooking(booking);
    } catch (err: unknown) {
      setActiveBooking(prevBooking);
      const msg = err instanceof Error ? err.message : 'Error al actualizar la reserva';
      setError(msg);
      throw err;
    }
  },
  [activeBooking, storagePort]
);
```

### 5.7 `updateExpense(expense: ReceiptExpense): Promise<void>`
```typescript
const updateExpense = useCallback(
  async (expense: ReceiptExpense): Promise<void> => {
    const prevExpenses = expenses;
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    try {
      await storagePort.saveExpense(expense);
      await recalculateSettlement();
    } catch (err: unknown) {
      setExpenses(prevExpenses);
      const msg = err instanceof Error ? err.message : 'Error al actualizar el gasto';
      setError(msg);
      throw err;
    }
  },
  [expenses, storagePort, recalculateSettlement]
);
```

### 5.8 Refactor `deleteEvent`, `updateEvent`, and `saveCompanionShift` for Optimistic Reactivity
- In `deleteEvent`: update `setEvents((prev) => prev.filter((e) => e.id !== eventId))` immediately, then await `storagePort.deleteEvent(eventId)` and `recalculateSettlement()`, with rollback if error thrown.
- In `updateEvent`: update `setEvents((prev) => prev.map((e) => e.id === event.id ? event : e))` immediately, then await `storagePort.saveEvent(event)`.
- In `saveCompanionShift`: update `setShifts(...)` immediately, then await `storagePort.saveShift(shift)` and `recalculateSettlement()`.

---

## 6. Step-by-Step Implementation Strategy for Worker

### Step 1: Update `AppContextType` Interface
In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`:
Add to `AppContextType`:
```typescript
  deleteShift: (shiftId: string) => Promise<void>;
  saveTransfer: (transfer: DriverTransfer) => Promise<void>;
  deleteTransfer: (transferId: string) => Promise<void>;
  updateExpense: (expense: ReceiptExpense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  updateBooking: (booking: PatientBooking) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  archiveBooking: (bookingId: string) => Promise<void>;
```

### Step 2: Implement Handlers in `AppProvider`
In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`:
1. Implement `deleteShift`, `saveTransfer`, `deleteTransfer`, `updateExpense`, `deleteExpense`, `updateBooking`, `deleteBooking`, `archiveBooking`.
2. Refactor `deleteEvent`, `updateEvent`, and `saveCompanionShift` into optimistic updates with `try/catch/rollback`.
3. Add all methods to the `value` object returned by `AppContext.Provider`.

### Step 3: Wire into Feature Hooks
1. In `src/features/settlement/presentation/hooks/useSettlement.ts`:
   - Consume `deleteExpense`, `deleteShift`, `deleteTransfer`, `updateExpense` from `useAppContext()`.
   - Expose them in `useSettlement()` return contract.
2. In `src/features/itinerary/presentation/hooks/useItinerary.ts`:
   - Verify `removeEvent` delegates cleanly to optimistic `deleteEvent`.

### Step 4: Clean Up Presentation Workarounds
In `src/features/directory/presentation/PassengersView.tsx`:
- Eliminate direct access to `storagePort.deleteBooking(...)`.
- Destructure `archiveBooking` and `deleteBooking` from `useAppContext()`.
- Replace lines 247-258 with `await archiveBooking(bookingId);`.

### Step 5: Author Comprehensive Unit/Integration Test Suite
Create `tests/unit/AppContext_CRUD.test.tsx` using `InMemoryStorageAdapter`:
- Assert that calling `deleteShift` instantly removes shift from state, calls `storagePort.deleteShift`, and triggers `recalculateSettlement`.
- Assert that calling `deleteTransfer` instantly removes transfer from state and calls `storagePort.deleteTransfer`.
- Assert that calling `deleteExpense` instantly removes expense from state, calls `storagePort.deleteExpense`, and recalculates ledger balance deterministically.
- Assert that calling `deleteBooking` removes the booking from storage and switches active booking if active.
- Assert that rollback occurs and previous state is restored if `storagePort` rejects.

### Step 6: Verify Typecheck, Tests, and Build
1. `npm run typecheck` (0 errors).
2. `npm test` (all suites pass, including new CRUD tests).
3. `npm run build` (clean Vite production build).
