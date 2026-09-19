# Dispatch for Worker M2 (Patient Portal UI & Total Isolation)

- Working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m2
- Original request: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (## 2026-09-12T19:07:00Z)
- Scope document: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_11/PROJECT.md
- Target repository: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Exclusive Write Boundaries
- `src/features/patient-portal/**` (create the full feature slice)
- `src/App.tsx` (mount `PatientPortalView` and `PatientLoginView`)

## Mandatory Requirements for Milestone M2
1. Create `src/features/patient-portal/`:
   - `presentation/PatientLoginView.tsx`:
     * Reservation code input (`RVA171-4`, `RVA282-5`, etc.) and invitation token input (`INV-*`).
     * Quick 1-click Caribbean demo buttons: `[🇨🇼 Curazao - Catia]`, `[🇦🇼 Aruba - Jean-Luc]`, `[🇧🇶 Bonaire - Alejandra]`.
     * Validates and calls `loginAsPatient` or `loginAsDemoPatient` from `useAuth()`.
     * Link back to admin login ("¿Eres coordinador o administrador? Ingresa aquí").
   - `presentation/PatientPortalHeader.tsx`:
     * Clean branding ("Medical Trip Colombia · Portal del Paciente Internacional"), MT logo (WITHOUT double-click developer diagnostics).
     * Patient badge (name, nationality flag `🇨🇼 Curazao`, reservation code).
     * Dual timezone chip (`COT / AST`), language switcher (`es`, `en`, `nl`, `pap`).
     * Direct WhatsApp coordinator CTA: `Carolina Cortázar` (`+57 300 123 4567`).
     * "Cerrar Sesión" button calling `logout()`.
   - `presentation/PatientItinerarySection.tsx`:
     * Day-by-day clinical agenda displaying appointment times (`tabular-nums font-mono`), category badges, clinic name, doctor, and preparation instructions.
     * ZERO financial costs (`$ COP`), ZERO financial types (`OUT_OF_POCKET`, `GUIDE_FEE`), ZERO status mutation buttons, ZERO edit/delete handles.
   - `presentation/PatientFlightSection.tsx`:
     * Flight tracking (`ZF-104`, airline, arrival time at JMC Rionegro).
     * Driver Ramón Rosero card (`Kia Sonet NLX666`, phone, WhatsApp button).
     * 1-Click Welcome Orientation Kit modal.
     * ZERO `DriverCheckInAction` button in DOM.
   - `presentation/PatientHotelSection.tsx`:
     * Assigned recovery accommodation: Hotel Inntu Laureles / Park 42, address, recovery amenities, location map link.
   - `presentation/PatientCompanionSection.tsx`:
     * Assigned bilingual companion profile: Yenny Roberto, languages, schedule, WhatsApp button.
     * ZERO companion hourly rates ($15.500/h), ZERO preparation allowance, ZERO meal subsidies.
   - `presentation/PatientSatisfactionModal.tsx`:
     * Touch/stylus Retina HTML5 Canvas signature pad for service conformity.
     * Legal statement in patient's preferred language.
     * 5-Star satisfaction rating.
     * SHA-256 seal derivation, confetti burst (`canvas-confetti`), and printable Certificate of Care.
     * ZERO financial math or ledger figures.
   - `presentation/PatientPortalView.tsx`:
     * Integrates all above sections with clean tab navigation or vertical flow.
     * Strictly enforces the 22-item DOM Absence Matrix.
   - `index.ts`:
     * Public API exporting `PatientPortalView`, `PatientLoginView`, and sub-components.
2. Update `src/App.tsx`:
   - Mount `PatientPortalView` in `AuthenticatedApp` when `isPatient || user?.role === 'PATIENT' || isPatientPortalRoute`.
   - Mount `PatientLoginView` when `isPatientPortalRoute && !isAuthenticated`.
3. Minimalist Design Standard:
   - Adhere strictly to `.agents/rules/uiux_minimalist_standards.md` (Tailwind allowlist, 1px hairline borders `border-zinc-200/50`, `tabular-nums font-mono`).
4. Verification:
   - `npm run typecheck` (0 errors).
   - `npx vitest run tests/architecture_boundaries.test.ts` (0 boundary leaks, public index.ts used).
   - `npx vitest run tests/presentation/` (all presentation tests pass).
   - `npm run build` (production build succeeds).

Deliver your handoff report to:
/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m2/handoff.md.

## 2026-09-12T19:31:15Z
You are Worker M2 for Milestone M2 (Patient Portal UI & Total Isolation).
Follow all instructions in DISPATCH.md:
1. Build `src/features/patient-portal/` with `PatientLoginView`, `PatientPortalView`, `PatientPortalHeader`, `PatientItinerarySection`, `PatientFlightSection`, `PatientHotelSection`, `PatientCompanionSection`, `PatientSatisfactionModal`, and public `index.ts`.
2. Enforce the 22-item DOM Absence Matrix (0 financial cards, 0 docked bar, 0 rates of $15.5k/h, 0 driver check-in button, 0 swarm diagnostics).
3. Mount in `src/App.tsx`.
4. Run `npm run typecheck`, `npx vitest run tests/architecture_boundaries.test.ts`, presentation tests, and `npm run build`.
5. Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_worker_m2/handoff.md` and send a message when done.
