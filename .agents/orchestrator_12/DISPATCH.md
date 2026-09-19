## 2026-09-14T16:54:19Z

You are the Project Orchestrator for the Medical Trip Colombia S.A.S. application UI/UX modernization and strict role isolation project.

Your assigned working directory is:
/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12

Your project workspace is:
/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

Authoritative user request is recorded in:
/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically the section "## 2026-09-14T16:49:34Z").

You must maintain your persistent working memory in /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/BRIEFING.md and continuous progress in /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/progress.md.

MISSION & REQUIREMENTS:
Use a team of agents with a lead reviewer enforcing role boundaries and complete UI contracts to execute the complete UI/UX modernization and strict role isolation across the Medical Trip Colombia S.A.S. application (`apps/medicaltrip_react_app`):

1. **Admin is God (R1)**: Immediately upon login, the Administrator must have a prominent, 1-click passenger selector (Cockpit Switcher) visible on all screen sizes (eliminate `md:hidden` restriction in `ArchetypeSwitcherBar.tsx`), allowing effortless switching between active Caribbean cases (`Catia RVA171`, `George RVA282`, `Eduard RVA341`, `Alejandra RVA077`) and creating new reservations (`[+ Nuevo Paciente]`). Render persistent Status Pill `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`, keyboard shortcuts `[1]`-`[4]`, hotel status, immediate view updates (`settlement`, `plan`, `passengers`) without page reloads.

2. **Strict Role Isolation (Zero Role Bleed) (R2)**:
   - In `src/features/directory/presentation/UsersView.tsx`: Completely remove the "CONTROL DE ROLES OPERATIVOS" card (lines 98-170). Transform `UsersView` into a clean, professional Directorio Operativo de Personal displaying staff members (Carolina Cortázar, Yenny Roberto, Ramón Guía, Dra. Acosta), duty status ("En Clínica CIMA", "En Turno Activo"), direct WhatsApp triggers, and assigned cases.
   - In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`: Remove "Ver como Acompañante" / "Ver como Admin" toggle button. User profile badge indicates authenticated role with clean Logout button.
   - In `src/App.tsx`: Enforce dedicated routing based on `user.role`:
     * ADMIN: Admin Cockpit with Module Navigation and God-mode passenger switcher.
     * COMPANION: Dedicated Consola Operativa en Terreno (`CompanionModeView`) focusing on shift tracking, fast petty cash logging, today's patient agenda, digital sign-off.
     * PATIENT: Isolated `PatientPortalView` with zero access to admin views.

3. **Implement High-Usability Minimalist UI (Alternativa 10) Across All 7 Windows (R3)**:
   - Window 1 (Header/Switcher): Status Pill + Instant Dropdown Cockpit.
   - Window 2 (Settlement): Responsive Bento Grid with explicit surplus ledger wording ("Saldo a Favor de Medical Trip"), 1-tap disbursement modal, BigInt deterministic calculations.
   - Window 3 (Users/Directorio): Pure operational staff directory with duty badges, WhatsApp links, zero role switches.
   - Window 4 (Plan): Dual clinical timeline with hospital triage emergency contacts.
   - Window 5 (Pasajeros): Family dossier with masked PHI, flight badges, 1-click WhatsApp onboarding links.
   - Window 6 (Portal Paciente): Stress-free patient board with daily schedule, assigned guide, digital satisfaction signature.
   - Window 7 (Consola Terreno): High-contrast mobile view with 48px touch targets, shift timer with lunch subsidy tiers, 1-tap petty cash OCR.

4. **Security, Architectural Boundaries & Testing Integrity (R4)**:
   - Update `tests/presentation/RoleBoundaryIsolation.test.tsx` and all impacted tests: zero role-switching controls in DOM for any role; patient cannot access admin endpoints or financial summaries; admin retains unrestricted CRUD across archetypes.
   - Maintain 100% test pass rate across all Vitest suites (`npm test`).
   - Pass `npm run typecheck` (`tsc --noEmit`) and `npm run build` with 0 errors.
   - Deploy updated production build to Vercel and verify live HTTP 200.
