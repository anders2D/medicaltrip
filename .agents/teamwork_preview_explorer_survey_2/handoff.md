# Handoff Report — Explorer Survey 2: Patient Portal UI, Total Isolation & Ergonomics

**Surveyor Identity**: teamwork_preview_explorer (Explorer 2)  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2`  
**Target Codebase**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Authoritative Request**: `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (Section `## 2026-09-12T19:07:00Z`)  
**Timestamp**: 2026-09-12T19:15:00Z  

---

## 1. Observation

### 1.1 Current Application Shell & Root Rendering (`src/App.tsx`)
In `src/App.tsx`:
- Lines 8–35 import administrative and operational components: `ArchetypeSwitcherBar`, `CalendarContainer`, `EventDetailDrawer`, `DockedSettlementBar`, `ReceiptOcrModal`, `DigitalSignaturePad`, `NewPatientModal`, `SendPatientInvitationModal`, `SmartItineraryModal`, `CompanionTurnSheetModal`, `SwarmDiagnosticsModal`, `WelcomeOrientationModal`, `MobileBottomNav`, `FloatingActionButton`, `PatientSidebar`, `SettlementView`, `UsersView`, `PlanView`, `PassengersView`, and `ModuleNav`.
- Lines 36–146 define `MainAppLayout`. It unconditionally renders:
  1. `ArchetypeSwitcherBar` (top bar with patient switching and quick actions).
  2. `ModuleNav` (sub-bar with `settlement`, `users`, `plan`, and `passengers` tabs).
  3. Active module container (`SettlementView`, `UsersView`, `PlanView`, `PassengersView`).
  4. Test mode backward-compatibility mount with `DockedSettlementBar`, `CalendarContainer`, and `EventDetailDrawer`.
  5. Administrative modals (`ReceiptOcrModal`, `DigitalSignaturePad`, `NewPatientModal`, `SendPatientInvitationModal`, `CompanionTurnSheetModal`, `SwarmDiagnosticsModal`, `WelcomeOrientationModal`).
- Lines 148–162 (`AuthenticatedApp`): When `!isAuthenticated`, renders `<LoginView />`. When authenticated, renders `<MainAppLayout />` without distinguishing between Administrator and Patient.
- Lines 164–202 (`App`): Only checks `isSelfRegistration` based on URL search parameters (`autogestion`, `registro`, `token`, `invitation`), which renders `PatientSelfRegistrationView` for initial onboarding. There is no dedicated post-onboarding view or session for authenticated patients.

### 1.2 Authentication Context & Role Limitations (`src/core/auth/AuthContext.tsx`)
In `src/core/auth/AuthContext.tsx`:
- Line 20: `export type UserRole = 'ADMIN' | 'COMPANION';` — The system only recognizes `ADMIN` and `COMPANION` roles; there is zero support for a `'PATIENT'` role.
- Lines 30–44 define only two presets: `ADMIN_USER_PRESET` (Carolina Cortázar) and `COMPANION_USER_PRESET` (Yenny Roberto).
- Lines 46–59 define `AuthContextType`: provides `isAdmin`, `isCompanion`, `currentRole`, but lacks `isPatient`, `activeBookingId`, or patient session scoping.
- Lines 126–145 (`login` function): Credentials only match `admin / admin` (or `123456`) and `guia / guia` (or `acompanante / yenny`). Entering a patient reservation code or patient credentials results in an error: *"Credenciales inválidas. Administrador: admin / admin • Acompañante Físico: guia / guia"*.
- Line 61: Session persistence key `medicaltrip_auth_session` stores global user credentials with no booking containment.

### 1.3 Administrator Switcher & Diagnostic Telemetry (`src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`)
In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`:
- Lines 55–58: The brand logo "MT" includes an active developer diagnostic hook:
  ```tsx
  onDoubleClick={openSwarmDiagnosticsModal}
  title="Medical Trip Colombia (Doble clic para diagnóstico)"
  ```
- Lines 68–97: A patient dropdown trigger (`patient-dropdown-trigger`) and archetype buttons (`switcher-rva171`, `switcher-rva282`, etc.) allow instant switching across any patient record.
- Lines 104–125: Admin action buttons `btn-header-new-patient` ("+ Nuevo Paciente") and `btn-header-send-link` ("Enviar Link").
- Lines 266–290: Role switcher `btn-switch-role` ("Ver como Acompañante" / "Ver como Admin").

### 1.4 Financial Settlement Ledger & Presets (`src/features/settlement/`)
- `SettlementView.tsx` (lines 228–614):
  - Hero displays "Saldo Neto en Terreno" with exact COP amount, "Escanear Recibo" button, and "Firmar Acta" button.
  - "Desglose Contable" reveals:
    * "Acompañamiento Físico" ($15.500/h rate, $15.500 prep allowance, $8k–$35k meal subsidies).
    * "Flota Privada Aeroturex" ($90.000).
    * "Gastos de Caja Menor" (itemized receipts).
    * "Anticipos Recibidos" (-$200.000 Bancolombia).
  - "Caja Menor en Terreno" with 1-click categories (Café, Farmacia, Peaje, Taxi) and context panel for disbursement.
  - "Guardar & Conciliar" button with total liquidation sum.
- `DockedSettlementBar.tsx` (lines 40–91, 291–580):
  - `FAST_EXPENSE_PRESETS`: `☕ Café $15k`, `💊 Farmacia $185k`, `🍽️ Almuerzo $25k`, `🛣️ Peaje $18k`, `🚕 Taxi $90k`.
  - 5-segment proportional progress bar (`settlement-progress-bar`).
  - Prominent net balance badge (`settlement-net-balance-badge`) and breakdown labels (`Flota:`, `Guía:`, `Farmacia:`, `Anticipos:`).
  - Action buttons: `btn-open-companion-turn`, `btn-unified-settle-and-sign`, `open-ocr-modal-btn`, `export-pdf-btn`, `toggle-kpi-drawer-btn`, `reconcile-ledger-btn`, `export-json-btn`.
  - KPI Drawer (`expanded-kpi-drawer`) containing 5 internal financial cards (`SettlementKpiCards`).

### 1.5 Companion Shifts & Internal Rate Accounting (`src/features/companion-shifts/`)
In `src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`:
- Lines 205–246: Calculates companion shift hourly rates ($15.500 COP/h via `CompanionShift.DEFAULT_HOURLY_RATE_COP`), prep allowance ($15.500 COP), meal subsidy tier ($8.000, $25.000, $35.000, $45.000 COP), petty cash balance, and net companion payout (`companionNetPayoutCOP`).
- Lines 645–740: Formats and exports a printed turn receipt with internal fee accounting.
- Lines 777–785: "Guardar Turno" persists the shift and recalculates ledger debits.

### 1.6 Airport Logistics & Fleet Driver Check-In (`src/features/logistics-fleet/`)
In `src/features/logistics-fleet/presentation/ArrivalTrackingCard.tsx`:
- Displays flight tracking (`ZF-104`), scheduled arrival at JMC Rionegro, assigned fleet driver ([DRV-01] Ramón Rosero, Kia Sonet, NLX666, Aeroturex), destination hotel (Hotel Inntu Laureles / Park 42), and welcome kit button.
- Line 248–254: Renders `DriverCheckInAction` (`btn-driver-checkin`), an administrative action button for drivers/coordinators to mutate transfer status (`IN_TRANSIT` -> `COMPLETED`).

### 1.7 Itinerary Presentation & Cost Leaks (`src/features/itinerary/`)
- In `src/features/itinerary/presentation/EventCard.tsx`:
  - Lines 391–395 & 507–519: In Day and Agenda views, renders direct financial cost badges (`event.cost.formatCOP()`) and financial types (`event.financialType`: `OUT_OF_POCKET`, `GUIDE_FEE`, `FLEET_TAXI`).
  - Lines 380–383: Renders internal guide hours logged: `Guía (${event.guideHours}h)`.
  - Lines 402–436 & 532–572: Renders status progression mutation buttons (`En Camino`, `En Sitio`, `Completar`).
- In `src/features/itinerary/presentation/AgendaView.tsx`:
  - Lines 144–148: Day header banner displays aggregate cost: `Total: {group.totalDayCost.formatCOP()}`.
- In `src/features/itinerary/presentation/EventDetailDrawer.tsx` & `EventForm.tsx`:
  - Provides full creation, editing, cost input, guide rate estimation (`guideHours * 15500`), and deletion (`btn-delete-event`) of itinerary events.

### 1.8 Actor Swarm Diagnostic Tooling (`src/features/swarm/`)
In `src/features/swarm/presentation/SwarmDiagnosticsModal.tsx`:
- Lines 37–118: Real-time execution of RPC diagnostic tasks across `[DRV]`, `[GUIA]`, `[NURSE]`, and `[FIN]` actors.
- Lines 137–165: Telemetry banner displaying mesh actor status, message routing counts, CRDT PNCounter values, and LWWSet operations.

### 1.9 Existing Verification State
- `npm run typecheck` (`tsc --noEmit`): Exits with code 0 (0 errors).
- `tests/architecture_boundaries.test.ts`: Exits with code 0 (5/5 tests passing).
- `tests/presentation/`: All 20 test files and 127 tests pass 100%.

---

## 2. Logic Chain

```
[Observation 1.1 & 1.2: App.tsx renders MainAppLayout unconditionally; AuthContext only supports ADMIN/COMPANION]
       │
       ▼ (Step 1: Session & Routing Gap)
There is currently no separation between the administrative workspace and patient experience.
A patient logging in or accessing the application is either forced into admin login or exposed to
full coordinator tools, violating Requirement R1.
       │
       ▼ (Step 2: Dual-Role Authentication Contract)
AuthContext must be expanded to include role: 'PATIENT', with session persistence storing the patient's
active bookingId (e.g. 'RVA171-4'). In patient mode, state queries are strictly scoped to that single bookingId,
preventing cross-patient access (Requirement R3).
       │
       ▼ (Step 3: Route Decoupling & Entry Point)
A dedicated entry point must be established: '/portal-paciente' (or '?portal=paciente' / '?reserva=').
Unauthenticated access to '/portal-paciente' renders a clean PatientLoginView (login by reservation code
or token). Once authenticated, it renders PatientPortalView instead of MainAppLayout.
       │
       ▼ (Step 4: Total UI Isolation Invariant)
[Observations 1.3, 1.4, 1.5, 1.6, 1.7, 1.8: Docked bar, ledger, expenses, diagnostics, rates, margins, swarm pills]
When in Patient mode, every administrative, financial, diagnostic, or developer component MUST BE COMPLETELY
ABSENT from the DOM (not merely hidden with CSS). This eliminates cognitive friction, protects internal pricing
and staff wages, and satisfies the principle of data minimization (Requirement R1).
       │
       ▼ (Step 5: Patient-Centered View Architecture)
The Patient Portal must assemble 5 core patient-centered modules:
  1. Itinerary: Clinical appointments with doctor, clinic, fasting instructions, and dual timezone (COT/AST) — NO costs.
  2. Flights: Airport arrival tracking with driver Ramón Rosero profile and Orientation Kit — read-only, NO check-in button.
  3. Hotel: Assigned recovery accommodation with address, amenities, and room details.
  4. Companion: Bilingual guide profile, languages, and direct WhatsApp contact — NO hourly rates or meal allowances.
  5. Satisfaction Signature: Canvas signature pad for service conformity, SHA-256 seal, and PDF certificate export.
       │
       ▼ (Step 6: Radical Functional Minimalism Compliance)
Layout adheres strictly to .agents/rules/uiux_minimalist_standards.md: Tailwind allow-list (bg-white, bg-zinc-50,
zinc neutrals), hairline dividers (border-zinc-200), zero decorative shadows, tabular-nums font-mono for times/flights,
and Hick-Hyman Law (<= 5 primary actions).
```

---

## 3. Caveats

1. **No External Router Package**: The repository does not use `react-router-dom` (it is not in `package.json`). Route separation must be implemented cleanly using native browser location APIs (`window.location.search`, `window.location.pathname`, and `window.history.pushState` / `replaceState`), consistent with how `PatientSelfRegistrationView` is already mounted.
2. **Supabase Local TLS in Vitest**: In headless test environments without external network certificates, direct outbound HTTPS queries to Supabase require `NODE_TLS_REJECT_UNAUTHORIZED=0` or mocking via `IStoragePort`. In-browser IndexedDB (`DexieStorageAdapter`) and in-memory mock adapters are 100% offline and deterministic.
3. **Multi-Patient Privacy Scoping**: In the current `AppContext`, `switchArchetype` changes the global state across all 4 archetypes. In Patient mode, `switchArchetype` must be completely disabled/blocked, and queries must be locked exclusively to `user.bookingId`.
4. **Driver Check-in Action**: The existing `ArrivalTrackingCard` embeds `DriverCheckInAction`. In Patient mode, this button must be suppressed or rendered read-only as a transfer status timeline badge without trigger actions.
5. **Signature Pad Reuse**: The existing `DigitalSignaturePad` is designed for financial settlement (`SignOffItineraryUseCase` / `executeOneTapSettlementWorkflow`). In the Patient Portal, the signature pad must capture patient service satisfaction (`PatientSatisfactionSignOffUseCase` or clean signature capture) and export a Certificate of Care, with zero debit/credit math.

---

## 4. Conclusion

### 4.1 Architecture of the Dedicated Patient Portal (`/portal-paciente`)

#### A. Entry Point & Authentication Flow
- **Route**: Accessible at `/portal-paciente` or `/?portal=paciente` or with reservation code `/?reserva=RVA171-4`.
- **Dedicated Login (`PatientLoginView`)**:
  - Branded header: "Medical Trip Colombia · Portal del Paciente Internacional".
  - Input field: "Código de Reserva o Token de Invitación" (e.g. `RVA171-4`, `INV-2026-X`).
  - Quick-access demo buttons for Caribbean archetypes:
    * `[🇨🇼 Catia Rodrigues - Curazao]`
    * `[🇦🇼 Jean-Luc - Aruba]`
    * `[🇧🇶 Bonaire Patient]`
  - Validating the reservation code authenticates the user with:
    ```ts
    user: {
      username: 'pax-rva171',
      name: 'Catia Rodrigues',
      role: 'PATIENT',
      roleLabel: 'Paciente Internacional',
      bookingId: 'RVA171-4',
    }
    ```
- **Administrative Guard**: If a patient tries to navigate to `?module=settlement` or `?module=users`, the guard intercepts and redirects back to `/portal-paciente`.

#### B. Component Architecture for `/portal-paciente` (`PatientPortalView`)
The view is structured into five ergonomic, minimalist sections:

1. **Header & Context Bar**:
   - Institutional logo "MT" (without double-click developer diagnostics).
   - Welcome badge: Patient full name, country flag (`🇨🇼 Curazao`), and reservation code (`RVA171-4`).
   - Dual Timezone Indicator: `COT (Medellín)` vs `AST (Curazao)` via `DualTimezoneChip`.
   - Language Switcher: 1-click toggle (`Papiamento`, `Nederlands`, `English`, `Español`).
   - Direct Coordinator WhatsApp CTA: "Contactar Coordinadora" (`Carolina Cortázar`, `+57 300 123 4567`).
   - "Cerrar Sesión" button.

2. **Section 1: Mi Itinerario Clínico & Asistencial (`PatientItineraryView`)**:
   - Grouped chronologically by day (Día 1: Llegada, Día 2: Laboratorio & Consultas, Día 3: Procedimiento, etc.).
   - Cards display:
     * Appointment time in `tabular-nums font-mono` (e.g. `05:30 AM - 07:00 AM`).
     * Category badge with semantic accent: `CLINICAL` (indigo), `LAB` (teal), `FLIGHT` (sky), `HOTEL` (zinc), `TRANSFER` (amber).
     * Appointment title: "Laboratorio Clínico Domiciliario - Ayuno Estricto 8h".
     * Healthcare provider & address: "Clínica Clofán · Carrera 48 #19A-40, Medellín".
     * Clinical preparation notes: Fasting requirements, hydration restrictions, doctor recommendations.
     * Assigned personnel chip: "Acompañante: Yenny Roberto" / "Conductor: Ramón Rosero".
     * Read-only status: "Confirmado" / "En Curso" / "Completado".
     * **TOTAL ISOLATION**: ZERO `event.cost`, ZERO `financialType`, ZERO status progression buttons (`En Camino`, `En Sitio`, `Completar`), ZERO edit/delete handles.

3. **Section 2: Vuelos & Logística de Aeropuerto (`PatientFlightLogisticsView`)**:
   - Read-only variant of `ArrivalTrackingCard`:
     * Flight details: Airline (`Z-Fly`), Flight Number (`ZF-104`), Scheduled arrival at JMC Rionegro.
     * Arrival timeline: Solicitado ➔ Conductor en Camino ➔ Esperando en Puerta 2 ➔ En Hotel.
     * Assigned fleet driver card: Ramón Rosero, vehicle Kia Sonet `[NLX666]`, phone number, direct WhatsApp button.
     * Reception instructions: "Tu conductor te esperará en la salida internacional con el cartel distintivo de Medical Trip".
     * 1-Click "Kit de Bienvenida": Orientation modal trigger with SIM card delivery status, local currency guidance, and emergency contacts.
     * **TOTAL ISOLATION**: `DriverCheckInAction` button is COMPLETELY REMOVED from the DOM.

4. **Section 3: Mi Hospedaje & Recuperación (`PatientAccommodationView`)**:
   - Hotel profile: `Hotel Inntu Laureles` / `Edificio Park 42 El Poblado`.
   - Address and location map link: `Circular 73 #3-12, Laureles, Medellín`.
   - Room specification: Suite adaptada con cama de recuperación y ascensor camillero.
   - Amenities: Desayuno diario, enfermería disponible, WiFi de alta velocidad.

5. **Section 4: Mi Acompañante Bilingüe Asignado (`PatientCompanionView`)**:
   - Companion profile: `Yenny Roberto` (Acompañante Físico Bilingüe).
   - Languages: `Papiamento`, `Nederlands`, `English`, `Español`.
   - Direct WhatsApp button: "Escribir a Yenny Roberto por WhatsApp" (`+57 311 987 6543`).
   - Scheduled accompaniment hours: Daily agenda slots where the companion will be physically assisting the patient.
   - Scope of service: Guianza médica, traducción presencial durante valoraciones, asistencia personal.
   - **TOTAL ISOLATION**: ZERO companion shift hourly rates ($15.500/h), ZERO preparation allowance ($15.500), ZERO meal subsidies ($25k), ZERO petty cash balances.

6. **Section 5: Firma Digital de Conformidad & Satisfacción (`PatientSatisfactionSignOffView`)**:
   - Touch/stylus Retina HTML5 Canvas signature pad (reusing high-DPI canvas engine).
   - Legal statement in patient's preferred language:
     *"Certifico que he recibido a entera satisfacción los servicios de coordinación médica, traslados ejecutivos, acompañamiento bilingüe y hospedaje contratados con Medical Trip Colombia S.A.S."*
   - Signer name input (auto-filled with patient's name: "Catia Rodrigues").
   - 5-Star satisfaction rating (1–5 stars).
   - Instant SHA-256 cryptographic seal derived upon signing.
   - Celebratory confetti burst via `fireSignatureSealBurst()`.
   - 1-Click download of "Certificado de Atención y Satisfacción del Paciente" (PDF/Printable HTML).
   - **TOTAL ISOLATION**: ZERO financial balances, zero ledger debits/credits, zero settlement formulas.

---

### 4.2 Comprehensive Total UI Isolation Catalog (DOM Absence Matrix)

The following table lists every component and DOM element that must be **completely absent from the DOM tree** when rendering the Patient Portal:

| # | Element / Component | Test ID / CSS Selector | Reason for Complete DOM Omission |
|---|---|---|---|
| 1 | Docked Settlement Bar | `[data-testid="docked-settlement-bar"]` | Exposes live formula balance bar and debit/credit formulas. |
| 2 | Net Balance Badges | `[data-testid="settlement-net-balance-badge"]` | Reveals agency surplus or deficit. |
| 3 | Financial Breakdown Bar | `[data-testid="settlement-progress-bar"]`, text matching `Flota:`, `Guía:`, `Farmacia:`, `Anticipos:` | Exposes contractor rates and commercial cost breakdown. |
| 4 | KPI Summary Drawer | `[data-testid="expanded-kpi-drawer"]`, `SettlementKpiCards` | Contains internal disbursements, driver fees, and cash advances. |
| 5 | Fast Expense Presets | `[data-testid="fast-expense-tray"]`, `[data-testid^="btn-fast-expense-"]` | Internal coordinator disbursement shortcuts (Café, Farmacia, Taxi, Peaje). |
| 6 | Settlement Module View | `SettlementView`, `[data-testid="caja-menor-context-panel"]` | Coordinator accounting and reconciliation hub. |
| 7 | OCR Scanner Modal & Buttons | `[data-testid="open-ocr-modal-btn"]`, `[data-testid="btn-ocr-scanner-module"]`, `ReceiptOcrModal` | Internal audit of raw physical receipts. |
| 8 | Module Navigation Bar | `ModuleNav`, `[data-testid="desktop-module-nav"]`, `[data-testid="mobile-module-nav"]` | Allows accessing settlement, personnel directory, etc. |
| 9 | Swarm Diagnostics Modal & Triggers | `[data-testid="swarm-diagnostics-modal"]`, logo `onDoubleClick`, shortcut `Ctrl+Shift+D` | Internal developer Web Worker swarm debugging and CRDT inspector. |
| 10 | Companion Turn Sheet Modal | `CompanionTurnSheetModal`, `[data-testid="btn-open-companion-turn"]`, `[data-testid="btn-header-companion-turn"]` | Exposes $15.500 COP/h companion rate, meal subsidies, and petty cash. |
| 11 | Driver Check-In Admin Action | `DriverCheckInAction`, `[data-testid^="btn-driver-checkin"]` | Administrative button to mutate transfer operational state. |
| 12 | Archetype / Patient Switcher | `ArchetypeSwitcherBar`, `[data-testid="patient-dropdown-trigger"]`, `[data-testid^="switcher-rva"]` | Allows viewing or switching between other patients' bookings. |
| 13 | New Patient Modal & Button | `NewPatientModal`, `[data-testid="btn-header-new-patient"]` | Coordinator CRUD to create new reservations. |
| 14 | Patient Invitation Modal & Link Generator | `SendPatientInvitationModal`, `[data-testid="btn-header-send-link"]` | Coordinator tool to generate self-registration tokens. |
| 15 | Event Create / Edit Drawer | `EventDetailDrawer`, `EventForm`, `[data-testid="btn-delete-event"]` | Admin CRUD to alter clinical events, costs, and providers. |
| 16 | Event Financial Cost Badges | `[data-testid^="event-card-"] span.font-mono`, text matching `COP`, `OUT_OF_POCKET`, `GUIDE_FEE` | Direct costs billed to the agency. |
| 17 | Event Status Progression Buttons | `[data-testid^="status-progression-"]`, buttons "En Camino", "En Sitio", "Completar" | Coordinator operational state transition controls. |
| 18 | Role Switcher Button | `[data-testid="btn-switch-role"]` | Toggles between Admin and Companion views. |
| 19 | Users & Staff Operational Directory | `UsersView`, `[data-testid="user-role-badge"]` | Internal personnel roles, responsibilities, and system permissions. |
| 20 | Smart Itinerary Modal & Shortcut | `SmartItineraryModal`, shortcut `[I]` | Algorithmic batch itinerary generation. |
| 21 | Mobile Floating Action Button (`+`) | `[data-testid="mobile-fab-create-event"]` | Shortcut to open event creation drawer. |
| 22 | Mobile Bottom Navigation Balance Tab | `[data-testid="mobile-tab-balance"]` | Bottom navigation tab expanding settlement balance. |

---

### 4.3 Proposed Implementation Structure

```
src/
├── features/
│   └── patient-portal/                      <-- Autonomous vertical slice
│       ├── index.ts                         <-- Public API barrel
│       ├── domain/
│       │   └── PatientSatisfactionSignOff.ts <-- Domain VO for satisfaction seal
│       ├── application/
│       │   ├── GetPatientPortalDataUseCase.ts
│       │   └── SignPatientSatisfactionUseCase.ts
│       └── presentation/
│           ├── PatientPortalView.tsx         <-- Dedicated portal container
│           ├── PatientPortalHeader.tsx       <-- Clean header (lang, tz, coordinator WA)
│           ├── PatientLoginView.tsx          <-- Reservation code / token login
│           ├── PatientItinerarySection.tsx   <-- Cost-free clinical agenda
│           ├── PatientFlightSection.tsx      <-- Read-only arrival logistics
│           ├── PatientHotelSection.tsx       <-- Accommodation & recovery details
│           ├── PatientCompanionSection.tsx   <-- Bilingual companion profile & WA
│           └── PatientSatisfactionModal.tsx  <-- Canvas signature & PDF certificate
```

---

## 5. Verification Method

### 5.1 Verification Commands
To independently verify the facts, architecture, and current state documented in this report:

```bash
# 1. Verify TypeScript compilation produces 0 errors
cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
npm run typecheck

# 2. Verify architectural boundary invariants (0 cross-feature deep imports, 0 storage leaks)
npx vitest run tests/architecture_boundaries.test.ts

# 3. Verify existing presentation test suite passes 100%
npx vitest run tests/presentation/

# 4. Verify baseline unit and adversarial test suites
npx vitest run tests/adversarial/ComprehensiveZeroFrictionAdversarialStress.test.tsx
npx vitest run tests/adversarial/AdversarialResponsiveLayoutStress.test.tsx
```

### 5.2 Files to Inspect for Independent Review
1. `src/App.tsx`: Confirm `MainAppLayout` renders `ArchetypeSwitcherBar`, `ModuleNav`, `SettlementView`, `DockedSettlementBar`, and diagnostic modals.
2. `src/core/auth/AuthContext.tsx`: Confirm `UserRole` only has `'ADMIN' | 'COMPANION'` and lacks `'PATIENT'`.
3. `src/features/settlement/presentation/DockedSettlementBar.tsx`: Confirm lines 40–91 define fast expenses and lines 398–442 render live balance formulas.
4. `src/features/swarm/presentation/SwarmDiagnosticsModal.tsx`: Confirm lines 37–118 contain RPC diagnostic tasks and swarm actor status.
5. `src/features/itinerary/presentation/EventCard.tsx`: Confirm lines 391–395 and 507–519 render `event.cost` in COP and financial types.
6. `src/features/logistics-fleet/presentation/ArrivalTrackingCard.tsx`: Confirm line 248 renders `DriverCheckInAction`.
7. `src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`: Confirm lines 205–246 calculate $15.500 COP/h rates and meal allowances.

### 5.3 Automated Invalidation Conditions
This handoff report and its design conclusions shall be considered invalidated if:
1. Rendering the Patient Portal view results in any instance of `[data-testid="docked-settlement-bar"]` or `[data-testid="settlement-net-balance-badge"]` present in the DOM.
2. An authenticated patient session can trigger `switchArchetype` or view other patients' reservations.
3. Event cards in Patient mode render monetary amounts (`$ ... COP`) or internal billing codes (`OUT_OF_POCKET`, `GUIDE_FEE`).
4. The patient flight logistics card contains an active status mutation button (`DriverCheckInAction`).
5. Running `npm run typecheck` or `npx vitest run tests/architecture_boundaries.test.ts` fails after the Patient Portal feature is integrated.
