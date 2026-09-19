# Verification Test Strategy & Implementation Blueprint: Domain 3 (Shifts) & Domain 4 (Transfers) CRUD Lifecycles

**Agent**: Explorer M1_2  
**Parent**: Orchestrator 14 (`c6e995c5-1c0c-40ce-93e1-5a0f55a42e53`)  
**Target Milestone**: Milestone 1: Direct Supabase Cloud REST API CRUD Integration Suite  
**Scope**: Domain 3 (Companion Shifts) & Domain 4 (Fleet Transfers)  
**Target Environment**: Live Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`)  
**Timestamp**: 2026-09-19T15:52:00Z  

---

## 1. Executive Summary

This report establishes the exhaustive, concrete verification test strategy for the full CRUD (Create, Read, Update, Delete) lifecycles of **Domain 3 (Turnos de Acompañamiento / Companion Shifts)** and **Domain 4 (Logística de Flota / Fleet Transfers)** in `apps/medicaltrip_react_app`.

All interactions are verified directly against **Supabase Cloud REST API** (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`) with mathematical determinism in `Money` Value Objects (`BigInt` cents, $\Delta = 0.00$ COP), cryptographic SHA-256 seal derivation, and CQRS domain event stream recording.

---

## 2. Architecture & Domain Contracts

### 2.1 Domain 3: Companion Shifts (`CompanionShift`)

#### Domain Entity & Formulae
Located in `apps/medicaltrip_react_app/src/features/companion-shifts/domain/CompanionShift.ts`.
- **Hourly Rate**: Fixed standard rate $15.500 COP/h (`Money.fromAmount(15500, 'COP')` $\to 1.550.000$ cents).
- **Preparation Allowance (Subsidio de Preparación)**: Fixed $15.500 COP (`Money.fromAmount(15500, 'COP')` $\to 1.550.000$ cents).
- **Meal Allowance Tiering (`MealSubsidyTier`)**:
  - `TIER_0` ($< 3\text{h}$): $0 COP (`0n` cents)
  - `TIER_1` ($3 \le h < 5\text{h}$): $8.000 COP (`800000n` cents)
  - `TIER_2` ($5 \le h < 8\text{h}$): $25.000 COP (`2500000n` cents)
  - `TIER_3` ($8 \le h < 12\text{h}$): $35.000 COP (`3500000n` cents)
  - `TIER_4` ($\ge 12\text{h}$): $45.000 COP (`4500000n` cents)
- **Mathematical Total Fee Formula**:
  $$\text{Total Fee} = (\text{hoursLogged} \times \text{hourlyRate}) + \text{prepAllowance} + \text{mealSubsidyAmount}$$

#### Database Schema: `shifts` Table
Defined in PostgreSQL Supabase Cloud:
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
```

#### Cryptographic Seal & Digital Signature
In `CompanionTurnSheetModal.tsx`:
- Canvas exports `signatureDataUrl` (`data:image/png;base64,...`) or SVG.
- SHA-256 seal is generated via `calculateBlockHash(1, timestamp, payload, '0'.repeat(64), 0)`.
- Notes field stores `[SHA-256 SEAL: <sha256Seal>]`.
- Blob storage stores raw signature under `category: 'SIGNATURE'` via `storagePort.saveBlob()`.

---

### 2.2 Domain 4: Fleet Transfers (`DriverTransfer`)

#### Domain Entity & Tariffs
Located in `apps/medicaltrip_react_app/src/features/logistics-fleet/domain/DriverTransfer.ts`.
- **Driver**: Primary assigned driver `[DRV-01] Ramón Rosero` (vehicle: `SEDAN`).
- **Route Classes**:
  - `AIRPORT_ARRIVAL`: Aeropuerto JMC Rionegro $\to$ HOTEL 1616 Poblado ($145.000 COP base rate, `14500000n` cents).
  - `AIRPORT_DEPARTURE`: HOTEL 1616 Poblado $\to$ Aeropuerto JMC Rionegro ($145.000 COP base rate).
  - `INTRA_CITY_SHORT`: Poblado $\to$ Glaucornea / Ciudad del Río ($45.000 COP base rate).
  - `INTRA_CITY_LONG`: Poblado $\to$ Comuna 13 / Tour ($85.000 COP base rate).
- **Mathematical Total Cost Formula**:
  $$\text{Total Cost} = \text{baseRate} + \text{nightSurcharge} + \text{waitingTimeFee} + \text{parkingFee}$$

#### Application Use Case: `PerformDriverCheckInUseCase`
Located in `apps/medicaltrip_react_app/src/features/logistics-fleet/application/PerformDriverCheckInUseCase.ts`.
- Command input:
  - `bookingId`: string
  - `transferId`: string
  - `targetTransferStatus`: `'IN_TRANSIT'` (or `'COMPLETED'`)
  - `gpsCoordinates`: `{ lat: 6.1645, lng: -75.4231 }` (JMC Airport coordinates)
  - `driverNotes`: string
- Orchestration effects:
  1. Updates transfer `status` to `'IN_TRANSIT'` and calls `storagePort.saveTransfer(updatedTransfer)`.
  2. If associated itinerary event exists: updates `event.gpsChecked: true`, `status: 'EN_SITIO'`, notes, and calls `storagePort.saveEvent(updatedEvent)`.
  3. Appends CQRS domain event to `event_stream` table: `type: 'DRIVER_CHECK_IN_TERMINAL'`.

#### Database Schema: `transfers` Table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Concrete Step-by-Step Test Specification

### 3.1 Domain 3: Companion Shifts CRUD Lifecycle

| Phase | Action | Execution Details | Expected Invariants & Assertions |
|---|---|---|---|
| **3.1 CREATE** | Provision bilingual guide shift | Instantiate `CompanionShift` for bilingual guide Yenny Roberto (`GUIA-01`) on booking `RVA350-1` with 6.0 hours logged, `TIER_2` meal allowance, date `'2026-09-20'`. | - Hourly subtotal: $6.0 \times \$15.500 = \$93.000$ COP (`9300000n` cents)<br>- Prep allowance: $\$15.500$ COP (`1550000n` cents)<br>- Meal allowance (`TIER_2`): $\$25.000$ COP (`2500000n` cents)<br>- Total fee: $\$133.500$ COP (`13350000n` cents)<br>- `storagePort.saveShift(shift)` succeeds with HTTP 200/201 in Supabase Cloud. |
| **3.2 READ** | Query shift by booking and direct REST | Execute `storagePort.getShiftsByBooking(bookingId)` AND direct `GET /rest/v1/shifts?id=eq.${shift.id}`. | - Shift is present in results with matching `id` and `booking_id`.<br>- Database values match: `hours_logged == 6`, `hourly_rate_cents == '1550000'`, `prep_allowance_cents == '1550000'`, `meal_subsidy_cents == '2500000'`.<br>- Entity reconstructed from database yields exact `calculateTotalFee().cents === 13350000n`. |
| **3.3 UPDATE** | Adjust hours (+0.5h) and record digital signature | 1. Increment `hoursLogged` from 6.0 to 6.5.<br>2. Generate digital signature hash and derived SHA-256 seal via `calculateBlockHash(...)`.<br>3. Set status to `'APPROVED'`, notes to include `[SHA-256 SEAL: <seal>]`.<br>4. Call `storagePort.saveShift(updatedShift)`. | - New total fee: $(6.5 \times \$15.500) + \$15.500 + \$25.000 = \$100.750 + \$15.500 + \$25.000 = \$141.250$ COP (`14125000n` cents).<br>- Incremental fee delta is exactly $+\$7.750$ COP (`775000n` cents = $0.5 \times 15500 \times 100$).<br>- Query Supabase Cloud REST: `hours_logged == 6.5`, `status == 'APPROVED'`, notes contains valid 64-char SHA-256 hex seal. |
| **3.4 DELETE** | Delete shift and verify removal | Execute `storagePort.deleteShift(shift.id)`. | - Direct query `GET /rest/v1/shifts?id=eq.${shift.id}` returns empty array `[]` (HTTP 200, 0 rows).<br>- `storagePort.getShiftsByBooking(bookingId)` does NOT include `shift.id`.<br>- Zero orphan records. |

---

### 3.2 Domain 4: Fleet Transfers CRUD Lifecycle

| Phase | Action | Execution Details | Expected Invariants & Assertions |
|---|---|---|---|
| **4.1 CREATE** | Provision Aeroturex transfer | Instantiate `DriverTransfer` for route `AIRPORT_ARRIVAL` from Aeropuerto JMC Rionegro to HOTEL 1616 Poblado with driver Ramón Rosero (`[DRV-01]`), vehicle `SEDAN`, base rate $\$145.000$ COP (`14500000n` cents), scheduled for `'2026-09-20T09:30:00.000Z'`. | - Total cost: $\$145.000$ COP (`14500000n` cents).<br>- `storagePort.saveTransfer(transfer)` persists cleanly to Supabase Cloud.<br>- Direct REST query verifies row inserted in `transfers` table with `driver_id == 'DRV-01'`, `route_type == 'AIRPORT_ARRIVAL'`, `status == 'CONFIRMED'`. |
| **4.2 READ** | Query transfers by booking | Execute `storagePort.getTransfersByBooking(bookingId)` AND direct `GET /rest/v1/transfers?id=eq.${transfer.id}`. | - Transfer retrieved successfully with valid fields.<br>- Total cost calculation preserved deterministically: `transfer.calculateTotalCost().cents === 14500000n`. |
| **4.3 UPDATE** | Execute terminal check-in via use case | Execute `PerformDriverCheckInUseCase.execute()` with command:<br>- `bookingId`<br>- `transferId`<br>- `targetTransferStatus: 'IN_TRANSIT'`<br>- `gpsCoordinates: { lat: 6.1645, lng: -75.4231 }`<br>- `driverNotes: 'Pasajero recibido en Puerta 2, inicio traslado a Hotel 1616'` | - `result.success === true`.<br>- `result.transfer.status === 'IN_TRANSIT'`.<br>- Query Supabase `transfers` table: `status == 'IN_TRANSIT'`.<br>- Query Supabase `event_stream` table: Record with `type == 'DRIVER_CHECK_IN_TERMINAL'` exists with matching `transferId`, `driverId: 'DRV-01'`, `gpsChecked: true`.<br>- If linked to arrival event: event `gps_checked == true` and `status == 'EN_SITIO'` in Supabase `events` table. |
| **4.4 DELETE** | Delete transfer and verify removal | Execute `storagePort.deleteTransfer(transfer.id)`. | - Direct query `GET /rest/v1/transfers?id=eq.${transfer.id}` returns empty array `[]` (HTTP 200, 0 rows).<br>- `storagePort.getTransfersByBooking(bookingId)` does NOT include `transfer.id`. |

---

## 4. Test Harness Implementation Recommendations for the Worker

The Worker should deliver **two primary verification artifacts**:
1. **Vitest Integration Suite**: `apps/medicaltrip_react_app/tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`
   - Integrates with `npm test` / Vitest.
   - Leverages Vite's path alias resolution (`@/features/companion-shifts`, `@/features/logistics-fleet`, `@/core/domain`).
   - Uses live Supabase client initialized with `process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co'` and `VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-'`.
2. **Dedicated Standalone Verification Script**: `apps/medicaltrip_react_app/scripts/verify_shifts_transfers_crud.ts`
   - Can be run directly via:
     ```bash
     npx tsx --tsconfig ./tsconfig.app.json scripts/verify_shifts_transfers_crud.ts
     ```
   - Prints clear colored step-by-step telemetry, BigInt deltas, and SHA-256 seal verification.

---

### 4.1 Exact Code Blueprint: `tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { PerformDriverCheckInUseCase } from '@/features/logistics-fleet';
import { ItineraryEvent } from '@/features/itinerary';
import { Money } from '@/core/domain/value-objects/Money';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import { calculateBlockHash, sha256 } from '@/features/settlement/infrastructure/Sha256LedgerChain';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Supabase Cloud REST API CRUD Verification: Domain 3 (Shifts) & Domain 4 (Transfers)', () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const TEST_BOOKING_ID = `bkg-crud-test-${Date.now()}`;
  const TEST_BOOKING_CODE = `RVA-TEST-${Math.floor(Math.random() * 10000)}`;

  const TEST_SHIFT_ID = `shf-crud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const TEST_TRANSFER_ID = `trf-crud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const TEST_EVENT_ID = `evt-arr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    // Disable TLS reject for development environment
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    adapter = new SupabaseStorageAdapter({ client });

    // Seed minimal booking record for referential safety
    await client.from('bookings').upsert({
      id: TEST_BOOKING_ID,
      code: TEST_BOOKING_CODE,
      patient_id: 'PAX-TEST-001',
      first_name: 'CRUD_Test',
      last_name: 'Patient',
      status: 'ACTIVO',
    });
  });

  afterAll(async () => {
    // Clean up all test artifacts in Supabase Cloud
    await client.from('shifts').delete().eq('id', TEST_SHIFT_ID);
    await client.from('transfers').delete().eq('id', TEST_TRANSFER_ID);
    await client.from('events').delete().eq('id', TEST_EVENT_ID);
    await client.from('bookings').delete().eq('id', TEST_BOOKING_ID);
  });

  // ==========================================
  // DOMAIN 3: COMPANION SHIFTS CRUD LIFECYCLE
  // ==========================================
  describe('Domain 3: Companion Shifts CRUD Lifecycle', () => {
    it('3.1 CREATE: provisions a bilingual guide shift with $15.500/h + prep + TIER_2 meal in Supabase Cloud', async () => {
      const shift = new CompanionShift({
        id: TEST_SHIFT_ID,
        bookingId: TEST_BOOKING_CODE,
        guideId: 'GUIA-01',
        guideName: 'Yenny Roberto',
        dayNumber: 1,
        date: '2026-09-20',
        hoursLogged: 6,
        hourlyRate: Money.fromAmount(15500, 'COP'),
        prepAllowance: Money.fromAmount(15500, 'COP'),
        mealSubsidyTier: 'TIER_2',
        mealSubsidyAmount: Money.fromAmount(25000, 'COP'),
        notes: 'Acompañamiento clínico bilingüe Glaucornea',
        status: 'SCHEDULED',
      });

      // Mathematical verification
      // 6 * 15500 = 93000 COP (9300000 cents)
      // Prep = 15500 COP (1550000 cents)
      // Meal = 25000 COP (2500000 cents)
      // Total = 133500 COP (13350000 cents)
      const totalFee = shift.calculateTotalFee();
      expect(totalFee.cents).toBe(13350000n);

      // Save through adapter
      await adapter.saveShift(shift);

      // Direct Supabase Cloud REST verification
      const { data, error, status } = await client
        .from('shifts')
        .select('*')
        .eq('id', TEST_SHIFT_ID)
        .maybeSingle();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).not.toBeNull();
      expect(data.id).toBe(TEST_SHIFT_ID);
      expect(data.guide_name).toBe('Yenny Roberto');
      expect(Number(data.hours_logged)).toBe(6);
      expect(data.hourly_rate_cents).toBe('1550000');
      expect(data.prep_allowance_cents).toBe('1550000');
      expect(data.meal_subsidy_tier).toBe('TIER_2');
      expect(data.meal_subsidy_cents).toBe('2500000');
      expect(data.status).toBe('SCHEDULED');
    });

    it('3.2 READ: queries back shifts by booking and asserts calculation invariants', async () => {
      const shifts = await adapter.getShiftsByBooking(TEST_BOOKING_CODE);
      expect(shifts.length).toBeGreaterThanOrEqual(1);

      const found = shifts.find((s) => s.id === TEST_SHIFT_ID);
      expect(found).toBeDefined();
      expect(found!.guideId).toBe('GUIA-01');
      expect(found!.hoursLogged).toBe(6);
      expect(found!.hourlyRate.cents).toBe(1550000n);
      expect(found!.prepAllowance.cents).toBe(1550000n);
      expect(found!.mealSubsidyTier).toBe('TIER_2');
      expect(found!.mealSubsidyAmount.cents).toBe(2500000n);
      expect(found!.calculateTotalFee().cents).toBe(13350000n);
    });

    it('3.3 UPDATE: increments hours by +0.5h, records digital signature & SHA-256 seal, and persists update', async () => {
      // 1. Digital signature derivation
      const signatureSvg = '<svg viewBox="0 0 200 60"><path d="M10 50 Q 50 10 90 50 T 170 50" stroke="#000" fill="none"/></svg>';
      const signatureHash = sha256(signatureSvg);
      const timestamp = Date.now();

      const newHours = 6.5;
      const hourlyRate = Money.fromAmount(15500, 'COP');
      const prepAllowance = Money.fromAmount(15500, 'COP');
      const mealAmount = Money.fromAmount(25000, 'COP');

      // 6.5 * 15500 = 100750 COP
      // 100750 + 15500 + 25000 = 141250 COP (14125000 cents)
      const expectedTotalCents = 14125000n;

      const sealPayload = {
        bookingCode: TEST_BOOKING_CODE,
        guideId: 'GUIA-01',
        guideName: 'Yenny Roberto',
        shiftDate: '2026-09-20',
        dayNumber: 1,
        hoursLogged: newHours,
        hourlyRateCents: hourlyRate.cents.toString(),
        prepAllowanceCents: prepAllowance.cents.toString(),
        mealSubsidyTier: 'TIER_2',
        mealSubsidyCents: mealAmount.cents.toString(),
        totalShiftFeeCents: expectedTotalCents.toString(),
        signerRole: 'PATIENT',
        signerName: 'Natalie Rumai',
        signatureHash,
      };

      const sha256Seal = calculateBlockHash(1, timestamp, sealPayload, '0'.repeat(64), 0);

      const updatedShift = new CompanionShift({
        id: TEST_SHIFT_ID,
        bookingId: TEST_BOOKING_CODE,
        guideId: 'GUIA-01',
        guideName: 'Yenny Roberto',
        dayNumber: 1,
        date: '2026-09-20',
        hoursLogged: newHours,
        hourlyRate,
        prepAllowance,
        mealSubsidyTier: 'TIER_2',
        mealSubsidyAmount: mealAmount,
        notes: `Turno firmado en terreno [SHA-256 SEAL: ${sha256Seal}]`,
        status: 'APPROVED',
      });

      expect(updatedShift.calculateTotalFee().cents).toBe(expectedTotalCents);

      // Save updated shift to Supabase Cloud
      await adapter.saveShift(updatedShift);

      // Verify direct in Supabase Cloud
      const { data, error } = await client
        .from('shifts')
        .select('*')
        .eq('id', TEST_SHIFT_ID)
        .single();

      expect(error).toBeNull();
      expect(Number(data.hours_logged)).toBe(6.5);
      expect(data.status).toBe('APPROVED');
      expect(data.notes).toContain(sha256Seal);
    });

    it('3.4 DELETE: removes shift via deleteShift() and confirms deletion from Supabase Cloud', async () => {
      await adapter.deleteShift(TEST_SHIFT_ID);

      // Direct REST verification: row must no longer exist
      const { data, error } = await client
        .from('shifts')
        .select('*')
        .eq('id', TEST_SHIFT_ID);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);

      // Adapter query verification
      const remainingShifts = await adapter.getShiftsByBooking(TEST_BOOKING_CODE);
      expect(remainingShifts.some((s) => s.id === TEST_SHIFT_ID)).toBe(false);
    });
  });

  // ==========================================
  // DOMAIN 4: FLEET TRANSFERS CRUD LIFECYCLE
  // ==========================================
  describe('Domain 4: Fleet Transfers CRUD Lifecycle', () => {
    it('4.1 CREATE: provisions an Aeroturex arrival transfer (JMC -> Hotel 1616) in Supabase Cloud', async () => {
      const transfer = new DriverTransfer({
        id: TEST_TRANSFER_ID,
        bookingId: TEST_BOOKING_CODE,
        driverId: 'DRV-01',
        driverName: 'Ramón Rosero',
        vehicleType: 'SEDAN',
        routeType: 'AIRPORT_ARRIVAL',
        origin: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC Rionegro'),
        destination: OperativeTerritory.fromPreset('POBLADO', 'HOTEL 1616 Poblado'),
        scheduledTime: '2026-09-20T09:30:00.000Z',
        baseRate: Money.fromAmount(145000, 'COP'),
        status: 'CONFIRMED',
      });

      expect(transfer.calculateTotalCost().cents).toBe(14500000n);

      await adapter.saveTransfer(transfer);

      // Direct Supabase REST verification
      const { data, error, status } = await client
        .from('transfers')
        .select('*')
        .eq('id', TEST_TRANSFER_ID)
        .maybeSingle();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).not.toBeNull();
      expect(data.driver_id).toBe('DRV-01');
      expect(data.driver_name).toBe('Ramón Rosero');
      expect(data.route_type).toBe('AIRPORT_ARRIVAL');
      expect(data.base_rate_cents).toBe('14500000');
      expect(data.status).toBe('CONFIRMED');
    });

    it('4.2 READ: queries back transfers by booking and validates route & driver invariants', async () => {
      const transfers = await adapter.getTransfersByBooking(TEST_BOOKING_CODE);
      expect(transfers.length).toBeGreaterThanOrEqual(1);

      const found = transfers.find((t) => t.id === TEST_TRANSFER_ID);
      expect(found).toBeDefined();
      expect(found!.driverId).toBe('DRV-01');
      expect(found!.driverName).toBe('Ramón Rosero');
      expect(found!.vehicleType).toBe('SEDAN');
      expect(found!.routeType).toBe('AIRPORT_ARRIVAL');
      expect(found!.baseRate.cents).toBe(14500000n);
      expect(found!.calculateTotalCost().cents).toBe(14500000n);
    });

    it('4.3 UPDATE: executes driver check-in via PerformDriverCheckInUseCase and verifies IN_TRANSIT & CQRS log', async () => {
      // Provision associated arrival event
      const arrivalEvent = new ItineraryEvent({
        id: TEST_EVENT_ID,
        bookingId: TEST_BOOKING_CODE,
        dayNumber: 1,
        title: 'Traslado JMC Rionegro -> Hotel 1616',
        category: 'TRANSFER',
        startDateTime: '2026-09-20T09:30:00.000Z',
        endDateTime: '2026-09-20T10:45:00.000Z',
        location: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC'),
        assignedDriverId: 'DRV-01',
        status: 'PROGRAMADO',
        requiresGpsCheckIn: true,
        cost: Money.fromAmount(145000, 'COP'),
        financialType: 'DIRECT_BILLING',
      });
      await adapter.saveEvent(arrivalEvent);

      // Execute CQRS use case
      const checkInUseCase = new PerformDriverCheckInUseCase(adapter);
      const result = await checkInUseCase.execute({
        bookingId: TEST_BOOKING_CODE,
        transferId: TEST_TRANSFER_ID,
        eventId: TEST_EVENT_ID,
        targetTransferStatus: 'IN_TRANSIT',
        targetEventStatus: 'EN_SITIO',
        gpsCoordinates: { lat: 6.1645, lng: -75.4231 },
        driverNotes: 'Pasajero recibido en Puerta 2 JMC, en ruta a Hotel 1616',
      });

      expect(result.success).toBe(true);
      expect(result.transfer.status).toBe('IN_TRANSIT');
      expect(result.event?.status).toBe('EN_SITIO');
      expect(result.event?.gpsChecked).toBe(true);

      // Verify transfer in Supabase Cloud
      const { data: cloudTransfer } = await client
        .from('transfers')
        .select('*')
        .eq('id', TEST_TRANSFER_ID)
        .single();
      expect(cloudTransfer.status).toBe('IN_TRANSIT');

      // Verify event in Supabase Cloud
      const { data: cloudEvent } = await client
        .from('events')
        .select('*')
        .eq('id', TEST_EVENT_ID)
        .single();
      expect(cloudEvent.status).toBe('EN_SITIO');
      expect(cloudEvent.gps_checked).toBe(true);

      // Verify CQRS event stream log in Supabase Cloud
      const { data: eventLogs } = await client
        .from('event_stream')
        .select('*')
        .eq('booking_id', TEST_BOOKING_CODE)
        .eq('type', 'DRIVER_CHECK_IN_TERMINAL');

      expect(eventLogs).not.toBeNull();
      expect(eventLogs!.length).toBeGreaterThanOrEqual(1);
    });

    it('4.4 DELETE: removes transfer via deleteTransfer() and confirms removal from Supabase Cloud', async () => {
      await adapter.deleteTransfer(TEST_TRANSFER_ID);

      const { data, error } = await client
        .from('transfers')
        .select('*')
        .eq('id', TEST_TRANSFER_ID);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);

      const remainingTransfers = await adapter.getTransfersByBooking(TEST_BOOKING_CODE);
      expect(remainingTransfers.some((t) => t.id === TEST_TRANSFER_ID)).toBe(false);
    });
  });
});
```

---

### 4.2 Exact Code Blueprint: `scripts/verify_shifts_transfers_crud.ts`

```typescript
/**
 * Medical Trip Colombia S.A.S. - Verification Script for Shifts & Transfers CRUD
 * Executes the full CRUD lifecycle against live Supabase Cloud REST API with deterministic assertions.
 * Run with: npx tsx --tsconfig ./tsconfig.app.json scripts/verify_shifts_transfers_crud.ts
 */

import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '../src/core/infrastructure/storage/SupabaseStorageAdapter';
import { CompanionShift } from '../src/features/companion-shifts/domain/CompanionShift';
import { DriverTransfer } from '../src/features/logistics-fleet/domain/DriverTransfer';
import { PerformDriverCheckInUseCase } from '../src/features/logistics-fleet/application/PerformDriverCheckInUseCase';
import { ItineraryEvent } from '../src/features/itinerary/domain/entities/ItineraryEvent';
import { Money } from '../src/core/domain/value-objects/Money';
import { OperativeTerritory } from '../src/core/domain/value-objects/OperativeTerritory';
import { calculateBlockHash, sha256 } from '../src/features/settlement/infrastructure/Sha256LedgerChain';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  console.log('================================================================');
  console.log('  MEDICAL TRIP COLOMBIA — SHIFTS & TRANSFERS CLOUD CRUD AUDIT  ');
  console.log('  Target: ' + SUPABASE_URL);
  console.log('================================================================\n');

  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adapter = new SupabaseStorageAdapter({ client });

  const testBookingId = `bkg-test-${Date.now()}`;
  const testBookingCode = `RVA-TEST-${Math.floor(Math.random() * 10000)}`;
  const testShiftId = `shf-test-${Date.now()}`;
  const testTransferId = `trf-test-${Date.now()}`;
  const testEventId = `evt-test-${Date.now()}`;

  try {
    // 0. Seed test booking
    console.log('[Setup] Creating temporary test booking ' + testBookingCode);
    await client.from('bookings').upsert({
      id: testBookingId,
      code: testBookingCode,
      patient_id: 'PAX-TEST',
      first_name: 'Audit',
      last_name: 'Patient',
      status: 'ACTIVO',
    });

    // ------------------------------------------------------------
    // DOMAIN 3: COMPANION SHIFTS CRUD
    // ------------------------------------------------------------
    console.log('\n>>> [Domain 3] 1. CREATE Companion Shift ($15.500/h + prep + TIER_2 meal)');
    const initialShift = new CompanionShift({
      id: testShiftId,
      bookingId: testBookingCode,
      guideId: 'GUIA-01',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-09-20',
      hoursLogged: 6,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      prepAllowance: Money.fromAmount(15500, 'COP'),
      mealSubsidyTier: 'TIER_2',
      mealSubsidyAmount: Money.fromAmount(25000, 'COP'),
      notes: 'Acompañamiento bilingüe Glaucornea',
      status: 'SCHEDULED',
    });

    const initialFee = initialShift.calculateTotalFee();
    console.log(`    Calculated total fee: ${initialFee.formatted} (${initialFee.cents} cents)`);
    if (initialFee.cents !== 13350000n) throw new Error(`Initial fee mismatch: expected 13350000n, got ${initialFee.cents}`);

    await adapter.saveShift(initialShift);
    console.log('    ✓ Shift persisted via adapter');

    console.log('\n>>> [Domain 3] 2. READ Companion Shift');
    const shifts = await adapter.getShiftsByBooking(testBookingCode);
    const retrievedShift = shifts.find((s) => s.id === testShiftId);
    if (!retrievedShift) throw new Error('Shift not found in Supabase Cloud');
    console.log(`    ✓ Retrieved shift: ${retrievedShift.guideName} | ${retrievedShift.hoursLogged}h | Fee: ${retrievedShift.calculateTotalFee().formatted}`);

    console.log('\n>>> [Domain 3] 3. UPDATE Companion Shift (+0.5h & Digital Signature)');
    const newHours = 6.5;
    const sigSvg = '<svg><path d="M0,0 L10,10"/></svg>';
    const sigHash = sha256(sigSvg);
    const ts = Date.now();
    const updatedTotalCents = 14125000n;

    const sealPayload = {
      bookingCode: testBookingCode,
      guideId: 'GUIA-01',
      shiftDate: '2026-09-20',
      hoursLogged: newHours,
      totalShiftFeeCents: updatedTotalCents.toString(),
      signerName: 'Natalie Rumai',
      signatureHash: sigHash,
    };
    const sha256Seal = calculateBlockHash(1, ts, sealPayload, '0'.repeat(64), 0);
    console.log('    Derived SHA-256 seal: ' + sha256Seal);

    const updatedShift = new CompanionShift({
      id: testShiftId,
      bookingId: testBookingCode,
      guideId: 'GUIA-01',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-09-20',
      hoursLogged: newHours,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      prepAllowance: Money.fromAmount(15500, 'COP'),
      mealSubsidyTier: 'TIER_2',
      mealSubsidyAmount: Money.fromAmount(25000, 'COP'),
      notes: `Firmado en terreno [SHA-256 SEAL: ${sha256Seal}]`,
      status: 'APPROVED',
    });

    const updatedFee = updatedShift.calculateTotalFee();
    console.log(`    Updated fee: ${updatedFee.formatted} (${updatedFee.cents} cents)`);
    if (updatedFee.cents !== updatedTotalCents) throw new Error(`Updated fee mismatch: expected 14125000n, got ${updatedFee.cents}`);

    await adapter.saveShift(updatedShift);

    const { data: cloudShift } = await client.from('shifts').select('*').eq('id', testShiftId).single();
    if (Number(cloudShift.hours_logged) !== 6.5 || cloudShift.status !== 'APPROVED') {
      throw new Error('Supabase Cloud did not update hours/status correctly');
    }
    console.log('    ✓ Cloud shift updated: hours = 6.5, status = APPROVED');

    console.log('\n>>> [Domain 3] 4. DELETE Companion Shift');
    await adapter.deleteShift(testShiftId);
    const { data: deletedShifts } = await client.from('shifts').select('*').eq('id', testShiftId);
    if (deletedShifts && deletedShifts.length > 0) throw new Error('Shift was not deleted from Supabase Cloud');
    console.log('    ✓ Shift successfully removed from Supabase Cloud');

    // ------------------------------------------------------------
    // DOMAIN 4: FLEET TRANSFERS CRUD
    // ------------------------------------------------------------
    console.log('\n>>> [Domain 4] 1. CREATE Fleet Transfer (Aeroturex JMC -> Hotel 1616)');
    const transfer = new DriverTransfer({
      id: testTransferId,
      bookingId: testBookingCode,
      driverId: 'DRV-01',
      driverName: 'Ramón Rosero',
      vehicleType: 'SEDAN',
      routeType: 'AIRPORT_ARRIVAL',
      origin: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC'),
      destination: OperativeTerritory.fromPreset('POBLADO', 'HOTEL 1616 Poblado'),
      scheduledTime: '2026-09-20T09:30:00.000Z',
      baseRate: Money.fromAmount(145000, 'COP'),
      status: 'CONFIRMED',
    });
    console.log(`    Calculated cost: ${transfer.calculateTotalCost().formatted}`);

    await adapter.saveTransfer(transfer);
    console.log('    ✓ Transfer persisted via adapter');

    console.log('\n>>> [Domain 4] 2. READ Fleet Transfer');
    const transfers = await adapter.getTransfersByBooking(testBookingCode);
    const retrievedTrf = transfers.find((t) => t.id === testTransferId);
    if (!retrievedTrf) throw new Error('Transfer not found in Supabase Cloud');
    console.log(`    ✓ Retrieved transfer: ${retrievedTrf.driverName} | ${retrievedTrf.routeType} | ${retrievedTrf.baseRate.formatted}`);

    console.log('\n>>> [Domain 4] 3. UPDATE Fleet Transfer (PerformDriverCheckInUseCase)');
    // Seed associated arrival event
    await adapter.saveEvent(
      new ItineraryEvent({
        id: testEventId,
        bookingId: testBookingCode,
        dayNumber: 1,
        title: 'Vuelo llegada Arajet & Traslado JMC',
        category: 'TRANSFER',
        startDateTime: '2026-09-20T09:30:00.000Z',
        endDateTime: '2026-09-20T10:45:00.000Z',
        location: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC'),
        assignedDriverId: 'DRV-01',
        status: 'PROGRAMADO',
        requiresGpsCheckIn: true,
        cost: Money.fromAmount(145000, 'COP'),
        financialType: 'DIRECT_BILLING',
      })
    );

    const checkInUseCase = new PerformDriverCheckInUseCase(adapter);
    const checkInResult = await checkInUseCase.execute({
      bookingId: testBookingCode,
      transferId: testTransferId,
      eventId: testEventId,
      targetTransferStatus: 'IN_TRANSIT',
      targetEventStatus: 'EN_SITIO',
      gpsCoordinates: { lat: 6.1645, lng: -75.4231 },
      driverNotes: 'Pasajero recibido en Puerta 2, sin novedades',
    });

    if (!checkInResult.success || checkInResult.transfer.status !== 'IN_TRANSIT') {
      throw new Error('Driver check-in use case execution failed');
    }
    console.log(`    ✓ Check-in succeeded: status = ${checkInResult.transfer.status}, logId = ${checkInResult.logId}`);

    const { data: cloudTrf } = await client.from('transfers').select('*').eq('id', testTransferId).single();
    if (cloudTrf.status !== 'IN_TRANSIT') throw new Error('Transfer status not updated in Supabase Cloud');
    console.log('    ✓ Transfer status confirmed in Supabase Cloud: IN_TRANSIT');

    console.log('\n>>> [Domain 4] 4. DELETE Fleet Transfer');
    await adapter.deleteTransfer(testTransferId);
    const { data: deletedTrfs } = await client.from('transfers').select('*').eq('id', testTransferId);
    if (deletedTrfs && deletedTrfs.length > 0) throw new Error('Transfer was not deleted from Supabase Cloud');
    console.log('    ✓ Transfer successfully removed from Supabase Cloud');

    console.log('\n================================================================');
    console.log('  ALL DOMAIN 3 & DOMAIN 4 CRUD TESTS PASSED AGAINST SUPABASE!   ');
    console.log('================================================================');
  } finally {
    // Teardown
    console.log('\n[Teardown] Cleaning up residual test data in Supabase Cloud...');
    await client.from('shifts').delete().eq('id', testShiftId);
    await client.from('transfers').delete().eq('id', testTransferId);
    await client.from('events').delete().eq('id', testEventId);
    await client.from('bookings').delete().eq('id', testBookingId);
    console.log('[Teardown] Cleanup complete.');
  }
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});
```

---

## 5. Implementation Instructions & Invariant Verification Matrix for the Worker

### 5.1 Verification Invariant Matrix

| Domain | Operation | Primary Invariant | Delta / Precision | Failure Mode & Recovery |
|---|---|---|---|---|
| **Domain 3 (Shifts)** | **Create** | Hourly rate $15.500 COP + prep allowance $15.500 COP + meal tier | $\Delta = 0.00$ COP; Exact `13350000n` cents for 6.0h | Catch network timeout, ensure retry or local fallback preserving uncommitted transaction. |
| **Domain 3 (Shifts)** | **Read** | PostgREST queries return `status == 200` without HTTP 406 (PGRST116) | Exact string equality of cents: `'1550000'`, `'2500000'` | Use `.maybeSingle()` or `.limit(1)` for single-row lookups. |
| **Domain 3 (Shifts)** | **Update** | Increment hours (+0.5h to 6.5h) increases total fee by exactly $+7.750$ COP | $\Delta = +775000n$ cents; Exact `14125000n` cents | Verify that `notes` correctly embeds `[SHA-256 SEAL: <64-char-hex>]`. |
| **Domain 3 (Shifts)** | **Delete** | Row deleted from `shifts` table | 0 rows returned | Ensure `deleteShift` handles missing IDs gracefully without throwing. |
| **Domain 4 (Transfers)** | **Create** | Aeroturex JMC base rate $\$145.000$ COP | $\Delta = 0.00$ COP; Exact `14500000n` cents | Verify driver Ramón Rosero (`DRV-01`) assignment. |
| **Domain 4 (Transfers)** | **Read** | Queries return `AIRPORT_ARRIVAL` route and `CONFIRMED` status | Exact status string match | PostgREST query on `booking_id` returns complete transfer list. |
| **Domain 4 (Transfers)** | **Update** | `PerformDriverCheckInUseCase` transitions transfer to `IN_TRANSIT` | Status transition `CONFIRMED` $\to$ `IN_TRANSIT` | Linked itinerary event must transition to `EN_SITIO` with `gps_checked == true` and CQRS log appended to `event_stream`. |
| **Domain 4 (Transfers)** | **Delete** | Row deleted from `transfers` table | 0 rows returned | Ensure `deleteTransfer` handles missing IDs gracefully without throwing. |

### 5.2 Worker Step-by-Step Task List

1. **Create Integration Test File**:
   - Path: `apps/medicaltrip_react_app/tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`.
   - Populate with the blueprint code provided in Section 4.1.
2. **Create Standalone Verification Script**:
   - Path: `apps/medicaltrip_react_app/scripts/verify_shifts_transfers_crud.ts`.
   - Populate with the blueprint code provided in Section 4.2.
3. **Execute Vitest Integration Suite**:
   - Command: `npx vitest run tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts` inside `apps/medicaltrip_react_app`.
   - Assert 100% test pass rate (8/8 tests pass).
4. **Execute Standalone Script**:
   - Command: `npx tsx --tsconfig ./tsconfig.app.json scripts/verify_shifts_transfers_crud.ts` inside `apps/medicaltrip_react_app`.
   - Assert exit code 0 and clean logs.
5. **Verify Zero Regressions**:
   - Run `npx vitest run` to ensure all existing unit tests (`SupabaseStorageAdapter_resilience.test.ts`) continue passing.
   - Run `npm run typecheck` (`tsc --noEmit`) to verify 0 TypeScript compiler errors.
