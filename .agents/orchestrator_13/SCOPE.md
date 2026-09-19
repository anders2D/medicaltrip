# Scope: Medical Trip E2E Interactive Click Harness & Zero-Error Certification

## Architecture
- **Application Core**: `apps/medicaltrip_react_app` (React 19 + TypeScript + Vite + Tailwind CSS)
- **Runtime Environment**: Live preview server on `http://localhost:3000` (port locked in `vite.config.ts`)
- **Backend & Cloud Persistence**: Supabase Cloud REST API at `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*`
- **Storage Layer**: Hexagonal architecture with `IStoragePort`, implemented by `SupabaseStorageAdapter` with local `DexieStorageAdapter` and `InMemoryStorageAdapter` fallback
- **Automation & Telemetry Interception**: Chromium DevTools Protocol (CDP) WebSocket interface intercepting `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, and `Network.responseReceived`

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| F1 | Storage Adapter PostgREST 406 Fix | Replace `.single()` with `.maybeSingle()` or array query in `SupabaseStorageAdapter.ts` to prevent HTTP 406 when 0 rows match | M1 | DONE | Survey Explorer 13_1 / 13_3 |
| F2 | Supabase REST API & User-Agent Resilience | Ensure requests to Supabase REST API do not trigger Cloudflare 401 "Forbidden use of secret API key in browser" | M1 | DONE | Survey Explorer 13_1 / 13_3 |
| F3 | Telemetry Interception Harness | CDP automation script intercepting console logs, uncaught exceptions, and Supabase network requests with zero-tolerance threshold | M2 | DONE | Survey Explorer 13_1 / worker_m1_audit_fix |
| F4 | Admin Journey: Cockpit Patient Switcher | Interactive switching between Natalie Rumai (`RVA350-1`), `RVA171-4`, and `RVA282-5` | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F5 | Admin Journey: Módulo 1 Liquidación Financiera | Stepper hours ($15.500/h), 1-tap petty cash presets, disbursement modal, hotel split calculator, PDF/JSON export, canvas signature & SHA-256 seal | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F6 | Admin Journey: Módulo 2 Directorio de Personal | Personnel search, role filter pills, staff cards, direct WhatsApp protocol dispatch | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F7 | Admin Journey: Módulo 3 Plan Médico & Red Hospitalaria | Calendar view toggles (Day/Week/Month/Agenda), track filters, hospital emergency triage protocols | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F8 | Admin Journey: Módulo 4 Dossier de Pasajeros | PHI masking (`ENT-PAX-0350`, `PAX-***-402`), Arajet flight connections, family dossier, multilingual invitation generator (`INV-2026-XXXX`) | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F9 | Companion Journey: Consola de Terreno | `CompanionModeView` shift hours, meal subsidy tiers 0-4, 1-tap cash expenses, canvas signature, SHA-256 seal | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F10 | Patient Journey: Portal del Paciente Internacional | Multilingual portal for `RVA350-1`: Arajet flights, Hotel 1616, Glaucornea itinerary, guide card, 5-star satisfaction modal & canvas signature | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F11 | Self-Registration Journey: 4-Step Booking Wizard | 4-step wizard (`PatientSelfRegistrationView`) for 2 passengers (Titular + Acompañante), hotel options, and submission to Supabase | M2 | DONE | Survey Explorer 13_2 / worker_m1_audit_fix |
| F12 | Bidirectional Supabase Cloud Verification | Direct REST verification of created/updated records in `bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements` | M3 | DONE | Survey Explorer 13_3 / challenger_iter2 / auditor_iter2 |
| F13 | Zero-Error Certification & UI/UX Polish | 0 console.error, 0 unhandled exceptions, 0 HTTP 4xx/5xx across all journeys, PWA manifest icons (`icon-192.png`, `icon-512.png`) and viewport tags | M4 | DONE | reviewer_iter2 / auditor_iter2 |
| F14 | Production Build Verification | `npm run build` (`tsc -b && vite build`) compiles with 0 errors in <4s | M4 | DONE | worker_m1_audit_fix / reviewer_iter2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Storage Adapter & Telemetry Resilience | F1, F2 | none | DONE |
| 2 | Exhaustive Interactive Click Harness Across All 4 Journeys | F3, F4, F5, F6, F7, F8, F9, F10, F11 | M1 | DONE |
| 3 | Bidirectional Supabase Cloud Parity Verification | F12 | M2 | DONE |
| 4 | Production Build, UI/UX Hygiene & Zero-Error Certification | F13, F14 | M2, M3 | DONE |

## Interface Contracts
### UI Components ↔ SupabaseStorageAdapter
- Method `getBookingByCode(code: string)` returns `Promise<Booking | null>` using `.maybeSingle()` or `.limit(1)` without throwing PostgREST HTTP 406.
- Supabase REST calls utilize `User-Agent: MedicalTripAutomation/1.0` to eliminate Cloudflare secret key rejections in browser contexts.

### CDP Automation Harness ↔ Web Preview Server
- Target URL: `http://localhost:3000`
- CDP Listeners: `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Network.requestWillBeSent`, `Network.responseReceived`
- Invariant Thresholds:
  * Total Console Errors: 0
  * Total Uncaught Exceptions: 0
  * Total Supabase REST 4xx/5xx: 0
- Status: 100% Verified across 294 live operations.

## Key Artifacts & Output Paths
- CDP Test Runner: `/Users/miyo123/projects/medicaltrip/scripts/audit_e2e_click_harness.mjs`
- Screenshots Directory: `/Users/miyo123/projects/medicaltrip/scripts/screenshots/`
  * `journey_1_admin_settlement.png`
  * `journey_1_admin_users.png`
  * `journey_1_admin_plan.png`
  * `journey_1_admin_passengers.png`
  * `journey_2_companion_console.png`
  * `journey_3_patient_portal.png`
  * `journey_4_self_registration.png`
- Audit Results: `/Users/miyo123/projects/medicaltrip/.agents/worker_m1_audit_fix/audit_results.json`
- Verification Reports:
  * `/Users/miyo123/projects/medicaltrip/.agents/reviewer_iter2/report.md`
  * `/Users/miyo123/projects/medicaltrip/.agents/challenger_iter2/report.md`
  * `/Users/miyo123/projects/medicaltrip/.agents/auditor_iter2/report.md`
