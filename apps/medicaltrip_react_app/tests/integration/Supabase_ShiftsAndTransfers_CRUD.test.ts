import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer, PerformDriverCheckInUseCase } from '@/features/logistics-fleet';
import { ItineraryEvent } from '@/features/itinerary';
import { Money } from '@/core/domain/value-objects/Money';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import { calculateBlockHash, sha256 } from '@/features/settlement/infrastructure/Sha256LedgerChain';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Supabase Cloud REST API CRUD Verification: Domain 3 (Shifts) & Domain 4 (Transfers)', { timeout: 30000 }, () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const TEST_BOOKING_ID = `bkg-crud-test-${Date.now()}`;
  const TEST_BOOKING_CODE = `RVA-TEST-${Math.floor(Math.random() * 10000)}`;

  const TEST_SHIFT_ID = `shf-crud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const TEST_TRANSFER_ID = `trf-crud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const TEST_EVENT_ID = `evt-arr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    // Disable TLS reject for local test environment
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
  }, 15000);

  afterAll(async () => {
    // Clean up all test artifacts in Supabase Cloud
    await client.from('shifts').delete().eq('id', TEST_SHIFT_ID);
    await client.from('transfers').delete().eq('id', TEST_TRANSFER_ID);
    await client.from('events').delete().eq('id', TEST_EVENT_ID);
    await client.from('event_stream').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('bookings').delete().eq('id', TEST_BOOKING_ID);
  }, 15000);

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

      // Mathematical verification:
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

      // Verify directly in Supabase Cloud
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
        financialType: 'FLEET_TAXI',
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
