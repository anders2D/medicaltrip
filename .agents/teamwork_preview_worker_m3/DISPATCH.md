# Dispatch for Worker M3 (Admin Workspace CRUD, PHI Minimization & Storage Sync)

- Working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m3
- Original request: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (## 2026-09-12T19:07:00Z)
- Scope document: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
- Target repository: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Boundaries
- `src/features/directory/presentation/PassengersView.tsx`
- `src/features/onboarding/presentation/SendPatientInvitationModal.tsx`
- `src/features/onboarding/presentation/PatientSelfRegistrationView.tsx`
- `src/core/infrastructure/ServiceContainer.ts`

## Mandatory Tasks
1. Enhance `src/features/directory/presentation/PassengersView.tsx`:
   - Add unified booking search input (`data-testid="input-search-passengers"`): search by patient name, reservation code, or `ENT-PAX-XXXX` ID.
   - Add status filter dropdown (`data-testid="select-status-filter"`): All, `PROGRAMADO`, `EN_CURSO`, `COMPLETADO`, `CANCELADO`.
   - Add Archive/Delete action (`data-testid="btn-archive-booking"` / `data-testid="btn-delete-booking"`): calls `storagePort.deleteBooking` when available.
   - Enforce PHI minimization: display `ENT-PAX-XXXX`, masked passport (`passportHash` / shield badge), 0 raw passport leaks.
   - Maintain 100% backward compatibility with existing tests.
2. Decouple `SendPatientInvitationModal.tsx` and `PatientSelfRegistrationView.tsx`:
   - Replace direct `new LocalStoragePatientInvitationAdapter()` instantiations with `ServiceContainer.getInvitationRepository()`.
   - Satisfy architectural boundary rule Check 2 in `tests/architecture_boundaries.test.ts` (0 concrete database adapter instantiations in presentation).
3. Ensure Storage Sync:
   - Ensure invitations and bookings persist through `ServiceContainer.getStoragePort()` and `ServiceContainer.getInvitationRepository()`.
4. Verification:
   - `npm run typecheck` (0 errors)
   - `npx vitest run tests/architecture_boundaries.test.ts` (5/5 PASS)
   - `npx vitest run tests/presentation/SendPatientInvitationModal.test.tsx`
   - `npx vitest run tests/presentation/PatientSelfRegistration.test.tsx`
   - `npm run build`

Deliver handoff report to:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m3/handoff.md`.

## 2026-09-12T19:44:27Z
You are Worker M3 for Milestone M3 (Admin Workspace CRUD, PHI Minimization & Storage Sync).
Your identity: teamwork_preview_worker
Your working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m3
Your DISPATCH file: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m3/DISPATCH.md
Read the authoritative user request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-09-12T19:07:00Z).
Read PROJECT.md at: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
The project target repository is: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

Follow all instructions in DISPATCH.md:
1. Enhance `src/features/directory/presentation/PassengersView.tsx` with search input (`input-search-passengers`), status filter dropdown (`select-status-filter`), and archive/delete action (`btn-archive-booking`). Preserve PHI minimization (ENT-PAX-XXXX, passportHash, 0 raw passports).
2. Decouple `SendPatientInvitationModal.tsx` and `PatientSelfRegistrationView.tsx` from `LocalStoragePatientInvitationAdapter`, replacing with `ServiceContainer.getInvitationRepository()`.
3. Verify storage sync and architectural boundaries.
4. Run `npm run typecheck`, `npx vitest run tests/architecture_boundaries.test.ts`, presentation tests, and `npm run build`.
5. Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m3/handoff.md` and send a message when done.

