# DISPATCH — Remediation Worker: Supabase Swappability Race Condition Fix

**Assigned Agent**: `teamwork_preview_worker_remediation`  
**Role**: `teamwork_preview_worker`  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_remediation`  
**Target Repository**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Timestamp**: 2026-09-12T20:25:00Z  

---

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## Mission & Scope
The Forensic Auditor reported an `INTEGRITY VIOLATION` during the full test suite run (`npm test -- --run`) because test `CHAL-SWAP-03` in `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts` failed due to a race condition with live remote Supabase cloud batch deletions.

The Remediation Explorer investigated this failure and authored a complete unified patch at:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_remediation/remediation.patch`

### Exact Files to Modify
1. `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`:
   - Replace table-wide `clearAll()` in `CHAL-SWAP-03` with isolated cleanup via `deleteBooking()` using unique timestamped booking identifiers (`BK-ISOLATE-MEM-${Date.now()}` and `BK-ISOLATE-SUPA-${Date.now()}`).
   - Add a brief retry loop (250ms) for remote cloud read-after-write propagation.
   - Clean up the test booking with `deleteBooking(supaBookingId)`.
2. `src/core/infrastructure/storage/SupabaseStorageAdapter.ts`:
   - In `clearAll()`, reorder table purges so child tables (`events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`) are deleted before `bookings`, preventing foreign key lock contention.

---

## Verification Requirements
You MUST execute the following verification commands from `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`:

1. `npx vitest run tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`
   - Must pass 100% (all 20 tests pass).
2. `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx`
   - Must pass 100% (all 24 tests pass).
3. `npm run typecheck`
   - Must exit with code 0 (0 compilation errors).
4. `npm run build`
   - Must exit with code 0.
5. `npm test -- --run`
   - Must exit with code 0 across all 117 test files and 1106+ tests with 0 failures.

---

## Handoff Requirements
Write your detailed handoff report to:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_remediation/handoff.md`
Include:
- Files modified and exact changes.
- Command outputs for all 5 verification steps.
- Confirmation that 100% of the tests in `npm test -- --run` pass.
- Send a message to the orchestrator when complete.
