# Project: Medical Trip Colombia — Admin Operational Workflow & Full CRUD Lifecycle Campaign

## Architecture
- **Application Core**: `apps/medicaltrip_react_app` (React 19 + TypeScript + Vite + Tailwind CSS)
- **Runtime Environment**: Live preview server on `http://localhost:3000` (port locked in `vite.config.ts`)
- **Backend & Cloud Persistence**: Supabase Cloud REST API at `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*`
- **Storage Layer**: Hexagonal architecture with `IStoragePort` implemented by `SupabaseStorageAdapter` (with Dexie and InMemory fallback)
- **Math Invariants**: Mathematical determinism in `Money` Value Object (`cents: bigint`) and `SettlementLedger` (Delta = 0.00 COP)
- **Cryptographic Seal**: `Sha256LedgerChain` generating canonical SHA-256 seals on settlement mutations
- **Automation & Telemetry Interception**: Chromium DevTools Protocol (CDP) WebSocket interface intercepting `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, and `Network.responseReceived`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Bookings CRUD Lifecycle | Create (`CreatePatientBookingUseCase`/`patient-creator`), Read (Cockpit switcher & details), Update (notes, flight/hotel), Delete/Archive | M1, M2 | ORIGINAL_REQUEST R1.1 |
| F2 | Clinical Itinerary CRUD Lifecycle | Create (medical presets `OPHTHALMOLOGY_3D`, `CARDIOLOGY_5D`, etc.), Read (Agenda, Day, Week, Month views), Update (`RescheduleEventUseCase`), Delete | M1, M2 | ORIGINAL_REQUEST R1.2 |
| F3 | Companion Shifts CRUD Lifecycle | Create ($15.500/h + prep allowance + meal tiers), Read (active & accumulated), Update (+/- 0.5h & digital signature), Delete | M1, M2 | ORIGINAL_REQUEST R1.3 |
| F4 | Fleet Transfers CRUD Lifecycle | Create (Aeroturex transfers JMC <-> Hotel <-> Hospital), Read (driver assignment & flight status), Update (driver check-in & arrival), Delete | M1, M2 | ORIGINAL_REQUEST R1.4 |
| F5 | Expenses & Settlements BigInt CRUD | Create (1-Tap quick expenses, custom receipts, cash advances), Read (Bento Grid, hotel split, summary), Update (receipt amounts, delta = 0.00 COP), Delete (reject receipts, reverse advances) | M1, M2 | ORIGINAL_REQUEST R1.5 |
| F6 | Supabase Cloud REST API Parity | 100% queries and mutations against Supabase Cloud REST API, 0 HTTP 4xx/5xx network errors, 0 unhandled promise rejections | M1, M3 | ORIGINAL_REQUEST R2 |
| F7 | AppContext CRUD Operations Completion | Complete deleteShift, deleteTransfer, deleteExpense wiring in AppContext.tsx to match SupabaseStorageAdapter capabilities | M2 | Explorer 1 & 3 Survey |
| F8 | Automated Chromium CDP Click Harness | Full interactive click simulation across all 4 admin tabs (`SettlementView`, `UsersView`, `PlanView`, `PassengersView`) and modals | M3 | ORIGINAL_REQUEST R3 |
| F9 | Modal Dialogs Full Interaction & Visuals | Interaction and verification in `NewPatientModal`, `ReceiptOcrModal`, `DigitalSignaturePad`, `CompanionTurnSheetModal` with screenshot capture | M3 | ORIGINAL_REQUEST R3 |
| F10 | Telemetry & Error Interception | Intercept `console.error`, unhandled exceptions, and Supabase REST requests; enforce zero-tolerance (0 errors, 0 exceptions, 0 HTTP 4xx/5xx) | M3 | ORIGINAL_REQUEST Acceptance Criteria |
| F11 | BigInt Determinism & SHA-256 Seal Verification | Verify BigInt cents math throughout all operations and ensure `sha256Seal` updates automatically upon settlement mutation | M1, M3 | ORIGINAL_REQUEST Acceptance Criteria |
| F12 | Nielsen 10 Heuristics & Minimalist UI Polish | Verify clean minimalist UI compliant with Nielsen 10 heuristics, zero visual clipping, zero stacked dialogs | M3 | ORIGINAL_REQUEST Acceptance Criteria |
| F13 | Production Build Verification | `npm run build` (`tsc -b && vite build`) succeeds cleanly with 0 TypeScript compilation errors | M4 | ORIGINAL_REQUEST Acceptance Criteria |
| F14 | Independent Forensic Integrity Audit | Complete forensic integrity verification by Forensic Auditor confirming genuine implementations and zero hardcoded tests | M1, M4 | System Prompt Audit Protocol |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Direct Supabase Cloud REST API CRUD Integration Suite | F1, F2, F3, F4, F5, F6, F11, F14 | none | DONE |
| 2 | AppContext CRUD Methods Wiring & UI State Sync | F7, F1, F2, F3, F4, F5 | M1 | IN_PROGRESS |
| 3 | Automated Chromium CDP Click Harness & Visual Certification | F6, F8, F9, F10, F11, F12 | M2 | PLANNED |
| 4 | Production Build & Final Forensic Audit Certification | F13, F14 | M1, M2, M3 | PLANNED |

## Interface Contracts
### Storage Port ↔ Supabase Cloud REST API
- Endpoints: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/<table_name>`
- Tables: `bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`, `blobs`, `patient_invitations`, `users`
- BigInt Cents serialization: Stored as PostgreSQL `TEXT` in stringified integer cents (e.g. `'1550000'` for $15.500 COP)
- Query safety: Single-row lookups use `.maybeSingle()` or `.limit(1)` to eliminate PGRST116 HTTP 406
- Deletion cascade: `deleteBooking` cascades across all 7 relational tables by `{id, code}`

### AppContext ↔ Presentation Views
- `deleteEvent(eventId: string): Promise<void>`
- `deleteShift(shiftId: string): Promise<void>`
- `deleteTransfer(transferId: string): Promise<void>`
- `deleteExpense(expenseId: string): Promise<void>`
- All state mutators update UI React state optimistically and persist synchronously through `storagePort`

### CDP Harness ↔ Chrome Browser & Vite Preview
- Target URL: `http://localhost:3000`
- Intercepted events: `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, `Network.responseReceived`
- Invariant: errorCount === 0, exceptionCount === 0, httpErrorCount === 0

## Code Layout
```
medicaltrip/
├── apps/medicaltrip_react_app/
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/entities/ (PatientBooking, SettlementLedger, etc.)
│   │   │   ├── domain/value-objects/ (Money.ts)
│   │   │   ├── ports/IStoragePort.ts
│   │   │   └── infrastructure/storage/SupabaseStorageAdapter.ts
│   │   ├── features/
│   │   │   ├── onboarding/ (CreatePatientBookingUseCase, NewPatientModal)
│   │   │   ├── itinerary/ (GenerateSmartItineraryUseCase, RescheduleEventUseCase, Day/Week/Month/AgendaView)
│   │   │   ├── companion-shifts/ (CompanionShift, CompanionTurnSheetModal)
│   │   │   ├── logistics-fleet/ (DriverTransfer, PerformDriverCheckInUseCase, ArrivalTrackingCard)
│   │   │   ├── settlement/ (SettlementView, ReceiptOcrModal, DigitalSignaturePad, Sha256LedgerChain)
│   │   │   └── directory/ (PassengersView, UsersView)
│   │   └── presentation/state/AppContext.tsx
│   ├── scripts/
│   │   ├── audit_e2e_click_harness.mjs
│   │   ├── verify_storage_adapter.ts
│   │   └── verify_supabase_all_domains_crud.ts
│   └── vite.config.ts
└── .agents/
    └── orchestrator_14/
```
