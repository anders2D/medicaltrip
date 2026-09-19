# Dispatch: Explorer M2.2 (Storage Port & Adapter Method Mapping)

## Context
Milestone 2: AppContext CRUD Methods Wiring & UI State Sync.
Working directory: /Users/miyo123/projects/medicaltrip/.agents/m2_exp2
Project root: /Users/miyo123/projects/medicaltrip
Application root: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Authoritative Files
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/GATE_STATUS.md

## Objective
Analyze `IStoragePort.ts` and `SupabaseStorageAdapter.ts` (and any Dexie/InMemory fallbacks) in `apps/medicaltrip_react_app/src/core/`.
1. Inspect the signatures of `deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking` / `archiveBooking`, `deleteEvent`, and `updateEvent` across all storage port implementations.
2. Check how errors (e.g. PGRST or network errors) are handled or thrown.
3. Verify return values, parameter types, and ID requirements (e.g., entity ID vs bookingId).
4. Identify any missing method in `IStoragePort` or its adapters that `AppContext` needs to call.
5. Formulate the contract compliance guide for the Worker.
6. Write your detailed analysis to `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2/analysis.md` and your summary to `/Users/miyo123/projects/medicaltrip/.agents/m2_exp2/handoff.md`.
Use send_message to report when completed.
