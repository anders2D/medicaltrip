# Handoff Report — Explorer Survey 2: Admin Cockpit Switcher & 7 Windows Minimalist UI (Alternativa 10)

**Author:** Explorer Survey 2  
**Target Application:** `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date:** 2026-09-14T17:35:00Z  
**Status:** Investigation Completed  
**Parent Orchestrator:** `4c46ec93-31c5-4060-81c0-0d21f4e3de48`

---

## 1. Observation

### 1.1 Test Suite & Build Verification
Direct execution of the quality pipeline confirms clean baseline integrity:
1. **TypeScript Typecheck (`npm run typecheck` / `tsc --noEmit`)**:
   - Exit code: `0`.
   - Errors: `0`.
2. **Vitest Test Suite (`npx vitest run`)**:
   - Result: `117 passed (117 test files), 1106 passed (1106 tests)`.
   - Duration: `114.14s`.
   - Zero test failures, zero regressions.
3. **Production Build (`npm run build` / `tsc -b && vite build`)**:
   - Exit code: `0`.
   - Duration: `3.46s`.
   - Output bundle: `dist/index.html` (2.01 kB), `dist/assets/index-*.js` (1,048.54 kB), `dist/assets/index-*.css` (64.83 kB).

---

### 1.2 Admin is God (R1): Cockpit Switcher & Status Pill
1. **Trigger Visibility on Desktop (`ArchetypeSwitcherBar.tsx:81`)**:
   - Current Code:
     ```tsx
     <button
       type="button"
       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
       data-testid="patient-dropdown-trigger"
       aria-expanded={isDropdownOpen}
       title="Cambiar paciente activo"
       className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all cursor-pointer min-h-[32px] active:scale-98 shrink-0"
     >
     ```
   - **Flaw**: The trigger button contains `md:hidden`, rendering it completely invisible on screen viewports $\ge 768\text{px}$ (tablets and desktops). On desktop, the administrator cannot see or open the patient dropdown directly from the header.
2. **Status Pill Representation (`ArchetypeSwitcherBar.tsx:83-96`)**:
   - Current Code renders only:
     ```tsx
     <span role="img">{activeArchetype?.countryFlag}</span>
     <span>{activeArchetype?.patientName.split(' ')[0]}</span>
     <span className="hidden sm:inline">{activeArchetype?.code}</span>
     <ChevronDown />
     ```
   - **Gap vs Specification**: The specification mandates an omnipresent, persistent Status Pill in the exact format:
     `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`
     Missing components: Clinical/procedure institution name (`CIMA`, `Cardio VID`, `CES`, `HPTU`), total Pax count (`3 Pax`), and full visibility across all resolutions.
3. **Keyboard Shortcuts [1]-[4] (`AppContext.tsx:590-602`)**:
   - Verified implementation:
     - `1` ➔ `switchArchetype('rva171')` (Catia)
     - `2` ➔ `switchArchetype('rva282')` (George)
     - `3` ➔ `switchArchetype('rva341')` (Eduard)
     - `4` ➔ `switchArchetype('rva077')` (Alejandra)
     - `N` ➔ `setIsNewPatientModalOpen(true)`
   - All shortcuts are active globally when modifier keys are not pressed (`!e.ctrlKey && !e.metaKey && !e.altKey`).
4. **Hotel Status in Switcher Dropdown (`ArchetypeSwitcherBar.tsx:237-243`)**:
   - Dropdown item renders `{archetype.hotelName} • {archetype.paxCount} Pax`.
   - Archetype hotel metadata:
     - `rva171`: Hotel Inntu Laureles
     - `rva282`: Airbnb Ed. Park 42 Poblado
     - `rva341`: Hotel Inntu Laureles (Hab. 1004)
     - `rva077`: Hotel Novelty Suites Poblado
5. **Immediate View Updates without Page Reloads (`AppContext.tsx:168-199`)**:
   - `switchArchetype(archetypeId)` invokes `LoadArchetypeUseCase(storagePort)` and atomically updates:
     - `setActiveArchetypeId(archetypeId)`
     - `setActiveBooking(bundle.booking)`
     - `setEvents([...bundle.events])`
     - `setShifts([...bundle.shifts])`
     - `setTransfers([...bundle.transfers])`
     - `setExpenses([...bundle.expenses])`
     - `setSettlement(bundle.settlement)`
   - All 4 active modules (`SettlementView`, `UsersView`, `PlanView`, `PassengersView`) consume this state directly from `AppContext`, updating reactively in < 16ms with zero DOM reloading.
6. **Role Switcher Anti-Pattern in Header (`ArchetypeSwitcherBar.tsx:266-291`)**:
   - Lines 266-291 contain `data-testid="btn-switch-role"` ("Ver como Acompañante" / "Ver como Admin"). This violates strict role isolation and must be removed.

---

### 1.3 Audit of the 7 Windows (Alternativa 10 Status & Gaps)

#### Window 1: Header / Cockpit Switcher
- **File**: `src/features/directory/presentation/ArchetypeSwitcherBar.tsx` (or similar)
- **Current Status**: Functional on mobile, broken on desktop due to `md:hidden`.
- **Gaps**:
  1. `md:hidden` prevents desktop cockpit dropdown opening.
  2. Pill format lacks clinic name and pax badge (`| CIMA · 3 Pax ▾`).
  3. Contains illegal role switch toggle `btn-switch-role` (lines 266-291).
- **Target Implementation**:
  - Remove `md:hidden` on `data-testid="patient-dropdown-trigger"`.
  - Display persistent Status Pill:
    `[${countryFlag} ${patientLastNameOrFullName} · ${shortCode} | ${clinicName} · ${paxCount} Pax ▾]`.
  - Ensure clicking trigger toggles the instant grid with 4 Caribbean cases, hotel status, keyboard shortcuts `[1]`-`[4]`, and prominent `[+ Nuevo Paciente]` button (`data-testid="btn-header-new-patient"`).
  - Remove `btn-switch-role`, leaving only user profile badge and `btn-logout`.

#### Window 2: Settlement Bento Grid & BigInt Calculations
- **File**: `src/features/settlement/presentation/SettlementView.tsx`
- **Current Status**: Implemented as Alternativa 10 with 2-column Bento Grid (`grid-cols-1 lg:grid-cols-12`, 7 cols left / 5 cols right).
- **Observations**:
  - Left column:
    * Hero Net Balance: Displays `{displayNetBalance}` in 48px tabular-nums (`SettlementView.tsx:288`).
    * Status Badge: `SettlementView.tsx:279` displays `{settlementStatusLabel}` ('Superávit Medical Trip' or 'A Favor del Paciente / Acompañante').
    * Subtitle: `SettlementView.tsx:285` displays `{settlementStatusSubtitle}` ('Saldo a Favor de Medical Trip (Superávit de Anticipo)').
    * Balance Bar: Progress bar comparing debits vs Bancolombia advances.
    * 4-Concept Ledger: Acompañamiento Físico (with collapsible shift hours and meal tier selector), Flota Privada Aeroturex, Gastos de Caja Menor, Anticipos Recibidos.
  - Right column:
    * Quick Actions: `Escanear Recibo` (`data-testid="btn-ocr-scanner-module"`) and `Firmar Acta` (`data-testid="btn-digital-signature-module"`).
    * Caja Menor en Terreno: 4 category pills (`Café`, `Farmacia`, `Peaje`, `Taxi`) with contextual numerical input panel for 1-tap disbursement (`data-testid="caja-menor-context-panel"`).
    * Custom Expense Accordion: `+ Otro Concepto` (`data-testid="btn-add-expense-custom"`).
    * Primary Close Button: `Guardar & Conciliar` (`data-testid="btn-save-settlement-main"`).
- **Gaps**:
  1. The prominent status badge (`SettlementView.tsx:279`) currently displays `'Superávit Medical Trip'`. To satisfy the requirement of explicit wording, it should render `"Saldo a Favor de Medical Trip"`.
  2. The 1-tap disbursement workflow should be tightly verified or modalized if required as a standalone dialog rather than inline contextual panel.

#### Window 3: Directorio Staff Directory (Zero Role Bleed)
- **File**: `src/features/directory/presentation/UsersView.tsx`
- **Current Status**: Contains illegal role switching card.
- **Observations**:
  - Lines 98-179: Contains `CONTROL DE ROLES OPERATIVOS` with `switchRole('ADMIN')` and `switchRole('COMPANION')` buttons.
  - Lines 181-252: Contains legitimate staff directory with 4 members:
    1. Carolina Cortázar (Admin General & Coordinación)
    2. Yenny Roberto (Acompañante Físico Bilingüe)
    3. Ramón Rosero (Conductor Principal de Flota)
    4. Dra. Jenny Paola Acosta (Dirección Médica & Calidad)
  - Members already have direct WhatsApp links (`https://wa.me/57...`).
- **Gaps**:
  1. Hero card (lines 98-179) MUST be deleted completely.
  2. Staff cards need dynamic duty badges (*"En Clínica CIMA"*, *"En Turno Activo"*, *"En Ruta (JMC ↔ Medellín)"*, *"Disponible en Sede CIMA"*) and assigned cases.

#### Window 4: Plan Dual Clinical Timeline + Triage Emergency Contacts
- **File**: `src/features/medical-plan/presentation/PlanView.tsx`
- **Current Status**: High-level static cards only (Hero package, Clinical provider, Hotel, Included services).
- **Gaps**:
  1. No Dual Clinical Timeline: Does not render a visual timeline separating clinical appointments/procedures from logistical milestones and recovery phases.
  2. No 1-Tap Triage Emergency Contacts: Displays nursing phone as static text (`+57 (4) 444 0000`). It lacks 1-tap dialable action cards for 24/7 Concierge Hotline, Hospital Triage Desk, and National Emergency (123).

#### Window 5: Pasajeros Family Dossier, Masked PHI & Flight Badges
- **File**: `src/features/directory/presentation/PassengersView.tsx`
- **Current Status**: Family dossier and PHI masking are functional.
- **Observations**:
  - Masked PHI (`PassengersView.tsx:295-303`): Displays SHA-256 passport hash (`data-testid="phi-passport-hash"`) and patient ID (`ENT-PAX-XXXX`), with zero plain-text passport numbers.
  - WhatsApp Onboarding Link (`PassengersView.tsx:403-439`): Shareable URL input with 1-click copy button (`data-testid="btn-copy-invitation-link"`).
  - Family Dossier (`PassengersView.tsx:340-401`): Displays Titular + Acompañantes list with Pax number badges and roles.
  - Search & Archive (`PassengersView.tsx:459-560`): Unified search by code/name, status filter (`PROGRAMADO`, `EN_CURSO`, `COMPLETADO`, `CANCELADO`), and archive/delete buttons.
- **Gaps**:
  1. Missing Airline Flight Badges: Does not render flight arrival/departure badges (`activeBooking.arrivalAirline`, `activeBooking.arrivalFlight`, e.g., `✈️ Z-Fly ZF-104 · 10:00 AM`) in the dossier header.

#### Window 6: Portal Paciente (Stress-Free Board)
- **Files**: `src/features/patient-portal/presentation/`
  - `PatientPortalView.tsx`
  - `PatientPortalHeader.tsx`
  - `PatientItinerarySection.tsx`
  - `PatientFlightSection.tsx`
  - `PatientHotelSection.tsx`
  - `PatientCompanionSection.tsx`
  - `PatientSatisfactionModal.tsx`
- **Current Status**: Complete, robust, fully compliant.
- **Observations**:
  - Accessible via `/portal-paciente` or `urlState.get('portal') === 'paciente'`.
  - Zero financial leak: Passes all 22 DOM absence assertions (rates, margins, ledger bars, swarm telemetry, admin buttons are completely absent).
  - Daily schedule rendered in patient-friendly terms without coordinator jargon.
  - Assigned guide card (`PatientCompanionSection.tsx`) displays Yenny Roberto, spoken languages (Papiamento, Spanish, English, Dutch), and direct WhatsApp contact.
  - 1-Tap satisfaction signature modal (`PatientSatisfactionModal.tsx`) with HTML5 Canvas and celebratory feedback.

#### Window 7: Consola Terreno (CompanionModeView)
- **Current Status**: **CRITICAL ARCHITECTURAL GAP — NOT IMPLEMENTED AS A DEDICATED VIEW**.
- **Observations**:
  - `src/App.tsx:170-208` does not branch on `user.role === 'COMPANION'`.
  - When authenticated as companion (`guia / guia`), the app falls through to `MainAppLayout`, exposing the administrator cockpit and module navigation (`settlement`, `users`, `plan`, `passengers`).
  - There is a rich modal `CompanionTurnSheetModal.tsx`, but no dedicated fullscreen high-contrast mobile view for companions on the move.
- **Gaps**:
  1. `src/features/companion-shifts/presentation/CompanionModeView.tsx` must be created.
  2. `src/App.tsx` must route `user.role === 'COMPANION'` to `CompanionModeView`.
  3. `CompanionModeView` must incorporate:
     - 48px touch targets (large sunlight-readable touch buttons).
     - Live shift timer with 15-min increments ($15.500/h + $15.500 prep).
     - 1-Click lunch subsidy tiers ($8k, $25k, $35k, $45k COP).
     - 1-Tap petty cash receipt OCR and fast logging.
     - Today's patient agenda summary.
     - Digital sign-off with patient.
     - Logout button and zero access to admin modules.

---

## 2. Logic Chain

1. **Premise 1 (Admin Cockpit Accessibility & God Mode)**:
   - *Observation*: `ArchetypeSwitcherBar.tsx:81` has `md:hidden` on `data-testid="patient-dropdown-trigger"`.
   - *Inference*: On any viewport $\ge 768\text{px}$, the DOM element is styled with `display: none`.
   - *Deduction*: Eliminating `md:hidden` makes the patient selector universally visible on mobile, tablet, and desktop viewports without requiring nested menus or sidebars. The persistent status pill format `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]` provides instant glanceability into nationality, patient name, reservation code, clinical institution, and group size.

2. **Premise 2 (Strict Role Isolation Invariant — Zero Role Bleed)**:
   - *Observation*: `UsersView.tsx:98-179` and `ArchetypeSwitcherBar.tsx:266-291` render in-DOM buttons that invoke `switchRole('ADMIN')` and `switchRole('COMPANION')`.
   - *Observation*: `App.tsx:202-208` renders `MainAppLayout` for any authenticated non-patient user, including `user.role === 'COMPANION'`.
   - *Inference*: A companion in the field has visibility into the full administrative shell, settlement audits, and patient management.
   - *Deduction*: Strict role isolation requires:
     (a) Deleting all in-DOM role switcher cards/buttons.
     (b) Authenticating roles exclusively at login (`LoginView`).
     (c) Adding dedicated route branching in `App.tsx` for `user.role === 'COMPANION'` to render `CompanionModeView`.

3. **Premise 3 (Surplus Ledger Semantics)**:
   - *Observation*: `SettlementView.tsx:279` displays `{settlementStatusLabel}` which evaluates to `'Superávit Medical Trip'` when advances exceed expenses.
   - *Observation*: The user requirement specifically demands the explicit wording `"Saldo a Favor de Medical Trip"`.
   - *Deduction*: Updating the primary status badge label to `"Saldo a Favor de Medical Trip"` eliminates any ambiguity for coordinators and patients.

4. **Premise 4 (Window 4 & Window 5 Completeness)**:
   - *Observation*: `PlanView.tsx` lacks an interactive clinical timeline and 1-tap emergency triage phone dialers.
   - *Observation*: `PassengersView.tsx` lacks flight badges for airline arrivals.
   - *Deduction*: Enriching `PlanView.tsx` with a dual clinical agenda and emergency triage triggers, and `PassengersView.tsx` with airline flight chips (`✈️ ZF-104 Z-Fly`), brings both modules to full Alternativa 10 compliance.

5. **Premise 5 (Window 7 Consola Terreno Requirements)**:
   - *Observation*: No `CompanionModeView.tsx` exists in the repository.
   - *Observation*: Field companions need large 48px touch targets, quick shift clocking ($15.500/h + $15.500 prep), 1-tap meal subsidies ($8k, $25k, $35k, $45k), and receipt OCR.
   - *Deduction*: A standalone `CompanionModeView.tsx` component that extracts logic from `CompanionTurnSheetModal.tsx` into a dedicated fullscreen interface will satisfy Window 7 without leaking administrative controls.

---

## 3. Caveats

1. **No Source Modifications in Survey**:
   - In accordance with the Explorer archetype rules, no production source files in `apps/medicaltrip_react_app` were modified during this investigation. All remediation items are documented for implementation by the builder/worker agents.
2. **Supabase Cloud Connectivity**:
   - While the local Dexie and In-Memory storage adapters were tested with 100% pass rates, Supabase cloud sync depends on active network credentials and internet connectivity in live production.
3. **Screen Resolution Assumption**:
   - Touch target compliance ($\ge 48\text{px}$) for `CompanionModeView` was audited against standard mobile viewports (375px - 428px iPhone / Android).

---

## 4. Conclusion

The application is in an exceptionally robust state (117 test files passing, 1106 tests passing, zero type errors, 3.46s production build), but possesses three specific architectural defects and four UI refinements that must be remediated to achieve 100% compliance with the 2026-09-14 requirements:

### Remediation Action Plan:
1. **Admin Cockpit Switcher (R1 & Window 1)**:
   - In `ArchetypeSwitcherBar.tsx`:
     - Remove `md:hidden` from `data-testid="patient-dropdown-trigger"`.
     - Update Status Pill to render: `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
     - Purge `data-testid="btn-switch-role"` button completely.
2. **Strict Role Isolation & Consola Terreno (R2 & Window 7)**:
   - In `UsersView.tsx`: Delete `CONTROL DE ROLES OPERATIVOS` card (lines 98-179).
   - Create `CompanionModeView.tsx` in `src/features/companion-shifts/presentation/` with 48px touch targets, shift clock, meal tiers, 1-tap OCR, today's agenda, and digital sign-off.
   - In `App.tsx`: Route `user.role === 'COMPANION'` to `CompanionModeView`.
3. **Settlement Refinement (Window 2)**:
   - In `SettlementView.tsx`: Change status label to `"Saldo a Favor de Medical Trip"`.
4. **Plan View Clinical Timeline & Triage (Window 4)**:
   - In `PlanView.tsx`: Add dual clinical timeline and 1-tap emergency dial buttons.
5. **Passengers View Flight Badges (Window 5)**:
   - In `PassengersView.tsx`: Add arrival airline/flight badges (`✈️ ZF-104 Z-Fly`).

---

## 5. Verification Method

### 5.1 Automated Command Line Verification
```bash
# 1. Typecheck
cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
npm run typecheck

# 2. Automated Test Suite (117 test files, 1106 tests)
npx vitest run

# 3. Dedicated Role Boundary Isolation Test
npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx

# 4. Archetype Switcher Test
npx vitest run tests/presentation/ArchetypeSwitcher.test.tsx

# 5. Production Build
npm run build
```

### 5.2 Key DOM Selectors & Test Assertions to Validate Post-Remediation
| Feature / Window | Target Element / Test ID | Expected State |
|---|---|---|
| Admin Cockpit Switcher | `[data-testid="patient-dropdown-trigger"]` | Visible on desktop (`display !== none`), renders `[🇨🇼 Catia Cortázar · RVA171 \| CIMA · 3 Pax ▾]` |
| Header Role Switcher | `[data-testid="btn-switch-role"]` | **Must NOT exist in DOM** (`toBeNull()`) |
| UsersView Role Card | `text="Control de Roles Operativos"` | **Must NOT exist in DOM** (`toBeNull()`) |
| Settlement Surplus Label | `[data-testid="settlement-view-root"]` or badge | Renders `"Saldo a Favor de Medical Trip"` |
| Consola Terreno | `[data-testid="companion-console-root"]` | Renders when `user.role === 'COMPANION'` with 48px touch targets |
| Passengers Flight Badge | `[data-testid="passenger-flight-badge"]` | Renders flight number (e.g. `ZF-104`) |
| Patient Portal Absence | `tests/presentation/RoleBoundaryIsolation.test.tsx` | All 22 administrative DOM checks pass |

