# Dispatch: Worker M4 (Test Suite Hardening & SPA Subpath Refresh Fix — Features F20-F24)

## Objective
Implement Feature F24 (Vite Base Path SPA Fix & Vercel Rewrites), Feature F20 & F21 (Negative Role-Switching Test Suite & AuthAndLogin Refactoring), and Features F22 & F23 (Build Hardening & 100% Vitest/Typecheck Pass).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `explorer_m4_1/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_1/handoff.md (Vite base '/' and Vercel rewrites blueprints)
- `explorer_m4_2/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_2/handoff.md (RoleBoundaryIsolation Section 6 and AuthAndLogin blueprints)
- `explorer_m4_3/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_3/handoff.md (Vitest regression, Rollup vendor chunking & test timeout blueprints)

## Write Ownership
You exclusively own:
- `apps/medicaltrip_react_app/vite.config.ts`
- `apps/medicaltrip_react_app/vercel.json`
- `/Users/miyo123/projects/medicaltrip/vercel.json`
- `apps/medicaltrip_react_app/index.html`
- `apps/medicaltrip_react_app/src/App.tsx`
- `apps/medicaltrip_react_app/tests/presentation/RoleBoundaryIsolation.test.tsx`
- `apps/medicaltrip_react_app/tests/presentation/AuthAndLogin.test.tsx`
- `apps/medicaltrip_react_app/tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`

## Tasks
1. In `apps/medicaltrip_react_app/vite.config.ts`:
   - Set `base: '/'`.
   - Add Rollup `manualChunks` to split `vendor-react`, `vendor-supabase`, `vendor-dexie`, `vendor-icons`.
2. In `apps/medicaltrip_react_app/vercel.json` & `/Users/miyo123/projects/medicaltrip/vercel.json`:
   - Set modern rewrites configuration matching `/(.*)` to `/index.html`.
3. In `apps/medicaltrip_react_app/index.html`:
   - Update asset links to `/favicon.ico`, `/manifest.json`, and service worker registration to `/sw.js` with `{ scope: '/' }`.
4. In `apps/medicaltrip_react_app/src/App.tsx`:
   - Update `isPatientPortalRoute` to include `currentPath.startsWith('/portal-paciente')`.
5. In `apps/medicaltrip_react_app/tests/presentation/RoleBoundaryIsolation.test.tsx`:
   - Append Section 6 (`M4-NEG-01` to `M4-NEG-06`) from Explorer M4-2's blueprint.
   - Add required imports (`UsersView`, `ArchetypeSwitcherBar`).
6. In `apps/medicaltrip_react_app/tests/presentation/AuthAndLogin.test.tsx`:
   - Update with Explorer M4-2's hardened 9-test suite.
7. In `apps/medicaltrip_react_app/tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`:
   - Ensure explicit 30,000ms timeouts on Supabase live tests to prevent network spikes.
8. Verification commands in `apps/medicaltrip_react_app`:
   - `npm run typecheck` (`tsc --noEmit`)
   - `npx tsc -b`
   - `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx tests/presentation/AuthAndLogin.test.tsx`
   - `npm test` (full suite: all test files must pass)
   - `npm run build` (`tsc -b && vite build`)

## Deliverables
- Write full report to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T21:25:20Z
Received dispatch for Worker M4 (Test Suite Hardening & SPA Subpath Refresh Fix — Features F20-F24).
Working directory: /Users/miyo123/projects/medicaltrip/.agents/worker_m4

