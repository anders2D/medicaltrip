# 📐 Supabase Cloud REST API & Database Schema Specification
**Medical Trip Colombia S.A.S. — Operational Architecture**
*Authoritative Specification Extracted by Spec Miner Survey 2*
*Date: 2026-09-19*

---

## 1. Executive Overview & Connection Topology

The cloud persistence layer of Medical Trip Colombia S.A.S. is hosted on **Supabase Cloud (AWS us-west-2 / us-east-1)**, exposing a direct PostgREST RESTful API.

- **Supabase Cloud REST API Root**: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- **Supabase Project Reference**: `pxmobokcqhsixfvdsrwj`
- **PostgreSQL Direct Connection**: `postgresql://postgres:[PASSWORD]@db.pxmobokcqhsixfvdsrwj.supabase.co:5432/postgres`
- **PostgreSQL Pooler Connection**: `postgresql://postgres.pxmobokcqhsixfvdsrwj:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres`
- **Storage Bucket Endpoint**: `https://pxmobokcqhsixfvdsrwj.supabase.co/storage/v1` (Default bucket: `medicaltrip-blobs`)

### Standard HTTP Headers for PostgREST
All client requests to `/rest/v1/*` must supply:
```http
apikey: sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-
Authorization: Bearer sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-
Content-Type: application/json
Accept: application/json
```
For upsert operations:
```http
Prefer: resolution=merge-duplicates, return=representation
```

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Persistence | Bookings REST CRUD | Create, read, update, delete patient bookings with passenger dossiers, flights, and hotel allocations | JSON payload (`bookings` row) | HTTP 200/201/204 with booking record | HTTP 400 on malformed JSON; 401 on bad key | `SupabaseStorageAdapter.ts`, `migrate_supabase_schema.cjs` |
| 2 | Persistence | Events REST CRUD | Create, read, update, delete clinical, lab, pharmacy, flight, and transfer events | JSON payload (`events` row) | HTTP 200/201/204 with event record | HTTP 406 if queried with `single()` on 0 rows | `ItineraryEvent.ts`, `events` OpenAPI |
| 3 | Persistence | Shifts REST CRUD | Create, read, update, delete companion shifts with hourly rates ($15.500/h) and meal subsidies | JSON payload (`shifts` row) | HTTP 200/201/204 with shift record | HTTP 400 on malformed columns | `CompanionShift.ts`, `shifts` OpenAPI |
| 4 | Persistence | Transfers REST CRUD | Schedule and track Aeroturex executive airport and clinic transfers with rate breakdowns | JSON payload (`transfers` row) | HTTP 200/201/204 with transfer record | HTTP 400 on invalid route | `DriverTransfer.ts`, `transfers` OpenAPI |
| 5 | Financial | Expenses REST CRUD | Record and audit out-of-pocket and clinic disbursements with BigInt integer cents | JSON payload (`expenses` row) | HTTP 200/201/204 with expense record | Ignores non-approved in ledger totals | `ReceiptExpense.ts`, `expenses` OpenAPI |
| 6 | Financial | Deterministic Settlement Reconciliation | Real-time calculation of net balance via BigInt cents without floating point drift | Set of approved expenses, shifts, transfers, and cash advances | Reconciled `SettlementLedger` | Throws `InvalidSettlementTypeError` if not `DAILY` | `SettlementLedger.ts`, `ReconcileSettlementUseCase.ts` |
| 7 | Cryptography | SHA-256 Seal Generation | Generation of tamper-evident SHA-256 cryptographic audit seal for settlement statements | Block chain state or serialized ledger payload | 64-char lowercase hex hash | Fails chain verification if tampered | `sha256LedgerChain.ts`, `OneTapSettlementWorkflowUseCase.ts` |
| 8 | Event Sourcing | CQRS Event Stream | Immutable event logging for audit trail (`ARCHETYPE_LOADED`, `DRIVER_CHECK_IN_TERMINAL`, etc.) | Domain event object (`type`, `payload`, `timestamp`) | Appended row in `event_stream` table | Silently logged or warned on network failure | `SupabaseStorageAdapter.ts`, `event_stream` OpenAPI |
| 9 | Storage | Blobs Persistence | Storage for canvas signatures, receipts, and generated audit PDF files | Binary blob or Base64 data URL with MIME type | Blob ID string and storage row | Falls back to local in-memory/Dexie on failure | `SupabaseStorageAdapter.ts`, `blobs` OpenAPI |
| 10 | Onboarding | Patient WhatsApp Invitation | Provisioning unique invitation tokens (`INV-YYYY-XXXX`) and WhatsApp self-registration links | Patient info, estimated arrival date, notes | `patient_invitations` row & token URL | Token uniqueness enforced by unique index | `SupabasePatientInvitationAdapter.ts`, `patient-creator` skill |
| 11 | Security | RBAC User Directory | Directory of system users (`ADMIN`, `COMPANION`, `PATIENT`) for portal authentication | User credentials / username | User record with role and profile metadata | HTTP 401 on authentication failure | `clean_supabase_data.cjs`, `users` OpenAPI |
| 12 | Logistics | 1-Click Driver Check-In | Atomic status transition from `CONFIRMED` to `IN_TRANSIT` with GPS check-in on event | Driver check-in command | Updated transfer & event + CQRS event | Graceful fallback if event not found | `PerformDriverCheckInUseCase.ts` |

---

## 3. Edge Cases & Observed Behaviors

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | PostgREST `.single()` query | Query matching 0 rows with `Accept: application/vnd.pgrst.object+json` | Returns `HTTP 406 Not Acceptable` with error `PGRST116: Cannot coerce the result to a single JSON object`. Mitigated in adapter by using `maybeSingle()` or `.limit(1)`. |
| 2 | PostgREST array query | Query matching 0 rows with `Accept: application/json` | Returns `HTTP 200 OK` with empty JSON array `[]` and `content-range: */*`. |
| 3 | API Authentication | Missing, malformed, or invalid `apikey` header | Returns `HTTP 401 Unauthorized` with `sb-error-code: UNAUTHORIZED_INVALID_API_KEY`. |
| 4 | Node.js SSL Certificate | Fetching Supabase Cloud endpoint in Node.js without environment flags | Throws `TypeError: fetch failed` with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Requires `NODE_TLS_REJECT_UNAUTHORIZED='0'`. |
| 5 | Booking ID vs Code Dual-Referencing | Querying child tables (`events`, `shifts`, etc.) where `booking_id` may match either UUID or `RVAxxx` | Adapter resolves both via `resolveBookingIds()` and uses `.in('booking_id', ids)` to prevent orphaned records. |
| 6 | Unapproved Expenses | Expenses with `status: 'PENDING'` or `'REJECTED'` | Excluded from `SettlementLedger.totalExpenses` calculations (only `APPROVED` expenses are debited). |
| 7 | Cancelled Transfers | Transfers with `status: 'CANCELLED'` | Excluded from `SettlementLedger.totalFleetTaxis` calculations. |
| 8 | Large Financial Amounts | Amounts exceeding 32-bit integer limits (e.g. > $21.474.836 COP) | Seamlessly handled via `BigInt` cents represented as `TEXT` in database columns (`cost_cents`, `net_balance_cents`). |
| 9 | Negative Net Balance | Total advances exceed total debits ($\text{Debits} < \text{Advances}$) | `net_balance_cents` is negative (`isPatientCredit() === true`), representing a surplus refund owed to the patient. |
| 10 | Cloud Outage / Network Offline | Network exception thrown during `.saveBooking()` or `.saveEvent()` | Adapter catches exception, logs a warning, and retains data in `InMemoryStorageAdapter` local fallback. |

---

## 4. Deep-Dive Specification by Domain

### Domain 1: `bookings` (Patient Booking Dossier)

#### PostgreSQL DDL Definition
```sql
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  patient_id TEXT,
  first_name TEXT,
  last_name TEXT,
  passport_hash TEXT,
  country TEXT,
  language TEXT,
  phone TEXT,
  email TEXT,
  companion_names JSONB DEFAULT '[]'::jsonb,
  pax_count INTEGER DEFAULT 1,
  arrival_date TEXT,
  departure_date TEXT,
  arrival_airline TEXT,
  arrival_flight TEXT,
  flight_legs JSONB DEFAULT '[]'::jsonb,
  treatment_phase TEXT,
  hotel_id TEXT,
  hotel_name TEXT,
  hotel_nights INTEGER,
  hotel_nightly_rate_cents TEXT,
  hotel_total_quoted_cents TEXT,
  hotel_agency_deposit_cents TEXT,
  hotel_direct_pay_cents TEXT,
  status TEXT,
  notes TEXT,
  passengers JSONB DEFAULT '[]'::jsonb,
  requires_hotel_reservation BOOLEAN DEFAULT false,
  hotel_voucher_file_name TEXT,
  hotel_voucher_file_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bookings_code ON bookings(code);
CREATE INDEX idx_bookings_patient_id ON bookings(patient_id);
```

#### Field Specifications & Types
- `id` (`TEXT`, PK): Unique booking identifier (UUID or slug like `bkg-rva350`). Required.
- `code` (`TEXT`, Indexed): Human-readable reservation code (e.g. `RVA350-1`, `RVA967`, `RVA171`). Required.
- `patient_id` (`TEXT`, Indexed): Sanitized normalized patient entity ID (e.g. `ENT-PAX-5625`, `pax-171`).
- `first_name` (`TEXT`), `last_name` (`TEXT`): Primary patient names.
- `passport_hash` (`TEXT`): Masked cryptographic hash of passport number (e.g. `sha256_000000003189bda3`) for PHI minimization.
- `country` (`TEXT`): Origin country/territory (`Curazao`, `Aruba`, `Bonaire`, `Países Bajos`, `Estados Unidos`).
- `language` (`TEXT`): Patient language (`Papiamento`, `Papiamento / Holandés`, `Español`, `English`).
- `phone` (`TEXT`): E.164 formatted international phone number (e.g. `+599 9 512 8899`).
- `email` (`TEXT`): Contact email.
- `companion_names` (`JSONB`): Array of strings containing names of accompanying persons.
- `pax_count` (`INTEGER`): Total number of travelers (range: 1 to 20).
- `arrival_date` (`TEXT`): ISO-8601 UTC timestamp of arrival in Colombia (e.g. `2026-09-30T10:00:00.000Z`).
- `departure_date` (`TEXT`): ISO-8601 UTC timestamp of departure from Colombia. Must be $\ge$ `arrival_date`.
- `arrival_airline` (`TEXT`), `arrival_flight` (`TEXT`): Inbound flight info (e.g. `Arajet`, `DM-101`).
- `flight_legs` (`JSONB`): Array of flight leg objects:
  ```json
  [
    {
      "from": "CUR",
      "to": "MDE",
      "flightNumber": "DM-101",
      "airline": "Arajet",
      "departureTime": "2026-09-30T10:00:00Z",
      "arrivalTime": "2026-09-30T11:45:00Z"
    }
  ]
  ```
- `treatment_phase` (`TEXT`): `'DIAGNOSTIC' | 'SURGERY' | 'POST_OP_CONTROL'`.
- `hotel_id` (`TEXT`), `hotel_name` (`TEXT`): Assigned accommodation (`HOTEL 1616 Poblado`, `Hotel Inntu Laureles`).
- `hotel_nights` (`INTEGER`): Total accommodation nights.
- `hotel_nightly_rate_cents`, `hotel_total_quoted_cents`, `hotel_agency_deposit_cents`, `hotel_direct_pay_cents` (`TEXT`): BigInt cents representing accommodation split accounting.
- `status` (`TEXT`): `'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO'`.
- `passengers` (`JSONB`): Array of detailed `PassengerRecord` objects conforming to:
  ```json
  [
    {
      "id": "pax-primary",
      "fullName": "Valerie Martis",
      "age": 40,
      "ageCategory": "ADULT",
      "role": "PATIENT",
      "relationshipWithPrimary": "Titular",
      "requiresHotelBed": true,
      "roomPreference": "SINGLE",
      "individualQuotationCOP": 12000000,
      "medicalSurvey": {
        "hasPreexistingConditions": false,
        "conditionsDescription": "",
        "takesMedications": false,
        "medicationsList": "",
        "specialRequirements": [],
        "specialRequirementsNotes": ""
      },
      "documents": {
        "passportFileName": "passport.pdf",
        "flightTicketFileName": "ticket.pdf"
      }
    }
  ]
  ```

---

### Domain 2: `events` (Clinical & Logistical Itinerary)

#### PostgreSQL DDL Definition
```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  day_number INTEGER,
  title TEXT NOT NULL,
  category TEXT,
  start_date_time TEXT,
  end_date_time TEXT,
  location_address TEXT,
  location_zone TEXT,
  coordinates_lat DOUBLE PRECISION,
  coordinates_lng DOUBLE PRECISION,
  provider_id TEXT,
  provider_name TEXT,
  assigned_driver_id TEXT,
  assigned_guide_id TEXT,
  assigned_nurse_id TEXT,
  financial_type TEXT,
  cost_cents TEXT,
  cost_currency TEXT,
  guide_hours NUMERIC,
  status TEXT,
  requires_gps_check_in BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT false,
  requires_receipt BOOLEAN DEFAULT false,
  gps_checked BOOLEAN DEFAULT false,
  signature_uuid TEXT,
  receipt_uuid TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_events_booking_id ON events(booking_id);
```

#### Category & Status Enums
- `category` (`TEXT`):
  - `'FLIGHT'`: International arrivals, departures, or connections.
  - `'CLINICAL'`: Specialist consultations, surgeries, pre-op/post-op evaluations.
  - `'LAB'`: Diagnostic blood work, ultrasound, imaging, tomographies.
  - `'PHARMACY'`: Medication procurement, medical supplies.
  - `'HOTEL'`: Hotel check-in, check-out, recovery periods.
  - `'TRANSFER'`: Executive passenger road movements.
- `status` (`TEXT`):
  - `'PROGRAMADO'`: Scheduled appointment.
  - `'EN_CAMINO'`: Guide/driver in transit to location.
  - `'EN_SITIO'`: Arrived at destination / GPS validated.
  - `'COMPLETADO'`: Procedure completed / signed off. (Terminal state).
  - `'CANCELADO'`: Cancelled event. (Can transition back to `PROGRAMADO`).
- `financial_type` (`TEXT`):
  - `'NONE' | 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'COMMERCIAL_COMMISSION'`.
- `cost_cents` (`TEXT`): BigInt integer cents string (e.g. `'39100000'` for $391.000 COP).
- `guide_hours` (`NUMERIC`): Hours spent by bilingual companion on this event.

---

### Domain 3: `shifts` (Field Companion Turns)

#### PostgreSQL DDL Definition
```sql
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  guide_id TEXT,
  guide_name TEXT,
  day_number INTEGER,
  date TEXT,
  hours_logged NUMERIC,
  hourly_rate_cents TEXT,
  hourly_rate_currency TEXT,
  prep_allowance_cents TEXT,
  prep_allowance_currency TEXT,
  meal_subsidy_tier TEXT,
  meal_subsidy_cents TEXT,
  meal_subsidy_currency TEXT,
  notes TEXT,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_shifts_booking_id ON shifts(booking_id);
```

#### Standard Rates & Financial Invariants
- Base Hourly Rate: **$15.500 COP/h** (`hourly_rate_cents = "1550000"`).
- Preparation Allowance: **$15.500 COP** (`prep_allowance_cents = "1550000"`).
- Meal Subsidy Tiers (`meal_subsidy_tier` & `meal_subsidy_cents`):
  - `< 3.0` hours: `TIER_0` $\rightarrow$ **$0 COP** (`"0"` cents).
  - `[3.0, 5.0)` hours: `TIER_1` $\rightarrow$ **$8.000 COP** (`"800000"` cents).
  - `[5.0, 8.0)` hours: `TIER_2` $\rightarrow$ **$25.000 COP** (`"2500000"` cents).
  - `[8.0, 12.0)` hours: `TIER_3` $\rightarrow$ **$35.000 COP** (`"3500000"` cents).
  - $\ge 12.0$ hours: `TIER_4` $\rightarrow$ **$45.000 COP** (`"4500000"` cents).
- Total Shift Fee Formula:
  $$\text{TotalShiftFee} = (\text{hourlyRate} \times \text{hoursLogged}) + \text{prepAllowance} + \text{mealSubsidyAmount}$$
- Status Enum: `'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'`.

---

### Domain 4: `transfers` (Logistics Fleet & Aeroturex Transfers)

#### PostgreSQL DDL Definition
```sql
CREATE TABLE transfers (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  vehicle_type TEXT,
  route_type TEXT,
  origin_address TEXT,
  origin_zone TEXT,
  destination_address TEXT,
  destination_zone TEXT,
  scheduled_time TEXT,
  base_rate_cents TEXT,
  base_rate_currency TEXT,
  night_surcharge_cents TEXT,
  night_surcharge_currency TEXT,
  waiting_time_fee_cents TEXT,
  waiting_time_fee_currency TEXT,
  parking_fee_cents TEXT,
  parking_fee_currency TEXT,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  event_id TEXT,
  tolls_cents TEXT,
  tolls_currency TEXT,
  parking_cents TEXT,
  parking_currency TEXT,
  total_billed_cents TEXT,
  total_billed_currency TEXT,
  flight_number TEXT,
  notes TEXT
);
CREATE INDEX idx_transfers_booking_id ON transfers(booking_id);
```

#### Enums & Rates
- `vehicle_type` (`TEXT`): `'SEDAN' | 'VAN_XL' | 'DUSTER'`.
- `route_type` (`TEXT`):
  - `'AIRPORT_ARRIVAL'`: JMC Airport $\rightarrow$ Hotel (Base: $145.000 COP Sedan / $175.000 COP Van XL).
  - `'AIRPORT_DEPARTURE'`: Hotel $\rightarrow$ JMC Airport.
  - `'INTRA_CITY_SHORT'`: Hotel $\leftrightarrow$ Clinic in Poblado/Ciudad del Río (Base: $45.000 COP).
  - `'INTRA_CITY_LONG'`: Across Medellín metropolitan area (Base: $65.000 COP).
  - `'OUT_OF_TOWN'`: Tour / Guatapé / Oriente Antioqueño.
- `status` (`TEXT`): `'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'`.
- Total Transfer Cost Formula:
  $$\text{TotalCost} = \text{baseRate} + \text{nightSurcharge} + \text{waitingTimeFee} + \text{parkingFee}$$

---

### Domain 5: `expenses` & `settlements` (Financial Accounting & BigInt Ledger)

#### PostgreSQL DDL Definitions
```sql
-- Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_id TEXT,
  category TEXT,
  description TEXT,
  amount_cents TEXT,
  amount_currency TEXT,
  vendor_name TEXT,
  vendor_tax_id TEXT,
  receipt_blob_uuid TEXT,
  date TEXT,
  audited BOOLEAN DEFAULT false,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_booking_id ON expenses(booking_id);

-- Settlements
CREATE TABLE settlements (
  booking_id TEXT PRIMARY KEY,
  total_expenses_cents TEXT,
  total_expenses_currency TEXT,
  total_guide_fees_cents TEXT,
  total_guide_fees_currency TEXT,
  total_fleet_taxis_cents TEXT,
  total_fleet_taxis_currency TEXT,
  total_advances_cents TEXT,
  total_advances_currency TEXT,
  net_balance_cents TEXT,
  net_balance_currency TEXT,
  advances JSONB DEFAULT '[]'::jsonb,
  last_updated TEXT,
  sha256_seal TEXT,
  settlement_type TEXT DEFAULT 'DAILY',
  date TEXT,
  day_number INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Expense Categories & Accounting Rules
- `category` (`TEXT`): `'PHARMACY' | 'MEDICAL_LAB' | 'PARKING' | 'MEAL_SUBSIDY' | 'SIM_CARD' | 'TOLL' | 'OTHER'`.
- `status` (`TEXT`): `'PENDING' | 'APPROVED' | 'REJECTED'`.
- **Accounting Invariant**: In `SettlementLedger.calculate()`, only expenses where `status === 'APPROVED'` are included in `total_expenses_cents`.

#### Advances Schema (`advances` JSONB in `settlements`)
```json
[
  {
    "id": "adv-rva350-1",
    "date": "2026-09-15T10:00:00Z",
    "amountCents": "150000000",
    "currency": "COP",
    "description": "Abono Depósito Garantía SWIFT Bancolombia"
  }
]
```

#### Master Deterministic Ledger Math (BigInt Cents)
All financial figures are held as integer cents using JavaScript `BigInt` (1 COP = 100 cents):
$$\text{TotalDebits} = \text{TotalApprovedExpenses} + \text{TotalGuideFees} + \text{TotalActiveTransfers}$$
$$\text{NetBalance} = \text{TotalDebits} - \text{TotalAdvances}$$

- If $\text{NetBalance} > 0$: `isPatientDebt() === true` (*Saldo a Favor de Medical Trip* — Patient must disburse remaining balance).
- If $\text{NetBalance} < 0$: `isPatientCredit() === true` (*Saldo a Favor del Paciente* — Medical Trip owes refund to patient).
- If $\text{NetBalance} == 0$: `isSettled() === true`.

#### Cryptographic `sha256Seal` Derivation
1. **Chain-based seal (`Sha256LedgerChain.signLedgerSeal`)**:
   ```typescript
   const signatureHash = sha256(signatureDataUrl);
   const sealData = `${latestBlockHash}|${signatureHash}|${patientId}|${timestamp}|${blockCount}`;
   const sha256Seal = sha256(sealData);
   ```
2. **Reconciliation seal (`ReconcileSettlementUseCase`)**:
   ```typescript
   const sealData = [
     bookingId,
     timestamp,
     ...expenses.map(e => `${e.id}:${e.amount.cents}`),
     ...shifts.map(s => `${s.id}:${s.calculateTotalFee().cents}`),
     ...transfers.map(t => `${t.id}:${t.calculateTotalCost().cents}`),
     ...advances.map(a => `${a.id}:${a.amount.cents}`),
   ].join('|');
   ```

---

### Discovered Auxiliary Tables

#### Table: `event_stream` (CQRS Audit Log)
```sql
CREATE TABLE event_stream (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  timestamp BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_event_stream_booking_id ON event_stream(booking_id);
```
- Recorded Event Types: `ARCHETYPE_LOADED`, `DRIVER_CHECK_IN_TERMINAL`, `SETTLEMENT_RECONCILED`, `ITINERARY_SIGNED_OFF`, `SETTLEMENT_PDF_EXPORTED`.

#### Table: `blobs` (Canvas Signatures & PDF Statements)
```sql
CREATE TABLE blobs (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  mime_type TEXT,
  category TEXT,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_blobs_booking_id ON blobs(booking_id);
```
- Categories: `'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF'`.

#### Table: `patient_invitations` (Self-Registration Tokens)
```sql
CREATE TABLE patient_invitations (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  patient_name TEXT,
  country TEXT,
  language TEXT,
  phone TEXT,
  email TEXT,
  estimated_arrival_date TEXT,
  coordinator_notes TEXT,
  status TEXT,
  created_at TEXT,
  completed_at TEXT,
  completed_booking_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Table: `users` (Role-Based Access Control)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_label TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
- Pre-seeded users: `admin` (`ADMIN`), `guia` / `acompanante` (`COMPANION`), `paciente_catia`, `paciente_george`, `paciente_eduard`, `paciente_alejandra` (`PATIENT`).

---

## 5. Network Pitfalls, Security & Implementation Rules

1. **PostgREST HTTP 406 (PGRST116) Avoidance**:
   - Never call `.single()` on queries that might match 0 records.
   - Always use `.maybeSingle()` or `.limit(1)` returning `data[0] || null`.
2. **Node.js TLS Certificate Verification**:
   - When executing tests or CLI migration scripts against Supabase Cloud from Node.js, the environment must specify:
     ```javascript
     process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
     ```
     to prevent `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`.
3. **Dual-Key Booking ID Resolution**:
   - Because child tables can have `booking_id` storing either the booking's UUID (`id`) or its correlation code (`code`, e.g., `RVA350-1`), always use `resolveBookingIds(bookingIdOrCode)` and query with `.in('booking_id', ids)`.
4. **Row Level Security (RLS) State**:
   - RLS is explicitly **disabled** on all 9 tables in the live Supabase project. `GRANT ALL` is given to `anon, authenticated, service_role`.
   - The `anon` key possesses full CRUD permissions. If RLS is re-enabled without policies, queries will silently return `[]` without error.
5. **BigInt Serialization**:
   - BigInt values must always be converted to string (`cents.toString()`) before submitting JSON to Supabase PostgREST, as JSON does not natively support 64-bit integer tokens without quotes.
