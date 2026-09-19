# Forensic Analysis: IStoragePort & Storage Adapters CRUD Contract Compliance

**Date**: 2026-09-19  
**Agent**: `explorer_m2_2` (Teamwork Preview Explorer)  
**Milestone**: Milestone 2 — AppContext CRUD Methods Wiring & UI State Sync  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2`  
**Application Root**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`

---

## 1. Executive Summary

This investigation performed a comprehensive forensic analysis of the persistence boundary in `apps/medicaltrip_react_app`, specifically:
- Interface Contract: `src/core/ports/IStoragePort.ts`
- Cloud Infrastructure Adapter: `src/core/infrastructure/storage/SupabaseStorageAdapter.ts`
- Local IndexedDB Adapter: `src/core/infrastructure/storage/DexieStorageAdapter.ts`
- In-Memory Reference Adapter: `src/core/infrastructure/storage/InMemoryStorageAdapter.ts`
- Presentation State Context: `src/presentation/state/AppContext.tsx`

### Key Takeaway
All three concrete storage adapters (`SupabaseStorageAdapter`, `DexieStorageAdapter`, and `InMemoryStorageAdapter`) **already implement 100% of the delete operations** (`deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking`, and `deleteEvent`). However, **`AppContext.tsx` exhibits an architectural asymmetry**: it implements `deleteEvent` and `updateEvent`, but completely omits `deleteShift`, `deleteTransfer`, `deleteExpense`, and `deleteBooking` from `AppContextType`. Consequently, UI components like `PassengersView.tsx` have breached hexagonal boundaries by reaching directly into `storagePort.deleteBooking`, while shifts, transfers, and expenses have no clean deletion hooks exposed to the presentation layer.

---

## 2. Method Signatures & Implementation Matrix

The table below contrasts the 6 target methods across the port interface, the three adapter implementations, and `AppContext`:

| Method | `IStoragePort` Contract | `SupabaseStorageAdapter` | `DexieStorageAdapter` | `InMemoryStorageAdapter` | `AppContext.tsx` (Current) |
|---|---|---|---|---|---|
| **`deleteShift`** | `deleteShift?(shiftId: string): Promise<void>` (line 56) | Implemented (lines 530–540) | Implemented (lines 390–392) | Implemented (lines 129–131) | ❌ **MISSING** in `AppContextType` & context |
| **`deleteTransfer`** | `deleteTransfer?(transferId: string): Promise<void>` (line 64) | Implemented (lines 626–636) | Implemented (lines 440–442) | Implemented (lines 147–149) | ❌ **MISSING** in `AppContextType` & context |
| **`deleteExpense`** | `deleteExpense?(expenseId: string): Promise<void>` (line 72) | Implemented (lines 712–722) | Implemented (lines 484–486) | Implemented (lines 168–170) | ❌ **MISSING** in `AppContextType` & context |
| **`deleteBooking`** | `deleteBooking?(bookingId: string): Promise<void>` (line 39) | Implemented (lines 278–300, 7-table cascade) | Implemented (lines 252–254, non-cascading) | Implemented (lines 56–85, 5-table cascade) | ❌ **MISSING** in `AppContextType` (called ad-hoc in `PassengersView`) |
| **`archiveBooking`** | ❌ Not defined | ❌ Not defined | ❌ Not defined | ❌ Not defined | ❌ Handled as local UI state Set in `PassengersView` |
| **`deleteEvent`** | `deleteEvent(eventId: string): Promise<void>` (line 47, mandatory) | Implemented (lines 403–413) | Implemented (lines 306–308) | Implemented (lines 108–110) | ✅ **PRESENT** (lines 99, 494–501, 715) |
| **`updateEvent`** | ❌ Not defined (port uses `saveEvent` with upsert semantics) | Handled via `saveEvent` upsert (lines 305–351) | Handled via `saveEvent` `db.events.put` (lines 259–291) | Handled via `saveEvent` `events.set` (lines 90–92) | ✅ **PRESENT** (lines 92, 462–469, 713, delegates to `saveEvent`) |

---

## 3. Error Handling & Resilience Architecture

### 3.1 PostgREST HTTP 406 (`PGRST116`) Elimination
- In `SupabaseStorageAdapter.ts`:
  - When querying singular rows (such as `getBooking(bookingIdOrCode)` and `getEventById(eventId)`), the adapter enforces `.maybeSingle()` or `.limit(1)`.
  - Calling `.single()` in PostgREST when a record does not exist generates an HTTP 406 error code `PGRST116` ("Cannot coerce result to a single JSON object").
  - `SupabaseStorageAdapter` checks `typeof query.maybeSingle === 'function' ? await query.maybeSingle() : await query.limit(1)...`.
  - When records do not exist, it cleanly returns `null` or falls back to the local in-memory store without throwing.

### 3.2 Offline-First Dual-Write Strategy
- `SupabaseStorageAdapter` holds a private fallback instance: `private readonly fallback: InMemoryStorageAdapter`.
- For every write (`saveBooking`, `saveEvent`, `saveShift`, `saveTransfer`, `saveExpense`, `saveSettlement`, `appendEventLog`, `saveBlob`) and delete (`deleteBooking`, `deleteEvent`, `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBlob`, `clearAll`), the operation is **first applied synchronously/asynchronously to `this.fallback`**.
- This guarantees that if the browser loses network connectivity or Supabase Cloud returns an HTTP error, the active session never loses state.

### 3.3 Zero-Unhandled-Rejections Guarantee
- In `SupabaseStorageAdapter`, all cloud mutations and deletions are wrapped in defensive `try/catch` and error-checking blocks:
  - Deletions (`deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteEvent`, `deleteBooking`):
    ```ts
    public async deleteShift(shiftId: string): Promise<void> {
      await this.fallback.deleteShift(shiftId);
      if (!this.client) return;
      try {
        await this.client.from('shifts').delete().eq('id', shiftId);
      } catch {
        // Handled gracefully
      }
    }
    ```
  - `deleteBooking`:
    ```ts
    await Promise.allSettled([
      this.client.from('bookings').delete().in('id', ids),
      this.client.from('bookings').delete().in('code', ids),
      this.client.from('events').delete().in('booking_id', ids),
      this.client.from('shifts').delete().in('booking_id', ids),
      this.client.from('transfers').delete().in('booking_id', ids),
      this.client.from('expenses').delete().in('booking_id', ids),
      this.client.from('settlements').delete().in('booking_id', ids),
      this.client.from('event_stream').delete().in('booking_id', ids),
    ]);
    ```
    `Promise.allSettled` ensures that failures or empty result sets in any single table do not interrupt the deletion chain across other tables.
  - Mutations (`saveBooking`, `saveShift`, `saveTransfer`, `saveExpense`, `saveSettlement`):
    - Inspects `{ error }` returned from Supabase.
    - If `error`, emits `console.warn('[SupabaseStorageAdapter] Cloud sync notice ...')` and preserves local state without rethrowing.
    - If a network rejection occurs, catches `(err: any)` and emits `console.warn('[SupabaseStorageAdapter] Network exception ...')`.
  - **Verdict**: Neither `SupabaseStorageAdapter` nor `InMemoryStorageAdapter` throw unhandled exceptions or rejected promises during normal CRUD operations.

---

## 4. Parameter Types, Return Values & ID Requirements

### 4.1 Granular Entity Contract Breakdown

#### 1. `deleteShift(shiftId: string): Promise<void>`
- **Parameter**: `shiftId` is the primary key string of the shift (e.g. `'shf-1'` or `'SHIFT-1726760000'`).
- **Target Table**: `shifts`, column: `id`.
- **Warning**: Do NOT pass `bookingId` here. A patient may have multiple shifts. Passing `bookingId` will delete nothing (since `id` != `booking_id`).
- **Return Value**: `Promise<void>`.
- **UI State Impact**: Removes shift from `shifts: CompanionShift[]`. Settlement must be recomputed via `recalculateSettlement()`.

#### 2. `deleteTransfer(transferId: string): Promise<void>`
- **Parameter**: `transferId` is the primary key string of the transfer (e.g. `'trf-1'` or `'TRF-1726760000'`).
- **Target Table**: `transfers`, column: `id`.
- **Warning**: Do NOT pass `bookingId`.
- **Return Value**: `Promise<void>`.
- **UI State Impact**: Removes transfer from `transfers: DriverTransfer[]`. Settlement must be recomputed via `recalculateSettlement()`.

#### 3. `deleteExpense(expenseId: string): Promise<void>`
- **Parameter**: `expenseId` is the primary key string of the receipt expense (e.g. `'exp-1'` or `'EXP-1726760000'`).
- **Target Table**: `expenses`, column: `id`.
- **Warning**: Do NOT pass `bookingId`.
- **Return Value**: `Promise<void>`.
- **UI State Impact**: Removes expense from `expenses: ReceiptExpense[]`. Settlement must be recomputed via `recalculateSettlement()`.

#### 4. `deleteEvent(eventId: string): Promise<void>`
- **Parameter**: `eventId` is the primary key string of the itinerary event (e.g. `'evt-1'` or `'EVT-1726760000'`).
- **Target Table**: `events`, column: `id`.
- **Return Value**: `Promise<void>`.
- **UI State Impact**: Removes event from `events: ItineraryEvent[]`. Settlement must be recomputed via `recalculateSettlement()`.

#### 5. `deleteBooking(bookingId: string): Promise<void>`
- **Parameter**: `bookingId` can be either the booking UUID/ID (e.g. `'bkg-rva350'`) OR the booking code (e.g. `'RVA350-1'`).
- **Mechanism**: `SupabaseStorageAdapter.resolveBookingIds(bookingId)` queries both `id` and `code` from the `bookings` table to assemble all matching identifier aliases. It then cascades across all 7 relational tables:
  1. `bookings` (`id` and `code`)
  2. `events` (`booking_id`)
  3. `shifts` (`booking_id`)
  4. `transfers` (`booking_id`)
  5. `expenses` (`booking_id`)
  6. `settlements` (`booking_id`)
  7. `event_stream` (`booking_id`)
- **Return Value**: `Promise<void>`.
- **UI State Impact**: If the deleted booking was the active one, the app must switch to another valid booking or clear state.

#### 6. `updateEvent(event: ItineraryEvent): Promise<void>`
- **Parameter**: `event: ItineraryEvent`.
- **Port Mapping**: Does not exist as `updateEvent` on `IStoragePort`. Delegates to `saveEvent(event: ItineraryEvent): Promise<void>`.
- **Adapter Mechanism**:
  - `SupabaseStorageAdapter`: `client.from('events').upsert(payload)`
  - `DexieStorageAdapter`: `db.events.put(serialized)`
  - `InMemoryStorageAdapter`: `events.set(event.id, event)`
- **Return Value**: `Promise<void>`.
- **UI State Impact**: Replaces the matching event in `events: ItineraryEvent[]` (`e.id === event.id ? event : e`) and re-reconciles settlement.

---

## 5. Architectural Inconsistencies & Gaps Identified

### Gap 1: Optional Modifiers on `IStoragePort` Delete Methods
`IStoragePort.ts` declares:
```ts
deleteBooking?(bookingId: string): Promise<void>;
deleteShift?(shiftId: string): Promise<void>;
deleteTransfer?(transferId: string): Promise<void>;
deleteExpense?(expenseId: string): Promise<void>;
```
While `deleteEvent` is mandatory:
```ts
deleteEvent(eventId: string): Promise<void>;
```
Since all three concrete adapters (`SupabaseStorageAdapter`, `DexieStorageAdapter`, and `InMemoryStorageAdapter`) fully implement all four methods, these optional `?` modifiers force caller code to perform defensive checks (e.g. `storagePort.deleteShift ? ... : ...`).
**Action**: The Worker can make these mandatory in `IStoragePort` or call them safely via optional chaining (`await storagePort.deleteShift?.(shiftId)`).

### Gap 2: Asymmetric Omission in `AppContext.tsx`
`AppContext.tsx` exposes `createEvent`, `updateEvent`, `rescheduleEvent`, `deleteEvent`, and `saveCompanionShift`. However, it lacks:
- `deleteShift(shiftId: string): Promise<void>`
- `deleteTransfer(transferId: string): Promise<void>`
- `deleteExpense(expenseId: string): Promise<void>`
- `deleteBooking(bookingId: string): Promise<void>`
- `archiveBooking(bookingId: string): Promise<void>`
- `saveTransfer(transfer: DriverTransfer): Promise<void>`
- `saveExpense(expense: ReceiptExpense): Promise<void>`

### Gap 3: Leaky Abstraction in `PassengersView.tsx`
Because `AppContext` has no `deleteBooking` method, `PassengersView.tsx` (lines 247–258) accesses `storagePort` directly:
```ts
if (storagePort && typeof storagePort.deleteBooking === 'function') {
  await storagePort.deleteBooking(bookingId);
  if (activeBooking && (activeBooking.id === bookingId || activeBooking.code === bookingId)) {
    if (activeBooking.code && activeBooking.code !== bookingId) {
      await storagePort.deleteBooking(activeBooking.code);
    }
  }
}
```
This violates Hexagonal Boundaries (presentation components must interact through use cases or context facades, never directly invoking adapter methods).

### Gap 4: `DexieStorageAdapter.deleteBooking` Does Not Cascade
In `DexieStorageAdapter.ts`:
```ts
public async deleteBooking(bookingId: string): Promise<void> {
  await this.db.bookings.delete(bookingId);
}
```
Unlike `SupabaseStorageAdapter` and `InMemoryStorageAdapter`, `DexieStorageAdapter` does not clean up related events, shifts, transfers, expenses, settlements, or event streams when a booking is deleted.

---

## 6. Contract Compliance Guide for the Worker (`worker_m2`)

To achieve complete CRUD contract compliance and satisfy Milestone 2 requirements:

### Step 1: Update `AppContextType` Interface in `AppContext.tsx`
Add the missing method signatures to `AppContextType`:
```ts
// Shifts & Transfers CRUD
deleteShift: (shiftId: string) => Promise<void>;
deleteTransfer: (transferId: string) => Promise<void>;
saveTransfer?: (transfer: DriverTransfer) => Promise<void>;

// Expenses CRUD
deleteExpense: (expenseId: string) => Promise<void>;
saveExpense?: (expense: ReceiptExpense) => Promise<void>;

// Bookings Lifecycle
deleteBooking: (bookingId: string) => Promise<void>;
archiveBooking?: (bookingId: string) => Promise<void>;
```

### Step 2: Implement Handlers in `AppContext.tsx`

```ts
// 1. Delete Shift
const deleteShift = useCallback(
  async (shiftId: string): Promise<void> => {
    if (storagePort.deleteShift) {
      await storagePort.deleteShift(shiftId);
    }
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    await recalculateSettlement();
  },
  [storagePort, recalculateSettlement]
);

// 2. Delete Transfer
const deleteTransfer = useCallback(
  async (transferId: string): Promise<void> => {
    if (storagePort.deleteTransfer) {
      await storagePort.deleteTransfer(transferId);
    }
    setTransfers((prev) => prev.filter((t) => t.id !== transferId));
    await recalculateSettlement();
  },
  [storagePort, recalculateSettlement]
);

// 3. Delete Expense
const deleteExpense = useCallback(
  async (expenseId: string): Promise<void> => {
    if (storagePort.deleteExpense) {
      await storagePort.deleteExpense(expenseId);
    }
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    await recalculateSettlement();
  },
  [storagePort, recalculateSettlement]
);

// 4. Save/Update Transfer
const saveTransfer = useCallback(
  async (transfer: DriverTransfer): Promise<void> => {
    await storagePort.saveTransfer(transfer);
    setTransfers((prev) => {
      const idx = prev.findIndex((t) => t.id === transfer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = transfer;
        return next;
      }
      return [...prev, transfer];
    });
    await recalculateSettlement();
  },
  [storagePort, recalculateSettlement]
);

// 5. Save/Update Expense
const saveExpense = useCallback(
  async (expense: ReceiptExpense): Promise<void> => {
    await storagePort.saveExpense(expense);
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = expense;
        return next;
      }
      return [...prev, expense];
    });
    await recalculateSettlement();
  },
  [storagePort, recalculateSettlement]
);

// 6. Delete / Archive Booking
const deleteBooking = useCallback(
  async (bookingId: string): Promise<void> => {
    if (storagePort.deleteBooking) {
      await storagePort.deleteBooking(bookingId);
    }
    if (activeBooking && (activeBooking.id === bookingId || activeBooking.code === bookingId)) {
      setActiveBooking(null);
      setEvents([]);
      setShifts([]);
      setTransfers([]);
      setExpenses([]);
      setSettlement(null);
    }
    await refreshData();
  },
  [storagePort, activeBooking, refreshData]
);
```

Expose these in the `value` object of `AppContext.Provider`:
```ts
deleteShift,
deleteTransfer,
saveTransfer,
deleteExpense,
saveExpense,
deleteBooking,
archiveBooking: deleteBooking,
```

### Step 3: Refactor `PassengersView.tsx`
Replace the direct `storagePort.deleteBooking` call in `handleArchive` with:
```ts
const { deleteBooking } = useAppContext();
// Inside handleArchive:
await deleteBooking(bookingId);
```
Remove any direct usage of `storagePort.deleteBooking`.

### Step 4: Cascade Delete Polish in `DexieStorageAdapter.ts`
Update `DexieStorageAdapter.deleteBooking` to achieve parity with Supabase and InMemory:
```ts
public async deleteBooking(bookingId: string): Promise<void> {
  const row = await this.getBooking(bookingId);
  const ids = new Set<string>([bookingId]);
  if (row) {
    ids.add(row.id);
    ids.add(row.code);
  }
  for (const id of ids) {
    await this.db.bookings.delete(id);
    await this.db.events.where('bookingId').equals(id).delete();
    await this.db.shifts.where('bookingId').equals(id).delete();
    await this.db.transfers.where('bookingId').equals(id).delete();
    await this.db.expenses.where('bookingId').equals(id).delete();
    await this.db.settlements.where('bookingId').equals(id).delete();
    await this.db.event_stream.where('bookingId').equals(id).delete();
  }
}
```

### Step 5: Verification & Safety Checklist
1. Execute `npm run typecheck` (`tsc --noEmit`) to verify 0 compiler errors.
2. Execute `npm test` to verify all 6 Vitest suites (53 tests) pass cleanly.
3. Write a dedicated unit test suite (`tests/unit/AppContext_CRUD_wiring.test.tsx`) covering:
   - `deleteShift` modifies `shifts` state, triggers `storagePort.deleteShift`, and recalculates settlement with BigInt determinism.
   - `deleteTransfer` modifies `transfers` state, triggers `storagePort.deleteTransfer`, and recalculates settlement.
   - `deleteExpense` modifies `expenses` state, triggers `storagePort.deleteExpense`, and recalculates settlement.
   - `deleteBooking` cascades across active state and invokes `storagePort.deleteBooking`.
