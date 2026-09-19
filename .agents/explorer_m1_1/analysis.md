# Forensic Analysis & Verification Test Strategy: Domains 1 & 2 CRUD Lifecycles (Supabase Cloud)

**Agent**: Explorer M1_1  
**Project**: Medical Trip Colombia S.A.S.  
**Scope**: Domain 1 (Bookings & Passengers) and Domain 2 (Clinical Itinerary Events) CRUD Lifecycles against live Supabase Cloud REST API  
**Target Environment**: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/*`  
**Timestamp**: 2026-09-19T15:52:00Z  

---

## 1. Executive Summary

This report establishes the concrete, deterministic verification test strategy for the end-to-end CRUD lifecycles of **Domain 1 (Bookings & Passengers)** and **Domain 2 (Clinical Itinerary Events)** in `apps/medicaltrip_react_app`, operating directly against the live Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`).

### Core Invariants Under Verification
1. **Direct Supabase Cloud REST API Parity**: Every mutation (`saveBooking`, `saveEvent`, `deleteBooking`, `deleteEvent`) and query (`getBooking`, `getBookingByCode`, `getEventsByBooking`, `getEventById`) must execute against remote Supabase Cloud tables (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`), returning HTTP 200/201/204 with **0 HTTP 4xx/5xx network errors**.
2. **PGRST116 / HTTP 406 Elimination**: All single-record queries MUST employ PostgREST `.maybeSingle()` or `.limit(1)` so missing records return `null` instead of throwing HTTP 406 Not Acceptable.
3. **BigInt Determinism**: All monetary values (`hotelNightlyRateCents`, `hotelTotalQuotedCents`, `cost_cents`) are stored in PostgreSQL as `TEXT` integer cents and rehydrated as `bigint`, eliminating floating-point rounding drift.
4. **Cascading Deletion Integrity**: Calling `storagePort.deleteBooking(idOrCode)` must atomically purge the parent booking and all associated child entities (`events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`) leaving 0 orphaned records in Supabase Cloud.
5. **Rescheduling & Status Invariant**: Updating an event via `RescheduleEventUseCase` must update `start_date_time`, `end_date_time`, transition status (e.g. to `'EN_SITIO'`), and append an `EVENT_RESCHEDULED` record to the CQRS `event_stream`.

---

## 2. Forensic Infrastructure & Codebase Findings

### 2.1 Live Supabase Cloud Configuration
- **REST URL**: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- **Public Anon Key**: `sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-`
- **Database Schema**: 9 unconstrained relational tables created via `migrate_supabase_schema.cjs` with Row Level Security (RLS) disabled and full privileges granted to `anon`, `authenticated`, and `service_role`.
- **Verified Connectivity**: Directly confirmed via `scripts/verify_storage_adapter.ts` and Node CLI execution, successfully retrieving existing operational booking `bkg-rva350` (`RVA350-1`) with 7 events, 15 shifts, 4 transfers, and 108 expenses.

### 2.2 Critical Discovery: Local TLS Certificate Invariant
- **Observation**: Direct `node` or test runner invocations connecting to Supabase Cloud over HTTPS encounter `Error: unable to get local issuer certificate (UNABLE_TO_GET_ISSUER_CERT_LOCALLY)`.
- **Resolution Requirement for Worker**: All test files and scripts executing against the live Supabase Cloud endpoint MUST declare `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';` at the top of the file (or pass `NODE_TLS_REJECT_UNAUTHORIZED=0` in the test command), exactly as practiced in `scripts/verify_storage_adapter.ts`.

### 2.3 Critical Discovery: Column Deserialization Defect in `SupabaseStorageAdapter.ts`
- **Observation**: In `src/core/infrastructure/storage/SupabaseStorageAdapter.ts:437`:
  ```typescript
  // Line 437 in deserializeEvent:
  guideHours: r.guideHours,
  ```
- **Forensic Diagnosis**: In the Supabase PostgreSQL database schema (`migrate_supabase_schema.cjs:67`), the column is snake_case: `guide_hours NUMERIC`. When saved in line 328, it writes `guide_hours: event.guideHours`. However, during `deserializeEvent`, reading `r.guideHours` evaluates to `undefined`, silently discarding `guide_hours` retrieved from Supabase Cloud!
- **Mandatory Worker Remediation**: Worker must update line 437 to:
  ```typescript
  guideHours: r.guide_hours !== undefined ? Number(r.guide_hours) : r.guideHours,
  ```

### 2.4 Critical Discovery: Dual Key Resolution in `deleteBooking`
- **Observation**: In `SupabaseStorageAdapter.ts:257-276`, `resolveBookingIds(bookingIdOrCode)` resolves both `id` (e.g. `uuid` or `bkg-xxx`) and `code` (e.g. `RVA-xxx`).
- **Forensic Diagnosis**: `bookings` table has `id TEXT PRIMARY KEY` and `code TEXT NOT NULL`. Child tables store `booking_id`, which contains either `code` or `id`.
  When deleting from `bookings`:
  ```typescript
  this.client.from('bookings').delete().in('id', ids)
  ```
  If `ids` contains both `id` and `code`, `.in('id', ids)` deletes the parent booking. However, if `resolveBookingIds` fails to match the row before deletion, only the passed argument is in `ids`.
- **Recommended Defensive Worker Enhancement**:
  ```typescript
  await Promise.allSettled([
    this.client.from('bookings').delete().or(`id.in.(${ids.map(i => `"${i}"`).join(',')}),code.in.(${ids.map(i => `"${i}"`).join(',')})`),
    this.client.from('events').delete().in('booking_id', ids),
    this.client.from('shifts').delete().in('booking_id', ids),
    this.client.from('transfers').delete().in('booking_id', ids),
    this.client.from('expenses').delete().in('booking_id', ids),
    this.client.from('settlements').delete().in('booking_id', ids),
    this.client.from('event_stream').delete().in('booking_id', ids),
  ]);
  ```

---

## 3. Domain 1: Bookings CRUD Lifecycle Verification Strategy

### 3.1 Test Fixture Design & Isolation Invariants
To prevent data contamination with live Caribbean archetypes (`RVA171`, `RVA282`, `RVA341`, `RVA077`, `RVA350-1`), all test runs must generate unique correlative test codes:
- **Pattern**: `RVA-M1-${Date.now()}` or `RVA-TEST-${Math.floor(1000 + Math.random() * 9000)}`
- **Patient ID**: Normalized identifier `ENT-PAX-${Math.floor(1000 + Math.random() * 9000)}`
- **Passport Hash**: Anonymized SHA-256 hash `sha256_${hex}` (zero plain-text passport exposure)
- **Passenger Group**: 2 passengers (1 Primary Patient + 1 Companion)

### 3.2 Step 1: Create Booking (`CreatePatientBookingUseCase`)
1. **Execution**:
   Instantiate `CreatePatientBookingUseCase(storagePort)` and execute command:
   ```typescript
   const createResult = await createBookingUseCase.execute({
     code: testCode,
     firstName: 'Eleanor',
     lastName: 'Vanderbilt',
     country: 'Curazao',
     language: 'Papiamento / Holandés',
     paxCount: 2,
     companionNames: ['Marcus Vanderbilt'],
     arrivalDate: '2026-11-10T14:30:00.000Z',
     departureDate: '2026-11-20T18:00:00.000Z',
     hotel: 'HOTEL 1616 Poblado',
     hotelName: 'HOTEL 1616 Poblado',
     airline: 'Arajet',
     flightNumber: 'DM-101',
     notes: 'Test booking for Domain 1 CRUD verification against Supabase Cloud',
     requiresHotelReservation: true,
   });
   ```
2. **Domain Assertions**:
   - `createResult.booking` is defined and `createResult.booking.code === testCode`.
   - `createResult.booking.paxCount === 2`.
   - `createResult.booking.status === 'PROGRAMADO'`.
   - `createResult.settlement` is initialized as empty ledger with `bookingId === testCode`.
3. **Direct Supabase Cloud Assertions**:
   Query `client.from('bookings').select('*').eq('id', createResult.booking.id).maybeSingle()`:
   - `data` is not null, `error` is null.
   - `data.id === createResult.booking.id`.
   - `data.code === testCode`.
   - `data.first_name === 'Eleanor'`.
   - `data.last_name === 'Vanderbilt'`.
   - `data.pax_count === 2`.
   - `data.companion_names` is array containing `'Marcus Vanderbilt'`.
   - `data.hotel_name === 'HOTEL 1616 Poblado'`.
   - `data.requires_hotel_reservation === true`.
4. **Side-Effect Assertions in Supabase Cloud**:
   - `client.from('settlements').select('*').eq('booking_id', testCode).maybeSingle()` exists with `total_expenses_cents === '0'`.
   - `client.from('event_stream').select('*').eq('booking_id', testCode).eq('type', 'BOOKING_CREATED')` has at least 1 record.

### 3.3 Step 2: Read Booking (`storagePort.getBooking`)
1. **Query by ID**:
   ```typescript
   const byId = await storagePort.getBooking(createResult.booking.id);
   expect(byId).not.toBeNull();
   expect(byId!.code).toBe(testCode);
   expect(byId!.firstName).toBe('Eleanor');
   ```
2. **Query by Code**:
   ```typescript
   const byCode = await storagePort.getBooking(testCode);
   expect(byCode).not.toBeNull();
   expect(byCode!.id).toBe(createResult.booking.id);
   ```
3. **Query by Alias (`getBookingByCode`)**:
   ```typescript
   const byCodeAlias = await (storagePort as any).getBookingByCode(testCode);
   expect(byCodeAlias).not.toBeNull();
   expect(byCodeAlias!.code).toBe(testCode);
   ```
4. **Comprehensive Field Assertions**:
   - `byId!.arrivalAirline === 'Arajet'`.
   - `byId!.arrivalFlight === 'DM-101'`.
   - `byId!.hotelName === 'HOTEL 1616 Poblado'`.
   - `byId!.passengers.length === 2`.
   - Primary passenger role is `'PATIENT'`, companion role is `'COMPANION'`.
5. **Negative Read Invariant**:
   Query `storagePort.getBooking('bkg-non-existent-' + Date.now())` and `storagePort.getBooking('RVA-NON-EXISTENT')`:
   - Both MUST return `null`.
   - MUST NOT throw HTTP 406 / PostgREST `PGRST116`.

### 3.4 Step 3: Update Booking (`storagePort.saveBooking`)
1. **Execution**:
   Reconstruct updated `PatientBooking` entity with modified attributes:
   ```typescript
   const updatedBooking = new PatientBooking({
     ...byId!,
     notes: 'OPERATIONAL NOTE UPDATED: Patient requires wheelchair assistance upon arrival.',
     hotelNights: 10,
     hotelNightlyRateCents: 35000000n, // $350.000 COP
     hotelTotalQuotedCents: 350000000n, // $3.500.000 COP
     arrivalFlight: 'Arajet DM-101-UPDATED',
     flightLegs: [
       {
         from: 'CUR',
         to: 'MDE',
         flightNumber: 'DM-101-UPDATED',
         airline: 'Arajet',
         departureTime: '2026-11-10T12:00:00.000Z',
         arrivalTime: '2026-11-10T14:30:00.000Z',
       },
     ],
     status: 'EN_CURSO',
   });
   await storagePort.saveBooking(updatedBooking);
   ```
2. **Storage Port Read Verification**:
   ```typescript
   const reRead = await storagePort.getBooking(testCode);
   expect(reRead!.notes).toContain('Patient requires wheelchair assistance');
   expect(reRead!.hotelNights).toBe(10);
   expect(reRead!.hotelNightlyRateCents).toBe(35000000n);
   expect(reRead!.hotelTotalQuotedCents).toBe(350000000n);
   expect(reRead!.arrivalFlight).toBe('Arajet DM-101-UPDATED');
   expect(reRead!.status).toBe('EN_CURSO');
   expect(reRead!.flightLegs.length).toBe(1);
   ```
3. **Direct Supabase Cloud Assertions**:
   Query `client.from('bookings').select('*').eq('id', createResult.booking.id).single()`:
   - `data.notes` matches updated note.
   - `data.hotel_nights === 10`.
   - `data.hotel_nightly_rate_cents === '35000000'`.
   - `data.hotel_total_quoted_cents === '350000000'`.
   - `data.arrival_flight === 'Arajet DM-101-UPDATED'`.
   - `data.status === 'EN_CURSO'`.
   - `data.flight_legs[0].flightNumber === 'DM-101-UPDATED'`.

### 3.5 Step 4: Cascading Delete (`storagePort.deleteBooking`)
1. **Pre-Delete Setup**:
   Before deleting the booking, populate child entities across all tables (using `GenerateSmartItineraryUseCase` or direct saves):
   - At least 3 clinical `events` in `events` table.
   - At least 1 `shifts` record in `shifts` table.
   - At least 1 `transfers` record in `transfers` table.
   - At least 1 `expenses` record in `expenses` table.
   - Settlement record in `settlements` table.
   - Domain event records in `event_stream` table.
   - Verify `events.length > 0`, `shifts.length > 0`, `transfers.length > 0`, `expenses.length > 0` directly in Supabase Cloud.
2. **Execution**:
   ```typescript
   await storagePort.deleteBooking(createResult.booking.id);
   ```
3. **Direct Supabase Cloud Cascading Verification**:
   Query all 7 relational tables directly:
   - `bookings`: `client.from('bookings').select('id').or('id.eq.' + createResult.booking.id + ',code.eq.' + testCode)` ➔ Expect `data.length === 0`.
   - `events`: `client.from('events').select('id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
   - `shifts`: `client.from('shifts').select('id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
   - `transfers`: `client.from('transfers').select('id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
   - `expenses`: `client.from('expenses').select('id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
   - `settlements`: `client.from('settlements').select('booking_id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
   - `event_stream`: `client.from('event_stream').select('id').in('booking_id', [createResult.booking.id, testCode])` ➔ Expect `data.length === 0`.
4. **Storage Port Negative Verification**:
   - `await storagePort.getBooking(testCode)` ➔ `null`.
   - `await storagePort.getEventsByBooking(testCode)` ➔ `[]`.

---

## 4. Domain 2: Clinical Itinerary Events CRUD Lifecycle Verification Strategy

### 4.1 Step 1: Create Clinical Events via Medical Presets (`GenerateSmartItineraryUseCase`)
1. **Execution**:
   Instantiate `GenerateSmartItineraryUseCase(storagePort)` and execute with medical preset `OPHTHALMOLOGY_3D`:
   ```typescript
   const itineraryResult = await itineraryUseCase.execute({
     bookingId: booking.code,
     presetType: 'OPHTHALMOLOGY_3D',
     baseDate: new Date('2026-11-10T10:00:00.000Z'),
   });
   ```
2. **Domain Assertions**:
   - `itineraryResult.events.length === 7` (Arrival Transfer, Clofán Pentacam, Day 2 Fasting Lab 05:30 AM, Day 2 Laser Surgery Clofán, Day 2 Pharmacy Gotas, Day 3 Fit-to-Fly Control, Day 3 Departure Transfer).
   - `itineraryResult.shifts.length === 2` (Day 1: 2.5h shift, Day 2: 3.5h shift).
   - `itineraryResult.transfers.length === 2` (Airport Arrival + Airport Departure).
   - `itineraryResult.expenses.length === 2` (Lab Echavarría $120.000 + Pharmacy Cruz Verde $85.000).
3. **Direct Supabase Cloud Assertions (`events` table)**:
   Query `client.from('events').select('*').eq('booking_id', booking.code).order('start_date_time', { ascending: true })`:
   - `data.length === 7`.
   - All events have valid UUID/IDs (`evt-${booking.code}-...`).
   - Categories present: `FLIGHT`, `CLINICAL`, `LAB`, `PHARMACY`.
   - Fasting Lab event has `start_date_time` at 05:30 AM on Day 2 (`2026-11-11T05:30:00.000Z`).
   - Clofán surgery event has `provider_id === 'CLINIC-CLOFAN'` and `cost_cents === '5425000'` ($54.250 COP).
   - Every event has `status === 'PROGRAMADO'`.

4. **Multi-Preset Verification (`CARDIOLOGY_5D`)**:
   Verify that preset `CARDIOLOGY_5D` generates a 5-day cardiology pathway (Cardio VID, Echo Doppler, Stress Test, Holter, Catheterization, Fit-to-Fly) with 9 events persisted into Supabase Cloud.

### 4.2 Step 2: Read Events & Chronology Validation (`storagePort.getEventsByBooking`)
1. **Query via Storage Port**:
   ```typescript
   const events = await storagePort.getEventsByBooking(booking.code);
   expect(events.length).toBe(7);
   ```
2. **Strict Chronological Invariant**:
   For every consecutive pair `i` and `i + 1`:
   ```typescript
   for (let i = 0; i < events.length - 1; i++) {
     const tCurrent = new Date(events[i].startDateTime).getTime();
     const tNext = new Date(events[i + 1].startDateTime).getTime();
     expect(tNext).toBeGreaterThanOrEqual(tCurrent);
   }
   ```
3. **Non-Inverted Event Duration Invariant**:
   For each event:
   ```typescript
   for (const evt of events) {
     expect(new Date(evt.endDateTime).getTime()).toBeGreaterThanOrEqual(new Date(evt.startDateTime).getTime());
     expect(evt.durationMinutes).toBeGreaterThan(0);
   }
   ```
4. **Single Event Lookup (`storagePort.getEventById`)**:
   Pick the primary clinical consultation (`evt-${booking.code}-d1-clofan`):
   ```typescript
   const single = await storagePort.getEventById(`evt-${booking.code}-d1-clofan`);
   expect(single).not.toBeNull();
   expect(single!.title).toContain('Topografía Corneal Pentacam');
   expect(single!.providerId).toBe('CLINIC-CLOFAN');
   expect(single!.category).toBe('CLINICAL');
   expect(single!.cost.cents).toBe(3875000n); // $38.750 COP
   ```
5. **Negative Event Read**:
   `storagePort.getEventById('evt-non-existent-' + Date.now())` ➔ Returns `null` without throwing HTTP 406.

### 4.3 Step 3: Reschedule Clinical Event (`RescheduleEventUseCase`)
1. **Execution**:
   Target clinical surgery event `evt-${booking.code}-d2-surg`.
   Instantiate `RescheduleEventUseCase(storagePort)` and execute command:
   ```typescript
   const rescheduleResult = await rescheduleUseCase.execute({
     eventId: `evt-${booking.code}-d2-surg`,
     newStartDateTime: '2026-11-11T14:00:00.000Z',
     newEndDateTime: '2026-11-11T17:30:00.000Z',
     newStatus: 'EN_SITIO',
     reason: 'Cirugía reprogramada por retraso en ayuno y disponibilidad de quirófano en Clofán.',
   });
   ```
2. **Domain Assertions**:
   - `rescheduleResult.id === 'evt-' + booking.code + '-d2-surg'`.
   - `rescheduleResult.startDateTime === '2026-11-11T14:00:00.000Z'`.
   - `rescheduleResult.endDateTime === '2026-11-11T17:30:00.000Z'`.
   - `rescheduleResult.status === 'EN_SITIO'`.
3. **Direct Supabase Cloud Assertions (`events` table)**:
   Query `client.from('events').select('*').eq('id', 'evt-' + booking.code + '-d2-surg').single()`:
   - `data.start_date_time === '2026-11-11T14:00:00.000Z'`.
   - `data.end_date_time === '2026-11-11T17:30:00.000Z'`.
   - `data.status === 'EN_SITIO'`.
   - `data.updated_at` is updated.
4. **CQRS Audit Trail Verification (`event_stream` table)**:
   Query `client.from('event_stream').select('*').eq('booking_id', booking.code).eq('type', 'EVENT_RESCHEDULED')`:
   - Contains an event record with `payload.eventId === 'evt-' + booking.code + '-d2-surg'`.
   - `payload.newStart === '2026-11-11T14:00:00.000Z'`.
   - `payload.newEnd === '2026-11-11T17:30:00.000Z'`.

### 4.4 Step 4: Delete Event (`storagePort.deleteEvent`)
1. **Execution**:
   Delete non-critical pharmacy event `evt-${booking.code}-d2-pharm`:
   ```typescript
   await storagePort.deleteEvent(`evt-${booking.code}-d2-pharm`);
   ```
2. **Direct Supabase Cloud Assertions**:
   - Query `client.from('events').select('*').eq('id', 'evt-' + booking.code + '-d2-pharm')` ➔ Returns empty array `[]`.
   - Query all events for booking: count decreases from 7 to 6.
   - Sibling events (`evt-d1-arr`, `evt-d1-clofan`, `evt-d2-lab`, `evt-d2-surg`, `evt-d3-check`, `evt-d3-dept`) remain intact with unchanged timestamps.
3. **Storage Port Negative Verification**:
   - `await storagePort.getEventById('evt-' + booking.code + '-d2-pharm')` ➔ Returns `null`.

---

## 5. Concrete Worker Implementation Blueprint

### 5.1 Proposed Code Structure
The Worker should implement:
1. **Primary Vitest Integration Suite**:
   `apps/medicaltrip_react_app/tests/integration/supabase_crud_domain1_domain2.test.ts`
   Integrated into `npm test` so that every CI and developer execution validates live Supabase parity.
2. **Standalone Diagnostic CLI Runner**:
   `apps/medicaltrip_react_app/scripts/verify_supabase_domains_crud.ts`
   Runnable via `./node_modules/.bin/vite-node scripts/verify_supabase_domains_crud.ts` for rapid, zero-overhead manual or subagent verification.

### 5.2 Step-by-Step Task Checklist for Worker

```markdown
- [ ] Step 1: Fix deserialization defect in `src/core/infrastructure/storage/SupabaseStorageAdapter.ts`:
      Update line 437: `guideHours: r.guide_hours !== undefined ? Number(r.guide_hours) : r.guideHours`
- [ ] Step 2: In `SupabaseStorageAdapter.deleteBooking`, reinforce deletion query:
      `this.client.from('bookings').delete().or(\`id.in.(${idsList}),code.in.(${idsList})\`)`
- [ ] Step 3: Create `apps/medicaltrip_react_app/tests/integration/supabase_crud_domain1_domain2.test.ts`:
      - Configure `process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'`
      - Connect real `createClient` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
      - Instantiate real `SupabaseStorageAdapter({ client })`
      - Test Domain 1: Bookings Create, Read, Update, Cascading Delete
      - Test Domain 2: Clinical Events Create (Presets), Read (Chronology), Update (Reschedule to EN_SITIO), Delete
      - In `afterAll` / `finally` blocks, ensure all test bookings are purged to keep Supabase Cloud pristine
- [ ] Step 4: Create standalone runner `apps/medicaltrip_react_app/scripts/verify_supabase_domains_crud.ts`
- [ ] Step 5: Execute `./node_modules/.bin/vite-node scripts/verify_supabase_domains_crud.ts` and confirm 100% green
- [ ] Step 6: Execute `npm test` and ensure all 7 Vitest test suites (including resilience and CRUD) pass cleanly
```

---

## 6. Summary Matrix: Verification Assertions

| Domain | Lifecycle Operation | Key Command / Method | Supabase REST Endpoint | Expected Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **Domain 1** | **Create** | `CreatePatientBookingUseCase.execute()` | `POST /rest/v1/bookings` (upsert) | HTTP 201/200; `status='PROGRAMADO'`; Empty ledger created; `BOOKING_CREATED` in `event_stream`. |
| **Domain 1** | **Read** | `storagePort.getBooking(idOrCode)` | `GET /rest/v1/bookings?or=(...)` | HTTP 200; maybeSingle; 0 HTTP 406; exact fields mapped to `PatientBooking`. |
| **Domain 1** | **Update** | `storagePort.saveBooking(updated)` | `POST /rest/v1/bookings` (upsert) | HTTP 200; `hotel_nights`, `notes`, `arrival_flight`, `status='EN_CURSO'` persisted. |
| **Domain 1** | **Delete** | `storagePort.deleteBooking(id)` | `DELETE /rest/v1/*` | HTTP 204/200; Cascading removal across `bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`. |
| **Domain 2** | **Create** | `GenerateSmartItineraryUseCase.execute()` | `POST /rest/v1/events` (upsert) | 7 events for `OPHTHALMOLOGY_3D`; 05:30 AM fasting lab; `cost_cents` exact BigInt text. |
| **Domain 2** | **Read** | `storagePort.getEventsByBooking(code)` | `GET /rest/v1/events?booking_id=...` | HTTP 200; strictly monotonic timestamps ($T_i \le T_{i+1}$); categories verified. |
| **Domain 2** | **Update** | `RescheduleEventUseCase.execute()` | `POST /rest/v1/events` (upsert) | HTTP 200; shifted start/end; `status='EN_SITIO'`; `EVENT_RESCHEDULED` in `event_stream`. |
| **Domain 2** | **Delete** | `storagePort.deleteEvent(id)` | `DELETE /rest/v1/events?id=eq.X` | HTTP 204/200; single event removed; sibling events unchanged. |
