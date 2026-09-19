import { describe, it, expect, vi } from 'vitest';
import { SupabaseStorageAdapter, SupabaseClientStub } from '../../src/core/infrastructure/storage/SupabaseStorageAdapter';
import { PatientBooking } from '../../src/core/domain/entities/PatientBooking';
import { Money } from '../../src/core/domain/value-objects/Money';
import { ItineraryEvent } from '@/features/itinerary';
import { OperativeTerritory } from '../../src/core/domain/value-objects/OperativeTerritory';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { SettlementLedger } from '@/features/settlement';

describe('SupabaseStorageAdapter Resilience & HTTP 406 Elimination', () => {
  it('calls maybeSingle instead of single when querying bookings and handles null without throwing', async () => {
    let maybeSingleCalled = false;
    let singleCalled = false;

    const mockClient: SupabaseClientStub = {
      from: (_table: string) => {
        const queryBuilder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(async () => {
            maybeSingleCalled = true;
            // Simulates PostgREST 200 OK with null body (PGRST116 prevented)
            return { data: null, error: null, status: 200 };
          }),
          single: vi.fn().mockImplementation(async () => {
            singleCalled = true;
            // PostgREST would return 406 Not Acceptable
            return { data: null, error: { code: 'PGRST116', message: 'Cannot coerce result to a single JSON object' }, status: 406 };
          }),
          limit: vi.fn().mockImplementation(async () => ({ data: [], error: null })),
        };
        return queryBuilder;
      },
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });
    const result = await adapter.getBooking('non-existent-booking');

    expect(singleCalled).toBe(false);
    expect(maybeSingleCalled).toBe(true);
    expect(result).toBeNull();
  });

  it('provides getBookingByCode alias without throwing HTTP 406', async () => {
    let maybeSingleCalled = false;

    const mockClient: SupabaseClientStub = {
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          maybeSingleCalled = true;
          return { data: null, error: null, status: 200 };
        }),
        limit: vi.fn().mockImplementation(async () => ({ data: [], error: null })),
      }),
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });
    const result = await adapter.getBookingByCode('RVA999');

    expect(maybeSingleCalled).toBe(true);
    expect(result).toBeNull();
  });

  it('calls maybeSingle when querying events by id and returns null on missing record', async () => {
    let singleCalled = false;
    let maybeSingleCalled = false;

    const mockClient: SupabaseClientStub = {
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          maybeSingleCalled = true;
          return { data: null, error: null, status: 200 };
        }),
        single: vi.fn().mockImplementation(async () => {
          singleCalled = true;
          return { data: null, error: { code: 'PGRST116' }, status: 406 };
        }),
        limit: vi.fn().mockImplementation(async () => ({ data: [], error: null })),
      }),
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });
    const event = await adapter.getEventById('evt-unknown');

    expect(singleCalled).toBe(false);
    expect(maybeSingleCalled).toBe(true);
    expect(event).toBeNull();
  });

  it('safely handles saveBooking network errors without unhandled promise rejections', async () => {
    const mockClient: SupabaseClientStub = {
      from: () => ({
        upsert: vi.fn().mockRejectedValue(new Error('Network offline or Cloudflare 401')),
      }),
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });
    const booking = new PatientBooking({
      id: 'bkg-test-1',
      code: 'RVA-TEST',
      patientId: 'pax-test',
      firstName: 'Test',
      lastName: 'User',
      passportHash: 'hash',
      country: 'Curazao',
      language: 'Papiamento',
      phone: '+5999000000',
      email: 'test@medicaltrip.test',
      companionNames: [],
      paxCount: 1,
      arrivalDate: '2026-09-20',
      departureDate: '2026-09-27',
      arrivalAirline: 'Arajet',
      arrivalFlight: 'DM-101',
      hotelId: 'h-1',
      hotelName: 'Hotel 1616',
      status: 'PROGRAMADO',
    });

    // Must resolve cleanly without throwing unhandled promise rejection
    await expect(adapter.saveBooking(booking)).resolves.not.toThrow();

    // Data is still safely preserved in local fallback
    const saved = await adapter.getBooking('bkg-test-1');
    expect(saved).not.toBeNull();
    expect(saved?.code).toBe('RVA-TEST');
  });

  it('safely handles saveEvent and saveEventsBatch without unhandled promise rejections', async () => {
    const mockClient: SupabaseClientStub = {
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'Cloud database error' } }),
      }),
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });
    const event = new ItineraryEvent({
      id: 'evt-test-1',
      bookingId: 'bkg-test-1',
      dayNumber: 1,
      title: 'Arrival',
      category: 'CLINICAL',
      startDateTime: '2026-09-20T10:00:00Z',
      endDateTime: '2026-09-20T11:00:00Z',
      location: OperativeTerritory.fromPreset('POBLADO', 'Hotel 1616'),
      financialType: 'NONE',
      cost: Money.fromCents(0n, 'COP'),
      status: 'PROGRAMADO',
    });

    await expect(adapter.saveEvent(event)).resolves.not.toThrow();
    await expect(adapter.saveEventsBatch([event])).resolves.not.toThrow();
  });

  it('safely handles saveShift, saveTransfer, saveExpense, saveSettlement without throwing', async () => {
    const mockClient: SupabaseClientStub = {
      from: () => ({
        upsert: vi.fn().mockRejectedValue(new Error('Connection timeout')),
      }),
    };

    const adapter = new SupabaseStorageAdapter({ client: mockClient });

    const shift = new CompanionShift({
      id: 'shf-1',
      bookingId: 'bkg-test-1',
      guideId: 'g-1',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-09-20',
      hoursLogged: 6,
      hourlyRate: Money.fromCents(1550000n, 'COP'),
      prepAllowance: Money.fromCents(1550000n, 'COP'),
      mealSubsidyTier: 'TIER_2',
      mealSubsidyAmount: Money.fromCents(2500000n, 'COP'),
      status: 'APPROVED',
    });

    const transfer = new DriverTransfer({
      id: 'trf-1',
      bookingId: 'bkg-test-1',
      driverId: 'drv-1',
      driverName: 'Ramón Rosero',
      vehicleType: 'VAN_XL',
      routeType: 'AIRPORT_ARRIVAL',
      origin: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'JMC'),
      destination: OperativeTerritory.fromPreset('POBLADO', 'Hotel 1616'),
      scheduledTime: '2026-09-20T10:00:00Z',
      baseRate: Money.fromCents(17500000n, 'COP'),
      status: 'CONFIRMED',
    });

    const expense = new ReceiptExpense({
      id: 'exp-1',
      bookingId: 'bkg-test-1',
      eventId: 'evt-1',
      category: 'MEAL_SUBSIDY',
      description: 'Almuerzo clínico',
      amount: Money.fromCents(2500000n, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    const settlement = SettlementLedger.calculate({
      bookingId: 'bkg-test-1',
      date: '2026-09-20',
      settlementType: 'DAILY',
      expenses: [expense],
      shifts: [shift],
      transfers: [transfer],
      advances: [],
    });

    await expect(adapter.saveShift(shift)).resolves.not.toThrow();
    await expect(adapter.saveTransfer(transfer)).resolves.not.toThrow();
    await expect(adapter.saveExpense(expense)).resolves.not.toThrow();
    await expect(adapter.saveSettlement(settlement)).resolves.not.toThrow();
  });
});
