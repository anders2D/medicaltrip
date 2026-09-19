## 2026-09-12T20:00:10Z
<USER_REQUEST>
You are the Test Writer for Milestone M4 (Role Boundary Isolation Test Suite).
Your identity: teamwork_preview_test_writer
Your working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_test_writer_m4
Your DISPATCH file: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_test_writer_m4/DISPATCH.md
Read the authoritative user request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-09-12T19:07:00Z).
Read PROJECT.md at: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
The project target repository is: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All tests must be authentic and thorough. DO NOT write vacuous assertions or dummy tests. An auditor will independently inspect the test suite.

Author the complete automated test suite in:
`tests/presentation/RoleBoundaryIsolation.test.tsx`
Covering:
1. Complete absence of all 22 financial and administrative elements in Patient Portal DOM.
2. Scoped patient queries (single booking scoping, preventing access to other patients' records or ledgers).
3. Anti-tampering URL/navigation guards redirecting patients away from admin modules.
4. Administrator full CRUD execution (Create, Search, Filter, Archive/Delete) and synchronization with active storage ports (Dexie + Supabase via ServiceContainer).
5. PHI minimization verification (ENT-PAX-XXXX, passportHash, zero raw passports in DOM).

Run:
- `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`

Deliver your handoff report to:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_test_writer_m4/handoff.md` and send a message when done.
</USER_REQUEST>
