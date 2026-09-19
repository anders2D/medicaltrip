# Supabase Cloud REST API Integration, Data Model Parity & Production Build Survey Report

**Agent**: `survey_explorer_13_3`  
**Date**: 2026-09-16  
**Target Application**: `apps/medicaltrip_react_app`  
**Supabase Cloud Project**: `https://pxmobokcqhsixfvdsrwj.supabase.co`  
**Live Preview Server**: `http://localhost:3000`

---

## Executive Summary

This forensic survey investigates the live Supabase Cloud REST API integration, data model parity, storage architecture, and production build readiness of the Medical Trip Colombia S.A.S. application. 

Key results:
1. **Supabase Cloud Connectivity**: The REST API at `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*` is 100% operational and responding with HTTP 200. Direct curl/fetch tests confirmed read, upsert, query, and delete permissions using the configured credentials with zero 4xx/5xx network errors.
2. **Storage Architecture**: Hexagonal `IStoragePort` abstraction is implemented via `SupabaseStorageAdapter` (remote Supabase) and `DexieStorageAdapter` (local Dexie IndexedDB), controlled by `ServiceContainer`. In production/preview mode, `VITE_STORAGE_DRIVER=supabase` activates `SupabaseStorageAdapter` by default.
3. **Data Model Parity**: All 6 required tables (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`) plus 4 auxiliary tables (`blobs`, `patient_invitations`, `users`, `event_stream`) are live in Supabase Cloud with RLS disabled. All monetary fields utilize stringified BigInt cents (`*_cents`), ensuring mathematical zero-drift financial parity.
4. **Production Build Readiness**: `npm run build` (`tsc -b && vite build`) executes in ~3.78 seconds with **0 TypeScript compiler errors** and generates code-split bundles in `dist/`. Static PWA assets (`manifest.json`, `icon-192.png`, `icon-512.png`, `favicon.ico`, `sw.js`) and viewport meta tags are verified and return HTTP 200 from the live preview server (`http://localhost:3000`).

---

## 1. Supabase Cloud Configuration & Credentials

### 1.1 Project Endpoints & Environment Variables
The configuration is established across `.env` and `.env.local`:

- **Supabase Project ID**: `pxmobokcqhsixfvdsrwj`
- **Project URL**: `https://pxmobokcqhsixfvdsrwj.supabase.co`
- **REST API Base**: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- **Database Host**: `aws-0-us-west-2.pooler.supabase.com:6543` / `db.pxmobokcqhsixfvdsrwj.supabase.co:5432`
- **Active Anon/API Key**: `sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-`
- **Database Password**: `4!vG#uqcVd-M.7G`

Files inspected:
- `apps/medicaltrip_react_app/.env`:
  ```env
  VITE_STORAGE_DRIVER=supabase
  VITE_SUPABASE_URL=https://pxmobokcqhsixfvdsrwj.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-
  ```
- `apps/medicaltrip_react_app/.env.local`:
  ```env
  SUPABASE_PROJECT_ID="pxmobokcqhsixfvdsrwj"
  SUPABASE_URL="https://pxmobokcqhsixfvdsrwj.supabase.co"
  SUPABASE_API_KEY="4!vG#uqcVd-M.7G"
  SUPABASE_DB_PASSWORD="4!vG#uqcVd-M.7G"
  DATABASE_URL="postgresql://postgres:4!vG%23uqcVd-M.7G@db.pxmobokcqhsixfvdsrwj.supabase.co:5432/postgres"
  DATABASE_POOLER_URL="postgresql://postgres.pxmobokcqhsixfvdsrwj:4!vG%23uqcVd-M.7G@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  VITE_STORAGE_DRIVER="supabase"
  VITE_SUPABASE_URL="https://pxmobokcqhsixfvdsrwj.supabase.co"
  VITE_SUPABASE_ANON_KEY="sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-"
  ```

### 1.2 HTTP Headers Required for REST Requests
Direct HTTP requests to `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*` must pass:
```http
apikey: sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-
Authorization: Bearer sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-
Content-Type: application/json
```
For write/upsert operations:
```http
Prefer: return=representation
```

---

## 2. Storage Architecture & Mutation Synchronization

### 2.1 Storage Ports & Adapters Structure
The codebase follows Hexagonal Architecture:
- **`IStoragePort`** (`src/core/ports/IStoragePort.ts`):
  Pure interface defining operations for `saveBooking`, `getBooking`, `getAllBookings`, `deleteBooking`, `saveEvent`, `getEventsByBooking`, `getEventById`, `deleteEvent`, `saveShift`, `getShiftsByBooking`, `deleteShift`, `saveTransfer`, `getTransfersByBooking`, `deleteTransfer`, `saveExpense`, `getExpensesByBooking`, `deleteExpense`, `saveSettlement`, `getSettlement`, `appendEventLog`, `getEventStream`, `clearAll`, and `getHealthInfo`.
- **`SupabaseStorageAdapter`** (`src/core/infrastructure/storage/SupabaseStorageAdapter.ts`):
  Implements `IStoragePort` and `IBlobStoragePort`. Initialized with an optional `@supabase/supabase-js` client stub or live instance. Features dual-write with an internal `fallback: InMemoryStorageAdapter` for offline resilience.
- **`DexieStorageAdapter`** (`src/core/infrastructure/storage/DexieStorageAdapter.ts`):
  Local-first adapter storing 7 structured relational tables in IndexedDB via Dexie.js v4.
- **`ServiceContainer`** (`src/core/infrastructure/ServiceContainer.ts`):
  Composition Root managing singleton port instances.
  Default driver selection logic (`resolveDefaultDriver()`):
  ```typescript
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return 'dexie';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORAGE_DRIVER) {
    const envDriver = import.meta.env.VITE_STORAGE_DRIVER as StorageDriverType;
    if (envDriver === 'supabase' || envDriver === 'memory' || envDriver === 'dexie') {
      return envDriver;
    }
  }
  return 'supabase';
  ```

### 2.2 Active Adapter & Mutation Lifecycle
In runtime (`http://localhost:3000` or production build), `VITE_STORAGE_DRIVER` is `"supabase"`, making **`SupabaseStorageAdapter` active by default**.

When a user interaction triggers a mutation (e.g. creating a patient, logging an expense, recording a companion shift):
1. The presentation layer calls the relevant use case (or `AppContext` handler).
2. The use case validates domain invariants and invokes `storagePort.saveX(entity)`.
3. `SupabaseStorageAdapter`:
   - Writes the entity synchronously to the local memory fallback cache.
   - Serializes the domain entity into the PostgreSQL snake_case row payload.
   - Calls `this.client.from('<table_name>').upsert(payload)`.
   - Supabase client transmits an HTTP POST to `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/<table_name>` with authorization headers.
   - Upon network error or HTTP failure, throws a descriptive error: `[SupabaseStorageAdapter] Error saving <entity>: <message>`.

---

## 3. Supabase Cloud Tables, Schema Parity & Direct REST Parity

### 3.1 Table Inventory in Supabase Cloud
Querying the OpenAPI schema from `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/` identified 10 tables:

| Table Name | Primary Key | Total Columns | Required Fields | Current Row Count |
|:---|:---:|:---:|:---|:---:|
| `bookings` | `id` | 32 | `id`, `code` | 1 |
| `events` | `id` | 29 | `id`, `booking_id`, `title` | 7 |
| `shifts` | `id` | 17 | `id`, `booking_id` | 2 |
| `transfers` | `id` | 30 | `id`, `booking_id` | 4 |
| `expenses` | `id` | 14 | `id`, `booking_id` | 4 |
| `settlements` | `booking_id` | 18 | `booking_id` | 1 |
| `event_stream` | `id` | 6 | `id`, `booking_id`, `type` | 5 |
| `blobs` | `id` | 6 | `id` | 0 |
| `patient_invitations` | `id` | 14 | `id`, `token` | 0 |
| `users` | `id` | 8 | `id`, `username`, `name`, `role`, `role_label` | 7 |

### 3.2 Schema Details for Core Tables

#### 1. `bookings`
- **Columns**: `id`, `code`, `patient_id`, `first_name`, `last_name`, `passport_hash`, `country`, `language`, `phone`, `email`, `companion_names` (JSONB), `pax_count` (int), `arrival_date`, `departure_date`, `arrival_airline`, `arrival_flight`, `hotel_id`, `hotel_name`, `status`, `notes`, `passengers` (JSONB), `flight_legs` (JSONB), `treatment_phase`, `hotel_nights`, `hotel_nightly_rate_cents`, `hotel_total_quoted_cents`, `hotel_agency_deposit_cents`, `hotel_direct_pay_cents`, `requires_hotel_reservation`, `hotel_voucher_file_name`, `hotel_voucher_file_url`, `updated_at`.
- **Domain Mapping**: `PatientBooking` entity in `src/core/domain/entities/PatientBooking.ts`.

#### 2. `events`
- **Columns**: `id`, `booking_id`, `day_number`, `title`, `category`, `start_date_time`, `end_date_time`, `location_address`, `location_zone`, `coordinates_lat`, `coordinates_lng`, `provider_id`, `provider_name`, `assigned_driver_id`, `assigned_guide_id`, `assigned_nurse_id`, `financial_type`, `cost_cents`, `cost_currency`, `guide_hours`, `status`, `requires_gps_check_in`, `requires_signature`, `requires_receipt`, `gps_checked`, `signature_uuid`, `receipt_uuid`, `notes`, `updated_at`.
- **Domain Mapping**: `ItineraryEvent` in `src/features/itinerary/domain/ItineraryEvent.ts`. `cost_cents` stringified from `Money.cents`. `location` mapped to/from `OperativeTerritory.fromPreset`.

#### 3. `shifts`
- **Columns**: `id`, `booking_id`, `guide_id`, `guide_name`, `day_number`, `date`, `hours_logged`, `hourly_rate_cents`, `hourly_rate_currency`, `prep_allowance_cents`, `prep_allowance_currency`, `meal_subsidy_tier`, `meal_subsidy_cents`, `meal_subsidy_currency`, `notes`, `status`, `updated_at`.
- **Domain Mapping**: `CompanionShift` in `src/features/companion-shifts/domain/CompanionShift.ts`.

#### 4. `transfers`
- **Columns**: `id`, `booking_id`, `driver_id`, `driver_name`, `vehicle_type`, `route_type`, `origin_address`, `origin_zone`, `destination_address`, `destination_zone`, `scheduled_time`, `base_rate_cents`, `base_rate_currency`, `night_surcharge_cents`, `night_surcharge_currency`, `waiting_time_fee_cents`, `waiting_time_fee_currency`, `parking_fee_cents`, `parking_fee_currency`, `status`, `updated_at`, `event_id`, `flight_number`, `parking_cents`, `tolls_cents`, `total_billed_cents`, `notes`.
- **Domain Mapping**: `DriverTransfer` in `src/features/logistics-fleet/domain/DriverTransfer.ts`.

#### 5. `expenses`
- **Columns**: `id`, `booking_id`, `event_id`, `category`, `description`, `amount_cents`, `amount_currency`, `vendor_name`, `vendor_tax_id`, `receipt_blob_uuid`, `date`, `audited`, `status`, `updated_at`.
- **Domain Mapping**: `ReceiptExpense` in `src/features/settlement/domain/ReceiptExpense.ts`.

#### 6. `settlements`
- **Columns**: `booking_id` (PK), `total_expenses_cents`, `total_expenses_currency`, `total_guide_fees_cents`, `total_guide_fees_currency`, `total_fleet_taxis_cents`, `total_fleet_taxis_currency`, `total_advances_cents`, `total_advances_currency`, `net_balance_cents`, `net_balance_currency`, `advances` (JSONB array), `last_updated`, `sha256_seal`, `settlement_type`, `date`, `day_number`, `updated_at`.
- **Domain Mapping**: `SettlementLedger` in `src/features/settlement/domain/SettlementLedger.ts`. Exact BigInt cents arithmetic.

### 3.3 Active Seed Data Verified in Supabase Cloud
The database currently holds the active baseline for **Natalie Monica Bito e/v Rumai (`bkg-rva350` / `RVA350-1`)**:
- 1 Booking: `Natalie Monica Bito e/v Rumai & Alci Amundaray Rumai` (Arajet arrival 2026-09-13 19:30, Hotel 1616).
- 7 Events: Flight arrival, transfer, ophthalmology appointment at Glaucornea, guide accompaniment, shopping transfer, Comuna 13 tour, return flight.
- 2 Shifts: Guide Yenny Roberto (Day 2 and Day 3, 6h @ $15.500 COP/h + $15.500 prep + $25.000 meal allowance).
- 4 Transfers: Driver Ramón Rosero ($175.000 COP airport), Andrés Cantero ($45.000, $40.000, $85.000 intra-city transfers).
- 4 Expenses: Medical insurance ($120.000 COP), 2 SIM cards Claro ($30.000 COP), Claro data top-ups ($76.000 COP), parking ($50.000 COP).
- 1 Settlement Ledger:
  - Total Advances: $1.498.750 COP
  - Total Expenses: $276.000 COP
  - Total Guide Fees: $267.000 COP
  - Total Fleet Taxis: $345.000 COP
  - Net Balance: `-$610.750 COP` (Surplus in favor of Medical Trip).

### 3.4 Direct Verification of Bidirectional Parity via REST API
An automated curl round-trip test was executed live against the Supabase Cloud REST API:
1. **Write (`POST /patient_invitations`)**:
   Sent payload with `id: test-inv-1789584087`, `token: INV-TEST-001`. Returned **HTTP 201/200** with representation.
2. **Read (`GET /patient_invitations?id=eq.test-inv-1789584087`)**:
   Returned exact JSON payload matching all sent fields.
3. **Delete (`DELETE /patient_invitations?id=eq.test-inv-1789584087`)**:
   Returned **HTTP 204**. Subsequent query returned `[]`.

All REST requests succeeded without any 401 Unauthorized, 400 Bad Request, or CORS issues.

---

## 4. Production Build & Static Asset Readiness

### 4.1 Build Execution Analysis
The production build script defined in `package.json`:
```bash
"build": "tsc -b && vite build"
```
Execution results:
- **Command**: `npm run build`
- **Result**: Success in **3.78 seconds**
- **Exit Code**: 0
- **Modules Transformed**: 1783 modules
- **TypeScript Compiler**: `tsc -b` and `tsc --noEmit` exit with **0 errors**.

Generated bundle breakdown in `dist/`:
- `dist/index.html` (2.41 kB, gzip: 0.97 kB)
- `dist/assets/index-BIRVczB5.js` (638.39 kB, gzip: 158.66 kB)
- `dist/assets/index-B2N8YpzD.css` (68.75 kB, gzip: 11.95 kB)
- Code-split vendor chunks:
  - `dist/assets/vendor-supabase-D_t8kiev.js` (223.81 kB)
  - `dist/assets/vendor-react-Cre2rhBu.js` (133.97 kB)
  - `dist/assets/vendor-dexie-CFrudMJs.js` (96.37 kB)
  - `dist/assets/vendor-icons-C2QIiYCZ.js` (42.30 kB)
- Web Worker actors:
  - `dist/assets/financialAuditorActor.worker-CrUwQaiY.js` (491.20 kB)
  - `dist/assets/driverActor.worker-BRM3Yt3W.js` (3.92 kB)
  - `dist/assets/nurseActor.worker-LVwjHxyZ.js` (5.93 kB)
  - `dist/assets/guideActor.worker-CfRgwpOX.js` (3.36 kB)

### 4.2 Static Assets, PWA Manifest & Meta Tags Verification

| Resource | Path | Dimensions / Type | HTTP Status (`localhost:3000`) | Status |
|:---|:---|:---|:---:|:---:|
| Web App Manifest | `public/manifest.json` | JSON (626 bytes) | **HTTP 200** | ✅ Clean |
| PWA Icon 192 | `public/icon-192.png` | 192x192 PNG 8-bit RGB | **HTTP 200** | ✅ Clean |
| PWA Icon 512 | `public/icon-512.png` | 512x512 PNG 8-bit RGB | **HTTP 200** | ✅ Clean |
| Favicon | `public/favicon.ico` | PNG 8-bit RGBA | **HTTP 200** | ✅ Clean |
| Service Worker | `public/sw.js` | JS (1631 bytes, v7) | **HTTP 200** | ✅ Clean |

#### Meta Tags & Viewport in `index.html`:
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#0f172a" />
<meta name="description" content="Gestión Operativa y Liquidación Financiera en Terreno - Medical Trip Colombia S.A.S." />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="MedicalTrip" />
<link rel="icon" type="image/svg+xml" href="/favicon.ico" />
<link rel="manifest" href="/manifest.json" />
```

#### Observations on Static Assets:
- In `index.html`, `<link rel="icon" type="image/svg+xml" href="/favicon.ico" />` specifies `type="image/svg+xml"` while `favicon.ico` is a PNG format file. Browsers handle this smoothly via MIME sniffing, but specifying `type="image/x-icon"` or `type="image/png"` is recommended for perfection.
- The viewport tag includes `maximum-scale=1.0, user-scalable=no`, which locks zooming for native app ergonomics on field mobile devices.

---

## 5. Verification Commands Reference

To independently verify any part of this assessment:

1. **Verify Supabase REST API connectivity & table schemas**:
   ```bash
   curl -s "https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/bookings?select=*" \
     -H "apikey: sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-" \
     -H "Authorization: Bearer sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-"
   ```
2. **Verify TypeScript compilation**:
   ```bash
   cd apps/medicaltrip_react_app && npm run typecheck
   ```
3. **Verify Production Build**:
   ```bash
   cd apps/medicaltrip_react_app && npm run build
   ```
4. **Verify Live Preview HTTP 200 & Static Assets**:
   ```bash
   curl -s -I "http://localhost:3000/manifest.json"
   curl -s -I "http://localhost:3000/icon-192.png"
   curl -s -I "http://localhost:3000/icon-512.png"
   ```
