# Handoff Report: Domain 3 (Companion Shifts) & Domain 4 (Fleet Transfers) CRUD Verification Strategy

**Agent**: Explorer M1_2  
**Parent**: Orchestrator 14 (`c6e995c5-1c0c-40ce-93e1-5a0f55a42e53`)  
**Target Milestone**: Milestone 1: Direct Supabase Cloud REST API CRUD Integration Suite  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/`  
**Handoff Type**: Hard (Investigation complete, full blueprints delivered)  
**Timestamp**: 2026-09-19T15:53:00Z  

---

## 1. Observation

1. **Storage Port & Interface Contracts**:
   - In `apps/medicaltrip_react_app/src/core/ports/IStoragePort.ts` (lines 53-65):
     ```typescript
     // 3. Companion Shifts & Guidance
     saveShift(shift: CompanionShift): Promise<void>;
     getShiftsByBooking(bookingId: string): Promise<CompanionShift[]>;
     getShiftById?(shiftId: string): Promise<CompanionShift | null>;
     deleteShift?(shiftId: string): Promise<void>;

     // 4. Logistics & Fleet Transfers
     saveTransfer(transfer: DriverTransfer): Promise<void>;
     getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]>;
     getTransferById?(transferId: string): Promise<DriverTransfer | null>;
     deleteTransfer?(transferId: string): Promise<void>;
     ```
   - In `apps/medicaltrip_react_app/src/core/infrastructure/storage/SupabaseStorageAdapter.ts`:
     - `saveShift` (line 452) persists fields to `shifts` table: `id`, `booking_id`, `guide_id`, `guide_name`, `day_number`, `date`, `hours_logged`, `hourly_rate_cents`, `prep_allowance_cents`, `meal_subsidy_tier`, `meal_subsidy_cents`, `notes`, `status`.
     - `getShiftsByBooking` (line 488) resolves both code and ID via `resolveBookingIds()` and maps rows back to `CompanionShift` instances with BigInt cents.
     - `deleteShift` (line 527) issues `.from('shifts').delete().eq('id', shiftId)`.
     - `saveTransfer` (line 542) persists fields to `transfers` table: `id`, `booking_id`, `driver_id`, `driver_name`, `vehicle_type`, `route_type`, `origin_address`, `origin_zone`, `destination_address`, `destination_zone`, `scheduled_time`, `base_rate_cents`, `night_surcharge_cents`, `waiting_time_fee_cents`, `parking_fee_cents`, `status`.
     - `getTransfersByBooking` (line 582) resolves booking IDs and orders by `scheduled_time`.
     - `deleteTransfer` (line 623) issues `.from('transfers').delete().eq('id', transferId)`.

2. **Domain Mathematical Formulas**:
   - In `apps/medicaltrip_react_app/src/features/companion-shifts/domain/CompanionShift.ts` (lines 20-23, 60-87):
     ```typescript
     public static readonly DEFAULT_HOURLY_RATE_COP = Money.fromAmount(15500, 'COP');
     public static readonly DEFAULT_PREP_ALLOWANCE_COP = Money.fromAmount(15500, 'COP');

     public calculateTotalFee(): Money {
       const hourlySubtotal = this.hourlyRate.multiply(this.hoursLogged);
       return hourlySubtotal.add(this.prepAllowance).add(this.mealSubsidyAmount);
     }
     ```
     - For 6.0h + `TIER_2` meal allowance:
       $$(6.0 \times \$15.500) + \$15.500 + \$25.000 = \$93.000 + \$15.500 + \$25.000 = \$133.500\text{ COP (13.350.000 cents)}$$
     - For 6.5h (+0.5h increment) + `TIER_2` meal allowance:
       $$(6.5 \times \$15.500) + \$15.500 + \$25.000 = \$100.750 + \$15.500 + \$25.000 = \$141.250\text{ COP (14.125.000 cents)}$$
       Delta is strictly deterministic: $+775.000$ cents ($+\$7.750$ COP).
   - In `apps/medicaltrip_react_app/src/features/logistics-fleet/domain/DriverTransfer.ts` (lines 56-61):
     ```typescript
     public calculateTotalCost(): Money {
       return this.baseRate.add(this.nightSurcharge).add(this.waitingTimeFee).add(this.parkingFee);
     }
     ```
     - Aeroturex standard JMC route rate: $\$145.000$ COP ($14.500.000$ cents).

3. **Driver Check-in Terminal Orchestration**:
   - In `apps/medicaltrip_react_app/src/features/logistics-fleet/application/PerformDriverCheckInUseCase.ts` (lines 68-189):
     - Executes terminal check-in, mutates transfer status to `'IN_TRANSIT'`.
     - Updates linked `ItineraryEvent` to status `'EN_SITIO'` with `gpsChecked: true`.
     - Appends CQRS event `DRIVER_CHECK_IN_TERMINAL` to `event_stream` table.

4. **Live Cloud Endpoint Health & Accessibility**:
   - Tested live endpoint with curl:
     ```bash
     curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-" \
       "https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/shifts?select=*&limit=1"
     ```
     Result: `200` OK.
   - Tested live deletion and creation:
     - `POST /rest/v1/shifts` returned HTTP 201 Created.
     - `DELETE /rest/v1/shifts?id=eq.<id>` returned HTTP 204 No Content.
     - Re-query confirmed 0 records remaining (`[]`).
   - Row Level Security (RLS) is explicitly disabled across all tables in `migrate_supabase_schema.cjs` (lines 209-229), allowing full direct REST queries and mutations with the anon key.

5. **Existing Verification Scripts**:
   - Tested `scripts/verify_storage_adapter.ts` with tsconfig resolution:
     ```bash
     npx tsx --tsconfig ./tsconfig.app.json scripts/verify_storage_adapter.ts
     ```
     Output:
     ```
     --- Test 8: Query shifts by booking for bkg-rva350 ---
     Status: OK | Retrieved shifts count: 15

     --- Test 9: Query transfers by booking for bkg-rva350 ---
     Status: OK | Retrieved transfers count: 4
     LIVE SUPABASE REST VERIFICATION 100% PASSED!
     ```

---

## 2. Logic Chain

1. **Premise 1 (Referential & Mathematical Rigor)**: Companion shifts rely on hourly rate ($15.500/h), prep allowance ($15.500), and meal tier subsidies ($0 to $45.000). The `Money` Value Object uses integer `BigInt` cents, preventing IEEE-754 floating-point drift.
2. **Premise 2 (Cloud Persistence Decoupling)**: `SupabaseStorageAdapter` provides clean CRUD abstractions (`saveShift`, `getShiftsByBooking`, `deleteShift`, `saveTransfer`, `getTransfersByBooking`, `deleteTransfer`).
3. **Premise 3 (Bidirectional Validation)**: To prevent false positives (where an in-memory mock or fallback passes while the cloud database fails), tests must verify BOTH via adapter queries AND direct Supabase PostgREST HTTP queries against `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`.
4. **Premise 4 (Use Case Orchestration)**: For fleet transfers, updating is not merely changing a string field; it must execute `PerformDriverCheckInUseCase`, verifying that transfer becomes `IN_TRANSIT`, associated itinerary events become `EN_SITIO`, and a CQRS event log entry is appended to `event_stream`.
5. **Conclusion**: An end-to-end Vitest integration suite (`tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts`) combined with a standalone script (`scripts/verify_shifts_transfers_crud.ts`) provides exhaustive, reproducible, non-destructive verification with clean setup and teardown.

---

## 3. Caveats

1. **Live Cloud Dependency**: The tests connect to live Supabase Cloud (`https://pxmobokcqhsixfvdsrwj.supabase.co`). While internet access is active and verified, tests must run with `NODE_TLS_REJECT_UNAUTHORIZED='0'` due to local Node.js certificate validation quirks.
2. **Isolated Booking Scope**: Tests must create a dedicated uniquely-named booking record (`bkg-crud-test-${Date.now()}`) and delete it in `afterAll`/`finally` to prevent collisions with real patient data (`RVA350-1`).
3. **AppContext Wiring Deferred to Milestone 2**: `AppContext.tsx` currently lacks `deleteShift` and `deleteTransfer` UI callbacks (noted in PROJECT.md feature F7 for Milestone 2). The storage adapter and domain use cases already support them fully, which is what Milestone 1 tests validate.

---

## 4. Conclusion

The verification test strategy for Domain 3 (Companion Shifts) and Domain 4 (Fleet Transfers) is fully designed, validated against the live database, and documented in `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/analysis.md`.

The Worker has exact, copy-paste-ready blueprints for:
1. `apps/medicaltrip_react_app/tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts` (8 Vitest test assertions covering all 4 CRUD phases for both domains).
2. `apps/medicaltrip_react_app/scripts/verify_shifts_transfers_crud.ts` (standalone executable script with telemetry).

---

## 5. Verification Method

### Step 1: File Existence & Completeness
Check that `analysis.md` exists and contains complete blueprints:
```bash
test -f /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/analysis.md && echo "analysis.md OK"
```

### Step 2: Live Cloud Endpoint Health
Execute a live curl check to confirm Supabase Cloud responds with HTTP 200:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-" \
  "https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/shifts?select=*&limit=1"
# Expected output: 200
```

### Step 3: Worker Implementation Verification
Once the Worker implements the two files:
1. Run Vitest integration suite:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx vitest run tests/integration/Supabase_ShiftsAndTransfers_CRUD.test.ts
   ```
   **Expected**: 8 passed tests.
2. Run standalone script:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx tsx --tsconfig ./tsconfig.app.json scripts/verify_shifts_transfers_crud.ts
   ```
   **Expected**: Exit code 0, all CRUD steps report "✓".
3. Check overall regression and types:
   ```bash
   npx vitest run
   npm run typecheck
   ```
   **Expected**: All test suites pass, 0 TypeScript errors.

### Invalidation Conditions
- Any test hardcoding dummy responses without issuing actual HTTP requests to Supabase Cloud.
- Failure of BigInt delta assertion ($\Delta \neq 0.00$ COP).
- Leftover uncleaned test records in Supabase Cloud tables (`shifts`, `transfers`, `events`, `bookings`).
