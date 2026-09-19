# Dispatch: Explorer M4-1 (Vite Base Path SPA Fix & Routing Audit — Feature F24)

## Objective
Investigate and blueprint the SPA subpath refresh fix (`base: '/'` in `vite.config.ts`) and Vercel routing rewrites for `apps/medicaltrip_react_app`.

## Authority & Inputs
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- Files to inspect:
  * `apps/medicaltrip_react_app/vite.config.ts`
  * `apps/medicaltrip_react_app/vercel.json` (or root `vercel.json` if present)
  * `apps/medicaltrip_react_app/src/App.tsx`
  * `apps/medicaltrip_react_app/index.html`

## Investigation Scope
1. Inspect `vite.config.ts`: Verify whether `base: '/'` is explicitly declared. Blueprint exact configuration to ensure all asset paths and subpath routing work cleanly.
2. Inspect `vercel.json`: Check if routing rewrites exist so that direct navigation or browser refresh on `/portal-paciente` (or any subpath) rewrites to `/index.html` instead of returning a 404 error.
3. Check `src/App.tsx`: Check how routing parses pathname (e.g. `window.location.pathname.startsWith('/portal-paciente')`) and ensure no hydration or routing mismatch occurs on reload.
4. Deliver detailed blueprints and verification steps in your handoff.

## Deliverables
- Write full findings and code blueprints to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T21:19:09Z
You are Explorer M4-1 for Milestone 4 (Vite Base Path SPA Fix & Routing Audit — Feature F24) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_1

Authoritative files to read before starting:
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_1/DISPATCH.md
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `apps/medicaltrip_react_app/vite.config.ts`
- `apps/medicaltrip_react_app/vercel.json` (or check if one exists in the repo)
- `apps/medicaltrip_react_app/src/App.tsx`
- `apps/medicaltrip_react_app/index.html`

Investigate:
1. `apps/medicaltrip_react_app/vite.config.ts`:
   - Inspect existing configuration. Verify if `base: '/'` is set.
   - Formulate exact blueprint to ensure `base: '/'` is explicitly configured to prevent 404s on subpath refreshes (such as `/portal-paciente`).
2. SPA Routing & Vercel Rewrites:
   - Check if `vercel.json` exists in `apps/medicaltrip_react_app/` or repository root.
   - Blueprint the exact `vercel.json` rewrite configuration:
     ```json
     {
       "rewrites": [
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```
     (or `"routes": [{ "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" }]`)
     to ensure any deep link or refresh on `/portal-paciente` serves `index.html` with HTTP 200 rather than a 404.
3. In `apps/medicaltrip_react_app/src/App.tsx`:
   - Verify how client-side routing detects `/portal-paciente` on initial load (e.g. `window.location.pathname.startsWith('/portal-paciente')` or search params).
   - Ensure clean navigation without page reloads or broken asset references (`/assets/...`).

Write your findings, gap analysis, and code blueprints to:
/Users/miyo123/projects/medicaltrip/.agents/explorer_m4_1/handoff.md
Send a message when finished.

