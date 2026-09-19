# UI Specification Mining Report — MedicalTrip React Application
**Agent**: `survey_explorer_13_2` (`teamwork_preview_spec_miner`)  
**Target Application**: `apps/medicaltrip_react_app`  
**Date**: 2026-09-16  
**Parent Agent**: `7f053633-4099-4310-b660-57d8e8a18fdc`  

---

## Executive Summary
This specification report provides the exhaustive, authoritative reverse-engineered user interface specification of `apps/medicaltrip_react_app`. Every component hierarchy, route guard, interaction target (`data-testid`, button text, HTML selector), state model, BigInt financial rule, PHI masking protocol, and cloud persistence mapping has been extracted by inspecting the TypeScript/React codebase, domain entities, value objects, and Supabase database adapters.

The application serves four primary operational personas:
1. **Administrador Operativo** (`admin`/`admin`): Cockpit switcher and 4 operational modules (Liquidación Financiera, Directorio de Personal, Plan Médico & Red Hospitalaria, Dossier de Pasajeros).
2. **Acompañante Físico** (`guia`/`guia`): Ground operations console (`CompanionModeView`) featuring shift hour logging ($15.500 COP/hr), 5-tier lunch subsidies, 1-tap petty cash ingestion, and digital signature sign-off with SHA-256 seal.
3. **Portal del Paciente Internacional** (`RVA350-1`): Multilingual portal for Caribbean patients (Natalie Monica Bito e/v Rumai) tracking Arajet flights, Hotel 1616 stay, Glaucornea surgical itinerary (Dr. Lukas Saldarriaga), physical guide contact, and a 5-star digital satisfaction certificate.
4. **Formulario de Autogestión de Reserva** (`PatientSelfRegistrationView`): 4-step wizard accessible via token or URL parameters, capturing 2-pax dossiers, medical survey data, hotel accommodations, and persisting directly to Supabase.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Routing | Role Tamper Guard & Login Routing | Dispatches users to specific interfaces based on role (`ADMIN`, `COMPANION`, `PATIENT`) or URL query params (`?registro=true`) | Credentials (`admin`/`admin`, `guia`/`guia`, tokens) | Renders `MainAppLayout`, `CompanionModeView`, `PatientPortalView`, or `PatientSelfRegistrationView` | Invalid credentials prompt inline error message | `src/App.tsx`, `src/presentation/views/LoginView.tsx` |
| 2 | Cockpit Nav | Caribbean Archetype Switcher | Header dropdown allowing instantaneous switching between active operational cases (RVA350-1, RVA171-4, RVA282-5) | Click or hotkeys [1-5] | Updates global `selectedArchetype`, active ledger, passenger dossier, and schedule | Falls back to default archetype if index out of bounds | `src/presentation/components/ArchetypeSwitcherBar.tsx`, `useKeyboardShortcuts.ts` |
| 3 | Cockpit Nav | Module Navigation Bar | Top and mobile dock navigation across 4 operational modules | Tab clicks: `module-tab-settlement`, `module-tab-users`, `module-tab-plan`, `module-tab-passengers` | Active view state change | Ignored if already on active tab | `src/presentation/components/ModuleNav.tsx` |
| 4 | Módulo 1 (Finance) | Net Settlement Balance & Summary Card | Real-time calculation of net balance using BigInt integer arithmetic to eliminate floating-point drift | Patient expense transactions, disbursements, companion hours | Formatted COP balance, total disbursed, total companion fee, petty cash total | Displays negative balance in red alert styling | `src/features/settlement/presentation/SettlementView.tsx`, `Money.ts` |
| 5 | Módulo 1 (Finance) | Companion Shift Hours Stepper & Editor | Collapsible row editor allowing increment/decrement of companion hours at $15.500 COP/h | Stepper buttons (`btn-hours-minus`, `btn-hours-plus`), Save button | Real-time COP recalculation, update in local Dexie and Supabase storage | Minimum clamp at 0.0 hrs | `src/features/settlement/presentation/SettlementView.tsx` |
| 6 | Módulo 1 (Finance) | 1-Tap Petty Cash Ingestion | Instant buttons for recurring cash expenses (Coffee $12k, Pharmacy $45k, Lunch $25k, Taxi $30k, Toll $16.8k) | One-tap click on quick preset buttons | Ledger row addition, instantaneous net balance update | Duplicate prevention debounce | `src/features/settlement/presentation/SettlementView.tsx` |
| 7 | Módulo 1 (Finance) | Cash Advance & Disbursement Modal | Form to record advance payments to guides, drivers, or clinical providers | Amount, beneficiary, concept category | Appends disbursement record to ledger | Disables confirm button on empty amount or zero | `src/features/settlement/presentation/SettlementView.tsx` |
| 8 | Módulo 1 (Finance) | Hotel Account Split Calculator | Dedicated card breaking down hotel expenses between agency deposit and patient direct payment | Quoted total, deposit percentage, room count | Calculated agency liability vs patient on-site balance, copy voucher button | Validation prevents deposit > total | `src/features/settlement/presentation/components/HotelAccountSplitCard.tsx` |
| 9 | Módulo 1 (Finance) | Docked Settlement Bar & Multi-Format Export | Docked sticky footer with direct PDF and JSON ledger export triggers | Click on `export-pdf-btn` or `export-json-btn` | Generated PDF receipt download, JSON data download | Displays error toast on generation failure | `src/features/settlement/presentation/components/DockedSettlementBar.tsx` |
| 10 | Módulo 1 (Finance) | Canvas Digital Signature & 1-Tap Final Sign-Off | High-DPI HTML5 canvas capturing coordinator signature, computing SHA-256 seal and sealing ledger | Pointer/touch stroke events | Base64 PNG signature, SHA-256 cryptographic seal, confetti explosion, locked ledger | Clear button resets canvas; disabled if blank | `src/features/settlement/presentation/components/DigitalSignaturePad.tsx` |
| 11 | Módulo 2 (Users) | Staff Directory & Filter Pills | Directory of operational personnel (Coordinators, Guides, Drivers, Medical Director) with role filter pills | Search query text, role filter pills (All, Coordinator, Guide, Driver, Medical) | Filtered staff card list | Empty state message if query has no match | `src/features/directory/presentation/UsersView.tsx` |
| 12 | Módulo 2 (Users) | Real-Time Duty Status Badges | Live badges displaying operational availability (EN TURNO, DISPONIBLE, EN RUTA, GUARDIA MÉDICA) | Internal duty state / time of day | Color-coded status badge with pulse indicator | Defaults to DISPONIBLE if shift expired | `src/features/directory/presentation/UsersView.tsx` |
| 13 | Módulo 2 (Users) | Direct WhatsApp Protocol Dispatch | One-click WhatsApp link formatted with pre-filled context messages for staff | Click on `btn-whatsapp-{userId}` | Opens `https://wa.me/57...` in external tab | Disables button if phone number is missing | `src/features/directory/presentation/UsersView.tsx` |
| 14 | Módulo 3 (Plan) | Calendar View Modes | Calendar header with Day, Week, Month, and Agenda view switches | Tab clicks: `view-tab-month`, `view-tab-week`, `view-tab-day`, `view-tab-agenda` | Layout change of the operational calendar | Persists last selected view in local state | `src/features/itinerary/presentation/components/CalendarHeader.tsx` |
| 15 | Módulo 3 (Plan) | Dual Clinical & Logistics Timeline | Visual timeline synchronizing medical appointments with transport and escort logistics | Track toggle pills (Dual, Clinical Only, Logistics Only) | Chronological activity cards with doctor, clinic, driver, vehicle info | Highlights conflicts in red | `src/features/itinerary/presentation/PlanView.tsx` |
| 16 | Módulo 3 (Plan) | Hospital Emergency Triage Protocols | Emergency directory listing 24/7 hotline, on-call medical director, and 4 major hospital protocols (CIMA, Clínica Medellín, CES, HPTU) | Emergency card clicks, Direct Call / GPS action buttons | Opens phone dialer or Google Maps navigation | Fallback to main hotline if specific hospital unavailable | `src/features/itinerary/presentation/PlanView.tsx` |
| 17 | Módulo 4 (Pax) | Passenger Dossier & PHI Masking | Comprehensive patient view displaying sanitized demographic and clinical data compliant with PHI rules | Patient selection | Normalized ID (`ENT-PAX-0350`), masked passport (`PAX-***-402`), surgical phase badge | Never displays unmasked passport in plain text | `src/features/directory/presentation/PassengersView.tsx` |
| 18 | Módulo 4 (Pax) | Flight & Connection Badges | Detailed visual flight cards showing carrier (Arajet), flight number, route, connection in Panama, seats | Active patient flight itinerary | Formatted flight cards with boarding and gate indicators | Shows alert badge if flight delayed | `src/features/directory/presentation/PassengersView.tsx` |
| 19 | Módulo 4 (Pax) | Family Group Dossier (Titular + Acompañante) | Multi-passenger card displaying primary patient and companion with relationships and assistance requirements | Passenger roster | Side-by-side demographic and medical escort cards | Labels companion clearly with zero-cost medical badge | `src/features/directory/presentation/PassengersView.tsx` |
| 20 | Módulo 4 (Pax) | Multilingual Invitation Modal Generator | Modal for generating onboarding invites with tokens (`INV-2026-XXXX`) in 4 Caribbean languages | Name, Country, Language, Phone, Arrival Date | Generated token, direct link, Copy to Clipboard, WhatsApp Share | Form validation requires name and valid phone | `src/features/directory/presentation/components/SendPatientInvitationModal.tsx` |
| 21 | Journey 2 (Guide) | Companion Field Console | Mobile-first ground console for escorts to manage their daily shift and patient milestones | Shift stepper, meal tier selector, quick expense buttons | Live shift subtotal, completed task checklist | Offline sync queue via Dexie / IndexedDB | `src/features/companion/presentation/CompanionModeView.tsx` |
| 22 | Journey 2 (Guide) | Meal Subsidy Policy Tiers (Tier 0-4) | 5-level meal subsidy selector based on operational shift duration and hospital duty | Radio selection: Tier 0 ($0), Tier 1 ($18k), Tier 2 ($25k), Tier 3 ($35k), Tier 4 ($50k) | Subsidy amount added to daily companion ledger | Auto-suggestion button highlights recommended tier | `src/features/companion/presentation/CompanionModeView.tsx` |
| 23 | Journey 2 (Guide) | Companion Digital Sign-Off & SHA-256 Seal | Guide end-of-day closure signature with cryptographic verification | Canvas signature stroke | Recorded PNG signature, calculated SHA-256 seal stamp | Disallows closure without signature stroke | `src/features/companion/presentation/CompanionModeView.tsx` |
| 24 | Journey 3 (Patient) | Caribbean Patient Multilingual Portal | Specialized portal for international patients in Papiamento, English, Dutch, and Spanish | Token authentication or direct link | 4 tabs: Itinerary, Flights, Hotel, Companion | Redirects to login on invalid or expired token | `src/features/patient/presentation/PatientPortalView.tsx` |
| 25 | Journey 3 (Patient) | Patient Satisfaction Survey & Canvas Signature | Post-treatment satisfaction evaluation with 5-star rating, comments, and signature | Star rating (1-5), comments, canvas signature | Generated printable Certificate of Care with QR code & SHA-256 hash | Requires at least 1 star to submit | `src/features/patient/presentation/components/PatientSatisfactionModal.tsx` |
| 26 | Journey 4 (Self-Reg) | 4-Step Patient Booking Wizard | Public self-service onboarding wizard for prospective international patients | Step 1 (Contact), Step 2 (Pax), Step 3 (Medical), Step 4 (Hotel) | Validated booking payload, submission trigger | Step validation prevents advancing with empty required fields | `src/features/onboarding/presentation/PatientSelfRegistrationView.tsx` |
| 27 | Journey 4 (Self-Reg) | Supabase Cloud Persistence Pipeline | Direct cloud persistence saving new bookings, transfers, and events to Supabase tables | Form submission payload | Created booking record with reference code (e.g. `RVA-2026-XXXX`) | Shows error banner on network failure; retries via local storage | `src/core/infrastructure/SupabaseStorageAdapter.ts` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Archetype Switcher | Rapid switching between archetypes via hotkeys [1-5] | Triggers instant re-render of active patient state across all 4 modules without race conditions |
| 2 | Shift Hours Stepper | Decrementing below 0 hours via `btn-hours-minus` | Clamped to `0.0` hours; cannot produce negative companion labor costs |
| 3 | Petty Cash Ingestion | Rapid multiple clicks on 1-tap buttons (e.g. 5x `btn-fast-expense-taxi`) | Debounced or appends discrete individual timestamped transactions; balance updates atomically |
| 4 | Cash Disbursement | Entering non-numeric or negative values in disbursement amount | HTML5 number input restricts non-digits; submit button remains disabled until amount > 0 |
| 5 | Hotel Account Split | Quoted total entered is smaller than deposit amount | Component alerts invalid split; clamps direct-pay amount to minimum 0 |
| 6 | Digital Signature Canvas | Submitting signature with an empty / blank canvas | Submit button remains disabled or triggers validation message requiring a stroke before sign-off |
| 7 | Canvas High-DPI Scaling | Drawing signature on high-DPI (Retina) screens | Canvas accounts for `window.devicePixelRatio`, preventing stroke blur and misalignment |
| 8 | PHI Masking | Rendering passenger passport in admin view and patient portal | Passport is strictly masked as `PAX-***-402` and internal ID as `ENT-PAX-0350`; raw numbers never exposed in DOM |
| 9 | Multilingual Token | Token generated with non-ASCII or special characters in patient name | Encodes parameters safely in URL query strings; trims whitespace |
| 10 | Companion Meal Tiers | Guide working >12 hours overnight selecting Tier 0 | System prompts with auto-suggested Tier 4 ($50.000 COP) for extended night duty |
| 11 | Hospital Emergency Triage | Offline network state when clicking emergency hospital navigation | Triggers fallback tel: URI to call hotline 24/7 directly |
| 12 | Patient Satisfaction | Submitting 1-star rating vs 5-star rating | Both trigger digital certificate generation; low rating flags internal alert for coordinator review |
| 13 | Self-Registration Wizard | Adding 5+ additional companions in Step 2 | Dynamically renders passenger sub-forms with independent passport and special needs toggles |
| 14 | Self-Registration Submit | Submitting form without Supabase internet connectivity | Falls back to local IndexedDB/Dexie queue and displays persistent offline confirmation banner |
| 15 | Role Tampering | Companion user attempting to navigate directly to `/settlement` | `App.tsx` evaluates `user.role === 'COMPANION'` and forces render of `<CompanionModeView />` |

---

## Detailed Journey Specifications

### Journey 1: Administrador Operativo (admin / admin)
- **Primary Layout File**: `src/presentation/layouts/MainAppLayout.tsx`
- **Authentication**: `src/presentation/views/LoginView.tsx`
  - Username selector: `input[type="text"]`
  - Password selector: `input[type="password"]`
  - Submit: `button[type="submit"]`
  - Demo trigger: `data-testid="btn-demo-natalie"` (Loads `RVA350-1`)

#### 1.1 Cockpit Patient Switcher
- **Component File**: `src/presentation/components/ArchetypeSwitcherBar.tsx`
- **DOM Test IDs & Selectors**:
  - Switcher dropdown trigger: `data-testid="patient-dropdown-trigger"`
  - Persistent status pill: `data-testid="persistent-status-pill"`
  - Dropdown container: `data-testid="patient-dropdown-menu"`
  - Patient options: `data-testid="switcher-rva350"`, `data-testid="switcher-rva171"`, `data-testid="switcher-rva282"`
  - Action buttons: `data-testid="btn-dropdown-new-patient"`, `data-testid="btn-dropdown-send-link"`
- **State Model**: `selectedArchetype: Archetype` managed in global context; triggers cascade update to `useSettlementStore`, `useItineraryStore`, `usePassengerStore`.

#### 1.2 Module Navigation Bar
- **Component File**: `src/presentation/components/ModuleNav.tsx`
- **DOM Test IDs**:
  - `data-testid="module-tab-settlement"` (Liquidación Financiera)
  - `data-testid="module-tab-users"` (Directorio de Personal)
  - `data-testid="module-tab-plan"` (Plan Médico & Hospitales)
  - `data-testid="module-tab-passengers"` (Dossier de Pasajeros)
  - Mobile variants: `module-tab-mobile-settlement`, `module-tab-mobile-users`, `module-tab-mobile-plan`, `module-tab-mobile-passengers`

#### 1.3 Módulo 1: Liquidación Financiera
- **Component Files**:
  - `src/features/settlement/presentation/SettlementView.tsx`
  - `src/features/settlement/presentation/components/DockedSettlementBar.tsx`
  - `src/features/settlement/presentation/components/DigitalSignaturePad.tsx`
  - `src/features/settlement/presentation/components/HotelAccountSplitCard.tsx`
- **Interaction Targets**:
  - Net balance output: `data-testid="settlement-view-net-balance"`
  - Shift editor toggle: `data-testid="row-toggle-shift-editor"`
  - Shift hours minus: `data-testid="btn-hours-minus"`
  - Shift hours count display: `data-testid="hours-display-count"`
  - Shift hours plus: `data-testid="btn-hours-plus"`
  - Shift hours save: `data-testid="btn-save-companion-hours"`
  - 1-Tap Petty Cash:
    - Cafe ($12.000): `data-testid="btn-fast-expense-cafe"`
    - Pharmacy ($45.000): `data-testid="btn-fast-expense-pharmacy"`
    - Lunch ($25.000): `data-testid="btn-fast-expense-lunch"`
    - Taxi ($30.000): `data-testid="btn-fast-expense-taxi"`
    - Toll ($16.800): `data-testid="btn-fast-expense-toll"`
  - Cash Disbursement Modal:
    - Trigger: `data-testid="btn-disbursement-modal"`
    - Card: `data-testid="disbursement-modal-card"`
    - Amount Input: `data-testid="input-disbursement-amount"`
    - Beneficiary Select: `data-testid="select-disbursement-beneficiary"`
    - Confirm Button: `data-testid="btn-confirm-disbursement"`
  - Hotel Account Split:
    - Card: `data-testid="hotel-account-split-card"`
    - Calculator Toggle: `data-testid="btn-toggle-hotel-calculator"`
    - Quoted Amount: `data-testid="hotel-total-quoted-amount"`
    - Agency Deposit: `data-testid="hotel-agency-deposit-amount"`
    - Direct Pay: `data-testid="hotel-direct-pay-amount"`
    - Copy Voucher: `data-testid="btn-copy-hotel-voucher"`
    - WhatsApp Voucher: `data-testid="btn-whatsapp-hotel-voucher"`
  - Docked Export Bar:
    - PDF Export: `data-testid="export-pdf-btn"`
    - JSON Export: `data-testid="export-json-btn"`
    - Reconcile Ledger: `data-testid="reconcile-ledger-btn"`
    - Save Main: `data-testid="btn-save-settlement-main"`
    - Open Signature Pad: `data-testid="btn-open-signature-pad"`
  - Digital Signature Pad:
    - Canvas: `data-testid="signature-canvas"`
    - Clear Button: `data-testid="btn-clear-signature"`
    - 1-Tap Submit & PDF Sign-off: `data-testid="btn-submit-one-tap-settlement"`

#### 1.4 Módulo 2: Directorio de Personal
- **Component File**: `src/features/directory/presentation/UsersView.tsx`
- **Interaction Targets**:
  - Root: `data-testid="users-directory-root"`
  - Search Input: `data-testid="input-search-staff"`
  - Filter Pills: `data-testid="btn-filter-role-all"`, `btn-filter-role-coordinator`, `btn-filter-role-guide`, `btn-filter-role-driver`, `btn-filter-role-medical`
  - Staff Cards:
    - Carolina Cortázar (Admin): `data-testid="user-card-carolina-cortazar"`
    - Yenny Roberto (Guide): `data-testid="user-card-yenny-roberto"`
    - Ramón Rosero (Driver): `data-testid="user-card-ramon-rosero"`
    - Dra. Jenny Paola Acosta (Medical Director): `data-testid="user-card-dr-jenny-acosta"`
  - Card Action Elements:
    - Duty Status: `data-testid="duty-status-badge-{userId}"`
    - WhatsApp Trigger: `data-testid="btn-whatsapp-{userId}"`
    - Call Trigger: `data-testid="btn-call-{userId}"`

#### 1.5 Módulo 3: Plan Médico & Red Hospitalaria
- **Component Files**:
  - `src/features/itinerary/presentation/PlanView.tsx`
  - `src/features/itinerary/presentation/components/CalendarHeader.tsx`
- **Interaction Targets**:
  - Calendar View Switches: `data-testid="view-tab-month"`, `data-testid="view-tab-week"`, `data-testid="view-tab-day"`, `data-testid="view-tab-agenda"`
  - Period Navigation: `data-testid="btn-prev-period"`, `data-testid="btn-next-period"`, `data-testid="btn-today-period"`
  - Clinical Package Banner: `data-testid="clinical-package-banner"`
  - Track Filters: `data-testid="filter-track-dual"`, `data-testid="filter-track-clinical"`, `data-testid="filter-track-logistics"`
  - Timeline Days: `data-testid="timeline-day-{dayNumber}"`
  - Hospital Triage Emergency Section: `data-testid="hospital-triage-section"`
    - Hotline 24/7 Badge: `data-testid="hotline-247-badge"`
    - Medical Director On-call: `data-testid="triage-director-card"`
    - Facilities: `data-testid="facility-cima"`, `data-testid="facility-clinica-medellin"`, `data-testid="facility-ces"`, `data-testid="facility-hptu"`
    - Navigation Buttons: `data-testid="btn-triage-navigate-{facilityId}"`, `data-testid="btn-triage-call-{facilityId}"`

#### 1.6 Módulo 4: Dossier de Pasajeros
- **Component Files**:
  - `src/features/directory/presentation/PassengersView.tsx`
  - `src/features/directory/presentation/components/SendPatientInvitationModal.tsx`
- **Interaction Targets**:
  - Search: `data-testid="input-search-passengers"`
  - Status Filter: `data-testid="select-status-filter"`
  - Open Invitation Modal: `data-testid="btn-open-invite-modal"`
  - Dossier Card: `data-testid="passenger-dossier-card"`
  - PHI Masked Outputs: `data-testid="phi-patient-id"`, `data-testid="phi-passport-hash"` (`PAX-***-402`), `data-testid="treatment-phase-badge"`
  - Flights & Connections: `data-testid="flight-badges-section"`, `data-testid="multi-leg-connections"`
  - Family Group Section: `data-testid="family-dossier-section"`, `data-testid="pax-card-titular"`, `data-testid="pax-card-companion"`
  - Onboarding Actions: `data-testid="btn-whatsapp-onboarding"`, `data-testid="btn-copy-invitation-link"`, `data-testid="btn-preview-patient-portal"`
  - Send Patient Invitation Modal:
    - Root: `data-testid="send-invitation-modal"`
    - Name Input: `data-testid="input-invitation-patient-name"`
    - Country Select: `data-testid="select-invitation-country"`
    - Language Select: `data-testid="select-invitation-language"`
    - Phone Input: `data-testid="input-invitation-phone"`
    - Arrival Date Input: `data-testid="input-invitation-arrival-date"`
    - Token Output: `data-testid="display-invitation-token"` (`INV-2026-XXXX`)
    - Link Output: `data-testid="input-generated-link"`
    - Copy Button: `data-testid="btn-copy-invitation-link"`
    - WhatsApp Share: `data-testid="btn-share-whatsapp"`

---

### Journey 2: Acompañante Físico (guia / guia)
- **Component File**: `src/features/companion/presentation/CompanionModeView.tsx`
- **Route Guard**: In `src/App.tsx`, `user.role === 'COMPANION'` directly routes to this view.
- **Interaction Targets**:
  - Root: `data-testid="companion-mode-root"`
  - Shift Hours Counter:
    - Minus: `data-testid="btn-companion-hours-minus"`
    - Count Display: `data-testid="companion-hours-display"`
    - Plus: `data-testid="btn-companion-hours-plus"`
    - Subtotal Display: `data-testid="companion-shift-subtotal"`
  - Meal Subsidy Policy Radios:
    - Radio Group: `data-testid="meal-subsidy-group"`
    - Tier 0 ($0): `data-testid="meal-tier-0"`
    - Tier 1 ($18k): `data-testid="meal-tier-1"`
    - Tier 2 ($25k): `data-testid="meal-tier-2"`
    - Tier 3 ($35k): `data-testid="meal-tier-3"`
    - Tier 4 ($50k): `data-testid="meal-tier-4"`
    - Auto-suggest Button: `data-testid="btn-apply-suggested-tier"`
  - 1-Tap Petty Cash:
    - Taxi: `data-testid="btn-fast-taxi"`
    - Pharmacy: `data-testid="btn-fast-pharmacy"`
    - Cafe: `data-testid="btn-fast-cafe"`
    - Toll: `data-testid="btn-fast-toll"`
    - Receipt Scanner / OCR: `data-testid="btn-companion-ocr"`
  - Milestones Checklist: `data-testid="companion-milestones-list"`, `data-testid="milestone-check-{milestoneId}"`
  - Digital Signature & Closure:
    - Canvas: `data-testid="companion-signature-canvas"`
    - Clear: `data-testid="btn-clear-companion-signature"`
    - Sign-off Button: `data-testid="btn-companion-signoff"`
    - Seal Display: `data-testid="signature-sha256-seal"`

---

### Journey 3: Portal del Paciente Internacional (RVA350-1)
- **Component Files**:
  - `src/features/patient/presentation/PatientLoginView.tsx`
  - `src/features/patient/presentation/PatientPortalView.tsx`
  - `src/features/patient/presentation/components/PatientSatisfactionModal.tsx`
- **Interaction Targets**:
  - Root: `data-testid="patient-portal-root"`
  - Language Selector: `data-testid="select-patient-lang"`
  - Navigation Tabs:
    - Itinerary: `data-testid="tab-patient-itinerary"`
    - Flights: `data-testid="tab-patient-flights"`
    - Hotel: `data-testid="tab-patient-hotel"`
    - Companion: `data-testid="tab-patient-companion"`
  - Itinerary Section:
    - Next Appointment Card: `data-testid="patient-next-appointment-card"`
    - Surgeon & Clinic Info: Dr. Lukas Saldarriaga / Glaucornea
  - Flight Section:
    - Flight Card: `data-testid="patient-flight-card"`
    - Carrier: Arajet DM-101 / Booking Ref S8242C
    - Route: CUR -> PTY -> MDE
    - Status: `data-testid="patient-flight-status-badge"`
  - Hotel Section:
    - Hotel Card: `data-testid="patient-hotel-card"` (Hotel 1616 Medellín, Room 402)
    - Concierge WhatsApp: `data-testid="btn-hotel-concierge-whatsapp"`
  - Guide Section:
    - Companion Card: `data-testid="patient-companion-card"` (Yenny Roberto)
    - Contact Triggers: `data-testid="btn-companion-whatsapp"`, `data-testid="btn-companion-call"`
  - Satisfaction & Digital Signature Modal:
    - Open Modal Button: `data-testid="btn-open-satisfaction-modal"`
    - Modal Root: `data-testid="patient-satisfaction-modal"`
    - 5-Star Ratings: `data-testid="star-rating-1"` to `data-testid="star-rating-5"`
    - Comments: `data-testid="textarea-satisfaction-comment"`
    - Canvas: `data-testid="patient-satisfaction-canvas"`
    - Clear: `data-testid="btn-clear-patient-signature"`
    - Submit: `data-testid="btn-sign-satisfaction"`
    - Certificate: `data-testid="certificate-of-care-container"`

---

### Journey 4: Formulario de Autogestión de Reserva
- **Component File**: `src/features/onboarding/presentation/PatientSelfRegistrationView.tsx`
- **Route / URL Activation**: Triggered when URL contains `?registro=true` or `?autogestion=true` or `?token=INV-...`.
- **Interaction Targets**:
  - Root: `data-testid="patient-self-registration-root"`
  - Step Indicators: `data-testid="step-indicator-1"` to `data-testid="step-indicator-4"`
  - Step 1 (Contact & Travel):
    - First Name: `data-testid="self-reg-firstname"`
    - Last Name: `data-testid="self-reg-lastname"`
    - Country: `data-testid="self-reg-country"`
    - Language: `data-testid="self-reg-language"`
    - Phone: `data-testid="self-reg-phone"`
    - Email: `data-testid="self-reg-email"`
    - Arrival Date: `data-testid="self-reg-arrival-date"`
    - Departure Date: `data-testid="self-reg-departure-date"`
    - Next: `data-testid="btn-wizard-next-1"`
  - Step 2 (Travel Party & Pax):
    - Add Pax: `data-testid="btn-add-adult"`, `data-testid="btn-add-child"`
    - Pax Role Selectors: `data-testid="btn-role-patient-{idx}"`, `data-testid="btn-role-companion-{idx}"`
    - Pax Name: `data-testid="input-pax-name-{idx}"`
    - Pax Passport: `data-testid="input-pax-passport-{idx}"`
    - Wheelchair / Assistance: `data-testid="checkbox-wheelchair-{idx}"`
    - Back: `data-testid="btn-wizard-back-2"`, Next: `data-testid="btn-wizard-next-2"`
  - Step 3 (Medical Information):
    - Specialty: `data-testid="select-medical-specialty"`
    - Referring Doctor: `data-testid="input-referring-doctor"`
    - Notes: `data-testid="textarea-medical-notes"`
    - Clinical File Upload: `data-testid="input-file-medical-history"`
    - Back: `data-testid="btn-wizard-back-3"`, Next: `data-testid="btn-wizard-next-3"`
  - Step 4 (Hotel & Submission):
    - Requires Hotel: `data-testid="checkbox-requires-hotel"`
    - Hotel Select: `data-testid="select-hotel"`
    - Room Type: `data-testid="select-room-type"`
    - Consent Checkbox: `data-testid="checkbox-privacy-consent"`
    - Back: `data-testid="btn-wizard-back-4"`
    - Submit: `data-testid="btn-submit-self-registration"`
  - Submission State:
    - Spinner: `data-testid="submission-spinner"`
    - Success Screen: `data-testid="registration-success-screen"`
    - Booking Reference: `data-testid="display-booking-ref"`
    - Go to Portal: `data-testid="btn-go-to-patient-portal"`

---

## State Models, Props & Database Architecture
- **Financial State & BigInt Integrity**:
  - Rates stored as BigInt integer values to avoid IEEE 754 precision loss: Companion Hour = `15500n` COP/hr.
  - Money value object (`src/domain/value-objects/Money.ts`) encapsulates balance arithmetic, ensuring zero floating-point cents.
- **Supabase Cloud Tables**:
  - `bookings`: `id`, `reference_code`, `patient_name`, `country`, `arrival_date`, `departure_date`, `status`.
  - `transfers`: `id`, `booking_id`, `driver_id`, `pickup_location`, `dropoff_location`, `scheduled_time`.
  - `events`: `id`, `booking_id`, `event_type`, `description`, `timestamp`, `payload`.
  - `shifts`: `id`, `guide_id`, `booking_id`, `hours`, `meal_tier`, `total_cop`.
  - `expenses`: `id`, `booking_id`, `category`, `amount_cop`, `receipt_url`.
  - `settlements`: `id`, `booking_id`, `final_balance_cop`, `sha256_seal`, `signed_at`.
