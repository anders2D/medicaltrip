# Dispatch: Explorer M4-R2-2 (Remediation: Supabase Adversarial Test Timeout Hardening)

## Objective
Investigate and formulate the exact remediation blueprint to resolve the test timeout failure in `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`, addressing the Forensic Audit failure.

## Authority & Full Audit Evidence
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `auditor_m4_1/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/auditor_m4_1/handoff.md (FULL AUDIT EVIDENCE REPORT — INTEGRITY VIOLATION)

## Specific Audit Evidence to Remediate
Auditor M4 reported:
- `FAIL tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts > CHAL-SWAP-02 [supabase]: should execute end-to-end entity lifecycle consistently`
- Error: `Test timed out in 45000ms.`
- In isolated runs, `CHAL-SWAP-02` takes ~20 seconds against live Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`). Under full sequential test suite runs (`npm test`), network latency and queue backlog cause it to exceed 45,000ms.

## Investigation Tasks
1. Inspect `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`:
   - Line 280-320: Check `CHAL-SWAP-02`.
   - Check all tests running against the `supabase` driver: `CHAL-SWAP-01`, `CHAL-SWAP-02`, `CHAL-SWAP-06`, `CHAL-SWAP-09`, etc.
2. Formulate the exact fix:
   - Provide an explicit timeout of 120,000ms (2 minutes) or 90,000ms for `CHAL-SWAP-02 [supabase]` and other long-running Supabase cloud integration tests.
   - Also inspect `tests/e2e/SupabaseLiveE2E.test.ts` for any tests needing timeout resilience.
3. Formulate exact code blueprints for Worker M4-R2.

## Deliverables
- Write full findings and code blueprints to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T23:04:46Z
Investigate:
1. Inspect `apps/medicaltrip_react_app/tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`:
   - Line 280-320: Inspect `CHAL-SWAP-02 [supabase]`, which timed out at 45,000ms during the full sequential `npm test` run.
   - Inspect all other tests exercising the `supabase` driver (`CHAL-SWAP-01` through `CHAL-SWAP-12`).
2. Inspect `apps/medicaltrip_react_app/tests/e2e/SupabaseLiveE2E.test.ts` for any remote network timeout sensitivities.
3. Formulate exact code blueprints to assign explicit 120,000ms (2 minutes) timeouts to all tests calling live remote Supabase Cloud endpoints, ensuring 100% test reliability during full sequential test suite runs.

Write your findings and code blueprints to:
/Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_2/handoff.md
Send a message when finished.

