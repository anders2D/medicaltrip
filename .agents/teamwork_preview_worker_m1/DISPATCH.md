# Dispatch for Worker M1 (Core Auth, Dual-Role Session & Route Guarding)

- Working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m1
- Original request file: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- Scope document: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
- Target repository: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Boundaries
You own ONLY these files:
- `src/core/auth/AuthContext.tsx`
- `src/core/auth/LoginView.tsx`
- `src/core/auth/index.ts`
- `src/presentation/state/AuthContext.tsx`
- `src/App.tsx`

## Mandatory Tasks
1. Extend `src/core/auth/AuthContext.tsx`:
   - Add `'PATIENT'` to `UserRole`.
   - Update `User` interface to include optional `bookingId`, `bookingCode`, `patientId`, `token`.
   - Add `PATIENT_USER_PRESET`:
     ```typescript
     export const PATIENT_USER_PRESET: User = {
       username: 'paciente_catia',
       name: 'Catia Rodrigues',
       role: 'PATIENT',
       roleLabel: 'Paciente Internacional',
       email: 'catia.rodrigues@patient.medicaltrip.co',
       bookingId: 'bkg-rva171',
       bookingCode: 'RVA171-4',
       patientId: 'ENT-PAX-0171',
     };
     ```
   - Update `AuthContextType` with `isPatient: boolean`, `loginAsPatient: (bookingCodeOrToken: string, identifier?: string) => Promise<boolean> | boolean`, `loginAsDemoPatient: (bookingCode?: string) => void`.
   - Implement dual session persistence:
     * Admin session key: `medicaltrip_auth_session`
     * Patient session key: `medicaltrip_patient_session`
     * Independent logouts.
   - **CRITICAL BACKWARD COMPATIBILITY INVARIANT**: In test environments (`process.env.NODE_ENV === 'test'`), `AuthContext` must continue to auto-boot with `ADMIN_USER_PRESET` unless `window.__TEST_SHOW_LOGIN__ === true` or `'medicaltrip_logged_out' === 'true'`. If `window.__TEST_AS_PATIENT__ === true`, auto-boot with `PATIENT_USER_PRESET`.
   - In `loginAsPatient`: match Caribbean archetypes (`RVA171-4`, `RVA282-1`, `RVA341-2`, `RVA077-9`) or tokens starting with `INV-` or valid booking IDs.
2. In `src/core/auth/LoginView.tsx`:
   - Keep admin/companion functionality intact.
   - Add an unobtrusive footer referral: "¿Eres paciente? Consulta tu itinerario aquí" navigating to `/portal-paciente`.
3. In `src/App.tsx`:
   - Detect `/portal-paciente` or `?portal=paciente` or `?reserva=` from URL.
   - Enforce anti-tampering guards: if `user?.role === 'PATIENT'`, prevent accessing administrative modules (`settlement`, `users`), redirecting to `/portal-paciente`.
4. Verification:
   - Run `npm run typecheck`
   - Run `npx vitest run tests/presentation/AuthAndLogin.test.tsx`
   - Run `npx vitest run tests/architecture_boundaries.test.ts`
   - Ensure 0 errors.

Deliver your handoff report to:
/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m1/handoff.md.

## 2026-09-12T19:15:04Z
You are Worker M1 for the Dual-Portal Architecture & Role Isolation project.
Your identity: teamwork_preview_worker
Your working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m1
Your DISPATCH file: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m1/DISPATCH.md
Read the authoritative user request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-09-12T19:07:00Z).
Read PROJECT.md at: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
The project target repository is: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Follow all instructions in DISPATCH.md. Implement Milestone M1:
1. Extend `src/core/auth/AuthContext.tsx` with `PATIENT` role, presets, and dual session persistence.
2. Update `src/core/auth/LoginView.tsx` with patient link.
3. Update `src/App.tsx` with route guards and session isolation.
4. Run `npm run typecheck`, `npx vitest run tests/presentation/AuthAndLogin.test.tsx`, and `npx vitest run tests/architecture_boundaries.test.ts`.
5. Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m1/handoff.md` and send a message when done.
