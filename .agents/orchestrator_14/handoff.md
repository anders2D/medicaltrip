# Soft Handoff: Project Orchestrator (orchestrator_14 ➔ Successor orchestrator_15)

## Milestone State
| Milestone | Description | Status |
|-----------|-------------|--------|
| Phase 0 | Survey & Scope Mapping | DONE (`PROJECT.md` initialized) |
| Milestone 1 | Direct Supabase Cloud REST API CRUD Integration Suite | DONE (Gate PASSED: 53/53 tests pass, 0 type errors, build clean, Auditor CLEAN) |
| Milestone 2 | AppContext CRUD Methods Wiring & UI State Sync | IN_PROGRESS (Exploration complete; ready for Worker dispatch) |
| Milestone 3 | Automated Chromium CDP Click Harness & Visual Certification | PLANNED |
| Milestone 4 | Production Build & Final Forensic Audit | PLANNED |

## Observation & Synthesis from Milestone 2 Explorers
1. **Explorer M2.1 (`explorer_m2_1`)**:
   - `IStoragePort` and all 3 adapters (`SupabaseStorageAdapter`, `DexieStorageAdapter`, `InMemoryStorageAdapter`) fully implement `deleteShift`, `deleteTransfer`, `deleteExpense`, and `deleteBooking`.
   - `AppContext.tsx` completely omits them from `AppContextType` and `AppProvider`.
   - Triple-Phase Invariant formulated:
     1. Optimistic React state update (`setX(prev => ...)`)
     2. Background persistence (`storagePort.deleteX(...)` + `await recalculateSettlement()`)
     3. Error rollback (`setX(previousState)`) on failure
2. **Explorer M2.2 (`explorer_m2_2`)**:
   - Mapped all parameter types and contracts:
     - `deleteShift(shiftId: string): Promise<void>`
     - `deleteTransfer(transferId: string): Promise<void>`
     - `deleteExpense(expenseId: string): Promise<void>`
     - `deleteBooking(bookingId: string): Promise<void>` (cascades across 7 tables in Supabase)
     - `archiveBooking(bookingId: string): Promise<void>` (alias to `deleteBooking` or status update)
     - `saveTransfer(transfer: DriverTransfer): Promise<void>`
     - `updateExpense(expense: ReceiptExpense): Promise<void>`
   - `DexieStorageAdapter.deleteBooking` needs cascading delete across child tables for parity with `SupabaseStorageAdapter`.
3. **Explorer M2.3 (`explorer_m2_3`)**:
   - `PassengersView.tsx` currently bypasses `AppContext` to invoke `storagePort.deleteBooking`. Must be refactored to use `useAppContext()`.
   - Ghost Expense defect in `CompanionTurnSheetModal.tsx`: `handleRemoveExpense` only removed from local state, never from storage.
   - Vitest test plan designed: create `tests/unit/AppContext_CRUD_StateSync.test.tsx` using `InMemoryStorageAdapter` and `@testing-library/react` for instant deterministic verification.

## Active Subagents
- None (all Explorers have concluded and delivered reports).

## Key Artifacts
- `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (authoritative user requirements)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md` (architecture, inventory, milestones)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/GATE_STATUS.md` (gate status records)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/BRIEFING.md` (orchestrator briefing)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/progress.md` (liveness & milestone tracking)
- `/Users/miyo123/projects/medicaltrip/.agents/m2_exp1/handoff.md` (Explorer 1 report)
- `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2/handoff.md` (Explorer 2 report)
- `/Users/miyo123/projects/medicaltrip/.agents/m2_exp3/handoff.md` (Explorer 3 report)

## Remaining Work & Immediate Next Steps for Successor
1. **Spawn Worker for Milestone 2 (`worker_m2`)**:
   - Working directory: `/Users/miyo123/projects/medicaltrip/.agents/worker_m2`
   - Prompt instructions:
     - Update `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`:
       - Add `deleteShift`, `deleteTransfer`, `deleteExpense`, `archiveBooking`, `deleteBooking`, `saveTransfer`, `updateExpense` to `AppContextType` and `AppProvider`.
       - Implement optimistic UI updates + background persistence + BigInt settlement recalculation (`recalculateSettlement()`) + error rollback.
     - Update `apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx` to call `deleteBooking` from `useAppContext()`.
     - Fix `CompanionTurnSheetModal.tsx` `handleRemoveExpense` to invoke `deleteExpense`.
     - Update `DexieStorageAdapter.deleteBooking` to cascade delete child records.
     - Implement unit test suite `tests/unit/AppContext_CRUD_StateSync.test.tsx` verifying all CRUD methods, reactive state sync, and rollback.
     - Verify with `npm test`, `npm run typecheck`, and `npm run build`.
   - Include the **MANDATORY INTEGRITY WARNING**:
     "DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected."
2. **Execute Gate Cycle for Milestone 2**:
   - Spawn 2 Reviewers independently (`reviewer_m2_1`, `reviewer_m2_2`).
   - Spawn 2 Challengers independently (`challenger_m2_1`, `challenger_m2_2`).
   - Spawn 1 Forensic Auditor (`auditor_m2_1`).
   - Record verdicts in `GATE_STATUS.md` and enforce the binary veto.
3. **Advance to Milestone 3 (Automated Chromium CDP Click Harness)** once M2 gate passes.
