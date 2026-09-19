# Medical Trip Colombia S.A.S. — Complete Architectural & State Management Analysis
## 5 Admin Core Domains in `apps/medicaltrip_react_app`

**Author**: Explorer Survey 1  
**Date**: 2026-09-19  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Target Backend**: Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co`) & Dexie IndexedDB Fallback  
**Reference Document**: `ORIGINAL_REQUEST.md` (Timestamp: 2026-09-19T15:37:50Z)

---

## 1. Executive Summary & Core Architectural Framework

The Medical Trip Colombia web application (`apps/medicaltrip_react_app`) is engineered according to a **Feature-First Vertical-Slice Hexagonal Architecture** with Inversion of Control (IoC). The architecture strictly decouples domain logic and presentation components from concrete persistence drivers via an abstract storage port (`IStoragePort`).

```
                              ┌──────────────────────────────────────┐
                              │         Presentation Layer           │
                              │  (Cockpit, Bento, Modals, Views)     │
                              └──────────────────┬───────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │        State Management Layer        │
                              │      (AppContext, useSettlement)     │
                              └──────────────────┬───────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │        CQRS Application Layer        │
                              │   (CreateBooking, SmartItinerary,    │
                              │    Reschedule, CheckIn, Settle)      │
                              └──────────────────┬───────────────────┘
                                                 │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │      Abstract Output Port Contract   │
                              │              (IStoragePort)          │
                              └──────────────────┬───────────────────┘
                                                 │
                       ┌─────────────────────────┴─────────────────────────┐
                       ▼                                                   ▼
         ┌───────────────────────────┐                       ┌───────────────────────────┐
         │   SupabaseStorageAdapter  │                       │    DexieStorageAdapter    │
         │ (Cloud REST API / PG SDK) │ ──[Local Fallback]──> │  (IndexedDB / Local-First)│
         └───────────────────────────┘                       └───────────────────────────┘
```

### Architectural Highlights:
1. **Composition Root (`ServiceContainer.ts`)**:
   - Location: `src/core/infrastructure/ServiceContainer.ts`.
   - Manages singleton instances and dynamically resolves the active storage driver (`supabase`, `dexie`, `memory`).
   - Defaults to `supabase` (Cloud URL: `https://pxmobokcqhsixfvdsrwj.supabase.co`) with an automatic in-memory Dexie fallback to guarantee zero offline crashes.
2. **Deterministic BigInt Integer Cents**:
   - Every monetary transaction is strictly encapsulated within the `Money` value object (`src/core/domain/value-objects/Money.ts`), holding `cents: bigint`. Floating-point arithmetic is strictly prohibited in financial ledgers.
3. **Cryptographic Ledger Sealing**:
   - Reconciled settlement balances are secured via immutable SHA-256 block hashing and digital signature sealing (`src/features/settlement/infrastructure/Sha256LedgerChain.ts`), producing a verifiable `sha256Seal`.
4. **Single-Writer CQRS Event Stream**:
   - Mutations append structured domain event records (`BOOKING_CREATED`, `EVENT_RESCHEDULED`, `DRIVER_CHECK_IN_TERMINAL`, `EXPENSE_SETTLED`, `SIGNATURE_SEALED`) to `event_stream`.

---

## 2. Deep Dive: 5 Administrative Core Domains

### Domain 1: Dossier de Pasajeros & Reservas (`bookings`)

#### 1. Domain Entities & Value Objects
- **Entity**: `PatientBooking` (`src/core/domain/entities/PatientBooking.ts`)
  - Key attributes:
    * `id: string`: UUID identifier.
    * `code: string`: Unique reservation code (e.g., `RVA171`, `RVA350-1`, `RVA501`).
    * `patientId: string`: Normalized identifier (`ENT-PAX-XXXX`).
    * `firstName: string`, `lastName: string`, `passportHash: string` (SHA-256 hash for PHI minimization).
    * `country: string`, `language: string`, `phone: string`, `email: string`.
    * `paxCount: number` (Invariant: $1 \le \text{paxCount} \le 20$).
    * `arrivalDate: string`, `departureDate: string` (Invariant: $T_{\text{dep}} \ge T_{\text{arr}}$).
    * `arrivalAirline: string`, `arrivalFlight: string`, `flightLegs: FlightLeg[]`.
    * `hotelId: string`, `hotelName: string`, `requiresHotelReservation: boolean`.
    * `hotelNights?: number`, `hotelNightlyRateCents?: bigint`, `hotelTotalQuotedCents?: bigint`.
    * `status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO'`.
    * `passengers: PassengerRecord[]`: Full traveler breakdown with age categories (`ADULT`, `CHILD`, `INFANT`), role (`PATIENT` vs `COMPANION`), individual COP quotation, and medical survey.

#### 2. Use Cases
- **`CreatePatientBookingUseCase`** (`src/features/onboarding/application/CreatePatientBookingUseCase.ts`):
  - Invariant validation: Pax count range check ($1..20$), date chronology verification ($T_{\text{dep}} \ge T_{\text{arr}}$).
  - Geocoded territorial validation: Resolves hotel location via `OperativeTerritory.fromString(hotelName)` (rejecting non-operative areas like Mocoa).
  - Collision-free code resolution: `resolveCollisionFreeCode()` checks existing codes in storage and auto-increments suffix (e.g., `RVA171` $\to$ `RVA171-1` $\to$ `RVA171-2`).
  - Ledger provisioning: Automatically creates an empty initial `SettlementLedger` (`SettlementLedger.createEmpty(booking.code)`) and persists it.
  - Event Stream logging: Appends `BOOKING_CREATED` event record and broadcasts via actor swarm event bus.
- **`LoadArchetypeUseCase`** (`src/application/use-cases/LoadArchetypeUseCase.ts`):
  - Loads seeded Caribbean archetypes (`rva350`, `rva171`, `rva282`, `rva341`, `rva077`).

#### 3. Presentation Components
- **Cockpit Switcher (`ArchetypeSwitcherBar.tsx`)**:
  - Location: `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`.
  - Omnipresent Status Pill: Displays `[CW Natalie Monica Bito · RVA350 | Glaucornea · 2 Pax ▾]` on all viewport sizes (desktop and mobile).
  - Dropdown Cockpit: Features 7-layer safety keyboard listener via `useKeyboardShortcuts` (`[1]`-`[5]`), active lodging status banner, `[+ Nuevo]` button (opens `NewPatientModal`), and `[Link]` button (opens `SendInvitationModal`).
  - Realtime switching: Updates `activeBooking`, resets and reloads all dependent events, shifts, transfers, and settlements without page reload.
- **New Patient Modal (`NewPatientModal.tsx`)**:
  - Location: `src/features/onboarding/presentation/NewPatientModal.tsx`.
  - Dual tabs: `BASIC` (name, dates, flights, hotel, language) and `PASSENGERS` (traveler age categorization, medical conditions, medication lists, special mobility requirements, individual quotation COP).
  - WhatsApp Self-Registration link generator: 1-click generation of personalized onboarding link (`/portal-paciente?token=...&reserva=...`) with direct `wa.me` sharing.
  - Hotel support validation: Enforces attachment of hotel voucher file if `requiresHotelReservation` is checked.
- **Passengers Dossier View (`PassengersView.tsx`)**:
  - Location: `src/features/directory/presentation/PassengersView.tsx` (Window 5: Pasajeros Family Dossier).
  - Airlines flight badges with dual timezones: Colombia COT (UTC-5) vs Caribbean AST (UTC-4 = COT + 1h).
  - Masked PHI protection: Passport numbers rendered as `PAX-***-402`, normalized IDs `ENT-PAX-XXXX`, and SHA-256 integrity hashes.
  - Full CRUD management: Live search by name/code, status filters (`PROGRAMADO`, `EN_CURSO`, `COMPLETADO`, `CANCELADO`), and archive/delete actions.

#### 4. Storage Adapter Methods
- `saveBooking(booking: PatientBooking): Promise<void>`:
  - Upserts payload into Supabase table `bookings` with sanitized snake_case fields (`patient_id`, `passport_hash`, `pax_count`, `passengers`, `flight_legs`).
  - Synchronizes to local Dexie IndexedDB table `bookings`.
- `getBooking(bookingIdOrCode: string): Promise<PatientBooking | null>`:
  - Executes `.or('id.eq.${sanitized},code.eq.${sanitized}').maybeSingle()` to eliminate PostgREST HTTP 406 (`PGRST116`) errors.
- `getAllBookings(): Promise<PatientBooking[]>`:
  - Queries all rows from `bookings`, instantiates `PatientBooking` domain objects, and merges with local fallback records.
- `deleteBooking(bookingId: string): Promise<void>`:
  - Performs clean cascading deletion across all 7 relational tables in Supabase (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`) to eliminate orphaned records.

---

### Domain 2: Itinerario Clínico & Agenda Médica (`events`)

#### 1. Domain Entities & Value Objects
- **Entity**: `ItineraryEvent` (`src/features/itinerary/domain/ItineraryEvent.ts`)
  - Attributes:
    * `id: string`: Event UUID.
    * `bookingId: string`: Parent reservation code or UUID.
    * `dayNumber: number`: Itinerary day offset ($1..N$).
    * `title: string`: Appointment name.
    * `category: EventCategory`: `'MEDICAL_CONSULTATION' | 'CLINICAL_LAB' | 'SURGERY' | 'POST_OP_CONTROL' | 'AIRPORT_TRANSFER' | 'HOTEL_CHECKIN' | 'HOTEL_CHECKOUT' | 'COMPANION_MEETING' | 'TOURISM' | 'OTHER'`.
    * `startDateTime: string`, `endDateTime: string`: ISO-8601 UTC timestamps.
    * `location: OperativeTerritory`: Validated address and geographic zone (`POBLADO`, `LAURELES`, `RIONEGRO`, `CENTRO`, etc.).
    * `coordinates?: { lat: number; lng: number }`: GPS coordinates for route navigation.
    * `providerId?: string`, `providerName?: string`: Clinical institution (e.g., `Glaucornea`, `Clofán`, `HPTU`, `Cardio VID`, `Clínica CES`).
    * `assignedDriverId?: string`, `assignedGuideId?: string`, `assignedNurseId?: string`.
    * `cost: Money`: Cost associated with the milestone.
    * `status: EventStatusType`: `'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'`.
    * `requiresGpsCheckIn: boolean`, `gpsChecked: boolean`.
    * `requiresSignature: boolean`, `signatureUuid?: string`.
    * `requiresReceipt: boolean`, `receiptUuid?: string`.

#### 2. Medical Presets (`GenerateSmartItineraryUseCase.ts`)
The application provides 4 automated clinical blueprints (`src/features/itinerary/application/GenerateSmartItineraryUseCase.ts`):
1. **`PLASTIC_SURGERY_12D` / `CIRUGIA_PLASTICA_12D`**:
   - 12-day surgical journey centered at Hospital Pablo Tobón Uribe (HPTU) or Quirófanos El Tesoro.
   - Day 1: JMC airport transfer + Hotel check-in.
   - Day 2: 05:30 AM Fasting laboratory blood work + pre-op evaluation.
   - Day 3: Surgical block (Quirófano) + post-anesthetic recovery.
   - Days 4–10: Daily lymphatic drainage, nursing home visits, and post-op check-ups.
   - Day 11: Final clinical clearance + Fit-to-Fly medical certificate.
   - Day 12: Checkout + JMC airport departure transfer.
2. **`CARDIOLOGY_5D` / `CARDIOLOGIA_5D`**:
   - 5-day comprehensive cardiovascular diagnostic journey at Clínica Cardio VID.
   - Echocardiogram Doppler, 24-hour Holter monitoring, stress treadmill test, coronary angiography consultation, and cardiology sign-off.
3. **`OPHTHALMOLOGY_3D` / `OFTALMOLOGIA_3D`**:
   - 3-day high-precision corneal/refractive journey at Glaucornea / Clínica Clofán.
   - Pentacam corneal tomography, laser refractive surgery (Femto-LASIK / PRK), 24-hour slit-lamp evaluation, and flight clearance.
4. **`UROLOGY_4D` / `UROLOGIA_4D`**:
   - 4-day urological diagnostics and minimally invasive procedure at Clínica CES Oviedo / Laboratorio Echavarría.

#### 3. Views & Ergonomics
- **`AgendaView.tsx`** (`src/features/itinerary/presentation/AgendaView.tsx`):
  - Chronological grouped list by day with sticky date headers.
  - Aggregates daily monetary totals using `Money.add()`.
  - Multi-column row cards with inline status transitions.
- **`DayView.tsx`** (`src/features/itinerary/presentation/DayView.tsx`):
  - Daily operational settlement sheet linking itinerary events, companion shifts, and petty cash expenses for the selected date.
  - 15-minute slot snapping for appointment scheduling.
  - Sticky 1-tap action bar for instant saving.
- **`WeekView.tsx`** (`src/features/itinerary/presentation/WeekView.tsx`):
  - 06:00 to 22:00 time grid (16 operational hours).
  - Real-time current time indicator line across "Today".
  - Interactive drag-and-drop rescheduling with `GhostDropIndicator` and 15-minute snapping.
- **`MonthView.tsx`** (`src/features/itinerary/presentation/MonthView.tsx`):
  - Desktop: 7-column calendar grid with dynamic height scaling.
  - Mobile: Mini-month 7-column calendar with event status dots and selected-day agenda sheet below.
- **`PlanView.tsx`** (`src/features/medical-plan/presentation/PlanView.tsx`):
  - Window 4 Dual clinical agenda displaying hospital network directory and emergency triage contacts (CIMA, Clofán, CES, HPTU).

#### 4. Reschedule Event Use Case
- **`RescheduleEventUseCase`** (`src/features/itinerary/application/RescheduleEventUseCase.ts`):
  - Fetches existing event via `storagePort.getEventById(eventId)`.
  - Validates existence, updates `startDateTime`, `endDateTime`, geocoded `location`, and `status`.
  - Persists update via `storagePort.saveEvent(rescheduled)`.
  - Appends `EVENT_RESCHEDULED` record to CQRS event stream and broadcasts via actor swarm event bus.

#### 5. Storage Adapter Methods
- `saveEvent(event: ItineraryEvent): Promise<void>`: Upserts into Supabase `events` table (converting BigInt `cost_cents` to string) and saves to Dexie fallback.
- `saveEventsBatch(events: ItineraryEvent[]): Promise<void>`: Sequentially saves batches of events.
- `getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]>`: Queries Supabase `events` where `booking_id IN (...)` ordered by `start_date_time ASC`. Deserializes coordinates, `OperativeTerritory`, and BigInt `Money`.
- `getEventById(eventId: string): Promise<ItineraryEvent | null>`: Queries single event using `.maybeSingle()`.
- `deleteEvent(eventId: string): Promise<void>`: Removes event from Supabase `events` and Dexie.

---

### Domain 3: Turnos de Acompañamiento en Terreno (`shifts`)

#### 1. Domain Entities & Business Rules
- **Entity**: `CompanionShift` (`src/features/companion-shifts/domain/CompanionShift.ts`)
  - Key constants & formulas:
    * Base hourly rate: `$15.500 COP/h` (`DEFAULT_HOURLY_RATE_COP = Money.fromAmount(15500, 'COP')`).
    * Base preparation allowance: `$15.500 COP` (`DEFAULT_PREP_ALLOWANCE_COP = Money.fromAmount(15500, 'COP')`, equivalent to 1 hour of setup).
    * Tiered Meal Allowance (`resolveMealSubsidyTier(hours)`):
      - $< 3\text{h}$: `TIER_0` $\to$ `$0 COP`
      - $3\text{h} \le t < 5\text{h}$: `TIER_1` $\to$ `$8.000 COP`
      - $5\text{h} \le t < 8\text{h}$: `TIER_2` $\to$ `$25.000 COP`
      - $8\text{h} \le t < 12\text{h}$: `TIER_3` $\to$ `$35.000 COP`
      - $\ge 12\text{h}$: `TIER_4` $\to$ `$45.000 COP`
    * Deterministic Total Fee:
      $$\text{calculateTotalFee}() = (\text{hourlyRate} \times \text{hoursLogged}) + \text{prepAllowance} + \text{mealSubsidyAmount}$$
  - Attributes: `id`, `bookingId`, `guideId`, `guideName`, `dayNumber`, `date`, `hoursLogged`, `hourlyRate: Money`, `prepAllowance: Money`, `mealSubsidyTier`, `mealSubsidyAmount: Money`, `notes`, `status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'`.

#### 2. Presentation Components
- **`CompanionTurnSheetModal.tsx`** (`src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`):
  - 63 KB comprehensive modal for companion field management.
  - Guide selector bound to `FIELD_STAFF` directory (Yenny Roberto `GUIA-01`, Alejandro Restrepo `GUIA-02`, Diana Morales `GUIA-03`).
  - Incremental shift hours logging with $+/- 0.25\text{h}$ buttons and instant fee computation.
  - `MealSubsidySelector` component with 1-click tier override.
  - Petty Cash Received logging (Caja Menor Recibida) and daily out-of-pocket expenses tracker with camera OCR and image upload.
  - Integrated Retina canvas signature pad for guide/patient sign-off with SHA-256 seal derivation.
- **`DigitalSignaturePad.tsx`** (`src/features/settlement/presentation/DigitalSignaturePad.tsx`):
  - HTML5 Canvas with `devicePixelRatio` scaling for high-DPI Retina screens.
  - Smooth quadratic Bézier curve stroke interpolation.
  - Role selection: `PATIENT` (Paciente Titular), `GUIDE` (Guía Acompañante), `COORDINATOR` (Coordinador Operativo).
  - Clear canvas and legal certification consent statement.
- **`CompanionModeView.tsx`** (`src/features/companion-shifts/presentation/CompanionModeView.tsx`):
  - Window 7 high-contrast sunlight-readable mobile field cockpit for companions.

#### 3. Storage Adapter Methods
- `saveShift(shift: CompanionShift): Promise<void>`:
  - Upserts into Supabase `shifts` table with stringified BigInt cents (`hourly_rate_cents`, `prep_allowance_cents`, `meal_subsidy_cents`).
  - Preserves local copy in Dexie `shifts` table.
- `getShiftsByBooking(bookingId: string): Promise<CompanionShift[]>`:
  - Retrieves all shifts for booking IDs and reconstructs `CompanionShift` instances using `Money.fromCents()`.
- `deleteShift(shiftId: string): Promise<void>`:
  - Deletes shift from Supabase and Dexie.

---

### Domain 4: Logística de Flota & Choferes (`transfers`)

#### 1. Domain Entities & Models
- **Entity**: `DriverTransfer` (`src/features/logistics-fleet/domain/DriverTransfer.ts`)
  - Attributes:
    * `id: string`: Transfer UUID.
    * `bookingId: string`: Booking identifier.
    * `driverId: string`, `driverName: string`: Assigned driver profile.
    * `vehicleType: VehicleClass`: `'SEDAN' | 'VAN_XL' | 'DUSTER'`.
    * `routeType: RouteClass`: `'AIRPORT_ARRIVAL' | 'AIRPORT_DEPARTURE' | 'INTRA_CITY_SHORT' | 'INTRA_CITY_LONG' | 'OUT_OF_TOWN'`.
    * `origin: OperativeTerritory`, `destination: OperativeTerritory`.
    * `scheduledTime: string`: ISO-8601 UTC timestamp.
    * `baseRate: Money`, `nightSurcharge: Money`, `waitingTimeFee: Money`, `parkingFee: Money`.
    * `status: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'`.
  - Deterministic total cost:
    $$\text{calculateTotalCost}() = \text{baseRate} + \text{nightSurcharge} + \text{waitingTimeFee} + \text{parkingFee}$$

#### 2. Directory & Fleet Provider Integration
- Sourced from `FLEET_DRIVERS` (`src/infrastructure/data/providers.data.ts`):
  - `DRV-01`: Ramón Rosero (Kia Sonet Sedán/SUV, placa `NLX666`, Aeroturex Transporte Especial).
  - `DRV-02`: Juan Carlos Montoya (Renault Duster SUV, placa `STU890`, Aeroturex Transporte Especial).
  - `DRV-03`: Andrés Cantero (Toyota HiAce Van XL, placa `WXY123`, Aeroturex Transporte Especial).

#### 3. Use Cases & Terminal Actions
- **`PerformDriverCheckInUseCase`** (`src/features/logistics-fleet/application/PerformDriverCheckInUseCase.ts`):
  - Triggered when international patient arrives at José María Córdova (JMC) Airport terminal.
  - Atomically updates target `DriverTransfer` to `IN_TRANSIT` (or `COMPLETED`).
  - Synchronizes associated `ItineraryEvent` to `EN_SITIO` (or `COMPLETADO`), marking `gpsChecked: true`.
  - Persists both entities via `storagePort.saveTransfer()` and `storagePort.saveEvent()`.
  - Appends `DRIVER_CHECK_IN_TERMINAL` domain event to CQRS event stream.
  - Broadcasts notification to Swarm Event Bus.
- **`ArrivalTrackingCard.tsx`** & **`DriverCheckInAction.tsx`**:
  - Visual flight tracker displaying flight number (e.g. `Arajet DM-504`, `Z-Fly ZF-104`), arrival time at JMC MDE, driver details, and hotel destination.
  - 1-Click Check-in button triggering `performDriverCheckIn()`.
  - Welcome orientation kit launcher (`WelcomeOrientationModal.tsx`).

#### 4. Storage Adapter Methods
- `saveTransfer(transfer: DriverTransfer): Promise<void>`:
  - Upserts into Supabase `transfers` table with BigInt rate cents (`base_rate_cents`, `night_surcharge_cents`, `waiting_time_fee_cents`, `parking_fee_cents`).
  - Saves to Dexie fallback.
- `getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]>`:
  - Fetches transfers ordered by `scheduled_time ASC` and maps to `DriverTransfer` entities.
- `deleteTransfer(transferId: string): Promise<void>`:
  - Removes transfer from Supabase and Dexie.

---

### Domain 5: Caja Menor, Anticipos & Liquidación Determinista (`expenses`, `settlements`)

#### 1. Domain Entities & Mathematical Formula
- **Entity**: `ReceiptExpense` (`src/features/settlement/domain/ReceiptExpense.ts`):
  - Attributes: `id`, `bookingId`, `eventId`, `category: ExpenseCategory` (`'MEAL_SUBSIDY' | 'PHARMACY' | 'TOLL' | 'TRANSPORT_TAXI' | 'LAB_TEST' | 'CLINICAL_SUPPLIES' | 'HOTEL_INCIDENTAL' | 'OTHER'`), `description`, `amount: Money`, `vendorName`, `vendorTaxId` (NIT), `receiptBlobUuid`, `date`, `audited: boolean`, `status: 'PENDING' | 'APPROVED' | 'REJECTED'`.
- **Entity**: `SettlementLedger` (`src/features/settlement/domain/SettlementLedger.ts`):
  - Strictly typed as daily settlement (`settlementType: 'DAILY'`).
  - **Deterministic Master Formula**:
    $$\text{Total Debits} = \text{totalExpenses} + \text{totalGuideFees} + \text{totalFleetTaxis}$$
    $$\text{Saldo Neto} = \text{Total Debits} - \text{totalAdvances}$$
  - Balances:
    * $\text{Saldo Neto} = 0$: `isSettled() === true` (Zero balance).
    * $\text{Saldo Neto} < 0$: `isPatientCredit() === true` (Medical Trip owes refund to patient).
    * $\text{Saldo Neto} > 0$: `isPatientDebt() === true` (Patient owes pending balance to Medical Trip).

#### 2. BigInt Money Value Object (`Money.ts`)
- Location: `src/core/domain/value-objects/Money.ts`.
- Encapsulates `cents: bigint` and `currency: 'COP' | 'USD'`.
- Exact methods:
  * `add(other: Money): Money`: Safe addition asserting currency match.
  * `subtract(other: Money): Money`: Safe subtraction.
  * `multiply(factor: number | bigint): Money`: Scaled integer arithmetic ($10^6$ scale factor) with exact rounding to avoid IEEE-754 floating-point drift.
  * `split(parts: number): Money[]`: Distributes remainders down to the exact cent across parts.
  * `formatCOP(): string`: Standard formatted Colombian pesos (`$ 1.500.000 COP`).

#### 3. SHA-256 Cryptographic Seal Derivation
- Location: `src/features/settlement/infrastructure/Sha256LedgerChain.ts`.
- Pure TypeScript implementation compliant with FIPS 180-4 (zero external dependencies).
- Process:
  1. Canonical JSON serialization (`canonicalStringify`) with recursively sorted keys.
  2. Block creation with index, timestamp, canonical payload, previous hash, and nonce.
  3. `chain.signLedgerSeal(patientId, signaturePngBase64, timestamp)` derives the final `sealHash`.
  4. The resulting 64-character hex hash is persisted on `SettlementLedger.sha256Seal` and embedded in PDF audit reports.

#### 4. Presentation Components
- **Bento Grid Layout (`SettlementView.tsx`)**:
  - Location: `src/features/settlement/presentation/SettlementView.tsx` (Window 2: Liquidación Financiera Bento Grid).
  - Minimalist layout: 1px hairline borders, `tabular-nums font-mono`, zero decorative heavy shadows.
  - KPI Cards: Total Disbursements, Total Guide Fees, Total Fleet/Taxis, Advances, Net Balance.
  - 1-Tap Quick Expenses:
    * ☕ `Café` ($8.000, $15.000, $25.000 COP).
    * 💊 `Farmacia` ($25.000, $65.000, $185.000 COP).
    * 🚗 `Peaje Túnel Oriente` ($16.100, $19.300, $24.800 COP).
    * 🚕 `Taxi Urbano` ($15.000, $35.000, $90.000 COP).
  - Companion Shift hours inline editor with +/- 0.5h controls.
  - `HotelAccountSplitCard.tsx`: Breakdown of hotel nights, quoted total, agency deposit, and guest direct-pay balance.
  - Cryptographic seal indicator pill displaying `SHA-256: [10-char prefix]...`.
- **Receipt OCR Modal (`ReceiptOcrModal.tsx`)**:
  - Features animated laser scanning, thermal contrast enhancement, vendor NIT extraction, line-item itemization in BigInt cents, and 1-click commit via `SettleExpenseUseCase`.
- **Docked Settlement Bar (`DockedSettlementBar.tsx`)**:
  - Persistent bottom summary docked formula bar visible across views.

#### 5. Storage Adapter Methods
- `saveExpense(expense: ReceiptExpense): Promise<void>`:
  - Upserts expense into Supabase `expenses` table with `amount_cents` stringified BigInt.
  - Syncs to Dexie IndexedDB.
- `getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]>`:
  - Queries Supabase `expenses` table for matching booking IDs and reconstructs `ReceiptExpense` entities.
- `deleteExpense(expenseId: string): Promise<void>`:
  - Removes expense from Supabase and Dexie.
- `saveSettlement(settlement: SettlementLedger): Promise<void>`:
  - Upserts into Supabase `settlements` table with stringified BigInt cents for all debit and credit components, serialized advances array, and `sha256_seal`.
  - Persists in Dexie `settlements` table.
- `getSettlement(bookingId: string): Promise<SettlementLedger | null>`:
  - Queries Supabase `settlements` table.
  - Executes parallel queries (`getExpensesByBooking`, `getShiftsByBooking`, `getTransfersByBooking`) to dynamically verify and recalculate the deterministic ledger in memory with `sha256Seal`.

---

## 3. Storage Layer Architecture & Parity Matrix

The application communicates with persistence through `IStoragePort`. Below is the mapping between domain methods and Supabase Cloud database tables:

| Domain | `IStoragePort` Method | Supabase Cloud Table | Fallback Dexie Table | BigInt Serialization Format |
|---|---|---|---|---|
| **Bookings** | `saveBooking(booking)` | `bookings` | `bookings` | String (`cents.toString()`) |
| | `getBooking(idOrCode)` | `bookings` (`.or()`) | `bookings` | Reconstructed via `BigInt()` |
| | `getAllBookings()` | `bookings` | `bookings` | Reconstructed via `BigInt()` |
| | `deleteBooking(id)` | Cascading across 7 tables | `bookings` + dependents | N/A |
| **Itinerary** | `saveEvent(event)` | `events` | `events` | `cost_cents: string` |
| | `saveEventsBatch(events)` | `events` | `events` | `cost_cents: string` |
| | `getEventsByBooking(id)` | `events` | `events` | `Money.fromCents(BigInt())` |
| | `getEventById(id)` | `events` (`.maybeSingle()`) | `events` | `Money.fromCents(BigInt())` |
| | `deleteEvent(id)` | `events` | `events` | N/A |
| **Shifts** | `saveShift(shift)` | `shifts` | `shifts` | `*_cents: string` |
| | `getShiftsByBooking(id)` | `shifts` | `shifts` | `Money.fromCents(BigInt())` |
| | `deleteShift(id)` | `shifts` | `shifts` | N/A |
| **Transfers** | `saveTransfer(transfer)` | `transfers` | `transfers` | `*_cents: string` |
| | `getTransfersByBooking(id)`| `transfers` | `transfers` | `Money.fromCents(BigInt())` |
| | `deleteTransfer(id)` | `transfers` | `transfers` | N/A |
| **Expenses** | `saveExpense(expense)` | `expenses` | `expenses` | `amount_cents: string` |
| | `getExpensesByBooking(id)`| `expenses` | `expenses` | `Money.fromCents(BigInt())` |
| | `deleteExpense(id)` | `expenses` | `expenses` | N/A |
| **Settlement**| `saveSettlement(ledger)` | `settlements` | `settlements` | All debit/credit cents as strings |
| | `getSettlement(id)` | `settlements` | `settlements` | Recalculated with BigInt math |
| **CQRS Log** | `appendEventLog(entry)` | `event_stream` | `event_stream` | JSON payload |

---

## 4. State Management Lifecycle & Reactivity Pattern

All central application state is coordinated by `AppContext` (`src/presentation/state/AppContext.tsx`) and the custom hook `useSettlement` (`src/features/settlement/presentation/hooks/useSettlement.ts`):

```
                       [User Mutation / Action]
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     CQRS Command UseCase  │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │    IStoragePort Method    │
                    │ (Supabase + Local Dexie)  │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   recalculateSettlement   │
                    │ (ReconcileSettlementUseCase)
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │    State Dispatch:        │
                    │    setEvents, setShifts,  │
                    │    setExpenses, setTransf,│
                    │    setSettlement          │
                    └───────────────────────────┘
```

1. **Optimistic & Safe Mutation**:
   - Each state-changing function in `AppContext` (`createEvent`, `rescheduleEvent`, `saveCompanionShift`, `logFastExpense`, `performDriverCheckIn`) delegates to its specific application use-case.
   - The use-case updates the persistent storage port (`storagePort`).
   - Immediately following persistence, `recalculateSettlement()` executes `ReconcileSettlementUseCase`, recalculating total debits and credits in exact BigInt cents and refreshing the live settlement state.
2. **Offline-First Resilience**:
   - `SupabaseStorageAdapter` automatically writes to its local Dexie database first. If network requests to Supabase Cloud encounter latency or HTTP interruptions, the local fallback ensures operations proceed without throwing uncaught promise rejections.
3. **HTTP 406 Elimination**:
   - Single-entity queries use `.maybeSingle()` or `.limit(1)` rather than `.single()`, ensuring zero PostgREST HTTP 406 (`PGRST116`) errors on empty or new records.

---

## 5. Architectural Invariants & Verification Evidence

1. **TypeScript Compilation**:
   - Executed `npm run typecheck` (`tsc --noEmit`): Exited with code 0 (0 errors).
2. **Production Build**:
   - Executed `npm run build` (`tsc -b && vite build`): Succeeded in 3.38s, producing optimized bundles in `dist/` with zero errors.
3. **Resilience Test Suite**:
   - Executed `vitest run tests/unit/SupabaseStorageAdapter_resilience.test.ts`: 6/6 tests passed, verifying network failure resilience, maybeSingle usage, and zero unhandled rejections across all 5 domains.
