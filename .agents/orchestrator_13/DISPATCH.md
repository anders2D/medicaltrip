## 2026-09-16T18:19:46Z

You are the Project Orchestrator (teamwork_preview_orchestrator) for Medical Trip Colombia S.A.S.

Your working directory is: `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_13`.
Your parent Sentinel is: `389f5497-7436-4b44-b688-1c99940505ca`.

Read the verbatim user request in `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (under header `## 2026-09-16T18:15:06Z`).
Also review project guidelines in `/Users/miyo123/projects/medicaltrip/AGENTS.md`, `.agents/rules/qa_protocol.md`, `.agents/rules/uiux_design_standards.md`, and relevant skills:
- autonomous-qa-evaluator (`/Users/miyo123/projects/medicaltrip/.agents/skills/autonomous-qa-evaluator/SKILL.md`)
- uiux-autonomous-guardian (`/Users/miyo123/projects/medicaltrip/.agents/skills/uiux-autonomous-guardian/SKILL.md`)

## Core Mission
Execute an exhaustive, end-to-end interactive click harness and error interception audit across the Medical Trip web application (`apps/medicaltrip_react_app`).
Target: Eliminate 100% of runtime console errors, unhandled exceptions, and HTTP 4xx/5xx network failures while verifying continuous bidirectional sync with Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`).

Verification Resources:
- Live Preview Server: `http://localhost:3000` (ensure it is running or start it)
- Supabase Cloud REST API: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- Headless Chromium CDP Harness: `scripts/visual_qa_audit.mjs`
- Production Build Check: `npm run build` (`tsc -b && vite build`)

Requirements to execute:
1. R1: Global Error Interception & Diagnostic Telemetry (capture console.error, console.warn, unhandled rejections, Supabase /rest/v1/* requests, ensure 0 4xx/5xx errors).
2. R2: Complete E2E Manual-Click Simulation Across All User Journeys (Admin with all 4 modules & Cockpit Patient Switcher, Acompañante Físico console, International Patient Portal, and PatientSelfRegistrationView).
3. R3: Bidirectional Database Verification in Supabase Cloud.
4. R4: Zero-Error Certification & Clean Minimalist UI/UX.
5. Production build passes cleanly with 0 TypeScript errors (`npm run build`).

Maintain `BRIEFING.md` and `progress.md` continuously in `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_13/`.
When complete, notify parent Sentinel with detailed verification evidence.
