# Dispatch: Reviewer M4-2-R2 (Replacement: Vite SPA Routing & Build Optimization — Features F23, F24)

## Objective
Independently review the Vite base path configuration, Rollup manual chunking, Vercel SPA rewrites, and build output for `apps/medicaltrip_react_app`.

## Authority & Inputs
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `worker_m4/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/worker_m4/handoff.md
- Files to review:
  * `apps/medicaltrip_react_app/vite.config.ts`
  * `apps/medicaltrip_react_app/vercel.json`
  * `/Users/miyo123/projects/medicaltrip/vercel.json`
  * `apps/medicaltrip_react_app/index.html`
  * `apps/medicaltrip_react_app/src/App.tsx`
  * `apps/medicaltrip_react_app/dist/` build output

## Review Tasks
1. Review `vite.config.ts`: verify `base: '/'` is set, and verify Rollup `manualChunks` vendor partitioning.
2. Review `vercel.json` in both app and root: verify modern rewrites mapping `/(.*)` to `/index.html`.
3. Review `index.html`: verify absolute paths for favicon, manifest, and service worker registration at `/sw.js` with `{ scope: '/' }`.
4. Review `App.tsx`: verify `isPatientPortalRoute` checks `currentPath.startsWith('/portal-paciente')`.
5. In `apps/medicaltrip_react_app`, run:
   - `npm run typecheck`
   - `npm run build`
   - Inspect `dist/index.html` to confirm all asset paths start with `/assets/` and 0 relative `./assets/`.
   - Verify no chunk size warnings (>1000 kB).
6. State explicit verdict: `APPROVE` or `REQUEST_CHANGES`.

## Deliverables
- Write full report to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T21:51:23Z
You are Reviewer M4-2-R2 (Replacement) for Milestone 4 (Vite SPA Routing & Build Optimization — Features F23, F24).
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/reviewer_m4_2_r2

