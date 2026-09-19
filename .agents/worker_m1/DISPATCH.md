# Task Assignment: Worker M1 (Supabase Cloud Full CRUD Integration Suite)

You are Worker M1 for Medical Trip Colombia.
Working Directory: /Users/miyo123/projects/medicaltrip/.agents/worker_m1/
Parent: orchestrator_14 (Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53)

Authoritative Requirements:
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z)
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md

Explorer Reports & Blueprints:
- Explorer M1_1 Report: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_1/analysis.md & handoff.md
- Explorer M1_2 Report: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/analysis.md & handoff.md
- Explorer M1_3 Report: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/analysis.md & handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement and verify the complete, genuine CRUD integration test suite and standalone diagnostic runner covering all 5 admin core domains directly against the live Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`).

### Files Owned Exclusively:
1. `apps/medicaltrip_react_app/src/core/infrastructure/storage/SupabaseStorageAdapter.ts`:
   - Patch line 437 deserialization defect: change `guideHours: r.guideHours` to `guideHours: r.guide_hours !== undefined ? Number(r.guide_hours) : r.guideHours` (and verify other storage adapter files if duplicated).
2. `apps/medicaltrip_react_app/tests/integration/supabase_crud_domain1_domain2.test.ts`:
   - Implement Bookings & Clinical Events CRUD test suite using Explorer M1_1's blueprint.
3. `apps/medicaltrip_react_app/tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`:
   - Implement Companion Shifts & Fleet Transfers CRUD test suite using Explorer M1_2's blueprint.
4. `apps/medicaltrip_react_app/tests/integration/supabase_expenses_settlements_crud.test.ts`:
   - Implement Expenses & Settlements CRUD test suite with BigInt math and SHA-256 seal using Explorer M1_3's blueprint.
5. `apps/medicaltrip_react_app/scripts/verify_supabase_all_domains_crud.ts`:
   - Create a unified standalone diagnostic script that runs all 5 domains sequentially against Supabase Cloud and outputs clean status summaries.

### Execution Requirements:
- Ensure all tests run with `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';` in Node/Vitest.
- Run `npm test` and verify that all test suites pass with 100% success rate.
- Run `npm run typecheck` and verify 0 TypeScript compiler errors.
- Run the standalone verification script via `npx tsx` or `vite-node` to verify live Supabase Cloud communication.
- Ensure all temporary test records (`RVA-TEST-*` or `bkg-crud-test-*`) are cleanly cleaned up after tests.
- Document exact commands executed, build and test outputs, and verification proofs in `/Users/miyo123/projects/medicaltrip/.agents/worker_m1/handoff.md`.



## 2026-09-19T15:52:38Z
You are Worker M1 for Medical Trip Colombia.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_m1/
Read your task instructions at: /Users/miyo123/projects/medicaltrip/.agents/worker_m1/DISPATCH.md
MANDATORY: Read the authoritative requirements file at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically under timestamp 2026-09-19T15:37:50Z) and /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md.

Read the blueprints from the 3 Explorers:
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_1/analysis.md
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/analysis.md
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement:
1. Fix deserialization in `apps/medicaltrip_react_app/src/core/infrastructure/storage/SupabaseStorageAdapter.ts:437` (`guideHours: r.guide_hours !== undefined ? Number(r.guide_hours) : r.guideHours`). Check if other SupabaseStorageAdapter files exist in `src/` and patch if needed.
2. Implement integration test suites:
   - `apps/medicaltrip_react_app/tests/integration/supabase_crud_domain1_domain2.test.ts`
   - `apps/medicaltrip_react_app/tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`
   - `apps/medicaltrip_react_app/tests/integration/supabase_expenses_settlements_crud.test.ts`
3. Implement unified standalone script:
   - `apps/medicaltrip_react_app/scripts/verify_supabase_all_domains_crud.ts`
4. Execute tests and verify:
   - `npm test`
   - `npm run typecheck`
   - Run the standalone script via `npx tsx` or `vite-node`
5. Ensure clean teardown of test records in Supabase Cloud.
6. Deliver a 5-component handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m1/handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.
