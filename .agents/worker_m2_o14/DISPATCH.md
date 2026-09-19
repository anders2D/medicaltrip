# Dispatch: Worker M2 (AppContext CRUD Methods Wiring & UI State Sync)

## Context
Milestone 2: AppContext CRUD Methods Wiring & UI State Sync.
Working directory: /Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14
Project root: /Users/miyo123/projects/medicaltrip
Application root: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Authoritative Files
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp1/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp2/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp3/handoff.md

## Exclusive Write Ownership
- `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`
- `apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx`
- `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`
- `apps/medicaltrip_react_app/src/core/infrastructure/storage/DexieStorageAdapter.ts`
- `apps/medicaltrip_react_app/tests/unit/AppContext_CRUD_StateSync.test.tsx`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-19T16:49:06Z
You are worker_m2, a teamwork_preview_worker agent.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14
You MUST read the authoritative user request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z).
Also read:
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp1/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp2/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/m2_exp3/handoff.md
- /Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14/DISPATCH.md

Exclusive Write Ownership:
- apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx
- apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx
- apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx
- apps/medicaltrip_react_app/src/core/infrastructure/storage/DexieStorageAdapter.ts
- apps/medicaltrip_react_app/tests/unit/AppContext_CRUD_StateSync.test.tsx

Tasks:
1. Update `AppContext.tsx`:
   - Extend `AppContextType` with:
     - `deleteShift: (shiftId: string) => Promise<void>;`
     - `deleteTransfer: (transferId: string) => Promise<void>;`
     - `deleteExpense: (expenseId: string) => Promise<void>;`
     - `deleteBooking: (bookingId: string) => Promise<void>;`
     - `archiveBooking: (bookingId: string) => Promise<void>;`
     - `saveTransfer: (transfer: DriverTransfer) => Promise<void>;`
     - `updateExpense: (expense: ReceiptExpense) => Promise<void>;`
   - Implement them in `AppProvider` following the Triple-Phase Invariant (optimistic state update, background persistence to `storagePort`, deterministic BigInt settlement recalculation with `recalculateSettlement()`, and error rollback).
   - Ensure `deleteBooking` / `archiveBooking` cleanly transitions `activeBooking` to a remaining valid booking if the active booking is removed.
   - Update `deleteEvent` and `saveCompanionShift` to use optimistic state updates.
2. In `PassengersView.tsx`:
   - Replace direct `storagePort.deleteBooking` calls with `deleteBooking` / `archiveBooking` from `useAppContext()`.
3. In `CompanionTurnSheetModal.tsx`:
   - Fix ghost expense defect: ensure `handleRemoveExpense` calls `deleteExpense` so persisted expenses are removed from storage.
4. In `DexieStorageAdapter.ts`:
   - Implement cascading delete in `deleteBooking` across child records (`events`, `shifts`, `transfers`, `expenses`, `settlements`) for full parity with SupabaseStorageAdapter.
5. In `tests/unit/AppContext_CRUD_StateSync.test.tsx`:
   - Create comprehensive unit test suite with `InMemoryStorageAdapter` verifying all CRUD operations, reactive state updates, settlement recalculation, and rollback on error.
6. Verification:
   - Run `npm test`, `npm run typecheck`, and `npm run build` in `apps/medicaltrip_react_app`. Ensure 100% pass rate.
7. Write your detailed changes to `/Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14/changes.md` and your handoff to `/Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14/handoff.md`.
Use send_message to report when done.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

