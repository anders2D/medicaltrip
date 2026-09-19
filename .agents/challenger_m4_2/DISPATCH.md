# Dispatch: Challenger M4-2 (SPA Deep Route & Asset Resolution Challenger)

## Objective
Empirically verify that deep routes, subpath reloads (`/portal-paciente`, `/portal-paciente/`, `/?module=settlement`), and production build assets resolve cleanly without 404 MIME errors.

## Authority & Inputs
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `worker_m4/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/worker_m4/handoff.md

## Empirical Tasks
1. Write and run an adversarial test suite in `tests/presentation/` (e.g. `M4SpaDeepRouteRefreshChallenger2.test.tsx`):
   - Test subpath initialization: set `window.location.pathname = '/portal-paciente'` and render `<App />`. Assert that `<PatientLoginView />` or `<PatientPortalView />` renders immediately with 0 admin controls and 0 role switchers.
   - Test trailing slash: set `window.location.pathname = '/portal-paciente/'` and verify identical safe rendering.
   - Test deep query parameters: `?portal=paciente` and `?reserva=rva171`.
2. Inspect `dist/index.html` build output:
   - Verify all scripts and stylesheets have `src="/assets/..."` and `href="/assets/..."`.
   - Assert 0 occurrences of `./assets/`.
3. Run in `apps/medicaltrip_react_app`:
   - `npx vitest run tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx`
4. State explicit verdict: `APPROVE` or `REJECT`.

## Deliverables
- Write full report to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T21:33:53Z
You are Challenger M4-2 for Milestone 4 (SPA Deep Route & Asset Resolution Challenger).
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/challenger_m4_2

Empirically verify:
1. Write and run an adversarial test suite in `tests/presentation/` (e.g. `M4SpaDeepRouteRefreshChallenger2.test.tsx`).
2. Empirically verify:
   - Direct navigation to `/portal-paciente` renders `<PatientLoginView />` (when unauthenticated) or `<PatientPortalView />` (when authenticated as patient).
   - Trailing slash `/portal-paciente/` and deep parameters `?portal=paciente` / `?reserva=rva171` render properly without 404.
   - Inspect `dist/index.html` to confirm all script and link tags use `/assets/...` (absolute root path) and zero `./assets/...`.
3. Run in `apps/medicaltrip_react_app`:
   - `npx vitest run tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx`
4. State explicit verdict: `APPROVE` or `REJECT`.

Write your report to `/Users/miyo123/projects/medicaltrip/.agents/challenger_m4_2/handoff.md` and send a message when finished.

