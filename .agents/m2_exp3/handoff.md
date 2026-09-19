# Handoff Report — Explorer M2.3: UI Action Triggers & Vitest Integration Strategy

**Agent**: `explorer_m2_3`  
**Milestone**: Milestone 2 — AppContext CRUD Methods Wiring & UI State Sync  
**Timestamp**: 2026-09-19T16:48:00Z  
**Target Path**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  

---

## 1. Observation

1. **`AppContext.tsx` lacks four CRUD methods**:
   - In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx` (lines 33-114), `AppContextType` only includes `deleteEvent` (line 99).
   - `deleteShift`, `deleteTransfer`, `deleteExpense`, and `archiveBooking` / `deleteBooking` are completely absent from `AppContextType` and `AppProvider`.
   - The hook is exported as `useAppContext` (line 727); no `useApp` alias is exported.
2. **Persistence Adapters already support full CRUD**:
   - `IStoragePort.ts` (lines 39, 47, 56, 64, 72) defines `deleteBooking`, `deleteEvent`, `deleteShift`, `deleteTransfer`, `deleteExpense`.
   - `InMemoryStorageAdapter.ts` (lines 56, 108, 129, 147, 168), `DexieStorageAdapter.ts` (lines 252, 306, 390, 440, 484), and `SupabaseStorageAdapter.ts` (lines 278, 403, 530, 626, 712) all implement these deletion methods.
3. **Critical Ghost Expense Defect in `CompanionTurnSheetModal.tsx`**:
   - In `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`:
     * Line 1152: `onClick={() => handleRemoveExpense(exp.id)}` with `Trash2` icon.
     * Lines 356-358:
       ```tsx
       const handleRemoveExpense = (id: string) => {
         setDailyExpenses((prev) => prev.filter((e) => e.id !== id));
       };
       ```
     * Lines 574-590 (`handleSaveShift`): iterates ONLY over `dailyExpenses` where `exp.isNew`. It **never deletes removed persisted expenses from `storagePort`**. Persisted expenses remain in the database and continue billing to the patient.
4. **Orphaned `EventDetailDrawer.tsx`**:
   - `apps/medicaltrip_react_app/src/features/itinerary/presentation/EventDetailDrawer.tsx` contains complete event creation, editing, and deletion (`deleteEvent` at line 53).
   - In `apps/medicaltrip_react_app/src/App.tsx` (`MainAppLayout`), lines 113-144, `<EventDetailDrawer />` is **never rendered**. Grepping for `<EventDetailDrawer` across the repository returns 0 occurrences. Event deletion via drawer is blocked at runtime.
5. **Direct StoragePort Duck-Typing in `PassengersView.tsx`**:
   - In `apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx` (lines 247-258):
     ```tsx
     if (storagePort && typeof storagePort.deleteBooking === 'function') {
       try {
         await storagePort.deleteBooking(bookingId);
         // ...
       } catch (err) {
         console.warn('Error deleting booking from storagePort:', err);
       }
     }
     ```
   - Directly bypasses `AppContext` to delete bookings and manually switches archetypes.
6. **Existing Vitest Test Inventory**:
   - `npm test` runs 6 test files (53 tests total) in 33.03s:
     * `tests/integration/supabase_crud_domain1_domain2.test.ts` (8 tests)
     * `tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts` (8 tests)
     * `tests/integration/supabase_expenses_settlements_crud.test.ts` (10 tests)
     * `tests/integration/SupabaseCloud_Adversarial_Stress.test.ts` (11 tests)
     * `tests/integration/Challenger_M1_2_Adversarial_Stress.test.ts` (10 tests)
     * `tests/unit/SupabaseStorageAdapter_resilience.test.ts` (6 tests)
   - Zero tests exist for `AppContext`, React state transitions, or UI components.

---

## 2. Logic Chain

1. From **Observation 1 & 2**: `IStoragePort` and `SupabaseStorageAdapter` have fully functioning deletion capabilities, but UI components cannot access them cleanly because `AppContext` omits `deleteShift`, `deleteTransfer`, `deleteExpense`, and `archiveBooking`.
2. From **Observation 3**: Because `AppContext` does not provide `deleteExpense`, `CompanionTurnSheetModal.tsx` attempted a local filter workaround that only modifies React component state without deleting from storage. This creates a data integrity violation (ghost expenses retained in Supabase and ledger).
3. From **Observation 4**: Even though `deleteEvent` is implemented in `AppContext` and `EventDetailDrawer`, the drawer was omitted from `MainAppLayout` in `App.tsx`. Therefore, users cannot trigger event deletion through the UI drawer.
4. From **Observation 5**: `PassengersView` resorted to calling `storagePort.deleteBooking` directly with duck-typing, creating architectural coupling that violates the single source of truth principle.
5. From **Observation 6**: The 53 passing tests only certify the database and use cases. They do not certify `AppContext` reactivity, state filtering, or UI action triggers. Creating a dedicated Vitest suite with `InMemoryStorageAdapter` and `@testing-library/react` (with `happy-dom`) will verify Milestone 2 deterministically.

---

## 3. Caveats

1. **Live Supabase Rate Limits**: The 6 existing integration tests make real HTTP calls to Supabase Cloud taking ~33s. The new AppContext unit test suite must use `InMemoryStorageAdapter` to run in <1s and avoid network flakiness.
2. **DOM Environment Requirement**: `vite.config.ts` does not specify `test: { environment: 'happy-dom' }`. Any React component test files MUST include `// @vitest-environment happy-dom` at line 1.
3. **Modal Dialog Unmounting**: Modals such as `NewPatientModal` and `CompanionTurnSheetModal` check `if (!isOpen) return null;`. Tests asserting modal elements must ensure `isOpen` is `true`.

---

## 4. Conclusion

Milestone 2 requires four concrete remediations:
1. **Wire missing methods into `AppContext.tsx`**:
   - Add `deleteShift`, `deleteTransfer`, `deleteExpense`, `archiveBooking`, `deleteBooking` to `AppContextType` and `AppProvider`.
   - Ensure all mutations optimistically update React state, persist to `storagePort`, and call `recalculateSettlement()`.
   - Export alias `export const useApp = useAppContext;`.
2. **Mount `<EventDetailDrawer />` in `src/App.tsx`**:
   - Place `<EventDetailDrawer />` inside `MainAppLayout` so event edit/delete triggers are functional.
3. **Fix Ghost Expense Bug in `CompanionTurnSheetModal.tsx`**:
   - Delete removed persisted expenses from `storagePort` or call `context.deleteExpense`.
4. **Implement Automated Vitest Suite for Milestone 2**:
   - Create `tests/unit/AppContext_CRUD_StateSync.test.tsx` verifying all CRUD actions and BigInt ledger recalculations with 100% pass rate.

---

## 5. Verification Method

To independently verify these findings:
1. **Run existing test suite**:
   ```bash
   cd apps/medicaltrip_react_app && npm test
   ```
   Confirm 6 test files and 53 tests pass.
2. **Verify missing methods in AppContext**:
   ```bash
   grep -E "deleteShift|deleteTransfer|deleteExpense|archiveBooking" src/presentation/state/AppContext.tsx
   ```
   Confirms 0 results.
3. **Verify orphaned `EventDetailDrawer`**:
   ```bash
   grep -rn "<EventDetailDrawer" src/
   ```
   Confirms 0 results.
4. **Verify ghost expense in `CompanionTurnSheetModal`**:
   Inspect lines 356-358 and lines 574-590 in `src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`.
