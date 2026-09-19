# Original User Request

## 2026-08-24T17:16:34Z

Use a very large team of agents to conduct a forensic UI/UX purge of any developer telemetry, diagnostic badges, or internal jargon that should NOT be visible to the end client, while rigorously certifying that 100% of operational user journeys work to absolute perfection.

Working directory: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
Integrity mode: development

## Requirements

### R1. Forensic Purge of Internal Developer Telemetry & Non-Client UI Noise
- Audit every component, modal, drawer, and toolbar to detect and remove (or discreetly tuck into a collapsed developer settings menu) any raw technical artifacts:
  * Web Worker Swarm telemetry badges / actor communication status pills if displayed as primary UI elements.
  * Raw database IDs or internal system codes that provide zero value to coordinators and patients.
  * Any unformatted error traces or diagnostic log overlays.
- Ensure the user interface presents only clean, consumer-grade business terminology (e.g., Paciente, Clínica, Conductor, Honorarios, Saldo Neto).

### R2. End-to-End Operational Journey Polish & Verification
- **Flow 1 (Patient Selection & Onboarding)**: Instant switching between all 4 real Google Drive archetypes (`[1-4]`) and clean creation of new patient profiles (`[N]`) without form friction.
- **Flow 2 (Smart Itinerary Generator)**: 1-click clinical pathway generation (`[I]`) with realistic timestamps (05:30 AM fasting lab, clinical consultations, recovery, fit-to-fly certificate).
- **Flow 3 (Interactive Calendar Ergonomics)**: Fluid switching across Month, Week, Day, and Agenda views with responsive 15-minute drag-and-drop snapping and zero layout shift.
- **Flow 4 (Fast In-Situ Expense Ingestion)**: 1-click preset expense logging (`☕ Café $15k`, `💊 Farmacia $185k`, `🍽️ Almuerzo $25k`, `🚕 Taxi $90k`) that updates the live settlement ledger instantaneously.
- **Flow 5 (1-Tap Settlement, Signature & PDF Export)**: Touch-friendly Retina HTML5 Canvas signature pad, automatic SHA-256 cryptographic seal derivation, celebratory confetti, and instantaneous PDF audit statement generation in <= 2 clicks.

### R3. Dual-Paradigm Desktop & Mobile Ergonomics
- **Desktop (>= 1024px)**: Clean 7-column calendar grid, slide-over drawer, and single-row docked formula balance bar.
- **Mobile (< 768px)**: Native touch layout with bottom navigation bar (Mes, Semana, Día, Agenda, Balance), floating action button (`+`), and accessible touch targets (>= 44x44px).

### R4. Automated Regression & Chromium CDP Runtime Certification
- Maintain a 100% test pass rate across all Vitest test suites (74 test files, >580 tests).
- Execute the autonomous Chromium CDP test harness (`run_autonomous_qa.mjs`) certifying:
  * 0 Uncaught runtime exceptions (`Runtime.exceptionThrown`).
  * 0 Console errors (`console.error`).
  * BigInt exact cents ledger arithmetic (Delta = 0.00).
  * Multi-viewport retina screenshots saved for client presentation.

---

## Acceptance Criteria

### Presentation Hygiene & Telemetry Purge
- [ ] Primary user interface contains zero raw developer telemetry (Swarm worker debugging moved to optional developer toggle or removed from presentation view).
- [ ] All terminology reflects high-trust medical tourism and financial coordination language (zero technical stack leaks).

### Flawless Operational Journeys
- [ ] All 5 operational flows (Patient switching, Smart itinerary, Calendar drag/drop, Fast expenses, 1-Tap settlement & signature) execute smoothly without glitches.
- [ ] PDF export generates complete itemized audit statements with valid SHA-256 seal.

### Quality, Build & CDP Verification
- [ ] All Vitest test suites pass with 100% PASS rate (74/74 files).
- [ ] Production build succeeds (`vite build`) producing optimized bundles in `dist/` with 0 TypeScript compilation errors.
- [ ] Autonomous QA harness executes in Chromium CDP with 0 runtime exceptions and 0 console errors.

## 2026-08-24T18:02:04-05:00

Use a very large team of agents to audit, design, and certify the end-to-end International Caribbean Patient Experience (Curaçao, Aruba, Bonaire), supporting multilingual ergonomics (Papiamento, English, Dutch, Spanish), seamless JMC Airport arrival logistics, bilingual companion assignment, and automated financial turn accounting for Medical Trip Colombia S.A.S.

Working directory: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
Integrity mode: development

## Requirements

### R1. Multilingual Caribbean Patient Experience (Papiamento / Dutch / English / Spanish)
- Implement multilingual UI tags and patient preference badges for Caribbean travelers arriving from Curaçao, Aruba, and Bonaire (`Papiamento`, `Nederlands`, `English`, `Español`).
- Provide instant language switcher toggles in the itinerary view, patient card, and PDF export templates.
- Ensure all medical consent and arrival instructions render with high readability in the patient's preferred language.

### R2. Airport Arrival & Logistics Handoff Flow (JMC Rionegro ➔ Hotel)
- **Arrival Tracking Card**: Visual flight tracker huddle displaying flight number, arrival time at JMC Rionegro, assigned driver ([DRV] Ramón Rosero), and destination hotel (Villa Anita / Park 42).
- **1-Click Driver Check-In**: Quick check-in action to notify coordination when the patient has been received at the terminal.
- **Welcome Orientation Kit**: Instant preview of emergency contacts, local SIM card delivery status, and exchange rate guidance.

### R3. Bilingual Companion Turn Management & Financial Accounting
- **Companion Shift Calculator**: Automatically calculate companion hourly shifts ($15.500 COP/h) and preparation allowance ($15.500 COP).
- **Tiered Meal Allowance**: Support 1-click selection of standardized meal subsidies ($8.000, $25.000, $35.000, $45.000 COP) integrated into the live ledger.
- **Digital Sign-Off**: Patient digital signature on companion turn sheets with instant SHA-256 seal generation.

### R4. Automated Regression & Chromium CDP Runtime Certification
- Maintain 100% test pass rate across all Vitest test suites (77+ test files).
- Execute the autonomous Chromium CDP test harness (`run_autonomous_qa.mjs`) certifying:
  * 0 Uncaught runtime exceptions (`Runtime.exceptionThrown`).
  * 0 Console errors (`console.error`).
  * BigInt exact cents ledger arithmetic (Delta = 0.00 COP).
  * Multi-viewport retina screenshots saved for client presentation.

---

## Acceptance Criteria

### Caribbean Patient UX & Multilingual Support
- [ ] Patient profile displays clear nationality/language badge (`🇨🇼 Curazao / Papiamento`, `🇦🇼 Aruba`, `🇧🇶 Bonaire`).
- [ ] Itinerary events and arrival cards provide multilingual translations and clear instructions.

### Logistics & Companion Accounting
- [ ] Airport arrival logistics card displays driver assignment and transfer status.
- [ ] Companion hourly fees ($15.500/h) and tiered meals calculate deterministically into the settlement dock.

### Quality, Build & CDP Verification
- [ ] All Vitest test suites pass with 100% PASS rate.
- [ ] Production build succeeds (`vite build`) with 0 TypeScript errors.
- [ ] Autonomous QA harness executes in Chromium CDP with 0 runtime exceptions and 0 console errors.

## 2026-08-25T03:54:39Z

Use a very large team of agents to implement the definitive architecture of Radical Functional Minimalism in Google Antigravity, codifying and deploying reusable `.agents` customizations (Rules, Skills, Agents), refactoring the user interface into zero-cognitive-friction elegance (Dieter Rams, Linear, Notion, Apple HIG), and verifying visual, mathematical, and runtime integrity.

Working directory: /Users/miyo123/projects/medicaltrip
Integrity mode: development

## Requirements

### R1. Reusable Antigravity Governance Core (`.agents/`)
- **Rules (`.agents/rules/`)**:
  * Create/Update `.agents/rules/uiux_minimalist_standards.md`: Strict Tailwind allow-list (`bg-white`, `bg-zinc-50`, `bg-zinc-950`, `bg-zinc-900`), prohibition of `shadow-xl`/`shadow-2xl`, mandatory `tabular-nums font-mono` for data, and strict DOM flattening.
  * Create/Update `.agents/rules/cognitive_load_invariants.md`: Mathematical action limit (<= 5 primary actions per view by Hick-Hyman Law), modal nesting depth limit = 1 (zero stacked dialogs), and mandatory optimistic UI with toast undo (`Ctrl+Z`).
- **Agents (`.agents/agents/`)**:
  * Create/Update `.agents/agents/uiux_critic_auditor/agent.md` & `.yaml`: Adversarial inspector with Nielsen severity matrix (0-4) blocking PRs with defects >= 2.
  * Create/Update `.agents/agents/generative_ui_architect/agent.md` & `.yaml`: Code refactoring builder for headless primitives and DOM flattening.
- **Skills (`.agents/skills/`)**:
  * Update `.agents/skills/uiux-autonomous-guardian/SKILL.md` and `.agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs` incorporating AOM pruning (<2k tokens), Set-of-Marks visual coordinate grounding, and dynamic SSIM structural regression.

### R2. Radical Functional Minimalist UI/UX Refactoring
- **Phase 1 (The Purge)**: Strip all decorative borders, badges, redundant labels, and heavy containers, replacing visual hierarchy with negative whitespace and subtle 1px hairline dividers (`border-zinc-200/50` / `ring-1 ring-zinc-200/50`).
- **Phase 2 (Token & Typographic Unification)**: Monotonic typographic scale (12px, 14px, 16px, 20px) with `tabular-nums` for all financial figures, dates, and timestamps.
- **Phase 3 (<= 2 Click Workflows & Inline Editing)**: 1-click speed presets, inline editing, and context drawers replacing disruptive navigation.
- **Phase 4 (Micro-Interactions & Optimistic Resilience)**: Tactile kinetic feedback (`active:scale-95 duration-200`), non-blocking bottom toasts with universal "Undo" (`Ctrl+Z`), and dual timezone chips (`COT (Medellín)` vs `AST (Caribe)`).

### R3. Automated Regression, WCAG 2.2 AAA & Chromium CDP Certification
- Validate 100% test pass rate across all Vitest test suites (101+ test files, >900 tests).
- Verify WCAG 2.2 AAA contrast ratios (>= 7:1 normal text, >= 4.5:1 large text) and APCA lightness contrast (Lc).
- Execute Chromium CDP runtime test harness with 0 exceptions, 0 console errors, exact BigInt ledger arithmetic (Delta = 0.00 COP), and multi-viewport retina screenshots.

---

## Acceptance Criteria

### Antigravity Governance & Reusability
- [ ] `.agents/rules/uiux_minimalist_standards.md` and `.agents/rules/cognitive_load_invariants.md` exist and enforce strict style & cognitive invariants.
- [ ] Subagents `uiux_critic_auditor` and `generative_ui_architect` configured and documented in `.agents/agents/`.
- [ ] `.agents/skills/uiux-autonomous-guardian/` updated with AOM, SoM, and SSIM integration.

### Minimalist UI/UX Refactoring
- [ ] Primary views contain zero decorative shadows (`shadow-2xl`), zero neon AI gradients, and <= 5 primary actions per view.
- [ ] All tabular data, financial ledgers, and timers use `tabular-nums font-mono`.
- [ ] Optimistic state mutations include non-blocking toast notifications with 1-click "Deshacer" (Undo / `Ctrl+Z`).
- [ ] Dual-timezone indicator displays local Caribbean (AST) and Colombia (COT) timestamps.

### Quality, Build & Verification
- [ ] 100% Vitest test pass rate across all test suites in both `medicaltrip` and `medicaltrip_app`.
- [ ] Production build succeeds (`vite build`) with 0 TypeScript compilation errors in <= 3s.
- [ ] Autonomous Chromium CDP inspector passes with 0 runtime exceptions and UI/UX heuristic score >= 98/100.

## 2026-09-12T16:23:36Z

Use a large team of workers where the team leader reviews and enforces all boundaries and contracts.

Refactor the Medical Trip web application (`apps/medicaltrip_react_app`) into an autonomous Feature-First Hexagonal Architecture with an abstract, swappable Storage Port (allowing seamless transition between in-browser Dexie/IndexedDB and remote Supabase/PostgreSQL) and archive obsolete legacy prototypes, maintaining 100% pass rate across the existing 935 automated tests.

Working directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
Integrity mode: development

## Verification Resources
- Vitest Automated Test Suite: 106 test files and 935 tests in `tests/` (`npm test`).
- TypeScript compiler: `npm run typecheck` (`tsc --noEmit`).
- Business invariants: BigInt cents ledger math (Delta = 0.00 COP) in `src/domain/value-objects/Money.ts` and `src/domain/entities/SettlementLedger.ts`.
- Core Caribbean archetypes: `rva171`, `rva282`, `rva341`, `rva077` in `src/infrastructure/data/archetypes.data.ts`.

## Requirements

### R1. Feature-First Vertical Slice Reorganization
Reorganize the application into autonomous vertical features under `src/features/` (`settlement`, `itinerary`, `medical-plan`, `logistics-fleet`, `companion-shifts`, `onboarding`, `directory`, `swarm`) and a shared kernel under `src/core/` (`domain`, `ports`, `infrastructure`, `auth`, `i18n`). Each feature must encapsulate its own domain models, use cases, local adapters, and UI components behind a strict public `index.ts` API.

### R2. Swappable Storage Port & Inversion of Control (Dexie ↔ Supabase)
Abstract all persistence operations behind an explicit, strongly-typed Storage Port (`IStoragePort`). Ensure presentation views and use cases interact exclusively with storage ports through a central Composition Root (`ServiceContainer`). The existing `DexieStorageAdapter` must remain 100% operational as the default local-first adapter, while defining the clean contract and ready adapter structure for plugging in a Supabase/PostgreSQL client without changing a single line of domain or presentation logic.

### R3. Automated Lead Reviewer Guardrail (Architecture Enforcement)
Implement an automated architectural test suite in Vitest (`tests/architecture_boundaries.test.ts`) that acts as the lead reviewer's automated enforcement gate, failing immediately if:
1. Any feature accesses internal files of another feature without using its public `index.ts`.
2. Any presentation component or application use case directly imports concrete database classes (`DexieStorageAdapter`, Dexie instances, or Supabase SDK).
3. Any domain model imports external frameworks, UI libraries, or storage drivers.

### R4. Archive Obsolete Roots and Redundant Forks
Safely move legacy non-tested prototypes (`index.html` and `flows_interactive_dashboard.html` in the root, `src/js/`, `apps/medicaltrip_calendar_app`, and `apps/itinerarios_liquidacion_offline`) into a top-level `archive/` directory so that `apps/medicaltrip_react_app` becomes the single clean source of truth.

### R5. Zero Regressions on Existing 935 Tests
Maintain 100% pass rate across all 106 test suites (935 tests) in `apps/medicaltrip_react_app`. All deterministic financial calculations, SHA-256 ledger chains, Web Worker actor swarm fallbacks, and multi-viewport layouts must remain fully functional.

## Acceptance Criteria

### Test & Compilation Integrity
- [ ] `npm test` runs and passes 100% of the 935 tests without regressions.
- [ ] `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.

### Architectural Boundary Validation
- [ ] An automated test (`tests/architecture_boundaries.test.ts`) executes during `npm test` and confirms zero cross-feature deep imports and zero direct database imports in UI/use-cases.

### Storage Decoupling & Swappability
- [ ] `IStoragePort` contains 0 references to Dexie, IndexedDB, or Supabase.
- [ ] Switching between `DexieStorageAdapter` and a future `SupabaseStorageAdapter` is achieved solely by changing the injection binding in `ServiceContainer` / Composition Root.
- [ ] All presentation views consume storage exclusively via use-case interfaces or injected ports.

### Repository Cleanliness
- [ ] Obsolete prototypes and redundant forks are neatly isolated in `archive/`.

## 2026-09-12T19:07:00Z

Use a very large team of agents with a lead reviewer enforcing role boundaries and complete CRUD contracts.

Implement a strict Dual-Portal architecture in the Medical Trip application (`apps/medicaltrip_react_app`) with distinct, fully isolated user interfaces and authentication flows for **Administrator** and **Patient**, ensuring the patient has a dedicated login with zero visibility of administrative/financial tools, the administrator has comprehensive CRUD control while respecting patient data privacy (PHI minimization), and all operations persist reliably through Supabase and local storage ports with zero test regressions.

Working directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
Integrity mode: development

## Verification Resources
- Vitest Automated Test Suite: 112 test files and 987 passing tests in `tests/` (`npm test`).
- TypeScript Compiler: `npm run typecheck` (`tsc --noEmit`) and production build `npm run build`.
- Live Supabase Cloud Database: `https://pxmobokcqhsixfvdsrwj.supabase.co` with 9 verified tables.
- Deterministic Math Invariant: BigInt cents ledger math in `src/features/settlement/domain/SettlementLedger.ts` and `src/core/domain/value-objects/Money.ts`.
- Architecture & Boundaries Suite: `tests/architecture_boundaries.test.ts`.

## Requirements

### R1. Dedicated Patient Authentication & Total UI Isolation
Create a distinct, branded Patient Portal entry point (`/portal-paciente`, patient login modal, or token/reservation code access) completely decoupled from administrative login. When authenticated as a Patient:
1. The user must NOT see or access administrative navigation, the docked settlement bar, internal ledger figures, cash advance balances, companion shift hourly rates, driver profit margins, or swarm diagnostic tooling.
2. The user sees an intuitive, patient-centered itinerary view: clinical appointments, flight arrival/departure tracking, assigned hotel details, direct WhatsApp coordinator contact, companion management, and service satisfaction signature.
3. Access attempts to administrative views or contexts must be strictly guarded and redirected.

### R2. Comprehensive Administrator Workspace with Principle of Data Minimization
Ensure the Administrator interface provides 100% full operational CRUD capabilities:
1. **Patient & Booking CRUD**: Create, edit, search, filter, and archive patient reservations with flights, hotel allocations, and companion counts.
2. **Clinical & Logistics Itinerary CRUD**: Add, reschedule, and update clinical appointments and airport/clinic transfers.
3. **Field Settlement CRUD**: Record and audit disbursements, register cash advances, calculate BigInt balances, and execute digital signature sign-offs.
4. **Patient Privacy & PHI Minimization**: The administrator view displays essential operational and logistical data (schedules, contact channels, airport logistics, mobility requirements) without exposing unneeded sensitive medical survey details or raw passport numbers (using sanitized hashes and normalized identifiers `ENT-PAX-XXXX`).
5. **Patient Invitation Management**: Generate 1-click self-registration tokens and personalized onboarding invitation links.

### R3. Dual-Role Session Management & Route Separation
Update `AuthContext` to natively support distinct `ADMIN` and `PATIENT` roles, with dedicated session persistence:
1. Patient sessions store the active `bookingId` or `token` and restrict state queries exclusively to that patient's records.
2. Admin sessions have global scope across archetypes and registered patients.
3. Seamless switching or logout between Administrator and Patient portals without session leaking or cross-contamination.

### R4. Automated Security & Isolation Guardrail Tests
Add an automated adversarial/security test suite (`tests/presentation/RoleBoundaryIsolation.test.tsx`):
1. Assert that rendering the Patient Portal produces 0 instances of financial cards, rate inputs, or admin modals.
2. Assert that Patient queries cannot access other patients' bookings or internal financial ledgers.
3. Assert that Administrator CRUD operations (Create/Read/Update/Delete) execute cleanly and sync with the active storage port (`SupabaseStorageAdapter` and `DexieStorageAdapter`).

### R5. Zero Regressions Across the 987 Existing Tests
Maintain a 100% pass rate across the existing 112 test files (987 tests). The production build (`npm run build`) and typecheck (`tsc --noEmit`) must pass with 0 errors.

## Acceptance Criteria

### Role & UI Separation
- [ ] Patient login is completely distinct and accessible via reservation code, invitation token, or credentials.
- [ ] Patient Portal renders solely patient-relevant items (itinerary, flight, hotel, companion details) with 0 financial or admin controls visible in the DOM.
- [ ] Administrator Portal retains 100% complete CRUD functionality across bookings, events, shifts, transfers, and settlements.

### Security & Privacy
- [ ] An automated test confirms that administrative routes/components are strictly blocked for patient sessions.
- [ ] Patient privacy is preserved in admin views through masked passport identifiers and operational data minimization.

### Build & Test Integrity
- [ ] `npm test` passes 100% of tests (987+ tests) with zero failures.
- [ ] `npm run typecheck` and `npm run build` succeed with 0 errors.
- [ ] Deployment to Vercel builds and runs successfully in production.

## 2026-09-14T16:49:34Z

Use a very large team of agents with a lead reviewer enforcing role boundaries and complete UI contracts.

Execute the complete UI/UX modernization and strict role isolation across the Medical Trip Colombia S.A.S. application (`apps/medicaltrip_react_app`):

1. **Admin is God**: Immediately upon login, the Administrator must have a prominent, 1-click passenger selector (Cockpit Switcher) visible on all screen sizes, allowing effortless switching between active Caribbean cases (`Catia RVA171`, `George RVA282`, `Eduard RVA341`, `Alejandra RVA077`) and creating new reservations.
2. **Strict Role Isolation (Zero Role Bleed)**: Eliminate all hybrid role-switching controls from operational views (purge the role-switching card from `UsersView` and the in-navbar toggle from `ArchetypeSwitcherBar`). Authenticate roles strictly via the login gateway:
   - **ADMIN**: Global management cockpit, full CRUD, patient switching, and settlement auditing.
   - **COMPANION (Persona en Sitio)**: Dedicated on-site field console (shift clock, 1-tap petty cash logging, daily itinerary, client signature).
   - **PATIENT**: Isolated self-service portal (`/portal-paciente`) with zero financial or internal logistics exposure.
3. **Implement High-Usability Minimalist UI (Alternativa 10)** across all 7 identified windows:
   - *Window 1 (Header)*: Omnipresent Status Pill + Fast Dropdown Cockpit (visible across mobile & desktop).
   - *Window 2 (Settlement)*: Responsive Bento Grid with explicit surplus ledger wording and 1-tap disbursement modal.
   - *Window 3 (Users/Directorio)*: Pure operational staff directory with duty badges, WhatsApp links, and zero role switches.
   - *Window 4 (Plan)*: Dual clinical timeline with hospital triage emergency contacts.
   - *Window 5 (Pasajeros)*: Family dossier with masked PHI, flight badges, and 1-click WhatsApp onboarding links.
   - *Window 6 (Portal Paciente)*: Stress-free patient board with daily schedule, assigned guide, and digital satisfaction signature.
   - *Window 7 (Consola Terreno)*: High-contrast, sunlight-readable field cockpit for companions on mobile.
4. **Zero Regressions**: Maintain 100% test pass rate across all Vitest suites, deterministic BigInt cents ledger math, and clean production build on Vercel.

Working directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
Integrity mode: development

## Verification Resources
- Vitest Automated Test Suite: 117 test files and 1106 passing tests in `tests/` (`npm test`).
- TypeScript Compiler: `npm run typecheck` (`tsc --noEmit`) and production build `npm run build`.
- Architectural Boundary Gate: `tests/architecture_boundaries.test.ts`.
- UI & Role Isolation Suite: `tests/presentation/RoleBoundaryIsolation.test.tsx`.
- Live Supabase Cloud Database: `https://pxmobokcqhsixfvdsrwj.supabase.co`.
- Deterministic Math Invariant: BigInt cents ledger math in `src/features/settlement/domain/SettlementLedger.ts` and `src/core/domain/value-objects/Money.ts`.

## Requirements

### R1. Admin God-Mode: Immediate 1-Click Passenger Selector
1. In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`, eliminate the `md:hidden` restriction on the patient selector so that the administrator on desktop can immediately see and switch active passengers upon login without hidden submenus.
2. Render a persistent, elegant Status Pill on desktop and mobile: `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
3. Clicking the selector opens an instant grid showing all active Caribbean cases (`RVA171`, `RVA282`, `RVA341`, `RVA077`) with keyboard shortcuts `[1]`-`[4]`, hotel status, and a prominent `[+ Nuevo Paciente]` button.
4. Switching a passenger immediately updates all active views (`settlement`, `plan`, `passengers`) without page reloads.

### R2. Strict Role Isolation (Purge Role-Combining Anti-Patterns)
1. In `src/features/directory/presentation/UsersView.tsx`:
   - Completely remove the *"CONTROL DE ROLES OPERATIVOS"* card (lines 98-170) that allows toggling between Admin and Companion.
   - Transform `UsersView` into a clean, professional **Directorio Operativo de Personal** displaying staff members (Carolina Cortázar, Yenny Roberto, Ramón Guía, Dra. Acosta), duty status (*"En Clínica CIMA"*, *"En Turno Activo"*), contact channels (direct WhatsApp triggers), and assigned cases.
2. In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`:
   - Remove the *"Ver como Acompañante"* / *"Ver como Admin"* toggle button.
   - The user profile badge indicates the authenticated role (`Admin` or `Guía de Terreno`) with a clean Logout button.
3. In `src/App.tsx`:
   - Enforce dedicated routing based on `user.role`:
     - If `user.role === 'ADMIN'`: Render the Admin Cockpit with Module Navigation (`settlement`, `users`, `plan`, `passengers`) and the God-mode passenger switcher.
     - If `user.role === 'COMPANION'`: Render the dedicated **Consola Operativa en Terreno** (`CompanionModeView`), focusing exclusively on shift tracking, fast petty cash logging, today's patient agenda, and digital sign-off.
     - If `user.role === 'PATIENT'`: Render the isolated `PatientPortalView` with zero access to admin views.

### R3. Implementation of Minimalist & Usable UI Across All 7 Windows
Implement the approved **Alternativa 10** for each window as documented in `uiux_per_window_10_alternatives.md`:
- **Window 1 (Header/Switcher)**: Status Pill + Instant Dropdown Cockpit.
- **Window 2 (Settlement)**: Dual-column responsive bento layout with unambiguous positive surplus labels (*"Saldo a Favor de Medical Trip"*), 1-tap disbursement modal, and BigInt deterministic calculations.
- **Window 3 (Users)**: Pure Operations Directory with status badges and WhatsApp triggers.
- **Window 4 (Plan)**: Dual clinical agenda with hospital network guide and 1-tap emergency dial.
- **Window 5 (Passengers)**: Clean family dossier with masked PHI, airline flight badges, and 1-click WhatsApp onboarding links.
- **Window 6 (Patient Portal)**: Tranquil, patient-centered itinerary view with daily schedule, assigned guide info, and digital satisfaction signature.
- **Window 7 (Field Console)**: High-contrast mobile view with 48px touch targets, shift timer with lunch subsidy tiers, and 1-tap petty cash OCR.

### R4. Security, Architectural Boundaries & Testing Integrity
1. Update `tests/presentation/RoleBoundaryIsolation.test.tsx` and all impacted tests:
   - Zero role-switching controls in the DOM for any role.
   - Patient sessions cannot access admin endpoints or financial summaries.
   - Admin sessions retain unrestricted CRUD capabilities across all archetypes.
2. Maintain 100% passing status across all Vitest suites.
3. Pass `npm run typecheck` and `npm run build` with 0 errors.
4. Deploy the updated production build to Vercel and verify live HTTP 200.

## Acceptance Criteria
- [ ] Admin God-mode passenger selector is immediately visible and operational upon login on desktop and mobile.
- [ ] Role-combining cards and toggles are completely purged from `UsersView` and `ArchetypeSwitcherBar`.
- [ ] Distinct views render for Admin, Companion (Persona en Sitio), and Patient.
- [ ] All 7 windows reflect the minimalist, high-usability Alternativa 10.
- [ ] 100% of Vitest tests pass without regressions.
- [ ] Production build succeeds and deploys cleanly to Vercel.

## 2026-09-16T18:15:06Z

Use a specialized team of autonomous testing and QA agents with live Chromium CDP instrumentation and Supabase database inspectors.

Execute an exhaustive, end-to-end interactive click harness and error interception audit across the Medical Trip web application (`apps/medicaltrip_react_app`). The goal is to simulate every user interaction, button click, tab change, modal submission, and login flow across all roles (Admin, Acompañante Físico, Paciente Internacional), capturing and eliminating 100% of runtime console errors, unhandled exceptions, and HTTP 4xx/5xx network failures while verifying continuous bidirectional sync with Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`).

Working directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
Integrity mode: development

## Verification Resources
- Live Preview Server: `http://localhost:3000`
- Supabase Cloud REST API: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- Headless Chromium CDP Harness: `scripts/visual_qa_audit.mjs`
- Production Build Check: `npm run build` (`tsc -b && vite build`)

## Requirements

### R1. Global Error Interception & Diagnostic Telemetry
1. Attach a low-level browser telemetry interceptor capturing:
   - All `console.error` and `console.warn` outputs.
   - All unhandled Promise rejections and window error events.
   - All outgoing HTTP requests to Supabase REST API (`/rest/v1/*`), logging request URL, headers (`apikey`, `Authorization`), payload, and response status codes.
2. Ensure zero 401 Unauthorized, 400 Bad Request, or 500 Internal Server errors occur during runtime.

### R2. Complete E2E Manual-Click Simulation Across All User Journeys
Perform complete, sequential button-by-button click validation across all application archetypes:
1. **Administrador Operativo (`admin` / `admin`)**:
   - **Módulo 1: Liquidación Financiera**: Expandir desglose contable, conmutar horas de acompañamiento presencial, disparar registro rápido de caja menor (1-Tap), recalcular balance determinista BigInt y generar PDF/JSON.
   - **Módulo 2: Directorio de Personal**: Inspeccionar tarjetas de coordinadores, conductores y guías, verificar enlaces WhatsApp y badges de estado.
   - **Módulo 3: Plan Médico & Red Hospitalaria**: Navegar cronograma clínico, abrir protocolos de urgencias y conmutar vistas día/semana/mes.
   - **Módulo 4: Dossier de Pasajeros**: Abrir modal de autogestión / compartir link, generar token de invitación multilingüe (`INV-*`), y validar protección de datos PHI.
   - **Cockpit Patient Switcher**: Conmutar entre paciente activo (Natalie Rumai `RVA350-1`) y otros perfiles asegurando 0 recargas fallidas.
2. **Acompañante Físico (`guia` / `guia`)**:
   - Consola de terreno: Registrar horas de turno ($15.500/h), ingresar comprobantes de taxi/farmacia y validar firma digital.
3. **Portal del Paciente Internacional (`RVA350-1`)**:
   - Consultar itinerario de vuelos Arajet, hotel asignado (Hotel 1616), citas en Glaucornea con el Dr. Lukas Saldarriaga y guía asignada.
4. **Formulario de Autogestión de Reserva (`PatientSelfRegistrationView`)**:
   - Diligenciar registro de 2 pasajeros (Titular + Acompañante), seleccionar hotel y enviar reserva directamente a Supabase Cloud.

### R3. Bidirectional Database Verification in Supabase Cloud
After every key action (Crear Paciente, Registrar Gasto, Actualizar Turno, Generar Itinerario):
1. Query Supabase Cloud REST API directly to assert that the corresponding table (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`) contains the exact persisted entity with valid data.
2. Verify that realtime updates propagate without state corruption or floating-point rounding errors.

### R4. Zero-Error Certification & Clean Minimalist UI/UX
1. Confirm that no UI clipping, broken modals, double scrollbars, or childish emojis appear in any view.
2. Validate that PWA Manifest icons (`icon-192.png`, `icon-512.png`) and modern viewport meta tags load cleanly without browser warnings.

## Acceptance Criteria

### Error & Network Invariants
- [ ] 0 `console.error` and 0 unhandled promise rejections recorded throughout all user click flows.
- [ ] 100% of network requests to Supabase Cloud (`/rest/v1/*`) return HTTP 200/201/204 status codes.
- [ ] 0 `401 Unauthorized` or invalid API key failures.

### Interactive Journey & Database Parity
- [ ] All 4 Admin modules, Companion Console, Patient Portal, and Self-Registration flows execute successfully.
- [ ] Every user action immediately reflects in Supabase Cloud database tables.
- [ ] Production build succeeds with 0 TypeScript compiler errors (`npm run build`).

## 2026-09-19T15:37:50Z

Execute an exhaustive, end-to-end agile CRUD testing and validation campaign for the entire Administrator operational workflow in the Medical Trip application (`apps/medicaltrip_react_app`), backed directly by Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co`) with deterministic BigInt math and zero runtime errors.

Working directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
Integrity mode: development

## Verification Resources
- Preview Server: `http://localhost:3000`
- Supabase Cloud Endpoint: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- Production Build Verification: `npm run build`
- Skills Available: `patient-creator`, `autonomous-qa-evaluator`, `uiux-autonomous-guardian`, `bpmn-modeler`, `skill-god`

## Requirements

### R1. Complete Administrator Workflow & CRUD Lifecycle Validation
Test the full spectrum of Create, Read, Update, and Delete (CRUD) operations across all 5 administrative core domains directly in Supabase Cloud:
1. **Dossier de Pasajeros & Reservas (`bookings`)**:
   - **Create**: Aprovisionar nueva reserva con titular, acompañantes, vuelos y hotel (`CreatePatientBookingUseCase` / `patient-creator`).
   - **Read**: Listar pacientes en Cockpit Switcher y cargar detalles de reserva.
   - **Update**: Modificar notas operativas, datos de vuelo u hotel asignado.
   - **Delete/Archive**: Eliminar/archivar reservas sin dejar registros huérfanos.
2. **Itinerario Clínico & Agenda Médica (`events`)**:
   - **Create**: Generar cronograma inteligente con presets médicos (`OPHTHALMOLOGY_3D`, `CARDIOLOGY_5D`, etc.).
   - **Read**: Visualizar cronograma en vista Agenda, Día, Semana y Mes.
   - **Update**: Reagendar citas médicas, cambiar horarios y estado de completitud (`RescheduleEventUseCase`).
   - **Delete**: Cancelar o eliminar eventos del calendario.
3. **Turnos de Acompañamiento en Terreno (`shifts`)**:
   - **Create**: Registrar turno de guía bilingüe a tarifa base $15.500 COP/h con subsidio de alimentación.
   - **Read**: Visualizar turnos activos y acumulados por paciente.
   - **Update**: Ajustar horas trabajadas con botones incrementales (+/- 0.5h) y registrar firma digital.
   - **Delete**: Eliminar turnos erróneos o duplicados.
4. **Logística de Flota & Choferes (`transfers`)**:
   - **Create**: Programar traslados Aeroturex (Aeropuerto JMC <-> Hotel <-> Hospital).
   - **Read**: Consultar estado de asignación de choferes y seguimiento de vuelos.
   - **Update**: Marcar check-in del conductor y confirmación de llegada.
   - **Delete**: Cancelar traslados logísticos.
5. **Caja Menor, Anticipos & Liquidación Determinista (`expenses`, `settlements`)**:
   - **Create**: Registrar gastos rápidos 1-Tap (Café, Farmacia, Peaje) y comprobantes personalizados; registrar anticipos de caja.
   - **Read**: Desglosar balance en Bento Grid, cuentas compartidas de hotel y resumen contable.
   - **Update**: Editar montos de comprobantes y recalcular balance BigInt en tiempo real (Delta = 0.00 COP).
   - **Delete**: Eliminar comprobantes rechazados y revertir anticipos.

### R2. Direct Supabase Cloud REST API Parity & Integrity
1. Verify that 100% of mutations and queries execute directly against Supabase Cloud REST API endpoints (`/rest/v1/bookings`, `/rest/v1/events`, `/rest/v1/shifts`, `/rest/v1/transfers`, `/rest/v1/expenses`, `/rest/v1/settlements`).
2. Ensure 0 HTTP 4xx/5xx network errors and 0 unhandled promise rejections.

### R3. Automated Chromium CDP Click Harness & Visual Certification
1. Run automated interactive browser simulation across all 4 admin tabs (`SettlementView`, `UsersView`, `PlanView`, `PassengersView`) plus modal dialogs (`NewPatientModal`, `ReceiptOcrModal`, `DigitalSignaturePad`, `CompanionTurnSheetModal`).
2. Capture screenshot evidence for every CRUD state transition.

## Acceptance Criteria

### CRUD & Database Parity
- [ ] 100% of Create, Read, Update, Delete operations for Bookings, Events, Shifts, Transfers, and Expenses reflect synchronously in Supabase Cloud.
- [ ] Financial balance calculations maintain mathematical determinism in BigInt cents with zero floating-point drift.
- [ ] Sello criptográfico `sha256Seal` se actualiza automáticamente tras cada modificación de liquidación.

### Error & Performance Invariants
- [ ] 0 `console.error` and 0 unhandled exceptions across all interactive journeys.
- [ ] 0 network failures (HTTP 400, 401, 404, 500) against Supabase REST API.
- [ ] Clean minimalist UI compliant with Nielsen 10 heuristics and zero visual clipping.
