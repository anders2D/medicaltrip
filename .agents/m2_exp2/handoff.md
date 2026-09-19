# Handoff Report: IStoragePort & Storage Adapters CRUD Contract Compliance

**Agent**: `explorer_m2_2`  
**Milestone**: Milestone 2 — AppContext CRUD Methods Wiring & UI State Sync  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2`  
**Target Analysis**: `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2/analysis.md`

---

## 1. Observation

1. **Storage Port Interface (`src/core/ports/IStoragePort.ts`)**:
   - `deleteBooking?(bookingId: string): Promise<void>;` (Line 39)
   - `deleteEvent(eventId: string): Promise<void>;` (Line 47, non-optional)
   - `deleteShift?(shiftId: string): Promise<void>;` (Line 56)
   - `deleteTransfer?(transferId: string): Promise<void>;` (Line 64)
   - `deleteExpense?(expenseId: string): Promise<void>;` (Line 72)
   - `updateEvent` is **not defined** on `IStoragePort`. The port defines `saveEvent(event: ItineraryEvent): Promise<void>` (Line 44).
   - `archiveBooking` is **not defined** on `IStoragePort`.

2. **Supabase Storage Adapter (`src/core/infrastructure/storage/SupabaseStorageAdapter.ts`)**:
   - Implements `deleteBooking(bookingId: string): Promise<void>` (Lines 278–300). Resolves matching IDs and codes via `resolveBookingIds(bookingId)` and executes `Promise.allSettled` cascading deletion across 7 child tables: `bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`.
   - Implements `deleteEvent(eventId: string): Promise<void>` (Lines 403–413). Calls `this.fallback.deleteEvent(eventId)` and `this.client.from('events').delete().eq('id', eventId)`.
   - Implements `deleteShift(shiftId: string): Promise<void>` (Lines 530–540). Calls `this.fallback.deleteShift(shiftId)` and `this.client.from('shifts').delete().eq('id', shiftId)`.
   - Implements `deleteTransfer(transferId: string): Promise<void>` (Lines 626–636). Calls `this.fallback.deleteTransfer(transferId)` and `this.client.from('transfers').delete().eq('id', transferId)`.
   - Implements `deleteExpense(expenseId: string): Promise<void>` (Lines 712–722). Calls `this.fallback.deleteExpense(expenseId)` and `this.client.from('expenses').delete().eq('id', expenseId)`.
   - Error Handling:
     - PostgREST HTTP 406 (`PGRST116`) is eliminated via `.maybeSingle()` and `.limit(1)` in `getBooking` (Lines 120–145) and `getEventById` (Lines 389–392).
     - Deletions are wrapped in `try/catch` and do NOT throw (swallowed gracefully after logging/handling locally).
     - Mutations (`saveBooking`, `saveEvent`, `saveShift`, `saveTransfer`, `saveExpense`, `saveSettlement`) log `console.warn` upon Cloud errors and do not throw, preserving data in `this.fallback`.

3. **Dexie Storage Adapter (`src/core/infrastructure/storage/DexieStorageAdapter.ts`)**:
   - Implements `deleteBooking(bookingId: string)` (Lines 252–254): executes `this.db.bookings.delete(bookingId)`. **Does NOT cascade delete** related records from `events`, `shifts`, `transfers`, `expenses`, or `settlements`.
   - Implements `deleteEvent(eventId: string)` (Lines 306–308): executes `this.db.events.delete(eventId)`.
   - Implements `deleteShift(shiftId: string)` (Lines 390–392): executes `this.db.shifts.delete(shiftId)`.
   - Implements `deleteTransfer(transferId: string)` (Lines 440–442): executes `this.db.transfers.delete(transferId)`.
   - Implements `deleteExpense(expenseId: string)` (Lines 484–486): executes `this.db.expenses.delete(expenseId)`.

4. **In-Memory Storage Adapter (`src/core/infrastructure/storage/InMemoryStorageAdapter.ts`)**:
   - Implements `deleteBooking(bookingId: string)` (Lines 56–85) with cascading deletion across `events`, `shifts`, `transfers`, `expenses`, and `settlements` matching `bookingId`.
   - Implements `deleteEvent(eventId: string)` (Lines 108–110).
   - Implements `deleteShift(shiftId: string)` (Lines 129–131).
   - Implements `deleteTransfer(transferId: string)` (Lines 147–149).
   - Implements `deleteExpense(expenseId: string)` (Lines 168–170).

5. **Application Context (`src/presentation/state/AppContext.tsx`)**:
   - Defines `AppContextType` (Lines 33–114).
   - Contains `deleteEvent: (eventId: string) => Promise<void>` (Line 99) and `updateEvent: (event: ItineraryEvent) => Promise<void>` (Line 92).
   - **Does NOT define** `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking`, or `archiveBooking` in `AppContextType`.
   - In `PassengersView.tsx` (Lines 247–258), the view attempts to delete a booking by bypassing context actions:
     `if (storagePort && typeof storagePort.deleteBooking === 'function') { await storagePort.deleteBooking(bookingId); ... }`

6. **Current Test Run**:
   - Command: `npm test` in `apps/medicaltrip_react_app`.
   - Output: 6 test files passed, 53 tests passed (Duration: 34.92s).
   - Command: `npm run typecheck` (`tsc --noEmit`).
   - Output: 0 errors.

---

## 2. Logic Chain

1. **Step 1 (Observation 1 & 2)**: All three storage adapters implement `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking`, and `deleteEvent`. Therefore, the infrastructure layer is 100% prepared to execute all deletions against Supabase Cloud REST API, Dexie IndexedDB, and In-Memory storage.
2. **Step 2 (Observation 5)**: In `AppContext.tsx`, `deleteEvent` and `updateEvent` exist, but `deleteShift`, `deleteTransfer`, `deleteExpense`, and `deleteBooking` are missing from `AppContextType` and from the context implementation.
3. **Step 3 (Observation 5)**: Because `AppContext` does not expose `deleteBooking`, `PassengersView.tsx` directly imports and invokes `storagePort.deleteBooking`. This is an architectural violation of the Hexagonal boundary rule stated in `PROJECT.md` and `ORIGINAL_REQUEST.md` (presentation views must consume storage via use cases or context facades, not direct adapter calls).
4. **Step 4 (Observation 2 & 5)**: `deleteShift`, `deleteTransfer`, and `deleteExpense` take the respective entity primary key `id` (`shiftId: string`, `transferId: string`, `expenseId: string`), whereas `deleteBooking` takes a `bookingId` or `code` and cascades. When wiring these methods in `AppContext`, each method must filter the corresponding React state array (`shifts`, `transfers`, `expenses`) by matching entity `id`, call the respective `storagePort` method, and trigger `recalculateSettlement()` to update the deterministic BigInt ledger.
5. **Step 5 (Observation 3)**: In `DexieStorageAdapter.ts`, `deleteBooking` does not cascade delete child records, which leaves orphan records in IndexedDB if Dexie is active. Fixing `DexieStorageAdapter.deleteBooking` to delete related events, shifts, transfers, expenses, and settlements brings it into parity with `SupabaseStorageAdapter`.

---

## 3. Caveats

1. **`archiveBooking` Semantic vs. `deleteBooking`**: The prompt references `deleteBooking` / `archiveBooking`. In `PatientBooking.ts`, booking status includes `'CANCELADO'`. However, `storagePort` does not have an `archiveBooking` method; it only provides `deleteBooking`. In `PassengersView.tsx`, archiving is implemented as a local `archivedBookingIds` set combined with `storagePort.deleteBooking`. In `AppContext`, `archiveBooking` can either update status to `'CANCELADO'` via `saveBooking` or alias `deleteBooking`. Both options should be supported.
2. **Optional Modifiers in `IStoragePort`**: In `IStoragePort.ts`, `deleteBooking?`, `deleteShift?`, `deleteTransfer?`, and `deleteExpense?` are marked with optional `?`. While all three existing adapters implement them, `AppContext` must safely call them with optional chaining (`await storagePort.deleteShift?.(shiftId)`) or the Worker can make them non-optional in `IStoragePort.ts`.

---

## 4. Conclusion

1. **Root Cause of M2 Gap**: The storage infrastructure layer already has complete delete capabilities across all domains, but `AppContext.tsx` never exposed them to the presentation layer, forcing views to bypass context or forego delete operations.
2. **Actionable Roadmap for Worker (`worker_m2`)**:
   - Add `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking`, `archiveBooking`, `saveTransfer`, and `saveExpense` to `AppContextType` in `AppContext.tsx`.
   - Implement these methods with optimistic UI state updates + storage persistence + `recalculateSettlement()`.
   - Refactor `PassengersView.tsx` to call `deleteBooking` from `useAppContext()` instead of `storagePort.deleteBooking`.
   - Update `DexieStorageAdapter.deleteBooking` to cascade delete child records for full parity with `SupabaseStorageAdapter`.
   - Add unit tests in `tests/unit/AppContext_CRUD_wiring.test.tsx` ensuring 100% test pass rate and 0 typecheck errors.

---

## 5. Verification Method

1. **Typecheck Verification**:
   ```bash
   cd apps/medicaltrip_react_app && npm run typecheck
   ```
   *Expected result*: Exits with code 0 (0 errors).

2. **Integration Test Suite**:
   ```bash
   cd apps/medicaltrip_react_app && npm test
   ```
   *Expected result*: All 6 test files (53 tests) pass cleanly without regressions.

3. **File Inspections**:
   - `src/presentation/state/AppContext.tsx`: Verify `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking` are present in `AppContextType` and implemented in `AppContext`.
   - `src/features/directory/presentation/PassengersView.tsx`: Verify zero instances of `storagePort.deleteBooking` remain in presentation code.
   - `src/core/infrastructure/storage/DexieStorageAdapter.ts`: Verify `deleteBooking` cascades across `events`, `shifts`, `transfers`, `expenses`, `settlements`.
