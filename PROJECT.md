# Project: Medical Trip Colombia — E2E Interactive Click Harness & Zero-Error Certification

## Architecture
- **Application Core**: `apps/medicaltrip_react_app` (React 19 + TypeScript + Vite + Tailwind CSS)
- **Runtime Environment**: Live preview server on `http://localhost:3000` (port locked in `vite.config.ts`)
- **Backend & Cloud Persistence**: Supabase Cloud REST API at `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*`
- **Storage Layer**: Hexagonal architecture with `IStoragePort`, implemented by `SupabaseStorageAdapter` with local `DexieStorageAdapter` and `InMemoryStorageAdapter` fallback
- **Automation & Telemetry Interception**: Chromium DevTools Protocol (CDP) WebSocket interface intercepting `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, and `Network.responseReceived`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Storage Adapter PostgREST 406 Fix | Replace `.single()` with `.maybeSingle()` or array query in `SupabaseStorageAdapter.ts` to prevent HTTP 406 when 0 rows match | M1 | Survey Explorer 13_1 / 13_3 |
| F2 | Supabase REST API & User-Agent Resilience | Ensure requests to Supabase REST API do not trigger Cloudflare 401 "Forbidden use of secret API key in browser" | M1 | Survey Explorer 13_1 / 13_3 |
| F3 | Telemetry Interception Harness | CDP automation script intercepting console logs, uncaught exceptions, and Supabase network requests with zero-tolerance threshold | M2 | Survey Explorer 13_1 |
| F4 | Admin Journey: Cockpit Patient Switcher | Interactive switching between Natalie Rumai (`RVA350-1`), `RVA171-4`, and `RVA282-5` | M2 | Survey Explorer 13_2 |
| F5 | Admin Journey: Módulo 1 Liquidación Financiera | Stepper hours ($15.500/h), 1-tap petty cash presets, disbursement modal, hotel split calculator, PDF/JSON export, canvas signature & SHA-256 seal | M2 | Survey Explorer 13_2 |
| F6 | Admin Journey: Módulo 2 Directorio de Personal | Personnel search, role filter pills, staff cards, direct WhatsApp protocol dispatch | M2 | Survey Explorer 13_2 |
| F7 | Admin Journey: Módulo 3 Plan Médico & Red Hospitalaria | Calendar view toggles (Day/Week/Month/Agenda), track filters, hospital emergency triage protocols | M2 | Survey Explorer 13_2 |
| F8 | Admin Journey: Módulo 4 Dossier de Pasajeros | PHI masking (`ENT-PAX-0350`, `PAX-***-402`), Arajet flight connections, family dossier, multilingual invitation generator (`INV-2026-XXXX`) | M2 | Survey Explorer 13_2 |
| F9 | Companion Journey: Consola de Terreno | `CompanionModeView` shift hours, meal subsidy tiers 0-4, 1-tap cash expenses, canvas signature, SHA-256 seal | M2 | Survey Explorer 13_2 |
| F10 | Patient Journey: Portal del Paciente Internacional | Multilingual portal for `RVA350-1`: Arajet flights, Hotel 1616, Glaucornea itinerary, guide card, 5-star satisfaction modal & canvas signature | M2 | Survey Explorer 13_2 |
| F11 | Self-Registration Journey: 4-Step Booking Wizard | 4-step wizard (`PatientSelfRegistrationView`) for 2 passengers (Titular + Acompañante), hotel options, and submission to Supabase | M2 | Survey Explorer 13_2 |
| F12 | Bidirectional Supabase Cloud Verification | Direct REST verification of created/updated records in `bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements` | M3 | Survey Explorer 13_3 |
| F13 | Zero-Error Certification & UI/UX Polish | 0 console.error, 0 unhandled exceptions, 0 HTTP 4xx/5xx across all journeys, PWA manifest icons (`icon-192.png`, `icon-512.png`) and viewport tags | M4 | ORIGINAL_REQUEST §R4 |
| F14 | Production Build Verification | `npm run build` (`tsc -b && vite build`) compiles with 0 errors | M4 | ORIGINAL_REQUEST §R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Storage Adapter & Telemetry Resilience | F1, F2 | none | COMPLETED |
| 2 | Exhaustive Interactive Click Harness Across All 4 Journeys | F3, F4, F5, F6, F7, F8, F9, F10, F11 | M1 | PLANNED |
| 3 | Bidirectional Supabase Cloud Parity Verification | F12 | M2 | PLANNED |
| 4 | Production Build, UI/UX Hygiene & Zero-Error Certification | F13, F14 | M2, M3 | PLANNED |

## Interface Contracts
### UI Components ↔ SupabaseStorageAdapter
- Method `getBookingByCode(code: string)` must return `Promise<PatientBooking | null>` without throwing PostgREST HTTP 406.
- Method `getBooking(bookingIdOrCode: string)` must return `Promise<PatientBooking | null>` using `.maybeSingle()` or array querying to prevent PostgREST HTTP 406.
- Supabase REST calls must use valid authorization headers and a compatible User-Agent (`MedicalTripAutomation/1.0`).

### CDP Automation Harness ↔ Web Preview Server
- Target URL: `http://localhost:3000`
- CDP Listeners: `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, `Network.responseReceived`
- Verification: Exit code 0 iff errorCount === 0 and exceptionCount === 0 and httpErrorCount === 0.

## Code Layout
```
medicaltrip/
├── apps/medicaltrip_react_app/
│   ├── src/
│   │   ├── core/infrastructure/storage/SupabaseStorageAdapter.ts
│   │   ├── core/infrastructure/SupabaseStorageAdapter.ts
│   │   ├── infrastructure/storage/SupabaseStorageAdapter.ts
│   │   ├── presentation/
│   │   │   ├── views/ (LoginView, CompanionModeView, PatientPortalView, PatientSelfRegistrationView)
│   │   │   ├── layouts/MainAppLayout.tsx
│   │   │   └── components/ (ArchetypeSwitcherBar, ModuleNav)
│   │   └── features/
│   │       ├── settlement/
│   │       ├── directory/
│   │       ├── itinerary/
│   │       ├── companion-shifts/
│   │       ├── logistics-fleet/
│   │       ├── patient/
│   │       └── onboarding/
│   ├── public/ (manifest.json, icon-192.png, icon-512.png, favicon.ico, sw.js)
│   └── vite.config.ts
├── scripts/
│   └── audit_e2e_click_harness.mjs
└── .agents/
    └── orchestrator_13/
```
